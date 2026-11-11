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
  function sbAdd(entry) { return sbInsert("notes", { name: entry.name, text: entry.text || null, img: entry.img || null }); }
  async function sbBoard() {
    var s = sb();
    var r = await fetch(s.url + "/rest/v1/notes?select=name,text,img,created_at&order=created_at.desc&limit=60", { headers: { apikey: s.key }, cache: "no-store" });
    if (!r.ok) throw new Error("no board");
    var rows = await r.json();
    return (Array.isArray(rows) ? rows : []).map(function (n) { return { name: n.name, text: n.text || "", img: n.img || "", at: Date.parse(n.created_at) || 0 }; });
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
    try { return new Date(ms).toLocaleDateString(C.lang() === "ar" ? "ar-SA" : "en-GB", { day: "numeric", month: "short", timeZone: "Asia/Riyadh" }); } catch (e) { return ""; }
  }
  function bar(text) { return el("p", "note-bar", text); }
  function field(id, ph, max, type) { var i = el("input", "field"); i.id = id; i.type = type || "text"; i.placeholder = ph; i.maxLength = max; i.setAttribute("aria-label", ph); return i; }
  function button(text, cls) { var b = el("button", cls || "btn", text); b.type = "button"; return b; }

  var APPS = {};

  /* ---------- about ---------- */
  /* about me, written as a small Python file: it types itself, runs, and the output is the introduction.
     The code and the output come from the same text below, so they always match. */
  var ME = {
    en: {
      role: "data analyst", hi: "Hi, I'm", label: "Toolkit:",
      mission: "I turn raw data into decisions people can trust.",
      skills: [
        ["Data cleaning", "messy files in, trusted tables out"],
        ["Exploratory analysis", "I get to know the data before I question it"],
        ["Data visualization", "one chart, one clear message"],
        ["KPI design", "measure what the goal really needs"],
        ["Business analysis", "link every number to a real decision"],
        ["Data storytelling", "findings a manager can read in a minute"]
      ]
    },
    ar: {
      role: "محللة بيانات", hi: "أهلًا، أنا", label: "أدواتي:",
      mission: "أحوّل البيانات الخام إلى قرارات يُعتمد عليها.",
      skills: [
        ["تنظيف البيانات", "ملفات مبعثرة تدخل، وجداول موثوقة تخرج"],
        ["التحليل الاستكشافي", "أتعرّف على البيانات قبل أن أسألها"],
        ["التصوير المرئي", "رسم واحد ورسالة واضحة"],
        ["مؤشرات الأداء", "أقيس ما يحتاجه الهدف فعلًا"],
        ["تحليل الأعمال", "أربط كل رقم بقرار حقيقي"],
        ["سرد القصص بالبيانات", "نتيجة يقرؤها المدير في دقيقة"]
      ]
    }
  };
  function aboutCode(m) {
    var pad = Math.max.apply(null, m.skills.map(function (x) { return x[0].length; }));
    return [
      "class DataAnalyst:",
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
      "        return [" + S.tools.map(function (x) { return '"' + x + '"'; }).join(", ") + "]",
      "",
      "",
      "me = DataAnalyst()",
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
      .concat(["", m.label + " " + S.tools.join(" · ")]);
  }
  function highlight(code) {
    var esc = function (t) { return t.replace(/&/g, "&amp;").replace(/</g, "&lt;"); };
    return code.replace(/(f?"[^"\n]*"?)|(#.*)|\b(class|def|return|for|in|self)\b|\b(print|DataAnalyst)\b|[^"#\w]+|\w+/g, function (m, str, com, kw, fn) {
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
    t.appendChild(el("p", "muted", T("Data analyst", "محللة بيانات")));
    t.appendChild(el("p", "about-bio", C.tr(S.bio)));
    t.appendChild(el("h3", "", T("Skills", "المهارات")));
    var sk = el("div", "chips"); S.skills.forEach(function (x) { sk.appendChild(el("span", "chip", C.tr(x))); }); t.appendChild(sk);
    t.appendChild(el("h3", "", T("Tools", "الأدوات")));
    var tl = el("div", "chips"); S.tools.forEach(function (x) { tl.appendChild(el("span", "chip", x)); }); t.appendChild(tl);
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

  /* ---------- notes: write or draw; only the writer and the owner see it, the owner can pin it ---------- */
  function canvasBox(onChange) {
    var wrap = el("div", "draw"), tools = el("div", "tools"), tool = "pen", color = "#21392E";
    [["pen", T("Pen", "قلم")], ["marker", T("Marker", "ماركر")], ["eraser", T("Eraser", "ممحاة")]].forEach(function (k, i) {
      var b = button(k[1], i ? "tk" : "tk on");
      b.addEventListener("click", function () { tool = k[0]; tools.querySelectorAll(".tk").forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); });
      tools.appendChild(b);
    });
    var size = el("input"); size.type = "range"; size.min = 2; size.max = 18; size.value = 5; size.setAttribute("aria-label", T("Brush size", "حجم الفرشاة")); tools.appendChild(size);
    var colors = el("div", "colors");
    ["#21392E", "#0D1E2F", "#4E7A5E", "#88C9E2", "#E2AFB1", "#C8553D", "#E2C46A", "#9B7BB8"].forEach(function (c, i) {
      var b = button("", i ? "" : "on"); b.style.background = c; b.setAttribute("aria-label", c);
      b.addEventListener("click", function () { color = c; colors.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); });
      colors.appendChild(b);
    });
    tools.appendChild(colors);
    var clear = button(T("Clear", "مسح"), "tk"); tools.appendChild(clear);
    var area = el("div", "canvas-wrap"), cv = document.createElement("canvas");
    cv.width = 800; cv.height = 520; cv.setAttribute("aria-label", T("Drawing area", "مساحة الرسم"));
    area.appendChild(cv);
    wrap.appendChild(tools); wrap.appendChild(area);
    var ctx = cv.getContext("2d"), last = null, drew = false;
    function blank() { ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, cv.width, cv.height); drew = false; }
    blank();
    clear.addEventListener("click", blank);
    function at(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; }
    function line(a, b) {
      var s = +size.value;
      ctx.lineCap = ctx.lineJoin = "round";
      ctx.globalAlpha = tool === "marker" ? 0.35 : 1;
      ctx.strokeStyle = tool === "eraser" ? "#FFFFFF" : color;
      ctx.lineWidth = tool === "marker" ? s * 3 : tool === "eraser" ? s * 4 : s;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0] + 0.01, b[1]); ctx.stroke();
      ctx.globalAlpha = 1; drew = true; if (onChange) onChange();
    }
    cv.addEventListener("pointerdown", function (e) { cv.setPointerCapture(e.pointerId); last = at(e); line(last, last); });
    cv.addEventListener("pointermove", function (e) { if (!last) return; var p = at(e); line(last, p); last = p; });
    ["pointerup", "pointercancel"].forEach(function (k) { cv.addEventListener(k, function () { last = null; }); });
    return {
      node: wrap,
      drew: function () { return drew; },
      image: function () { var s = document.createElement("canvas"); s.width = 400; s.height = 260; s.getContext("2d").drawImage(cv, 0, 0, 400, 260); return s.toDataURL("image/jpeg", 0.8); },
      clear: blank
    };
  }
  function noteCard(n, extra) {
    var a = el("figure", "sticky");
    if (n.img && (/^data:image\/(jpeg|png);base64,/.test(n.img) || /^pinned\/[\w-]+\.(png|jpe?g)$/.test(n.img))) { var im = document.createElement("img"); im.src = n.img; im.alt = T("Drawing by ", "رسمة ") + (n.name || ""); a.appendChild(im); }
    if (n.text) a.appendChild(el("p", "", n.text));
    a.appendChild(el("small", "", (n.name || "") + " · " + when(n.at)));
    if (extra) a.appendChild(extra);
    return a;
  }

  APPS.notes = function (w) {
    w.title(T("Notes", "الملاحظات"));
    var stops = [], view = el("div");
    function stopAll() { stops.forEach(function (s) { s(); }); stops = []; }
    w.onClose(stopAll);
    var tabs = [["write", T("Write", "اكتب")], ["draw", T("Draw", "ارسم")], ["pinned", T("Board", "اللوحة")]];
    var btns = {};
    function tabBar() {
      w.clearTools();
      tabs.forEach(function (t) { btns[t[0]] = w.tool(t[1]); btns[t[0]].addEventListener("click", function () { show(t[0]); }); });
    }
    tabBar();
    w.body.appendChild(view);
    STORE.ready.then(function () {
      if (STORE.db && STORE.owner && !btns.inbox) {
        tabs.push(["inbox", T("Inbox", "الوارد")]);
        tabBar(); mark(currentTab);
      }
    });
    var currentTab = "write";
    function mark(t) { Object.keys(btns).forEach(function (k) { btns[k].className = k === t ? "on" : ""; }); }

    function compose(kind) {
      view.innerHTML = "";
      view.appendChild(el("p", "muted", sb() && !useDb()
        ? T("Leave me a note or a drawing. It shows on the board once I approve it.", "اترك لي ملاحظة أو رسمة، وتطلع في اللوحة بعد ما أوافق عليها.")
        : T("Leave me a note or a drawing. Only you and I can see it.", "اترك لي ملاحظة أو رسمة. ما يشوفها غيرك وغيري.")));
      var form = el("form", "compose"), body = null, pad = null;
      if (kind === "write") { body = el("textarea", "paper"); body.id = "noteText"; body.maxLength = 1000; body.setAttribute("aria-label", T("Your note", "ملاحظتك")); form.appendChild(body); }
      else { pad = canvasBox(); form.appendChild(pad.node); }
      var row = el("div", "row gap-top"), name = field("noteName", T("Your name", "اسمك"), 40), send = el("button", "btn", T("Send", "أرسل")); send.type = "submit";
      try { name.value = localStorage.getItem("desk-name") || ""; } catch (e) { /* empty */ }
      row.appendChild(name); row.appendChild(send); form.appendChild(row);
      var info = el("p", "muted"); form.appendChild(info);
      var hp = trap(); form.appendChild(hp);
      view.appendChild(form);
      var mine = el("div", "board"); view.appendChild(mine);
      function showMine(list) {
        mine.innerHTML = "";
        if (list.length) mine.appendChild(el("h3", "", T("Your notes", "ملاحظاتك")));
        var g = el("div", "wall"); list.forEach(function (n) { g.appendChild(noteCard(n)); }); mine.appendChild(g);
      }
      STORE.ready.then(function () {
        if (!canSend()) { send.disabled = true; form.appendChild(bar(T("Sending is not available right now.", "الإرسال مو متاح حاليًا."))); return; }
        /* on the published site the visitor's own notes are kept in their browser only */
        if (!useDb()) { showMine(local("desk-mynotes").slice().reverse()); return; }
        /* the visitor sees their own notes; the rules hide everyone else's */
        var ref = STORE.db.doc("notes/" + STORE.uid);
        stops.push(ref.onSnapshot(function (snap) {
          mine.innerHTML = "";
          var list = snap.exists ? (snap.data().entries || []).slice().reverse() : [];
          if (list.length) mine.appendChild(el("h3", "", T("Your notes", "ملاحظاتك")));
          var g = el("div", "wall"); list.forEach(function (n) { g.appendChild(noteCard(n)); }); mine.appendChild(g);
        }, function () {}));
      });
      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        if (!canSend()) return;
        var who = clean(name.value, 40);
        if (!who) { name.focus(); info.textContent = T("Add your name first.", "اكتب اسمك أول."); return; }
        var entry = { id: newId(), name: who, at: Date.now() };
        if (body) { entry.text = String(body.value || "").trim().slice(0, 1000); if (!entry.text) { body.focus(); info.textContent = T("Write something first.", "اكتب شي أول."); return; } }
        else { if (!pad.drew()) { info.textContent = T("Draw something first.", "ارسم شي أول."); return; } entry.img = pad.image(); }
        try { localStorage.setItem("desk-name", who); } catch (err) { /* not remembered */ }
        send.disabled = true; info.textContent = T("Sending...", "جاري الإرسال...");
        if (hp.value) { info.textContent = T("Sent. Thank you!", "تم الإرسال، شكرًا لك!"); send.disabled = false; return; }
        if (!useDb() && tooSoon("note")) { info.textContent = T("Please wait a few seconds before sending again.", "انتظر ثواني قبل ما ترسل مرة ثانية."); send.disabled = false; return; }
        try {
          var waits = false;
          if (useDb()) await append("notes", entry, 8);
          else if (sb()) {
            await sbAdd(entry); waits = true;
            /* a short heads-up to my email; the note itself is already saved */
            emailMe("New note waiting for approval", { name: who, note: entry.text || "(a drawing)" }).catch(function () {});
            lastSend.note = Date.now();
            showMine(local("desk-mynotes", entry, 4).slice().reverse());
          } else {
            await emailMe("New note from " + who, { name: who, note: entry.text || "(drawing attached)" }, entry.img);
            showMine(local("desk-mynotes", entry, 4).slice().reverse());
          }
          info.textContent = waits ? T("Sent. It shows on the board once I approve it. Thank you!", "تم الإرسال، وتطلع في اللوحة بعد الموافقة. شكرًا لك!") : T("Sent. Thank you!", "تم الإرسال، شكرًا لك!");
          if (window.BADGES) window.BADGES.give("note");
          if (body) body.value = ""; else pad.clear();
        } catch (err) {
          info.textContent = err && err.code === "quota_exceeded" ? T("Notes are full right now.", "الملاحظات ممتلئة حاليًا.") : err && err.code === "wait" ? T("Please wait a few seconds before sending again.", "انتظر ثواني قبل ما ترسل مرة ثانية.") : err && err.code === "busy" ? T("The board is busy right now. Try again later.", "اللوحة مزحومة حاليًا، جرّب بعدين.") : T("Could not send. Try again in a moment.", "ما تم الإرسال، جرّب بعد شوي.");
        }
        send.disabled = false;
      });
    }

    function pinned() {
      view.innerHTML = "";
      view.appendChild(el("p", "muted", T("Notes and drawings from visitors.", "ملاحظات ورسومات الزوار.")));
      var g = el("div", "wall"), status = el("p", "empty", T("Loading...", "جاري التحميل..."));
      view.appendChild(status); view.appendChild(g);
      STORE.ready.then(function () {
        if (!STORE.db) {
          /* on the published site: the notes I approved in Supabase, plus any I add by hand in pinned.json.
             Visitors can only look. The board checks for new notes every 30 seconds while it is open. */
          var fixed = fetch("pinned.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
          function paint(list) {
            g.innerHTML = "";
            status.hidden = list.length > 0; status.textContent = T("Nothing pinned yet.", "ما فيه شي مثبت للحين.");
            list.forEach(function (n, i) { var c = noteCard(n); c.style.setProperty("--tilt", ((i % 3) - 1) * 1.4 + "deg"); g.appendChild(c); });
          }
          function load() {
            Promise.all([fixed, sb() ? sbBoard().catch(function () { return []; }) : []]).then(function (both) {
              var list = (Array.isArray(both[0]) ? both[0] : []).concat(both[1]).filter(function (n) { return n && (n.text || n.img); });
              list.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
              if (g.isConnected) paint(list);
            });
          }
          load();
          if (sb()) { var tick = setInterval(load, 30000); stops.push(function () { clearInterval(tick); }); }
          return;
        }
        stops.push(watch("pinned", function (list) {
          g.innerHTML = "";
          status.hidden = list.length > 0;
          status.textContent = T("Nothing pinned yet.", "ما فيه شي مثبت للحين.");
          list.forEach(function (n, i) { var c = noteCard(n); c.style.setProperty("--tilt", ((i % 3) - 1) * 1.4 + "deg"); g.appendChild(c); });
        }, function () { status.hidden = false; status.textContent = T("Can't reach the board right now.", "ما قدرنا نوصل للوحة حاليًا."); }));
      });
    }

    function inbox() {
      view.innerHTML = "";
      var status = el("p", "muted", T("Loading...", "جاري التحميل...")), g = el("div", "wall");
      view.appendChild(status); view.appendChild(g);
      var pins = {}, notes = [];
      function draw() {
        g.innerHTML = "";
        status.textContent = notes.length ? T("Only you see this list. Pin a note to show it to everyone.", "هذي القائمة تشوفها أنت بس. ثبّت الملاحظة عشان يشوفها الكل.") : T("No notes yet.", "ما فيه ملاحظات للحين.");
        notes.forEach(function (n) {
          var row = el("div", "row"), on = !!pins[n.id];
          var pin = button(on ? T("Unpin", "إلغاء التثبيت") : T("Pin", "ثبّت"), on ? "btn" : "btn light");
          pin.addEventListener("click", async function () {
            pin.disabled = true;
            try {
              if (on) await STORE.db.doc("pinned/" + n.id).delete();
              else await STORE.db.doc("pinned/" + n.id).set({ text: n.text || "", img: n.img || "", name: n.name || "", at: n.at || Date.now() });
            } catch (e) { pin.disabled = false; }
          });
          var del = button(T("Delete", "حذف"), "btn light");
          del.addEventListener("click", async function () {
            del.disabled = true;
            try { await removeEntry("notes", n.owner, n.id); if (pins[n.id]) await STORE.db.doc("pinned/" + n.id).delete(); } catch (e) { del.disabled = false; }
          });
          row.appendChild(pin); row.appendChild(del);
          g.appendChild(noteCard(n, row));
        });
      }
      stops.push(watch("notes", function (l) { notes = l; draw(); }, function () { status.textContent = T("Can't reach notes right now.", "ما قدرنا نوصل للملاحظات حاليًا."); }));
      stops.push(watch("pinned", function (l) { pins = {}; l.forEach(function (p) { pins[p.key] = true; }); draw(); }, function () {}));
    }

    function show(t) {
      currentTab = t; stopAll(); mark(t);
      if (t === "write" || t === "draw") compose(t);
      else if (t === "pinned") pinned();
      else inbox();
    }
    show("write");
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
      [T("Notes", "الملاحظات"), T("Write or draw a note with your name. Only you and I see it.", "اكتب أو ارسم ملاحظة باسمك، ما يشوفها غيرك وغيري.")],
      [T("CV", "السيرة الذاتية"), T("Ask for my CV with your name, email and job title.", "اطلب السيرة باسمك وإيميلك ومسماك الوظيفي.")],
      [T("Sudoku", "سودوكو"), T("A quick puzzle for a break.", "لغز سريع للاستراحة.")],
      [T("Data lab", "مختبر البيانات"), T("Drop a CSV file and get a quick profile of every column. The file stays in your browser.", "حط ملف CSV ويطلع لك ملخص لكل عمود، والملف ما يطلع من متصفحك.")],
      [T("Contact", "تواصل"), T("Write a message and send it straight to my email.", "اكتب رسالتك وتوصل لإيميلي على طول.")],
      [T("Dock", "الشريط السفلي"), T("The tools I work with. Hover to see each name.", "الأدوات اللي أشتغل فيها، وقّف عليها وتشوف اسمها.")]
    ];
    var list = el("div", "help");
    tips.forEach(function (t) { var r = el("div", "help-row"); r.appendChild(el("b", "", t[0])); r.appendChild(el("p", "", t[1])); list.appendChild(r); });
    w.body.appendChild(list);
  };

  window.DESK = { apps: APPS, store: STORE };
})();
