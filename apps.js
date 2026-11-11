/* Desktop version: storage and the apps that open in a window. */
(function () {
  "use strict";
  var C = window.CORE, A = window.ART, S = C.S, el = C.el;
  var T = function (en, ar) { return C.lang() === "ar" ? ar : en; };

  /* ---------- storage: the published site has no database of its own; see Supabase below ---------- */
  var STORE = { db: null, uid: null, owner: false };
  STORE.ready = Promise.resolve(STORE);
  function useDb() { return !!(STORE.db && STORE.uid); }
  /* on the published site there is no database: notes, CV requests and messages go to my email through
     FormSubmit. Visitors can only send; nothing they send changes the site. */
  var CFG = window.DESK_CONFIG || {};
  function mailTo() { var k = CFG.formsubmit || S.email; return k ? "https://formsubmit.co/ajax/" + encodeURIComponent(k) : ""; }
  function canSend() { return useDb() || !!mailTo(); }
  var lastSend = {};  /* when each form last sent, so one visitor cannot flood it */
  function tooSoon(kind) { return Date.now() - (lastSend[kind] || 0) < 20000; }
  function dataUrlFile(url) {
    var m = /^data:(image\/(?:png|jpeg));base64,(.+)$/.exec(url || ""); if (!m) return null;
    var bin = atob(m[2]), buf = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return new Blob([buf], { type: m[1] });
  }
  async function emailMe(subject, fields, image) {
    if (tooSoon("mail:" + subject.split(" ")[0])) { var e = new Error("wait"); e.code = "wait"; throw e; }
    var fd = new FormData();
    fd.append("_subject", subject); fd.append("_template", "table"); fd.append("_captcha", "false");
    Object.keys(fields).forEach(function (k) { fd.append(k, fields[k]); });
    var file = dataUrlFile(image); if (file) fd.append("attachment", file, file.type === "image/png" ? "drawing.png" : "drawing.jpg");
    var r = await fetch(mailTo(), { method: "POST", headers: { Accept: "application/json" }, body: fd, keepalive: !file });
    var d = {}; try { d = await r.json(); } catch (err) { /* no body */ }
    if (!r.ok || String(d.success) === "false") throw new Error("not sent");
    lastSend["mail:" + subject.split(" ")[0]] = Date.now();
  }
  /* the live board on the published site: Supabase. Visitors can add a note (it waits for my approval)
     and read the approved ones; nothing else. The rules are in supabase/setup.sql */
  /* only the public key belongs in the page; a secret key would give full control, so it is refused */
  function secretKey(k) {
    if (/^sb_secret_/.test(k)) return true;
    try { return JSON.parse(atob(k.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role === "service_role"; } catch (e) { return false; }
  }
  var SB = (function () {
    var url = String(CFG.supabaseUrl || "").replace(/\/+$/, ""), key = String(CFG.supabaseKey || "");
    if (!url || !key || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) return null;
    if (secretKey(key)) { console.warn("config.js: use the public (anon or publishable) Supabase key, never the secret one."); return null; }
    return { url: url, key: key };
  })();
  function sb() { return SB; }
  async function sbInsert(table, row) {
    var s = sb();
    var r = await fetch(s.url + "/rest/v1/" + table, {
      method: "POST",
      headers: { apikey: s.key, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row)
    });
    if (!r.ok) { var e = new Error("not sent"); if (r.status === 400 || r.status === 409) e.code = "busy"; throw e; }
  }
  async function sbAdd(entry) {
    var row = { name: entry.name, text: entry.text || null, img: entry.img || null };
    if (entry.place) row.place = entry.place;
    try { await sbInsert("notes", row); }
    catch (e) { if (!row.place) throw e; delete row.place; await sbInsert("notes", row); }  /* before the place column exists */
  }
  async function sbBoard() {
    var s = sb();
    var q = "/rest/v1/notes?order=created_at.desc&limit=60&select=";
    var r = await fetch(s.url + q + "name,place,text,img,created_at", { headers: { apikey: s.key }, cache: "no-store" });
    if (!r.ok) r = await fetch(s.url + q + "name,text,img,created_at", { headers: { apikey: s.key }, cache: "no-store" });
    if (!r.ok) throw new Error("no board");
    var rows = await r.json();
    return (Array.isArray(rows) ? rows : []).map(function (n) { return { name: n.name, place: n.place || "", text: n.text || "", img: n.img || "", at: Date.parse(n.created_at) || 0 }; });
  }

  /* a hidden field people never see; a bot that fills it is quietly ignored */
  function trap() { var t = el("input", "trap"); t.type = "text"; t.name = "website"; t.tabIndex = -1; t.autocomplete = "off"; t.setAttribute("aria-hidden", "true"); return t; }
  function local(key, entry, keep) {
    var list = []; try { list = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { list = []; }
    if (entry) { list.push(entry); list = list.slice(-keep); try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) { list.pop(); } }
    return list;
  }
  function clean(s, n) { return String(s || "").replace(/\s+/g, " ").trim().slice(0, n); }
  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  /* each visitor keeps one document per collection, holding a short list of entries */
  async function append(col, entry, keep) {
    var ref = STORE.db.doc(col + "/" + STORE.uid), snap = await ref.get();
    var list = snap.exists && Array.isArray(snap.data().entries) ? snap.data().entries.slice() : [];
    list.push(entry);
    await ref.set({ entries: list.slice(-keep) });
  }
  async function removeEntry(col, owner, id) {
    var ref = STORE.db.doc(col + "/" + owner), snap = await ref.get();
    if (!snap.exists) return;
    await ref.set({ entries: (snap.data().entries || []).filter(function (e) { return (e.id || "t" + e.at) !== id; }) });
  }
  /* listen to a whole collection; entries come back newest first with the writer's id */
  function watch(col, onList, onFail) {
    var timer = setTimeout(function () { onFail("slow"); }, 10000);
    var stop = STORE.db.collection(col).onSnapshot(function (snap) {
      if (!snap.metadata.fromCache) clearTimeout(timer);
      var all = [];
      snap.docs.forEach(function (d) {
        var data = d.data() || {};
        if (Array.isArray(data.entries)) data.entries.forEach(function (e) { all.push(Object.assign({ owner: d.id }, e, { id: e.id || "t" + e.at })); });
        else all.push(Object.assign({ key: d.id }, data));
      });
      all.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
      onList(all);
    }, function () { clearTimeout(timer); onFail("error"); });
    return function () { clearTimeout(timer); stop(); };
  }
  function when(ms) {
    try { return new Date(ms).toLocaleDateString(C.lang() === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { day: "numeric", month: "short", timeZone: "Asia/Riyadh" }); } catch (e) { return ""; }
  }
  function bar(text) { return el("p", "note-bar", text); }
  function field(id, ph, max, type) { var i = el("input", "field"); i.id = id; i.type = type || "text"; i.placeholder = ph; i.maxLength = max; i.setAttribute("aria-label", ph); return i; }
  function button(text, cls) { var b = el("button", cls || "btn", text); b.type = "button"; return b; }

  var APPS = {};

  /* ---------- about ---------- */
  /* about me, written as a small Python file: it types itself, runs, and the output is the introduction.
     The code and the output come from the same text below, so they always match. */
  /* my profile lives in profile.js; the original site's settings are the fallback */
  var PR = window.DESK_PROFILE || { role: { en: "Data analyst", ar: "محللة بيانات" }, bio: S.bio, mission: S.bio, skills: S.skills.map(function (x) { return { en: x.en, ar: x.ar, how: { en: "", ar: "" } }; }), tools: S.tools };
  function meFor(lang) {
    var ar = lang === "ar";
    return {
      role: ar ? PR.role.ar.replace(" · ", " و") : PR.role.en.replace(" · ", " & ").toLowerCase(),
      hi: ar ? "أهلًا، أنا" : "Hi, I'm", label: ar ? "أدواتي:" : "Toolkit:",
      mission: (PR.mission || PR.bio)[ar ? "ar" : "en"],
      skills: PR.skills.map(function (x) { return [x[ar ? "ar" : "en"], x.how[ar ? "ar" : "en"]]; })
    };
  }
  var ME = { en: meFor("en"), ar: meFor("ar") };
  function aboutCode(m) {
    var pad = Math.max.apply(null, m.skills.map(function (x) { return x[0].length; }));
    return [
      "class AboutMe:",
      "    def __init__(self):",
      '        self.name = "' + S.name + '"',
      '        self.role = "' + m.role + '"',
      '        self.mission = "' + m.mission + '"',
      "",
      "    def skills(self):",
      "        return {",
      m.skills.map(function (x) { return '            "' + x[0] + '": ' + " ".repeat(pad - x[0].length) + '"' + x[1] + '",'; }).join("\n"),
      "        }",
      "",
      "    def toolkit(self):",
      "        return [" + PR.tools.map(function (x) { return '"' + x + '"'; }).join(", ") + "]",
      "",
      "",
      "me = AboutMe()",
      "",
      'print(f"' + m.hi + ' {me.name} — {me.role}")',
      "print(me.mission)",
      "print()",
      "for skill, how in me.skills().items():",
      '    print(f"• {skill}: {how}")',
      "print()",
      'print("' + m.label + '", " · ".join(me.toolkit()))'
    ].join("\n");
  }
  function aboutOutput(m) {
    return [m.hi + " " + S.name + " — " + m.role, m.mission, ""]
      .concat(m.skills.map(function (x) { return "• " + x[0] + ": " + x[1]; }))
      .concat(["", m.label + " " + PR.tools.join(" · ")]);
  }
  function highlight(code) {
    var esc = function (t) { return t.replace(/&/g, "&amp;").replace(/</g, "&lt;"); };
    return code.replace(/(f?"[^"\n]*"?)|(#.*)|\b(class|def|return|for|in|self)\b|\b(print|AboutMe)\b|[^"#\w]+|\w+/g, function (m, str, com, kw, fn) {
      if (str) return '<span class="k-s">' + esc(str) + "</span>";
      if (com) return '<span class="k-c">' + esc(com) + "</span>";
      if (kw) return '<span class="k-k">' + kw + "</span>";
      if (fn) return '<span class="k-f">' + fn + "</span>";
      return esc(m);
    });
  }
  window.DESK_ABOUT = { code: aboutCode, output: aboutOutput, text: ME, highlight: highlight };
  /* the first About window: photo, name, bio, skills and tools. My name in the menu bar opens it */
  APPS.about = function (w) {
    w.title(T("About me", "نبذة عني"));
    w.narrow();
    var box = el("div", "about"), av = el("div", "avatar big"); av.innerHTML = A.avatar(); box.appendChild(av);
    var t = el("div");
    t.appendChild(el("p", "about-name", S.name));
    t.appendChild(el("p", "muted", C.tr(PR.role)));
    t.appendChild(el("p", "about-bio", C.tr(PR.bio)));
    t.appendChild(el("h3", "", T("Skills", "المهارات")));
    var sk = el("div", "chips"); PR.skills.forEach(function (x) { sk.appendChild(el("span", "chip", C.tr(x))); }); t.appendChild(sk);
    t.appendChild(el("h3", "", T("Tools", "الأدوات")));
    var tl = el("div", "chips"); PR.tools.forEach(function (x) { tl.appendChild(el("span", "chip", x)); }); t.appendChild(tl);
    var row = el("div", "row gap-top");
    row.appendChild(C.link(C.profile, "btn", "GitHub ↗", true));
    if (C.mailto()) row.appendChild(C.link(C.mailto(), "btn light", S.email));
    t.appendChild(row);
    box.appendChild(t);
    w.body.appendChild(box);
  };
  /* ---------- projects: two folders, the second locked until it has work ---------- */
  function ordered() {
    /* chosen order: layoffs first, delivery second, the others as in the content file */
    var first = ["global-layoffs", "olist-delivery-impact"];
    return C.P.slice().sort(function (a, b) {
      var i = first.indexOf(a.id), j = first.indexOf(b.id);
      return (i < 0 ? 99 : i) - (j < 0 ? 99 : j);
    });
  }
  APPS.projects = function (w, opts) {
    w.title(T("Projects", "المشاريع"));
    function home() {
      w.body.innerHTML = "";
      w.body.appendChild(el("p", "path", T("Projects", "المشاريع")));
      var g = el("div", "finder");
      var a = button("", "f-item"); a.innerHTML = A.folder(false);
      a.appendChild(el("span", "", T("Data & Business Analysis", "تحليل البيانات والأعمال")));
      var count = el("small", "", C.P.length + T(" projects", " مشاريع")); a.appendChild(count);
      fetch("repos.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (d) {
        var urls = {}; C.P.forEach(function (p) { if (p.github) urls[p.github.toLowerCase().replace(/\/$/, "")] = 1; });
        var n = C.P.length + (d.repos || []).filter(function (r) { return !urls[r.url.toLowerCase()]; }).length;
        count.textContent = n + T(" projects", " مشاريع");
      }, function () { /* keep the first count */ });
      a.addEventListener("click", list);
      var b = button("", "f-item locked"); b.innerHTML = A.folder(true);
      b.appendChild(el("span", "", T("Digital Design", "التصميم الرقمي")));
      b.appendChild(el("small", "", T("Locked · coming soon", "مقفل · قريبًا")));
      b.addEventListener("click", function () { msg.textContent = T("This folder opens once the design work is ready.", "هذا المجلد يفتح لما تجهز أعمال التصميم."); });
      g.appendChild(a); g.appendChild(b);
      w.body.appendChild(g);
      var msg = el("p", "muted center"); w.body.appendChild(msg);
    }
    /* the folder is filled from GitHub: every public repository shows here by itself.
       Repositories that have a full project page use it; the others show their README image and description. */
    function repoName(n) { return n.replace(/[-_]+/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }).replace(/\bSql\b/g, "SQL").replace(/\bEv\b/g, "EV"); }
    function pageFor(repo) { var u = repo.url.toLowerCase(); return C.P.filter(function (p) { return p.github && p.github.toLowerCase().replace(/\/$/, "") === u; })[0]; }
    function crumbs(extra) {
      var p = el("p", "path"), back = button(T("Projects", "المشاريع"), "crumb");
      back.addEventListener("click", home);
      p.appendChild(back);
      if (extra) { var b2 = button(T("Data & Business Analysis", "تحليل البيانات والأعمال"), "crumb"); b2.addEventListener("click", list); p.appendChild(document.createTextNode(" › ")); p.appendChild(b2); p.appendChild(document.createTextNode(" › " + extra)); }
      else p.appendChild(document.createTextNode(" › " + T("Data & Business Analysis", "تحليل البيانات والأعمال")));
      w.body.appendChild(p);
    }
    function preview(r) {
      w.body.innerHTML = "";
      crumbs(repoName(r.name));
      var box = el("div", "repo-view");
      if (r.image) { var im = document.createElement("img"); im.className = "shot-big"; im.src = r.image; im.alt = repoName(r.name); im.onerror = function () { im.remove(); }; box.appendChild(im); }
      box.appendChild(el("h3", "", repoName(r.name)));
      if (r.description) box.appendChild(el("p", "", r.description));
      if (r.language) box.appendChild(el("p", "muted", r.language));
      box.appendChild(C.link(r.url, "btn gap-top", T("Open on GitHub ↗", "افتحه في GitHub ↗"), true));
      w.body.appendChild(box);
    }
    function card(g, pj, repo, first) {
      if (pj) {
        var f = C.link("#project/" + pj.id, "file" + (first ? " new" : ""));
        f.title = C.tr(pj.headline);
        f.innerHTML = A.file(C.asset(pj.thumbnail));
        f.appendChild(el("span", "", C.tr(pj.title)));
        var num = el("b"); num.appendChild(el("bdi", "", pj.insights[0].value)); num.appendChild(document.createTextNode(" · " + C.tr(pj.cardLine)));
        f.appendChild(num);
        f.addEventListener("click", function () { try { sessionStorage.setItem("desk-back", "list"); } catch (e) { /* back goes home */ } });
      } else {
        var f = button("", "file" + (first ? " new" : ""));
        f.title = repo.description || repo.name;
        f.innerHTML = A.file(repo.image || "");
        f.appendChild(el("span", "", repoName(repo.name)));
        f.appendChild(el("b", "", repo.language ? repo.language + " · GitHub" : "GitHub"));
        f.addEventListener("click", function () { preview(repo); });
      }
      g.appendChild(f);
    }
    function list() {
      w.body.innerHTML = "";
      crumbs();
      var g = el("div", "files");
      w.body.appendChild(g);
      var note = el("p", "muted gap-top", T("Open a project to see the analysis, the dashboard and the code on GitHub. New work on GitHub shows up here by itself.", "افتح المشروع وتشوف التحليل والداشبورد والكود في GitHub. أي مشروع جديد أرفعه في GitHub يطلع هنا تلقائيًا."));
      w.body.appendChild(note);
      function fill(repos) {
        g.innerHTML = "";
        var shown = {};
        ordered().forEach(function (pj, i) { shown[(pj.github || "").toLowerCase().replace(/\/$/, "")] = 1; card(g, pj, null, i === 0); });
        repos.forEach(function (r) { if (!shown[r.url.toLowerCase()] && !pageFor(r)) card(g, null, r, false); });
      }
      fill([]);
      fetch("repos.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (d) { if (g.isConnected) fill(d.repos || []); }, function () { /* the projects from the content file still show */ });
    }
    if (opts && opts.list) list(); else home();
  };

  /* ---------- Sticky Notes: visitors draw a little note; I approve it and it shows on the wall ---------- */
  var PAPERS = ["#FFFFFF", "#FBF3E4", "#FBE4E8", "#E6EEF8", "#E4F2EA", "#EEE8F8", "#FCF1CF", "#1F2A37"];
  var PATTERNS = ["plain", "dots", "grid", "lines"];
  var INKS = ["#1D1D1B", "#E5484D", "#F59E0B", "#3E9B5F", "#3B82F6", "#8B5CF6", "#EC4899", "#FFFFFF"];
  var STICKERS = ["☀️", "⭐", "❤️", "🌸", "📊", "🎨", "😊", "✨", "🌿", "☕"];
  function drawPaper(ctx, w, h, paper, pattern) {
    ctx.fillStyle = paper; ctx.fillRect(0, 0, w, h);
    var dark = paper === "#1F2A37", c = dark ? "rgba(255,255,255,.12)" : "rgba(29,29,27,.09)", step = 28, x, y;
    ctx.save(); ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1;
    if (pattern === "dots") { for (y = step; y < h; y += step) for (x = step; x < w; x += step) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill(); } }
    if (pattern === "grid") { ctx.beginPath(); for (x = step; x < w; x += step) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); } for (y = step; y < h; y += step) { ctx.moveTo(0, y + .5); ctx.lineTo(w, y + .5); } ctx.stroke(); }
    if (pattern === "lines") { ctx.beginPath(); for (y = step * 1.5; y < h; y += step) { ctx.moveTo(0, y + .5); ctx.lineTo(w, y + .5); } ctx.stroke(); }
    ctx.restore();
  }
  /* a strip of tape from a to b: plain, dotted or checked, in the chosen colour, with torn ends */
  function drawTape(ctx, a, b, color, style) {
    var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.max(40, Math.hypot(dx, dy)), ang = Math.atan2(dy, dx), h = 30, i;
    ctx.save(); ctx.translate(a[0], a[1]); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0, -h / 2);
    for (i = 0; i <= 6; i++) ctx.lineTo((i % 2) * 4, -h / 2 + i * h / 6);
    ctx.lineTo(len, h / 2);
    for (i = 6; i >= 0; i--) ctx.lineTo(len - (i % 2) * 4, -h / 2 + i * h / 6);
    ctx.closePath();
    ctx.globalAlpha = 0.6; ctx.fillStyle = color; ctx.fill();
    ctx.clip(); ctx.globalAlpha = 0.5; ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 2;
    if (style === "dots") for (var x = 8; x < len; x += 10) for (var y = -h / 2 + 6; y < h / 2; y += 9) { ctx.beginPath(); ctx.arc(x + (Math.round(y) % 2 ? 5 : 0), y, 1.8, 0, 7); ctx.fill(); }
    if (style === "grid") { ctx.beginPath(); for (var gx = 6; gx < len; gx += 9) { ctx.moveTo(gx, -h / 2); ctx.lineTo(gx, h / 2); } for (var gy = -h / 2 + 5; gy < h / 2; gy += 9) { ctx.moveTo(0, gy); ctx.lineTo(len, gy); } ctx.stroke(); }
    ctx.restore();
  }
  function pad() {
    var W = 960, H = 600, state = { tool: "pen", ink: INKS[0], size: 5, paper: PAPERS[0], pattern: "grid", tape: "plain", sticker: STICKERS[0] };
    var wrap = el("div", "sn"), side = el("div", "sn-tools"), stage = el("div", "sn-stage");
    var paper = document.createElement("canvas"), ink = document.createElement("canvas"), over = document.createElement("canvas");
    [paper, ink, over].forEach(function (c, i) { c.width = W; c.height = H; c.className = ["sn-paper", "sn-ink", "sn-over"][i]; stage.appendChild(c); });
    ink.setAttribute("aria-label", T("Drawing area", "مساحة الرسم"));
    var pc = paper.getContext("2d"), ic = ink.getContext("2d"), oc = over.getContext("2d"), drew = false, undo = [];
    function repaper() { drawPaper(pc, W, H, state.paper, state.pattern); }
    repaper();
    function tbtn(key, label, icon) {
      var b = button("", "sn-tool" + (state.tool === key ? " on" : "")); b.dataset.tool = key; b.setAttribute("aria-label", label);
      b.innerHTML = '<span class="sn-ico">' + icon + "</span>"; b.appendChild(el("small", "", label));
      b.addEventListener("click", function () { state.tool = key; side.querySelectorAll(".sn-tool").forEach(function (x) { x.classList.toggle("on", x === b); }); stickerRow.hidden = key !== "sticker"; });
      side.appendChild(b); return b;
    }
    tbtn("pen", T("Pen", "قلم"), "✎");
    tbtn("marker", T("Marker", "ماركر"), "▍");
    tbtn("rake", T("Rake", "مشط"), "≡");
    tbtn("tape", T("Tape", "شريط"), "▭");
    tbtn("eraser", T("Eraser", "ممحاة"), "⌫");
    tbtn("sticker", T("Stickers", "ستيكر"), "☺");
    var stickerRow = el("div", "sn-stickers"); stickerRow.hidden = true;
    STICKERS.forEach(function (st, i) { var b = button(st, i ? "" : "on"); b.addEventListener("click", function () { state.sticker = st; stickerRow.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); }); }); stickerRow.appendChild(b); });
    var tapes = el("div", "sn-tapes");
    [["plain", T("Plain tape", "شريط سادة")], ["dots", T("Dotted tape", "شريط منقط")], ["grid", T("Checked tape", "شريط كروهات")]].forEach(function (t) {
      var b = button("", "sn-tape " + t[0] + (state.tape === t[0] ? " on" : "")); b.setAttribute("aria-label", t[1]); b.title = t[1];
      b.addEventListener("click", function () { state.tape = t[0]; state.tool = "tape"; tapes.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); }); side.querySelectorAll(".sn-tool").forEach(function (x) { x.classList.toggle("on", x.dataset.tool === "tape"); }); stickerRow.hidden = true; });
      tapes.appendChild(b);
    });
    side.appendChild(tapes);
    var size = el("input", "sn-size"); size.type = "range"; size.min = 2; size.max = 24; size.value = state.size; size.setAttribute("aria-label", T("Size", "الحجم"));
    size.addEventListener("input", function () { state.size = +size.value; });
    side.appendChild(size);
    var inks = el("div", "sn-inks");
    function setInk(c, b) { state.ink = c; inks.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); }); tapes.style.setProperty("--tape", c); }
    INKS.forEach(function (c, i) { var b = button("", i ? "" : "on"); b.style.background = c; b.setAttribute("aria-label", c); b.addEventListener("click", function () { setInk(c, b); }); inks.appendChild(b); });
    var pick = el("input", "sn-pick"); pick.type = "color"; pick.value = "#7C5CFF"; pick.setAttribute("aria-label", T("More colours", "ألوان أكثر"));
    pick.addEventListener("input", function () { setInk(pick.value, null); });
    inks.appendChild(pick);
    side.appendChild(inks);
    tapes.style.setProperty("--tape", state.ink);

    var bottom = el("div", "sn-paperbar");
    bottom.appendChild(el("span", "sn-label", T("PAPER", "الورق")));
    PAPERS.forEach(function (c, i) { var b = button("", "sn-pp" + (i ? "" : " on")); b.style.background = c; b.setAttribute("aria-label", c); b.addEventListener("click", function () { state.paper = c; bottom.querySelectorAll(".sn-pp").forEach(function (x) { x.classList.toggle("on", x === b); }); repaper(); }); bottom.appendChild(b); });
    bottom.appendChild(el("i", "sn-div"));
    PATTERNS.forEach(function (p) { var b = button("", "sn-pat " + p + (state.pattern === p ? " on" : "")); b.setAttribute("aria-label", p); b.addEventListener("click", function () { state.pattern = p; bottom.querySelectorAll(".sn-pat").forEach(function (x) { x.classList.toggle("on", x === b); }); repaper(); }); bottom.appendChild(b); });

    var main = el("div", "sn-main"); main.appendChild(stickerRow); main.appendChild(stage); main.appendChild(bottom);
    wrap.appendChild(side); wrap.appendChild(main);

    function at(e) { var r = ink.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; }
    function seg(a, b) {
      var s = state.size; ic.lineCap = ic.lineJoin = "round";
      ic.globalCompositeOperation = state.tool === "eraser" ? "destination-out" : "source-over";
      ic.strokeStyle = state.ink; ic.globalAlpha = state.tool === "marker" ? 0.35 : 1;
      if (state.tool === "rake") {
        var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
        ic.lineWidth = Math.max(1, s / 4);
        for (var k = -2; k <= 2; k++) { ic.beginPath(); ic.moveTo(a[0] + nx * k * s, a[1] + ny * k * s); ic.lineTo(b[0] + nx * k * s + .01, b[1] + ny * k * s); ic.stroke(); }
      } else {
        ic.lineWidth = state.tool === "marker" ? s * 3 : state.tool === "eraser" ? s * 4 : s;
        ic.beginPath(); ic.moveTo(a[0], a[1]); ic.lineTo(b[0] + .01, b[1]); ic.stroke();
      }
      ic.globalAlpha = 1; ic.globalCompositeOperation = "source-over"; drew = true;
    }
    var last = null, start = null, path = null;
    /* the marker is drawn as one see-through stroke, so it does not get darker where it overlaps itself */
    function markerPath(c, pts) {
      c.save(); c.globalAlpha = 0.35; c.strokeStyle = state.ink; c.lineWidth = state.size * 3; c.lineCap = c.lineJoin = "round";
      c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); pts.forEach(function (q) { c.lineTo(q[0] + .01, q[1]); }); c.stroke(); c.restore();
    }
    function save() { undo.push(ic.getImageData(0, 0, W, H)); if (undo.length > 15) undo.shift(); }
    ink.addEventListener("pointerdown", function (e) {
      try { ink.setPointerCapture(e.pointerId); } catch (err) { /* not a real pointer */ }
      save();
      var p = at(e);
      if (state.tool === "sticker") { ic.font = (state.size * 3 + 28) + "px serif"; ic.textAlign = "center"; ic.textBaseline = "middle"; ic.fillText(state.sticker, p[0], p[1]); drew = true; return; }
      if (state.tool === "tape") { start = p; return; }
      if (state.tool === "marker") { path = [p]; oc.clearRect(0, 0, W, H); markerPath(oc, path); return; }
      last = p; seg(p, p);
    });
    ink.addEventListener("pointermove", function (e) {
      var p = at(e);
      if (start) { oc.clearRect(0, 0, W, H); drawTape(oc, start, p, state.ink, state.tape); return; }
      if (path) { path.push(p); oc.clearRect(0, 0, W, H); markerPath(oc, path); return; }
      if (!last) return; seg(last, p); last = p;
    });
    function up(e) {
      if (start) { oc.clearRect(0, 0, W, H); drawTape(ic, start, at(e), state.ink, state.tape); drew = true; start = null; }
      if (path) { oc.clearRect(0, 0, W, H); markerPath(ic, path); drew = true; path = null; }
      last = null;
    }
    ink.addEventListener("pointerup", up);
    ink.addEventListener("pointercancel", function () { oc.clearRect(0, 0, W, H); start = null; last = null; path = null; });
    return {
      node: wrap,
      drew: function () { return drew; },
      undo: function () { if (undo.length) ic.putImageData(undo.pop(), 0, 0); },
      clear: function () { save(); ic.clearRect(0, 0, W, H); drew = false; },
      image: function () {
        var s = document.createElement("canvas"); s.width = 480; s.height = 300;
        var c = s.getContext("2d"); c.drawImage(paper, 0, 0, 480, 300); c.drawImage(ink, 0, 0, 480, 300);
        return s.toDataURL("image/jpeg", 0.82);
      }
    };
  }
  /* one visitor note as a tidy row: initial, name, place, date, words, and the drawing */
  function noteRow(n, extra, onImage) {
    var a = el("article", "sn-row"); a.dir = /[\u0600-\u06FF]/.test((n.text || n.name || "").slice(0, 20)) ? "rtl" : "ltr";
    a.appendChild(el("span", "sn-av", (String(n.name || "?").trim()[0] || "?").toUpperCase()));
    var t = el("div", "sn-rt"), head = el("p", "sn-who");
    head.appendChild(el("b", "", n.name || T("Guest", "زائر")));
    if (n.place) head.appendChild(el("span", "", " · " + n.place));
    head.appendChild(el("time", "", when(n.at)));
    t.appendChild(head);
    if (n.text) { var p = el("p", "sn-say", n.text); p.dir = "auto"; t.appendChild(p); }
    if (n.img && (/^data:image\/(jpeg|png);base64,/.test(n.img) || /^pinned\/[\w-]+\.(png|jpe?g)$/.test(n.img))) {
      var b = button("", "sn-thumb"), im = document.createElement("img"); im.src = n.img; im.alt = T("Drawing by ", "رسمة ") + (n.name || "");
      b.appendChild(im); b.setAttribute("aria-label", T("Open the drawing", "كبّر الرسمة"));
      b.addEventListener("click", function () { if (onImage) onImage(n.img, im.alt); }); t.appendChild(b);
    }
    if (extra) t.appendChild(extra);
    a.appendChild(t);
    return a;
  }

  APPS.sticky = function (w) {
    w.title("Sticky Notes");
    var stops = [], view = el("div", "sn-view");
    function stopAll() { stops.forEach(function (s) { s(); }); stops = []; }
    w.onClose(stopAll);
    w.body.appendChild(view);
    var tWall = w.tool(T("Wall", "الحائط")), tDraw = w.tool(T("Draw", "ارسم")), tWrite = w.tool(T("Write", "اكتب")), tInbox = null;
    function mark(b) { [tWall, tDraw, tWrite, tInbox].forEach(function (x) { if (x) x.className = x === b ? "on" : ""; }); }
    tWall.addEventListener("click", wall); tDraw.addEventListener("click", draw); tWrite.addEventListener("click", write);
    STORE.ready.then(function () { if (STORE.db && STORE.owner) { tInbox = w.tool(T("Inbox", "الوارد")); tInbox.addEventListener("click", inbox); } });

    /* name, where from, and the post button: the same for drawing and writing */
    function postForm(withHi) {
      var form = el("form", "sn-form" + (withHi ? "" : " short")), hp = trap();
      var name = field("snName", T("Name (optional)", "الاسم (اختياري)"), 40), place = field("snPlace", T("Where from? (optional)", "من وين؟ (اختياري)"), 40);
      var hi = withHi ? field("snHi", T("Say hi (optional)", "قل مرحبا (اختياري)"), 300) : null;
      try { name.value = localStorage.getItem("desk-name") || ""; } catch (e) { /* empty */ }
      var send = el("button", "sn-post", T("post ↗", "أرسل ↗")); send.type = "submit";
      [name, place, hi].forEach(function (x) { if (x) form.appendChild(x); });
      form.appendChild(send); form.appendChild(hp);
      return { form: form, name: name, place: place, hi: hi, send: send, trap: hp };
    }
    async function post(f, info, entry, done) {
      if (!canSend()) { info.textContent = T("Sending is not available right now.", "الإرسال مو متاح حاليًا."); return; }
      if (f.trap.value) { info.textContent = T("Posted. Thank you!", "تم الإرسال، شكرًا لك!"); return; }
      if (!useDb() && tooSoon("note")) { info.textContent = T("Please wait a few seconds before sending again.", "انتظر ثواني قبل ما ترسل مرة ثانية."); return; }
      entry.id = newId(); entry.at = Date.now();
      entry.name = clean(f.name.value, 40) || T("Guest", "زائر"); entry.place = clean(f.place.value, 40);
      try { if (clean(f.name.value, 40)) localStorage.setItem("desk-name", entry.name); } catch (err) { /* not remembered */ }
      f.send.disabled = true; info.textContent = T("Sending...", "جاري الإرسال...");
      try {
        var summary = { name: entry.name, from: entry.place || "-", note: entry.text || "(a drawing)" };
        if (useDb()) await append("notes", entry, 8);
        else if (sb()) {
          await sbAdd(entry);
          emailMe("New sticky note waiting for approval", summary).catch(function () {});
          lastSend.note = Date.now();
        } else await emailMe("New sticky note from " + entry.name, summary, entry.img);
        local("desk-mynotes", { name: entry.name, place: entry.place, text: entry.text, at: entry.at }, 4);
        info.textContent = T("Posted! It shows on the wall once I approve it. Thank you!", "تم الإرسال! يطلع في الحائط بعد الموافقة. شكرًا لك!");
        if (window.BADGES) window.BADGES.give("note");
        done();
      } catch (err) {
        info.textContent = err && err.code === "wait" ? T("Please wait a few seconds before sending again.", "انتظر ثواني قبل ما ترسل مرة ثانية.") : err && err.code === "busy" ? T("The wall is busy right now. Try again later.", "الحائط مزحوم حاليًا، جرّب بعدين.") : T("Could not send. Try again in a moment.", "ما تم الإرسال، جرّب بعد شوي.");
      }
      f.send.disabled = false;
    }

    function draw() {
      stopAll(); mark(tDraw); view.innerHTML = "";
      var p = pad(); view.appendChild(p.node);
      var f = postForm(true);
      var acts = el("div", "sn-acts"), un = button("↶", "sn-mini"), cl = button(T("Clear", "مسح"), "sn-mini");
      un.setAttribute("aria-label", T("Undo", "تراجع"));
      un.addEventListener("click", p.undo); cl.addEventListener("click", p.clear);
      acts.appendChild(un); acts.appendChild(cl);
      var info = el("p", "sn-hint", T("Draw a little sticky, pick a paper, add your name and say hi. It shows on the wall once I approve it.", "ارسم ستيكي صغير، واختر الورق، واكتب اسمك وقل مرحبا. يطلع في الحائط بعد ما أوافق عليه."));
      view.appendChild(acts); view.appendChild(f.form); view.appendChild(info);
      f.form.addEventListener("submit", function (e) {
        e.preventDefault();
        var say = String(f.hi.value || "").trim().slice(0, 300);
        if (!p.drew() && !say) { info.textContent = T("Draw something or say hi first.", "ارسم شي أو قل مرحبا أول."); return; }
        var entry = { text: say }; if (p.drew()) entry.img = p.image();
        post(f, info, entry, function () { p.clear(); f.hi.value = ""; });
      });
    }

    /* a written note on a small sticky: pick the paper, type, post */
    function write() {
      stopAll(); mark(tWrite); view.innerHTML = "";
      var wrap = el("div", "sn-write"), card = el("div", "sn-card"), text = el("textarea", "sn-paper");
      text.id = "snText"; text.maxLength = 600; text.dir = "auto";
      text.placeholder = T("Write me a note...", "اكتب لي ملاحظة...");
      text.setAttribute("aria-label", T("Your note", "ملاحظتك"));
      var count = el("small", "sn-left", "600");
      text.addEventListener("input", function () { count.textContent = String(600 - text.value.length); });
      card.appendChild(text); card.appendChild(count);
      var papers = el("div", "sn-paperbar");
      papers.appendChild(el("span", "sn-label", T("PAPER", "الورق")));
      ["#FFFDF8", "#FBF3E4", "#FBE4E8", "#E6EEF8", "#E4F2EA", "#EEE8F8", "#FCF1CF"].forEach(function (c, i) {
        var b = button("", "sn-pp" + (i ? "" : " on")); b.style.background = c; b.setAttribute("aria-label", c);
        b.addEventListener("click", function () { card.style.background = c; papers.querySelectorAll(".sn-pp").forEach(function (x) { x.classList.toggle("on", x === b); }); });
        papers.appendChild(b);
      });
      wrap.appendChild(card); wrap.appendChild(papers);
      view.appendChild(wrap);
      var f = postForm(false);
      var info = el("p", "sn-hint", T("Write a few words, add your name and where you are from. It shows on the wall once I approve it.", "اكتب كم كلمة، واسمك ومن وين أنت. تطلع في الحائط بعد ما أوافق عليها."));
      view.appendChild(f.form); view.appendChild(info);
      setTimeout(function () { text.focus(); }, 50);
      f.form.addEventListener("submit", function (e) {
        e.preventDefault();
        var say = String(text.value || "").trim().slice(0, 600);
        if (!say) { text.focus(); info.textContent = T("Write something first.", "اكتب شي أول."); return; }
        post(f, info, { text: say }, function () { text.value = ""; count.textContent = "600"; });
      });
    }

    function lightbox(src, alt) {
      var box = el("div", "sn-light"), im = document.createElement("img"); im.src = src; im.alt = alt;
      box.appendChild(im); box.addEventListener("click", function () { box.remove(); });
      view.appendChild(box);
    }
    function wall() {
      stopAll(); mark(tWall); view.innerHTML = "";
      var head = el("div", "sn-wallhead"), count = el("p", "sn-count"), list = el("div", "sn-list"), status = el("p", "sn-empty", T("Loading...", "جاري التحميل..."));
      head.appendChild(count);
      var btns = el("div", "sn-acts2"), goW = button(T("+ Write", "+ اكتب"), "sn-post"), goD = button(T("+ Draw", "+ ارسم"), "sn-mini");
      goW.addEventListener("click", write); goD.addEventListener("click", draw);
      btns.appendChild(goD); btns.appendChild(goW); head.appendChild(btns);
      view.appendChild(head); view.appendChild(status); view.appendChild(list);
      function paint(rows) {
        list.innerHTML = "";
        rows.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
        count.textContent = rows.length + T(rows.length === 1 ? " note from visitors" : " notes from visitors", " ملاحظة من الزوار");
        status.hidden = rows.length > 0; status.textContent = T("No notes yet. Be the first!", "ما فيه ملاحظات للحين، كن أول واحد!");
        rows.forEach(function (n) { list.appendChild(noteRow(n, null, lightbox)); });
      }
      STORE.ready.then(function () {
        if (STORE.db) {
          stops.push(watch("pinned", function (l) { paint(l); }, function () { status.hidden = false; status.textContent = T("Can't reach the wall right now.", "ما قدرنا نوصل للحائط حاليًا."); }));
          return;
        }
        var fixed = fetch("pinned.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
        function load() {
          Promise.all([fixed, sb() ? sbBoard().catch(function () { return []; }) : []]).then(function (both) {
            if (!list.isConnected) return;
            paint((Array.isArray(both[0]) ? both[0] : []).concat(both[1]).filter(function (n) { return n && (n.text || n.img); }));
          });
        }
        load();
        if (sb()) { var tick = setInterval(load, 30000); stops.push(function () { clearInterval(tick); }); }
      });
    }

    function inbox() {
      stopAll(); mark(tInbox); view.innerHTML = "";
      var status = el("p", "sn-count", T("Loading...", "جاري التحميل...")), list = el("div", "sn-list");
      view.appendChild(status); view.appendChild(list);
      var pins = {}, notes = [];
      function paint() {
        list.innerHTML = "";
        status.textContent = notes.length ? T("Only you see this list. Pin a note to show it on the wall.", "هذي القائمة تشوفها أنت بس. ثبّت الملاحظة عشان تطلع في الحائط.") : T("No notes yet.", "ما فيه ملاحظات للحين.");
        notes.forEach(function (n) {
          var row = el("div", "row"), on = !!pins[n.id];
          var pin = button(on ? T("Unpin", "إلغاء التثبيت") : T("Pin", "ثبّت"), on ? "btn" : "btn light");
          pin.addEventListener("click", async function () {
            pin.disabled = true;
            try {
              if (on) await STORE.db.doc("pinned/" + n.id).delete();
              else await STORE.db.doc("pinned/" + n.id).set({ text: n.text || "", img: n.img || "", name: n.name || "", place: n.place || "", at: n.at || Date.now() });
            } catch (e) { pin.disabled = false; }
          });
          var del = button(T("Delete", "حذف"), "btn light");
          del.addEventListener("click", async function () { del.disabled = true; try { await removeEntry("notes", n.owner, n.id); if (pins[n.id]) await STORE.db.doc("pinned/" + n.id).delete(); } catch (e) { del.disabled = false; } });
          row.appendChild(pin); row.appendChild(del);
          list.appendChild(noteRow(n, row, lightbox));
        });
      }
      stops.push(watch("notes", function (l) { notes = l; paint(); }, function () { status.textContent = T("Can't reach notes right now.", "ما قدرنا نوصل للملاحظات حاليًا."); }));
      stops.push(watch("pinned", function (l) { pins = {}; l.forEach(function (p) { pins[p.key] = true; }); paint(); }, function () {}));
    }
    wall();
  };

  /* ---------- Notebook: my own notes, written as .md files in the notes folder of the site's repository ---------- */
  function parseNote(file, text) {
    var meta = {}, body = String(text || "").replace(/\r/g, "");
    var m = /^---\n([\s\S]*?)\n---\n?/.exec(body);
    if (m) { m[1].split("\n").forEach(function (l) { var i = l.indexOf(":"); if (i > 0) meta[l.slice(0, i).trim().toLowerCase()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, ""); }); body = body.slice(m[0].length); }
    var lines = body.trim().split("\n"), title = meta.title;
    if (!title && /^#\s+/.test(lines[0] || "")) title = lines.shift().replace(/^#\s+/, "");
    body = lines.join("\n").trim();
    var first = (body.split(/\n\s*\n/)[0] || "").replace(/[#>*_`-]/g, "").trim();
    var at = Date.parse(meta.date || "") || 0;
    return { file: file, title: title || file.replace(/\.md$/, "").replace(/[_-]+/g, " "), at: at, pinned: /^(true|yes|1)$/i.test(meta.pinned || ""), body: body, first: first };
  }
  /* a small, safe Markdown: paragraphs, headings, lists, quotes, bold, italic, code and links */
  function inline(node, text) {
    var re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g, last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) node.appendChild(document.createTextNode(text.slice(last, m.index)));
      var t = m[0], e;
      if (t.slice(0, 2) === "**") e = el("b", "", t.slice(2, -2));
      else if (t[0] === "*") e = el("i", "", t.slice(1, -1));
      else if (t[0] === "`") e = el("code", "", t.slice(1, -1));
      else { var k = t.indexOf("]("); e = C.link(t.slice(k + 2, -1), "", t.slice(1, k), true); }
      node.appendChild(e); last = m.index + t.length;
    }
    if (last < text.length) node.appendChild(document.createTextNode(text.slice(last)));
    return node;
  }
  function renderMd(src) {
    var out = el("div", "nb-text");
    src.split(/\n\s*\n/).forEach(function (block) {
      var b = block.trim(); if (!b) return;
      var ls = b.split("\n");
      if (/^#{1,3}\s/.test(b)) out.appendChild(inline(el(/^#\s/.test(b) ? "h3" : "h4"), b.replace(/^#+\s+/, "")));
      else if (ls.every(function (l) { return /^\s*[-*]\s+/.test(l); })) { var ul = el("ul"); ls.forEach(function (l) { ul.appendChild(inline(el("li"), l.replace(/^\s*[-*]\s+/, ""))); }); out.appendChild(ul); }
      else if (ls.every(function (l) { return /^\s*\d+[.)]\s+/.test(l); })) { var ol = el("ol"); ls.forEach(function (l) { ol.appendChild(inline(el("li"), l.replace(/^\s*\d+[.)]\s+/, ""))); }); out.appendChild(ol); }
      else if (/^>\s?/.test(b)) out.appendChild(inline(el("blockquote"), ls.map(function (l) { return l.replace(/^>\s?/, ""); }).join(" ")));
      else { var p = el("p"); ls.forEach(function (l, i) { if (i) p.appendChild(el("br")); inline(p, l); }); out.appendChild(p); }
    });
    return out;
  }
  var notesCache = null;
  function loadNotes() {
    if (notesCache) return notesCache;
    var repo = String(CFG.notesRepo || "");
    var names = (/^[\w.-]+\/[\w.-]+$/.test(repo)
      ? fetch("https://api.github.com/repos/" + repo + "/contents/notes", { headers: { Accept: "application/vnd.github+json" } }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (l) { return l.filter(function (f) { return f.type === "file"; }).map(function (f) { return f.name; }); })
      : Promise.reject()
    ).catch(function () { return fetch("notes/index.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }); });
    notesCache = names.then(function (list) {
      list = (Array.isArray(list) ? list : []).filter(function (n) { return /^[\w.-]+\.md$/.test(n) && !/^readme\.md$/i.test(n); });
      return Promise.all(list.map(function (n) { return fetch("notes/" + encodeURIComponent(n), { cache: "no-store" }).then(function (r) { return r.ok ? r.text() : ""; }).then(function (t) { return t ? parseNote(n, t) : null; }).catch(function () { return null; }); }));
    }).then(function (notes) { return notes.filter(Boolean).sort(function (a, b) { return (b.at || 0) - (a.at || 0); }); });
    notesCache.catch(function () { notesCache = null; });
    return notesCache;
  }
  function longDate(ms) {
    if (!ms) return "";
    try { return new Date(ms).toLocaleDateString(C.lang() === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Riyadh" }); } catch (e) { return ""; }
  }
  function monthOf(ms) {
    if (!ms) return T("Earlier", "قبل");
    var d = new Date(ms), now = new Date();
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) return T("This month", "هذا الشهر");
    try { return d.toLocaleDateString(C.lang() === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB", { month: "long", year: "numeric" }); } catch (e) { return ""; }
  }
  /* each note reads in its own language's direction, whatever language the site is in */
  function noteDir(n) { return /[\u0600-\u06FF]/.test((n.title + n.first).replace(/[^\p{L}]/gu, "").slice(0, 12)) ? "rtl" : "ltr"; }
  APPS.notebook = function (w) {
    w.title("Notebook");
    var box = el("div", "nb"), side = el("div", "nb-side"), read = el("div", "nb-read");
    var search = el("input", "nb-search"); search.type = "search"; search.placeholder = T("Search", "بحث"); search.setAttribute("aria-label", T("Search notes", "ابحث في المذكرات"));
    var list = el("div", "nb-list");
    side.appendChild(search); side.appendChild(list);
    box.appendChild(side); box.appendChild(read);
    w.body.appendChild(box);
    list.appendChild(el("p", "nb-empty", T("Loading...", "جاري التحميل...")));
    var notes = [], current = null;
    function open(n) {
      current = n;
      list.querySelectorAll(".nb-item").forEach(function (x) { x.classList.toggle("on", x.dataset.file === n.file); });
      read.innerHTML = "";
      var back = button(T("‹ Notes", "‹ المذكرات"), "nb-back"); back.addEventListener("click", function () { box.classList.remove("reading"); });
      read.appendChild(back);
      var art = el("article", "nb-note"); art.dir = noteDir(n);
      if (n.at) art.appendChild(el("p", "nb-date", longDate(n.at)));
      art.appendChild(el("h2", "nb-title", n.title));
      art.appendChild(renderMd(n.body));
      read.appendChild(art);
      box.classList.add("reading");
    }
    function paint() {
      var q = search.value.trim().toLowerCase();
      var shown = notes.filter(function (n) { return !q || (n.title + " " + n.body).toLowerCase().indexOf(q) >= 0; });
      list.innerHTML = "";
      if (!shown.length) { list.appendChild(el("p", "nb-empty", notes.length ? T("No notes match.", "ما فيه مذكرات تطابق.") : T("No notes yet.", "ما فيه مذكرات للحين."))); return; }
      var groups = [], seen = {};
      shown.forEach(function (n) { var g = n.pinned ? T("Pinned", "المثبتة") : monthOf(n.at); if (!seen[g]) { seen[g] = []; groups.push([g, seen[g]]); } seen[g].push(n); });
      groups.sort(function (a, b) { return (b[1][0].pinned ? 1 : 0) - (a[1][0].pinned ? 1 : 0); });
      groups.forEach(function (g) {
        list.appendChild(el("p", "nb-group", g[0]));
        g[1].forEach(function (n) {
          var b = button("", "nb-item" + (current && current.file === n.file ? " on" : "")); b.dataset.file = n.file; b.dir = noteDir(n);
          b.appendChild(el("b", "", n.title));
          var sub = el("span"); if (n.at) sub.appendChild(el("em", "", when(n.at))); sub.appendChild(document.createTextNode(n.first)); b.appendChild(sub);
          b.addEventListener("click", function () { open(n); });
          list.appendChild(b);
        });
      });
    }
    search.addEventListener("input", paint);
    loadNotes().then(function (l) {
      notes = l; paint();
      if (notes.length && window.matchMedia("(min-width: 641px)").matches) open(notes.filter(function (n) { return n.pinned; })[0] || notes[0]);
      else if (!notes.length) read.appendChild(el("p", "nb-empty center", T("Notes I write will show here.", "المذكرات اللي أكتبها بتطلع هنا.")));
    });
  };

  /* ---------- CV: locked; a visitor asks for it with name, email and job title ---------- */
  APPS.resume = function (w) {
    w.title(T("CV", "السيرة الذاتية"));
    w.narrow();
    var stop = null;
    w.onClose(function () { if (stop) stop(); });
    var head = el("div", "lockhead"); head.innerHTML = A.icon("resume");
    head.appendChild(el("p", "lock-title", T("My CV is shared on request", "السيرة الذاتية تُرسل عند الطلب")));
    head.appendChild(el("p", "muted center", T("Tell me who you are and I will email it to you.", "عرّفني بنفسك وأرسلها لك على الإيميل.")));
    w.body.appendChild(head);
    var form = el("form", "stack");
    var name = field("cvName", T("Your name", "اسمك"), 60), mail = field("cvMail", T("Your email", "إيميلك"), 120, "email"), role = field("cvRole", T("Your job title", "مسماك الوظيفي"), 80);
    var send = el("button", "btn", T("Request my CV", "اطلب السيرة الذاتية")); send.type = "submit";
    [name, mail, role, send].forEach(function (x) { form.appendChild(x); });
    var info = el("p", "muted"); form.appendChild(info);
    var hp = trap(); form.appendChild(hp);
    w.body.appendChild(form);
    STORE.ready.then(function () {
      if (!canSend()) { send.disabled = true; form.appendChild(bar(T("Requests are not available right now. Email me at ", "الطلب مو متاح حاليًا. راسلني على ") + S.email)); }
      if (STORE.db && STORE.owner) {
        w.body.appendChild(el("h3", "", T("Requests", "الطلبات")));
        var list = el("div", "inbox"), st = el("p", "muted", T("Loading...", "جاري التحميل..."));
        w.body.appendChild(st); w.body.appendChild(list);
        stop = watch("cv", function (l) {
          list.innerHTML = ""; st.textContent = l.length ? "" : T("No requests yet.", "ما فيه طلبات للحين.");
          l.forEach(function (r) {
            var a = el("article");
            a.appendChild(el("p", "", (r.name || "") + " · " + (r.role || "")));
            a.appendChild(el("small", "", (r.email || "") + " · " + when(r.at)));
            list.appendChild(a);
          });
        }, function () { st.textContent = T("Can't reach requests right now.", "ما قدرنا نوصل للطلبات حاليًا."); });
      }
    });
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!canSend()) return;
      var r = { id: newId(), name: clean(name.value, 60), email: clean(mail.value, 120), role: clean(role.value, 80), at: Date.now() };
      if (!r.name) { name.focus(); info.textContent = T("Add your name.", "اكتب اسمك."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) { mail.focus(); info.textContent = T("Add a valid email.", "اكتب إيميل صحيح."); return; }
      if (!r.role) { role.focus(); info.textContent = T("Add your job title.", "اكتب مسماك الوظيفي."); return; }
      if (hp.value) { info.textContent = T("Thank you!", "شكرًا لك!"); return; }
      send.disabled = true; info.textContent = T("Sending...", "جاري الإرسال...");
      try {
        if (useDb()) await append("cv", r, 5);
        else if (sb()) {
          /* saved in Supabase in under a second; the email is only a heads-up and may take a while */
          if (tooSoon("cv")) { var w8 = new Error("wait"); w8.code = "wait"; throw w8; }
          await sbInsert("cv_requests", { name: r.name, email: r.email, job_title: r.role });
          emailMe("CV request from " + r.name, { name: r.name, email: r.email, job_title: r.role, _replyto: r.email }).catch(function () {});
          lastSend.cv = Date.now();
        }
        else await emailMe("CV request from " + r.name, { name: r.name, email: r.email, job_title: r.role, _replyto: r.email });
        info.textContent = T("Thank you! I will email my CV to ", "شكرًا لك! بأرسل السيرة الذاتية على ") + r.email; form.reset(); }
      catch (err) { info.textContent = err && err.code === "wait" ? T("Please wait a few seconds before sending again.", "انتظر ثواني قبل ما ترسل مرة ثانية.") : T("Could not send. Try again in a moment.", "ما تم الإرسال، جرّب بعد شوي."); }
      send.disabled = false;
    });
  };

  /* ---------- sudoku ---------- */
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function puzzle(clues) {
    /* a valid full grid from the standard pattern, mixed by row, column and digit swaps that keep it valid */
    var bands = shuffle([0, 1, 2]), stacks = shuffle([0, 1, 2]), digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    var rows = [], cols = [];
    bands.forEach(function (b) { shuffle([0, 1, 2]).forEach(function (r) { rows.push(b * 3 + r); }); });
    stacks.forEach(function (s) { shuffle([0, 1, 2]).forEach(function (c) { cols.push(s * 3 + c); }); });
    var grid = rows.map(function (r) { return cols.map(function (c) { return digits[(3 * (r % 3) + Math.floor(r / 3) + c) % 9]; }); });
    var cells = shuffle(Array.from({ length: 81 }, function (_, i) { return i; })).slice(0, 81 - clues);
    var start = grid.map(function (r) { return r.slice(); });
    cells.forEach(function (i) { start[Math.floor(i / 9)][i % 9] = 0; });
    return start;
  }
  APPS.sudoku = function (w) {
    w.title(T("Sudoku", "سودوكو"));
    w.narrow();
    var levels = [[T("Easy", "سهل"), 40], [T("Medium", "متوسط"), 32], [T("Hard", "صعب"), 26]], level = 0;
    var top = el("div", "row"); w.body.appendChild(top);
    var gridEl = el("div", "sudoku"); gridEl.setAttribute("role", "grid"); w.body.appendChild(gridEl);
    var pad = el("div", "pad"); w.body.appendChild(pad);
    var status = el("p", "status center"); w.body.appendChild(status);
    var start, cur, sel = null;
    levels.forEach(function (l, i) {
      var b = button(l[0], i ? "btn light" : "btn");
      b.addEventListener("click", function () { level = i; top.querySelectorAll("button").forEach(function (x, j) { x.className = j === i ? "btn" : "btn light"; }); fresh(); });
      top.appendChild(b);
    });
    function fresh() { start = puzzle(levels[level][1]); cur = start.map(function (r) { return r.slice(); }); sel = null; draw(); }
    function clash(r, c) {
      var v = cur[r][c]; if (!v) return false;
      for (var i = 0; i < 9; i++) {
        if (i !== c && cur[r][i] === v) return true;
        if (i !== r && cur[i][c] === v) return true;
        var br = Math.floor(r / 3) * 3 + Math.floor(i / 3), bc = Math.floor(c / 3) * 3 + i % 3;
        if ((br !== r || bc !== c) && cur[br][bc] === v) return true;
      }
      return false;
    }
    function draw() {
      gridEl.innerHTML = "";
      var full = true, bad = false;
      for (var r = 0; r < 9; r++) for (var c = 0; c < 9; c++) {
        var fixed = start[r][c] !== 0, v = cur[r][c], b = button(v ? String(v) : "", "cell");
        if (fixed) b.classList.add("fixed");
        if (sel && sel[0] === r && sel[1] === c) b.classList.add("sel");
        else if (sel && (sel[0] === r || sel[1] === c)) b.classList.add("line");
        if (clash(r, c)) { b.classList.add("bad"); bad = true; }
        if (!v) full = false;
        if (c % 3 === 2 && c < 8) b.classList.add("edge-r");
        if (r % 3 === 2 && r < 8) b.classList.add("edge-b");
        b.setAttribute("aria-label", T("Row ", "صف ") + (r + 1) + T(", column ", "، عمود ") + (c + 1) + (v ? ": " + v : ""));
        (function (r, c, fixed) { b.addEventListener("click", function () { sel = fixed ? null : [r, c]; draw(); }); })(r, c, fixed);
        gridEl.appendChild(b);
      }
      if (full && !bad && window.BADGES) window.BADGES.give("sudoku");
      status.textContent = full && !bad ? T("Solved! Well done.", "حليتها! أحسنت.") : sel ? T("Pick a number.", "اختر رقم.") : T("Tap an empty square.", "اضغط مربع فاضي.");
    }
    for (var d = 1; d <= 10; d++) {
      (function (d) {
        var b = button(d === 10 ? "⌫" : String(d), "key");
        b.setAttribute("aria-label", d === 10 ? T("Erase", "مسح") : String(d));
        b.addEventListener("click", function () { if (!sel) return; cur[sel[0]][sel[1]] = d === 10 ? 0 : d; draw(); });
        pad.appendChild(b);
      })(d);
    }
    w.keys(function (e) {
      if (!sel) return;
      if (/^[1-9]$/.test(e.key)) { cur[sel[0]][sel[1]] = +e.key; draw(); }
      else if (e.key === "Backspace" || e.key === "Delete") { cur[sel[0]][sel[1]] = 0; draw(); }
    });
    fresh();
  };

  /* ---------- mail: write and send without leaving the site ---------- */
  APPS.contact = function (w) {
    w.title(T("New message", "رسالة جديدة"));
    w.narrow();
    var stop = null;
    w.onClose(function () { if (stop) stop(); });
    var form = el("form", "mail-form");
    function row(label, node) { var r = el("div", "mail-row"), l = el("label", "", label); if (node.id) l.htmlFor = node.id; r.appendChild(l); r.appendChild(node); return r; }
    var to = el("span", "mail-to", S.email);
    var name = el("input"); name.id = "mailName"; name.maxLength = 60; name.autocomplete = "name";
    var from = el("input"); from.id = "mailFrom"; from.type = "email"; from.maxLength = 120; from.autocomplete = "email";
    var subj = el("input"); subj.id = "mailSubject"; subj.maxLength = 120;
    var body = el("textarea", "mail-body"); body.id = "mailBody"; body.maxLength = 3000; body.setAttribute("aria-label", T("Message", "الرسالة"));
    form.appendChild(row(T("To", "إلى"), to));
    form.appendChild(row(T("Name", "الاسم"), name));
    form.appendChild(row(T("Your email", "إيميلك"), from));
    form.appendChild(row(T("Subject", "الموضوع"), subj));
    form.appendChild(body);
    w.body.appendChild(form);
    var foot = el("div", "mail-foot"), info = el("p", "muted"), send = el("button", "btn", T("Send", "إرسال")); send.type = "button";
    foot.appendChild(info); foot.appendChild(send); w.body.appendChild(foot);
    setTimeout(function () { name.focus(); }, 50);
    STORE.ready.then(function () {
      if (STORE.db && STORE.owner) {
        w.body.appendChild(el("h3", "", T("Inbox", "الوارد")));
        var st = el("p", "muted", T("Loading...", "جاري التحميل...")), list = el("div", "inbox");
        w.body.appendChild(st); w.body.appendChild(list);
        stop = watch("mail", function (l) {
          list.innerHTML = ""; st.textContent = l.length ? "" : T("No messages yet.", "ما فيه رسائل للحين.");
          l.forEach(function (m) {
            var a = el("article");
            a.appendChild(el("p", "", (m.subject || T("(no subject)", "(بدون موضوع)")) + " · " + (m.name || "")));
            a.appendChild(el("small", "", (m.email || "") + " · " + when(m.at)));
            var t = el("p", "muted", m.text || ""); t.style.whiteSpace = "pre-wrap"; t.style.marginTop = "6px"; a.appendChild(t);
            list.appendChild(a);
          });
        }, function () { st.textContent = T("Can't reach messages right now.", "ما قدرنا نوصل للرسائل حاليًا."); });
      }
    });
    /* the message goes to my email through FormSubmit (free, no account); if that cannot be reached
       here, it is kept in the site's inbox instead */
    var hp = trap(); form.appendChild(hp);
    function toEmail(m) { return emailMe("Message: " + (m.subject || "from your portfolio"), { name: m.name, email: m.email, message: m.text, _replyto: m.email }); }
    send.addEventListener("click", async function () {
      var m = { id: newId(), name: clean(name.value, 60), email: clean(from.value, 120), subject: clean(subj.value, 120), text: String(body.value || "").trim().slice(0, 3000), at: Date.now() };
      if (!m.name) { name.focus(); info.textContent = T("Add your name.", "اكتب اسمك."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)) { from.focus(); info.textContent = T("Add your email so I can reply.", "اكتب إيميلك عشان أرد عليك."); return; }
      if (!m.text) { body.focus(); info.textContent = T("Write your message.", "اكتب رسالتك."); return; }
      if (hp.value) { info.textContent = T("Sent.", "تم الإرسال."); return; }
      send.disabled = true; info.textContent = T("Sending...", "جاري الإرسال...");
      var ok = false, wait = false;
      if (sb() && !useDb()) {
        /* saved in Supabase first, so the visitor is not kept waiting; the email follows in the background */
        if (tooSoon("message")) wait = true;
        else {
          try {
            await sbInsert("messages", { name: m.name, email: m.email, subject: m.subject || null, text: m.text });
            ok = true; toEmail(m).catch(function () {}); lastSend.message = Date.now();
          } catch (err) { /* fall back to email */ }
        }
      }
      if (!ok && !wait) { try { await toEmail(m); ok = true; } catch (err) { wait = err && err.code === "wait"; } }
      if (!ok && useDb()) { try { await append("mail", m, 10); ok = true; } catch (err) { /* not sent */ } }
      if (ok) { info.textContent = T("Sent. I will reply to ", "تم الإرسال، بأرد عليك على ") + m.email; name.value = from.value = subj.value = body.value = ""; }
      else if (wait) info.textContent = T("Please wait a few seconds before sending again.", "انتظر ثواني قبل ما ترسل مرة ثانية.");
      else info.textContent = T("Could not send. Please email me at ", "ما تم الإرسال، راسلني على ") + S.email;
      send.disabled = false;
    });
  };

  /* ---------- dashboards gallery ---------- */
  APPS.gallery = function (w) {
    w.title(T("Dashboards", "معرض الشاشات"));
    function grid() {
      w.body.innerHTML = "";
      var g = el("div", "gallery");
      ordered().forEach(function (p) {
        var b = button("", "shot");
        var im = document.createElement("img"); im.src = C.asset(p.thumbnail); im.alt = ""; im.loading = "lazy"; b.appendChild(im);
        b.appendChild(el("span", "", C.tr(p.title)));
        b.addEventListener("click", function () { big(p); });
        g.appendChild(b);
      });
      w.body.appendChild(g);
    }
    function big(p) {
      w.body.innerHTML = "";
      var top = el("div", "row"), back = button("← " + T("All dashboards", "كل الشاشات"), "btn light");
      back.addEventListener("click", grid); top.appendChild(back);
      var open = C.link("#project/" + p.id, "btn", T("Open project", "افتح المشروع"));
      open.addEventListener("click", function () { try { sessionStorage.setItem("desk-back", "gallery"); } catch (e) { /* back goes home */ } });
      top.appendChild(open);
      w.body.appendChild(top);
      var im = document.createElement("img"); im.className = "shot-big"; im.src = C.asset(p.dashboard); im.alt = C.tr(p.title);
      w.body.appendChild(im);
      w.body.appendChild(el("p", "muted gap-top", C.tr(p.headline)));
    }
    grid();
  };

  /* ---------- help ---------- */
  APPS.help = function (w) {
    w.title(T("Help", "المساعدة"));
    w.narrow();
    var tips = [
      [T("The desktop", "سطح المكتب"), T("Click an icon on the right to open it in a window. Close it with the red dot, a click outside it, or Esc.", "اضغط أي أيقونة على اليمين وتنفتح في نافذة. تقفلها بالنقطة الحمراء أو بالضغط برّا النافذة أو زر Esc.")],
      [T("The sun menu", "قائمة الشمس"), T("The sun at the top left opens night mode, tidy up icons, and Shut down, which goes back to the login screen.", "الشمس فوق يسار فيها: الوضع الليلي، وترتيب الأيقونات، وإيقاف التشغيل اللي يرجعك لشاشة الدخول.")],
      [T("My name", "اسمي"), T("Click my name in the menu bar to read About me. The >_ button next to it opens a small Python file that introduces me.", "اضغط اسمي في الشريط العلوي وتطلع نبذة عني، والزر ‎>_‎ جنبه يفتح ملف بايثون صغير يعرّف فيني.")],
      [T("Explore bar", "شريط الاستكشاف"), T("The small bar at the top right fills up as you explore. Click it to see what is left.", "الشريط الصغير فوق يمين يتعبى كل ما استكشفت أكثر، اضغطه وتشوف وش باقي.")],
      [T("Background", "الخلفية"), T("Pick a colour or a photo under the clock, or swipe the desktop to the left.", "اختر لون أو صورة تحت الساعة، أو اسحب الشاشة لليسار.")],
      [T("Sound and language", "الصوت واللغة"), T("The speaker turns the click sound on or off. The letter A or ع switches English and Arabic.", "السماعة تشغّل صوت النقر أو تطفيه، والحرف A أو ع يبدّل بين الإنجليزي والعربي.")],
      [T("Screensaver", "شاشة التوقف"), T("Leave the page for 30 seconds and a short Python code draws the sun. Move the mouse to go back.", "إذا تركت الصفحة 30 ثانية يطلع كود بايثون يرسم الشمس. حرّك الماوس وترجع.")],
      [T("Projects", "المشاريع"), T("The Data & Business Analysis folder fills itself from my GitHub. Each project has the analysis, the dashboard and the code. Back returns you to the list.", "مجلد تحليل البيانات والأعمال يتعبى تلقائيًا من GitHub. كل مشروع فيه التحليل والداشبورد والكود، والرجوع يرجعك للقائمة.")],
      [T("Move icons", "تحريك الأيقونات"), T("Drag any icon on the desktop to place it where you like. Tidy up icons in the sun menu puts them back.", "اسحب أي أيقونة وحطها وين تبي. «ترتيب الأيقونات» في قائمة الشمس يرجعها مكانها.")],
      [T("Day and night", "النهار والليل"), T("Night mode in the sun menu darkens the windows and the bars. The background stays as it is.", "الوضع الليلي في قائمة الشمس يغمّق النوافذ والأشرطة، والخلفية تبقى مثل ما هي.")],
      [T("Notebook", "المذكرات"), T("Short notes I write about data, design and what I am learning. Search them or pick one from the list.", "مذكرات أكتبها عن البيانات والتصميم واللي أتعلمه. ابحث فيها أو اختر وحدة من القائمة.")],
      [T("Sticky Notes", "ملاحظات الزوار"), T("Draw a little note with pens, tape and stickers, add your name and say hi. It shows on the wall once I approve it.", "ارسم ملاحظة بالأقلام والشرائط والستيكرات، واكتب اسمك وقل مرحبا. تطلع في الحائط بعد ما أوافق عليها.")],
      [T("CV", "السيرة الذاتية"), T("Ask for my CV with your name, email and job title.", "اطلب السيرة باسمك وإيميلك ومسماك الوظيفي.")],
      [T("Sudoku", "سودوكو"), T("A quick puzzle for a break.", "لغز سريع للاستراحة.")],
      [T("Data lab", "مختبر البيانات"), T("Drop a CSV file and get a quick profile of every column. The file stays in your browser.", "حط ملف CSV ويطلع لك ملخص لكل عمود، والملف ما يطلع من متصفحك.")],
      [T("Contact", "تواصل"), T("Write a message and send it straight to my email.", "اكتب رسالتك وتوصل لإيميلي على طول.")],
      [T("Dock", "الشريط السفلي"), T("The tools I work with, for data and for design. Hover to see each name.", "الأدوات اللي أشتغل فيها للبيانات والتصميم، وقّف عليها وتشوف اسمها.")]
    ];
    var list = el("div", "help");
    tips.forEach(function (t) { var r = el("div", "help-row"); r.appendChild(el("b", "", t[0])); r.appendChild(el("p", "", t[1])); list.appendChild(r); });
    w.body.appendChild(list);
  };

  window.DESK = { apps: APPS, store: STORE };
})();
