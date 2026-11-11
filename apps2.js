/* Desktop version: badges, the data lab for CSV files, and my GitHub repositories. */
(function () {
  "use strict";
  var C = window.CORE, el = C.el, APPS = window.DESK.apps;
  var T = function (en, ar) { return C.lang() === "ar" ? ar : en; };
  function button(text, cls) { var b = el("button", cls || "btn", text); b.type = "button"; return b; }

  /* ---------- pixel badges: earned by exploring, kept in this browser ---------- */
  var LIST = [
    ["project", "#E2B93B", "First look", "أول نظرة", "Open a project", "افتح مشروع"],
    ["all", "#C8553D", "Full tour", "الجولة كاملة", "Open all five projects", "افتح المشاريع الخمسة كلها"],
    ["about", "#3E7CB1", "Nice to meet you", "تشرفنا", "Open About me", "افتح نبذة عني"],
    ["lab", "#4E7A5E", "Data detective", "محقق البيانات", "Check a CSV file in the data lab", "افحص ملف CSV في مختبر البيانات"],
    ["sudoku", "#9B7BB8", "Puzzle solver", "حلّال الألغاز", "Solve a Sudoku", "حل سودوكو"],
    ["note", "#E2AFB1", "Kind words", "كلمة طيبة", "Send a note or a drawing", "أرسل ملاحظة أو رسمة"],
    ["colour", "#7FB2D0", "New view", "منظر جديد", "Change the background", "غيّر الخلفية"],
    ["night", "#26354A", "Night owl", "ساهر الليل", "Switch on night mode", "شغّل الوضع الليلي"],
    ["saver", "#F6E7A1", "Patient eye", "عين صبورة", "Wait for the screensaver", "انتظر شاشة التوقف"],
    ["explorer", "#21392E", "Explorer", "المستكشف", "Open six different apps", "افتح ست تطبيقات مختلفة"]
  ];
  var got = {}, seenApps = {}, seenProjects = {};
  try { got = JSON.parse(localStorage.getItem("desk-badges") || "{}"); seenApps = JSON.parse(localStorage.getItem("desk-apps") || "{}"); seenProjects = JSON.parse(localStorage.getItem("desk-projects") || "{}"); } catch (e) { /* start fresh */ }
  function save() { try { localStorage.setItem("desk-badges", JSON.stringify(got)); localStorage.setItem("desk-apps", JSON.stringify(seenApps)); localStorage.setItem("desk-projects", JSON.stringify(seenProjects)); } catch (e) { /* not kept */ } }
  /* a round medal with a ribbon and a star, in the badge's colour; grey while locked */
  var mid = 0;
  function medal(color, locked) {
    var c = locked ? "#AEB8C0" : color, g = "md" + (++mid);
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".45"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="M15 4h7l4 13h-7zM33 4h-7l-4 13h7z" fill="' + c + '" opacity=".55"/>' +
      '<circle cx="24" cy="29" r="15" fill="' + c + '"/><circle cx="24" cy="29" r="15" fill="url(#' + g + ')"/>' +
      '<circle cx="24" cy="29" r="11" fill="none" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="1.4"/>' +
      '<path d="M24 22.6l2 4.1 4.5.6-3.3 3.1.8 4.5-4-2.1-4 2.1.8-4.5-3.3-3.1 4.5-.6z" fill="#FFFFFF" opacity="' + (locked ? ".7" : "1") + '"/></svg>';
  }
  var onGive = null;
  function give(id) {
    if (got[id]) return;
    var b = LIST.filter(function (x) { return x[0] === id; })[0];
    if (!b) return;
    got[id] = Date.now(); save();
    if (onGive) onGive(b, medal(b[1]));
  }
  function app(name) {
    seenApps[name] = 1; save();
    if (name === "about") give("about");
    if (Object.keys(seenApps).length >= 6) give("explorer");
  }
  function project(id) {
    seenProjects[id] = 1; save();
    give("project");
    if (C.P.every(function (p) { return seenProjects[p.id]; })) give("all");
  }
  window.BADGES = { give: give, app: app, project: project, medal: medal, onGive: function (fn) { onGive = fn; }, count: function () { return LIST.filter(function (b) { return got[b[0]]; }).length; }, total: LIST.length,
    list: function () { return LIST.map(function (b) { return { id: b[0], color: b[1], name: T(b[2], b[3]), how: T(b[4], b[5]), on: !!got[b[0]] }; }); } };

  /* ---------- data lab: a quick profile of any CSV, done in the browser; the file never leaves it ---------- */
  function parseCSV(text) {
    var rows = [], row = [], cell = "", q = false, i, ch, sep = (text.split("\n")[0].match(/;/g) || []).length > (text.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
    for (i = 0; i < text.length; i++) {
      ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === sep) { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += ch;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.length > 1 || r[0] !== ""; });
  }
  function profile(rows) {
    var head = rows[0], body = rows.slice(1);
    return head.map(function (name, i) {
      var vals = body.map(function (r) { return (r[i] || "").trim(); }), filled = vals.filter(function (v) { return v !== ""; });
      var nums = filled.map(function (v) { return Number(v.replace(/,/g, "")); }).filter(function (n) { return !isNaN(n); });
      var isNum = filled.length > 0 && nums.length / filled.length > 0.9;
      var isDate = !isNum && filled.length > 0 && filled.filter(function (v) { return /^\d{4}-\d{2}(-\d{2})?/.test(v); }).length / filled.length > 0.9;
      var col = { name: name || T("(no name)", "(بدون اسم)"), missing: vals.length - filled.length, total: vals.length, unique: new Set(filled).size, type: isNum ? "number" : isDate ? "date" : "text" };
      if (isNum) {
        var s = nums.slice().sort(function (a, b) { return a - b; }), sum = s.reduce(function (a, b) { return a + b; }, 0);
        col.min = s[0]; col.max = s[s.length - 1]; col.mean = sum / s.length; col.median = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; col.values = nums;
      } else {
        var cnt = {}; filled.forEach(function (v) { cnt[v] = (cnt[v] || 0) + 1; });
        col.top = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; }).slice(0, 3).map(function (k) { return [k, cnt[k]]; });
        if (isDate) { var d = filled.slice().sort(); col.first = d[0]; col.last = d[d.length - 1]; }
      }
      return col;
    });
  }
  function fmtNum(n) { return Math.abs(n) >= 1000 ? Math.round(n).toLocaleString("en-US") : (Math.round(n * 100) / 100).toString(); }
  function histogram(values) {
    var min = Math.min.apply(null, values), max = Math.max.apply(null, values), bins = new Array(12).fill(0);
    values.forEach(function (v) { var i = max === min ? 0 : Math.min(11, Math.floor((v - min) / (max - min) * 12)); bins[i]++; });
    var top = Math.max.apply(null, bins), svg = '<svg viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true">';
    bins.forEach(function (b, i) { var h = top ? Math.max(1, b / top * 34) : 0; svg += '<rect x="' + (i * 10 + 1) + '" y="' + (36 - h) + '" width="8" height="' + h + '" rx="1.5"/>'; });
    return svg + "</svg>";
  }
  APPS.lab = function (w) {
    w.title(T("Data lab", "مختبر البيانات"));
    var drop = el("label", "drop"), input = el("input"); input.type = "file"; input.accept = ".csv,text/csv"; input.id = "labFile";
    drop.htmlFor = "labFile";
    drop.appendChild(el("b", "", T("Drop a CSV file here, or click to choose one", "اسحب ملف CSV هنا، أو اضغط لاختيار ملف")));
    drop.appendChild(el("small", "", T("It is read inside your browser and never uploaded. Up to 5 MB.", "يُقرأ الملف داخل متصفحك ولا يُرفع إلى أي مكان. الحد الأقصى 5 ميغابايت.")));
    drop.appendChild(input);
    var sample = button(T("Try it with a table from my delivery project", "جرّب جدولًا من مشروع التوصيل"), "btn light");
    var head = el("div", "row"); head.appendChild(sample);
    var out = el("div", "lab-out");
    w.body.appendChild(drop); w.body.appendChild(head); w.body.appendChild(out);
    function show(name, text) {
      out.innerHTML = "";
      var rows = parseCSV(text);
      if (rows.length < 2) { out.appendChild(el("p", "sql-err", T("This file has no data rows.", "لا يحتوي هذا الملف على صفوف بيانات."))); return; }
      var cols = profile(rows), missing = cols.reduce(function (a, c) { return a + c.missing; }, 0), cells = (rows.length - 1) * cols.length;
      var sum = el("div", "lab-sum");
      [[T("File", "الملف"), name], [T("Rows", "الصفوف"), (rows.length - 1).toLocaleString("en-US")], [T("Columns", "الأعمدة"), cols.length], [T("Missing cells", "خلايا ناقصة"), missing.toLocaleString("en-US") + " (" + (cells ? Math.round(missing / cells * 1000) / 10 : 0) + "%)"]].forEach(function (k) { var d = el("div"); d.appendChild(el("small", "", k[0])); d.appendChild(el("b", "", String(k[1]))); sum.appendChild(d); });
      out.appendChild(sum);
      var dup = rows.length - 1 - new Set(rows.slice(1).map(function (r) { return r.join("\u0001"); })).size;
      if (dup) out.appendChild(el("p", "note-bar", dup + T(" duplicate rows found.", " صف مكرر.")));
      var grid = el("div", "lab-cols");
      cols.forEach(function (c) {
        var card = el("article", "lab-col");
        var top = el("div", "lab-top"); top.appendChild(el("b", "", c.name)); top.appendChild(el("span", "lab-type " + c.type, c.type === "number" ? T("number", "رقم") : c.type === "date" ? T("date", "تاريخ") : T("text", "نص"))); card.appendChild(top);
        card.appendChild(el("small", "muted", T("Missing ", "ناقص ") + c.missing + " · " + T("Unique ", "مختلف ") + c.unique));
        if (c.type === "number") {
          var h = el("div", "lab-hist"); h.innerHTML = histogram(c.values); card.appendChild(h);
          card.appendChild(el("p", "lab-stats", "min " + fmtNum(c.min) + " · median " + fmtNum(c.median) + " · mean " + fmtNum(c.mean) + " · max " + fmtNum(c.max)));
        } else {
          if (c.first) card.appendChild(el("p", "lab-stats", c.first + " → " + c.last));
          var ul = el("ul", "lab-top3"); (c.top || []).forEach(function (t) { var li = el("li"); li.appendChild(el("span", "", t[0])); li.appendChild(el("b", "", String(t[1]))); ul.appendChild(li); }); card.appendChild(ul);
        }
        grid.appendChild(card);
      });
      out.appendChild(grid);
      give("lab");
    }
    function read(file) {
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { out.innerHTML = ""; out.appendChild(el("p", "sql-err", T("The file is larger than 5 MB.", "حجم الملف أكبر من 5 ميغابايت."))); return; }
      var r = new FileReader();
      r.onload = function () { show(file.name, String(r.result || "")); };
      r.readAsText(file);
    }
    input.addEventListener("change", function () { read(input.files[0]); });
    ["dragenter", "dragover"].forEach(function (k) { drop.addEventListener(k, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (k) { drop.addEventListener(k, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { read(e.dataTransfer.files[0]); });
    sample.addEventListener("click", function () {
      var t = (window.SQLDATA || []).filter(function (x) { return x.name === "routes"; })[0];
      if (!t) return;
      var csv = [t.columns.join(",")].concat(t.rows.map(function (r) { return r.map(function (v) { return v === null ? "" : v; }).join(","); })).join("\n");
      show("routes.csv", csv);
    });
  };

  /* ---------- GitHub: my public repositories, refreshed by an automatic job ---------- */
  APPS.github = function (w) {
    w.title("GitHub");
    w.narrow();
    var status = el("p", "muted", T("Loading...", "جاري التحميل...")), list = el("div", "repos");
    w.body.appendChild(status); w.body.appendChild(list);
    fetch("repos.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (data) {
      status.remove();
      (data.repos || []).forEach(function (r) {
        var a = C.link(r.url, "repo", undefined, true);
        a.appendChild(el("b", "", r.name));
        if (r.description) a.appendChild(el("p", "", r.description));
        if (r.language) a.appendChild(el("small", "", r.language));
        list.appendChild(a);
      });
      w.body.appendChild(C.link(C.profile, "btn gap-top", T("Open my GitHub ↗", "افتح حسابي في GitHub ↗"), true));
    }, function () {
      status.textContent = T("The list could not load.", "تعذّر تحميل القائمة.");
      w.body.appendChild(C.link(C.profile, "btn gap-top", T("Open my GitHub ↗", "افتح حسابي في GitHub ↗"), true));
    });
  };
})();
