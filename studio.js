/* Two working tools for the Folders section, built on the main page:
   1. Data check: drop a CSV (or pick one of my project tables) and get a quality report in the browser.
      Nothing is uploaded anywhere.
   2. Chart makeover: the same numbers from my delivery project, a default chart and my redesign,
      with a slider between them and the reasons for each change. */
(function () {
  "use strict";
  var TABLES = window.SQLDATA || [];
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
  function fmt(n) { if (n == null || isNaN(n)) return "–"; var a = Math.abs(n); return a >= 1e6 ? (n / 1e6).toFixed(1) + "M" : a >= 1e4 ? Math.round(n / 1e3) + "K" : String(Math.round(n * 100) / 100); }

  /* ---------------- 1. data check ---------------- */
  function parseCSV(text) {
    var rows = [], row = [], cell = "", q = false, i, c;
    text = text.replace(/^﻿/, "");
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; continue; }
      if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    rows = rows.filter(function (r) { return r.length > 1 || (r[0] || "").trim() !== ""; });
    return { columns: rows[0] || [], rows: rows.slice(1) };
  }
  var DATE = /^\d{4}-\d{2}(-\d{2})?([ T]\d{2}:\d{2}(:\d{2})?)?$/;
  function isMissing(v) { return v == null || (typeof v === "string" && /^\s*$|^(na|n\/a|null|none|nan|-)$/i.test(v.trim())); }
  function profile(t) {
    var n = t.rows.length, seen = {}, dup = 0;
    t.rows.forEach(function (r) { var k = JSON.stringify(r); if (seen[k]) dup++; else seen[k] = 1; });
    var cols = t.columns.map(function (name, j) {
      var vals = t.rows.map(function (r) { return r[j]; }), miss = 0, nums = [], dates = 0, texts = 0, spaces = 0, uniq = {};
      vals.forEach(function (v) {
        if (isMissing(v)) { miss++; return; }
        if (typeof v === "string" && v !== v.trim()) spaces++;
        var s = String(v).trim(); uniq[s] = (uniq[s] || 0) + 1;
        var num = typeof v === "number" ? v : (/^-?[\d,]*\.?\d+(e-?\d+)?%?$/i.test(s) ? parseFloat(s.replace(/[,%]/g, "")) : NaN);
        if (!isNaN(num)) nums.push(num); else if (DATE.test(s)) dates++; else texts++;
      });
      var filled = n - miss, type = !filled ? "empty" : nums.length === filled ? "number" : dates === filled ? "date" : (nums.length && texts) ? "mixed" : "text";
      var keys = Object.keys(uniq), top = keys.sort(function (a, b) { return uniq[b] - uniq[a]; })[0];
      var c = { name: name, type: type, missing: miss, unique: keys.length, spaces: spaces, top: top, topN: top ? uniq[top] : 0 };
      if (nums.length) {
        nums.sort(function (a, b) { return a - b; });
        var q = function (p) { return nums[Math.min(nums.length - 1, Math.floor(p * (nums.length - 1)))]; };
        c.min = nums[0]; c.max = nums[nums.length - 1]; c.mean = nums.reduce(function (a, b) { return a + b; }, 0) / nums.length;
        var q1 = q(0.25), q3 = q(0.75), iqr = q3 - q1;
        c.outliers = iqr > 0 ? nums.filter(function (x) { return x < q1 - 1.5 * iqr || x > q3 + 1.5 * iqr; }).length : 0;
        c.bins = bins(nums);
      }
      return c;
    });
    return { rows: n, cols: cols, dup: dup, missing: cols.reduce(function (a, c) { return a + c.missing; }, 0) };
  }
  function bins(nums) {
    var lo = nums[0], hi = nums[nums.length - 1], k = 12, out = [];
    for (var i = 0; i < k; i++) out.push(0);
    nums.forEach(function (x) { out[hi === lo ? 0 : Math.min(k - 1, Math.floor((x - lo) / (hi - lo) * k))]++; });
    return out;
  }
  function spark(b) {
    if (!b) return "";
    var m = Math.max.apply(null, b) || 1;
    return '<svg class="dc-spark" viewBox="0 0 60 18" aria-hidden="true">' + b.map(function (v, i) {
      var h = Math.max(1, v / m * 16); return '<rect x="' + i * 5 + '" y="' + (18 - h) + '" width="4" height="' + h + '"/>';
    }).join("") + "</svg>";
  }
  function advice(p, T) {
    var out = [];
    if (p.dup) out.push(T(p.dup + " rows are exact copies. Remove them before counting anything.", "فيه " + p.dup + " صف مكرر بالكامل. احذفها قبل أي عدّ."));
    p.cols.forEach(function (c) {
      var pct = p.rows ? Math.round(c.missing / p.rows * 100) : 0;
      if (c.type === "empty") out.push(T("“" + c.name + "” is empty. Drop it.", "العمود «" + c.name + "» فاضي. احذفه."));
      else if (pct >= 30) out.push(T("“" + c.name + "” is " + pct + "% empty. Find out why before using it.", "العمود «" + c.name + "» فاضي بنسبة " + pct + "%. اعرف السبب قبل ما تستخدمه."));
      else if (c.missing) out.push(T("“" + c.name + "” has " + c.missing + " empty cells. Decide: fill, flag or leave out.", "العمود «" + c.name + "» فيه " + c.missing + " خلية فاضية. قرّر: تعبّيها، أو تعلّم عليها، أو تستبعدها."));
      if (c.type === "mixed") out.push(T("“" + c.name + "” mixes numbers and text. Clean it so it can be summed.", "العمود «" + c.name + "» فيه أرقام ونصوص مع بعض. نظّفه عشان ينجمع."));
      if (c.spaces) out.push(T("“" + c.name + "” has " + c.spaces + " values with extra spaces. Trim them so groups match.", "العمود «" + c.name + "» فيه " + c.spaces + " قيمة فيها مسافات زايدة. احذفها عشان تتطابق المجموعات."));
      if (c.outliers) out.push(T("“" + c.name + "” has " + c.outliers + " values far from the rest. Check them, they may be real or typos.", "العمود «" + c.name + "» فيه " + c.outliers + " قيمة بعيدة عن الباقي. راجعها، ممكن تكون صحيحة وممكن خطأ إدخال."));
      if (c.type !== "number" && c.unique === p.rows && p.rows > 1) out.push(T("“" + c.name + "” is unique on every row, so it works as the key.", "العمود «" + c.name + "» ما يتكرر أبدًا، يصلح يكون المفتاح."));
    });
    /* the key note is good news, so it goes last */
    out.sort(function (x, y) { return (/key|المفتاح/.test(x) ? 1 : 0) - (/key|المفتاح/.test(y) ? 1 : 0); });
    if (!out.length) out.push(T("Clean: no empty cells, no copies, no mixed types. Ready to analyse.", "نظيف: لا خلايا فاضية، ولا تكرار، ولا أنواع مختلطة. جاهز للتحليل."));
    return out;
  }
  var TYPE = { number: ["number", "رقم"], date: ["date", "تاريخ"], text: ["text", "نص"], mixed: ["mixed", "مختلط"], empty: ["empty", "فاضي"] };
  function check(box, lang) {
    var T = function (en, ar) { return lang === "ar" ? ar : en; };
    box.innerHTML =
      '<p class="st-kicker">[· ' + T("data check", "فحص البيانات") + ' ·]</p>' +
      '<h2 class="st-title">' + T("Is this data ready to analyse?", "هل البيانات جاهزة للتحليل؟") + "</h2>" +
      '<p class="st-lead">' + T("Before any chart, I check the data. Drop a CSV here and you get the same first check I run: empty cells, copies, types, odd values, and what to fix first. It runs in your browser; the file is not sent anywhere.",
        "قبل أي رسم، أفحص البيانات. ارمِ ملف CSV هنا وتطلع لك نفس الفحص الأول اللي أسويه: الخلايا الفاضية، والتكرار، والأنواع، والقيم الغريبة، ووش تصلح أول. يشتغل في متصفحك، والملف ما ينرسل لأي مكان.") + "</p>" +
      '<div class="dc-in"><label class="dc-drop" id="dcDrop"><input type="file" id="dcFile" accept=".csv,text/csv"><b>' + T("Drop a CSV or click to choose", "ارمِ ملف CSV أو اضغط للاختيار") + "</b><small>" + T("up to 5 MB", "حتى 5 ميجا") + "</small></label>" +
      '<div class="dc-or"><span>' + T("or try one of my project tables", "أو جرّب جدول من مشاريعي") + '</span><select id="dcPick">' +
      TABLES.map(function (t, i) { return '<option value="' + i + '">' + esc(t.name) + "</option>"; }).join("") + "</select></div></div>" +
      '<div class="dc-out" id="dcOut" aria-live="polite"></div>';
    var out = box.querySelector("#dcOut");
    function show(t, label) {
      var p = profile(t);
      out.innerHTML =
        '<p class="dc-name">' + esc(label) + "</p>" +
        '<div class="dc-cards">' +
        [[T("rows", "صفوف"), p.rows], [T("columns", "أعمدة"), p.cols.length], [T("empty cells", "خلايا فاضية"), p.missing], [T("copied rows", "صفوف مكررة"), p.dup]].map(function (k, i) {
          return '<div class="dc-card' + (i > 1 && k[1] ? " warn" : "") + '"><b>' + fmt(k[1]) + "</b><span>" + k[0] + "</span></div>";
        }).join("") + "</div>" +
        '<h3 class="st-h">' + T("What I would fix first", "وش أصلح أول") + '</h3><ol class="dc-todo">' + advice(p, T).slice(0, 7).map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ol>" +
        '<h3 class="st-h">' + T("Each column", "كل عمود") + '</h3><div class="dc-scroll"><table class="dc-table"><thead><tr><th>' + [T("column", "العمود"), T("type", "النوع"), T("empty", "فاضي"), T("unique", "مختلف"), T("range / most common", "المدى / الأكثر تكرارًا"), ""].join("</th><th>") + "</th></tr></thead><tbody>" +
        p.cols.map(function (c) {
          var info = c.min != null ? fmt(c.min) + " → " + fmt(c.max) + " · " + T("avg ", "متوسط ") + fmt(c.mean) : c.top != null ? "“" + esc(String(c.top).slice(0, 24)) + "” ×" + c.topN : "–";
          return "<tr><td>" + esc(c.name) + '</td><td><span class="dc-type t-' + c.type + '">' + TYPE[c.type][lang === "ar" ? 1 : 0] + "</span></td><td" + (c.missing ? ' class="warn"' : "") + ">" + c.missing + "</td><td>" + c.unique + "</td><td>" + info + "</td><td>" + spark(c.bins) + "</td></tr>";
        }).join("") + "</tbody></table></div>";
    }
    function pick(i) { var t = TABLES[i]; if (t) show(t, t.name + " · " + (t.about ? (t.about[lang] || t.about.en) : "")); }
    box.querySelector("#dcPick").addEventListener("change", function () { pick(+this.value); });
    var drop = box.querySelector("#dcDrop");
    function read(f) {
      if (!f) return;
      if (f.size > 5 * 1024 * 1024) { out.innerHTML = '<p class="dc-name">' + T("That file is over 5 MB.", "الملف أكبر من 5 ميجا.") + "</p>"; return; }
      var r = new FileReader();
      r.onload = function () { var t = parseCSV(String(r.result)); if (!t.columns.length) { out.innerHTML = '<p class="dc-name">' + T("No rows found in that file.", "ما لقيت صفوف في الملف.") + "</p>"; return; } show(t, f.name); };
      r.readAsText(f);
    }
    box.querySelector("#dcFile").addEventListener("change", function () { read(this.files[0]); });
    ["dragenter", "dragover"].forEach(function (k) { drop.addEventListener(k, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (k) { drop.addEventListener(k, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { read(e.dataTransfer.files[0]); });
    var start = Math.max(0, TABLES.findIndex ? TABLES.findIndex(function (t) { return t.name === "delivery_monthly"; }) : 0);
    box.querySelector("#dcPick").value = String(start); pick(start);
  }

  /* ---------------- 2. chart makeover ---------------- */
  function rating() {
    var t = TABLES.filter(function (x) { return x.name === "rating_by_delay"; })[0];
    return t ? t.rows.map(function (r) { return { level: String(r[0]).replace(/^\d+\.\s*/, ""), score: r[2], late: /late/.test(r[0]) }; }) : [];
  }
  var LV_AR = { "15+ days early": "مبكر 15+ يوم", "8-14 days early": "مبكر 8–14", "0-7 days early": "مبكر 0–7", "1-3 days late": "متأخر 1–3", "4-7 days late": "متأخر 4–7", "8-14 days late": "متأخر 8–14", "15+ days late": "متأخر 15+" };
  function before(d) {
    /* what a default chart often looks like: rainbow colours, cut axis, legend, tilted labels, no point */
    var W = 560, H = 330, x0 = 60, y0 = 270, lo = 1.5, hi = 4.5, bw = 50, gap = 18;
    var colors = ["#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#46f0f0"];
    var y = function (v) { return y0 - (v - lo) / (hi - lo) * 220; };
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" class="mk-svg before"><rect width="' + W + '" height="' + H + '" fill="#F2F2F2"/>' +
      '<text x="' + W / 2 + '" y="24" text-anchor="middle" font-size="15" font-family="Times New Roman,serif" fill="#000">avg_score by delay_level</text>';
    for (var g = lo; g <= hi + 0.001; g += 0.25) s += '<line x1="' + x0 + '" x2="' + (x0 + 7 * (bw + gap)) + '" y1="' + y(g) + '" y2="' + y(g) + '" stroke="#bbb" stroke-width=".8"/><text x="' + (x0 - 6) + '" y="' + (y(g) + 4) + '" text-anchor="end" font-size="10" fill="#333" font-family="Arial">' + g.toFixed(2) + "</text>";
    d.forEach(function (r, i) {
      var x = x0 + 10 + i * (bw + gap);
      s += '<rect x="' + (x + 5) + '" y="' + (y(r.score) - 5) + '" width="' + bw + '" height="' + (y0 - y(r.score)) + '" fill="#999"/>' +
        '<rect x="' + x + '" y="' + y(r.score) + '" width="' + bw + '" height="' + (y0 - y(r.score)) + '" fill="' + colors[i] + '" stroke="#000" stroke-width=".6"/>' +
        '<text transform="translate(' + (x + bw / 2) + "," + (y0 + 12) + ') rotate(35)" font-size="9.5" fill="#333" font-family="Arial">' + esc(r.level) + "</text>";
    });
    s += '<rect x="' + (W - 120) + '" y="40" width="108" height="' + (d.length * 13 + 8) + '" fill="#fff" stroke="#666"/>';
    d.forEach(function (r, i) { s += '<rect x="' + (W - 114) + '" y="' + (46 + i * 13) + '" width="8" height="8" fill="' + colors[i] + '"/><text x="' + (W - 102) + '" y="' + (54 + i * 13) + '" font-size="8" font-family="Arial" fill="#333">' + esc(r.level) + "</text>"; });
    return s + "</svg>";
  }
  function after(d, lang) {
    var W = 560, H = 330, x0 = 24, y0 = 262, bw = 58, gap = 14;
    var y = function (v) { return y0 - v / 5 * 190; };
    var ar = lang === "ar", firstLate = d.findIndex ? d.findIndex(function (r) { return r.late; }) : 3, prev = d[firstLate - 1], fl = d[firstLate];
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" class="mk-svg after"><rect width="' + W + '" height="' + H + '" fill="#0D1E2F"/>' +
      '<text x="' + x0 + '" y="34" font-size="20" font-weight="700" fill="#E6F3F8" font-family="Funnel Display,Readex Pro,sans-serif">' + (ar ? "التأخير يسحب النجوم بسرعة" : "Late orders lose stars, fast") + "</text>" +
      '<text x="' + x0 + '" y="56" font-size="12" fill="#A9BCC8" font-family="Funnel Display,Readex Pro,sans-serif">' + (ar ? "متوسط تقييم العميل من 5، حسب موعد وصول الطلب" : "Average review score out of 5, by when the order arrived") + "</text>" +
      '<line x1="' + x0 + '" x2="' + (W - 20) + '" y1="' + y0 + '" y2="' + y0 + '" stroke="#A9BCC8" stroke-width="1"/>';
    d.forEach(function (r, i) {
      var x = x0 + 8 + i * (bw + gap), c = r.late ? "#E2AFB1" : "#3C5873";
      s += '<rect class="mk-bar" style="--i:' + i + '" x="' + x + '" y="' + y(r.score) + '" width="' + bw + '" height="' + (y0 - y(r.score)) + '" fill="' + c + '"/>' +
        '<text x="' + (x + bw / 2) + '" y="' + (y(r.score) - 7) + '" text-anchor="middle" font-size="13" font-weight="700" fill="' + (r.late ? "#E2AFB1" : "#E6F3F8") + '" font-family="JetBrains Mono,monospace">' + r.score.toFixed(2) + "</text>" +
        '<text x="' + (x + bw / 2) + '" y="' + (y0 + 17) + '" text-anchor="middle" font-size="10.5" fill="#A9BCC8" font-family="Funnel Display,Readex Pro,sans-serif">' + esc(ar ? LV_AR[r.level] || r.level : r.level.replace(" days", "d")) + "</text>";
    });
    if (prev && fl) {
      var xa = x0 + 8 + firstLate * (bw + gap) + bw / 2;
      s += '<path d="M' + (xa - 40) + " " + (y(prev.score) - 30) + " Q " + (xa - 6) + " " + (y(prev.score) - 32) + " " + xa + " " + (y(fl.score) - 26) + '" fill="none" stroke="#F6E7A1" stroke-width="1.4" stroke-dasharray="3 3"/>' +
        '<text x="' + (xa - 44) + '" y="' + (y(prev.score) - 36) + '" text-anchor="end" font-size="11.5" fill="#F6E7A1" font-family="Funnel Display,Readex Pro,sans-serif">' +
        (ar ? "يوم تأخير واحد: " : "One day late: ") + prev.score.toFixed(2) + " → " + fl.score.toFixed(2) + "</text>";
    }
    s += '<text x="' + x0 + '" y="' + (H - 12) + '" font-size="10" fill="#6E8597" font-family="Funnel Display,Readex Pro,sans-serif">' + (ar ? "المصدر: مشروع التوصيل وتقييمات العملاء" : "Source: my delivery and reviews project") + "</text>";
    return s + "</svg>";
  }
  function makeover(box, lang) {
    var T = function (en, ar) { return lang === "ar" ? ar : en; }, d = rating();
    var notes = [
      [T("Say the point in the title", "قل الفكرة في العنوان"), T("“avg_score by delay_level” names columns. The new title tells you what happened.", "«avg_score by delay_level» مجرد أسماء أعمدة. العنوان الجديد يقول وش صار.")],
      [T("Colour only what matters", "لوّن المهم بس"), T("Seven colours made seven stories. Now late is pink and on time is quiet blue.", "سبعة ألوان تعني سبع قصص. الحين المتأخر وردي، والباقي أزرق هادي.")],
      [T("Start the axis at zero", "ابدأ المحور من الصفر"), T("The old axis started at 1.5, which made the drop look bigger than it is.", "المحور القديم يبدأ من 1.5، فيكبّر الفرق أكثر من حقيقته.")],
      [T("Label the bars, drop the clutter", "اكتب القيم واحذف الزحمة"), T("No legend, no grid, no 3D shadow, no tilted text. The numbers sit on the bars.", "بدون مفتاح ألوان، ولا شبكة، ولا ظل، ولا كلام مايل. الأرقام فوق الأعمدة.")]
    ];
    box.innerHTML =
      '<p class="st-kicker">[· ' + T("chart makeover", "إعادة تصميم رسم") + ' ·]</p>' +
      '<h2 class="st-title">' + T("Same numbers, clearer story", "نفس الأرقام، قصة أوضح") + "</h2>" +
      '<p class="st-lead">' + T("A table from my delivery project, drawn twice: first the way a tool draws it by default, then the way I would put it in front of a manager. Drag the line to compare.",
        "جدول من مشروع التوصيل، مرسوم مرتين: مرة بالشكل اللي تطلعه الأداة افتراضيًا، ومرة بالشكل اللي أعرضه على مدير. اسحب الخط وقارن.") + "</p>" +
      '<div class="mk-stage" id="mkStage" dir="ltr"><div class="mk-layer">' + before(d) + '</div><div class="mk-layer mk-top" id="mkTop">' + after(d, lang) + "</div>" +
      '<div class="mk-handle" id="mkHandle"><i></i></div><span class="mk-tag l">' + T("before", "قبل") + '</span><span class="mk-tag r">' + T("after", "بعد") + "</span></div>" +
      '<input class="mk-range" id="mkRange" type="range" min="0" max="100" value="50" aria-label="' + T("Compare before and after", "قارن قبل وبعد") + '">' +
      '<ol class="mk-notes">' + notes.map(function (n, i) { return '<li style="--i:' + i + '"><b>' + esc(n[0]) + "</b><span>" + esc(n[1]) + "</span></li>"; }).join("") + "</ol>";
    var stage = box.querySelector("#mkStage"), top = box.querySelector("#mkTop"), handle = box.querySelector("#mkHandle"), range = box.querySelector("#mkRange");
    function set(p) { p = Math.max(0, Math.min(100, p)); top.style.clipPath = "inset(0 0 0 " + p + "%)"; handle.style.left = p + "%"; range.value = p; }
    var drag = false;
    function at(e) { var r = stage.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); }
    stage.addEventListener("pointerdown", function (e) { drag = true; try { stage.setPointerCapture(e.pointerId); } catch (x) { /* fine */ } at(e); });
    stage.addEventListener("pointermove", function (e) { if (drag) at(e); });
    ["pointerup", "pointercancel"].forEach(function (k) { stage.addEventListener(k, function () { drag = false; }); });
    range.addEventListener("input", function () { set(+range.value); });
    /* a short show on open: the line sweeps across once */
    set(100);
    var t0 = performance.now();
    (function sweep(now) { var k = Math.min(1, (now - t0) / 1600); set(100 - 50 * (1 - Math.pow(1 - k, 3))); if (k < 1 && !drag) requestAnimationFrame(sweep); })(t0);
  }

  /* ---------------- 3. how I work: the same six steps, for any of my projects ---------------- */
  function process(box, lang, startId) {
    var ar = lang === "ar", T = function (en, a) { return ar ? a : en; };
    var L = function (o) { return o ? (typeof o === "string" ? o : (o[lang] || o.en || "")) : ""; };
    var n = function (x) { return Number(x).toLocaleString("en-US"); };
    var list = (window.PROJECTS || []).filter(function (p) { return p.process; });
    if (!list.length) { box.innerHTML = ""; return; }
    var NAMES = [T("ask", "السؤال"), T("data", "البيانات"), T("clean", "التنظيف"), T("analyse", "التحليل"), T("test", "الاختبار"), T("decide", "القرار")];
    var HEADS = [T("Start with the question", "أبدأ بالسؤال"), T("Know what is in the data", "أعرف ما في البيانات"), T("Clean it, and log every change", "أنظّفها وأسجّل كل تعديل"),
      T("Find where it concentrates", "أبحث أين يتركز"), T("Try to prove myself wrong", "أحاول أن أثبت أني مخطئة"), T("Turn it into a decision", "أحوّله إلى قرار")];
    box.innerHTML =
      '<p class="st-kicker">[· ' + T("how I work", "كيف أعمل") + ' ·]</p>' +
      '<h2 class="st-title">' + T("Six steps, every project", "ست خطوات، في كل مشروع") + "</h2>" +
      '<p class="st-lead">' + T("Pick a project. The steps stay the same; what I found at each one changes. Every number comes from that project's own files.",
        "اختر مشروعًا. الخطوات نفسها دائمًا، وما وجدته في كل خطوة يتغير. كل رقم من ملفات المشروع نفسه.") + "</p>" +
      '<div class="hw-pick" id="hwPick" role="tablist">' + list.map(function (p) {
        return '<button type="button" role="tab" data-id="' + esc(p.id) + '">' + esc(ar ? L(p.title) : String(p.cardTitle || L(p.title)).toLowerCase()) + "</button>"; }).join("") + "</div>" +
      '<div class="hw"><ol class="hw-nav" id="hwNav">' + NAMES.map(function (k, i) { return '<li><button type="button" data-i="' + i + '"><em>0' + (i + 1) + "</em>" + esc(k) + "</button></li>"; }).join("") +
      '</ol><div class="hw-steps" id="hwSteps"></div></div>';
    var scroller = box.closest(".studio") || null, nav = box.querySelectorAll("#hwNav button"), io = null, secs = [];
    function on(i) {
      nav.forEach(function (b, k) { b.classList.toggle("on", k === i); b.classList.toggle("done", k < i); });
      var ol = box.querySelector("#hwNav"), b = nav[i];
      if (ol.scrollWidth > ol.clientWidth) ol.scrollTo({ left: b.parentNode.offsetLeft - 16, behavior: "smooth" });
    }
    function arts(p) {
      var pr = p.process, max = Math.max.apply(null, pr.counts.map(function (c) { return c[1]; })) || 1;
      return [
        '<div class="hw-q"><span>?</span><p>' + esc(L(p.goal)) + "</p></div>",
        '<div class="hw-funnel">' + pr.counts.map(function (c, i) {
          return '<div class="hw-f" style="--w:' + (c[1] / max * 100).toFixed(1) + "%;--i:" + i + '"><i></i><span>' + esc(L(c[0])) + "</span><b>" + n(c[1]) + "</b></div>"; }).join("") + "</div>",
        '<table class="hw-t hw-log"><thead><tr><th>' + T("what I did", "ما فعلته") + "</th><th>" + T("rows", "صفوف") + "</th></tr></thead>" + pr.clean.map(function (c, i) {
          return '<tr style="--i:' + i + '"><td>' + esc(L(c[0])) + '</td><td class="v' + (c[1] ? "" : " zero") + '">' + n(c[1]) + "</td></tr>"; }).join("") + "</table>",
        '<div class="hw-ins">' + (p.insights || []).map(function (x, i) {
          return '<div style="--i:' + i + '"><b>' + esc(x.value) + "</b><span>" + esc(L(x.text)) + "</span></div>"; }).join("") + "</div>",
        '<ul class="hw-checks">' + pr.test.map(function (t, i) { return '<li style="--i:' + i + '"><i aria-hidden="true">✓</i><span>' + esc(L(t)) + "</span></li>"; }).join("") + "</ul>",
        '<div class="hw-out"><p class="hw-head">' + esc(L(p.headline)) + '</p><a class="btn" href="#p/' + esc(p.id) + '">' + T("[ · Read the full project · ]", "[ · اقرأ المشروع كاملًا · ]") + "</a></div>"
      ];
    }
    function texts(p) {
      return [
        T("Before touching the data, I write the question so it can be answered.", "قبل أن ألمس البيانات، أكتب السؤال بصيغة يمكن الإجابة عنها."),
        L(p.process.data) + " " + T("I count what is left after each rule, so nothing disappears without a reason.", "أعدّ ما يبقى بعد كل شرط، حتى لا يختفي شيء دون سبب."),
        T("Every change is written down with the rows it touched, so anyone can check it.", "كل تعديل مكتوب مع عدد الصفوف التي مسّها، ليستطيع أي أحد مراجعته."),
        T("Then I look for where the numbers concentrate, using " + (p.tools || []).join(", ") + ".", "ثم أبحث أين تتركز الأرقام، باستخدام " + (p.tools || []).join("، ") + "."),
        T("Before I trust a result, I try to break it.", "قبل أن أثق بأي نتيجة، أحاول أن أنقضها."),
        L(p.recommendation)
      ];
    }
    function show(id) {
      var p = list.filter(function (x) { return x.id === id; })[0] || list[0];
      box.querySelectorAll("#hwPick button").forEach(function (b) { var o = b.dataset.id === p.id; b.classList.toggle("on", o); b.setAttribute("aria-selected", String(o)); });
      var a = arts(p), t = texts(p);
      box.querySelector("#hwSteps").innerHTML = NAMES.map(function (k, i) {
        return '<section class="hw-step" data-i="' + i + '"><p class="hw-n">0' + (i + 1) + " / 06 · " + esc(k) + "</p><h3>" + esc(HEADS[i]) + "</h3><p>" + esc(t[i]) + '</p><div class="hw-art">' + a[i] + "</div></section>";
      }).join("");
      secs = box.querySelectorAll(".hw-step");
      if (io) io.disconnect();
      if ("IntersectionObserver" in window) {
        io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); on(+e.target.dataset.i); } }); }, { root: scroller, rootMargin: "-35% 0px -45% 0px" });
        secs.forEach(function (s) { io.observe(s); });
      } else secs.forEach(function (s) { s.classList.add("in"); });
      secs[0].classList.add("in"); on(0);
    }
    box.querySelectorAll("#hwPick button").forEach(function (b) {
      b.addEventListener("click", function () {
        show(b.dataset.id);
        var top = box.querySelector(".hw"); if (scroller && top) scroller.scrollTo({ top: top.offsetTop - 70, behavior: "smooth" });
      });
    });
    nav.forEach(function (b) { b.addEventListener("click", function () { secs[+b.dataset.i].scrollIntoView({ behavior: "smooth", block: "center" }); }); });
    show(startId || list[0].id);
  }

  /* small previews for the hover card */
  function sample(name, lang) {
    var ar = lang === "ar";
    if (name === "check") return '<div class="pk-dc"><div><b>20</b><span>' + (ar ? "صف" : "rows") + "</span></div><div><b>6</b><span>" + (ar ? "عمود" : "cols") + '</span></div><div class="w"><b>1</b><span>' + (ar ? "فاضي" : "empty") + "</span></div><i></i><i></i><i></i></div>";
    if (name === "process") return '<div class="pk-hw">' + ["?", "▤", "⌫", "▮▮", "≈", "→"].map(function (g, i) { return "<span style=\"--i:" + i + "\"><b>" + g + "</b>0" + (i + 1) + "</span>"; }).join("") + "</div>";
    if (name === "makeover") return '<div class="pk-mk">' + after(rating(), lang) + "</div>";
    return "";
  }
  function icon(name) {
    var S = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
    if (name === "check") return '<svg viewBox="0 0 34 34" ' + S + '><rect x="5" y="6" width="20" height="22"/><path d="M5 12h20M5 18h20M5 24h20M12 6v22"/><circle cx="24" cy="23" r="5" fill="#0D1E2F"/><path d="M27.5 26.5 31 30"/></svg>';
    if (name === "makeover") return '<svg viewBox="0 0 34 34" ' + S + '><path d="M4 29h26"/><path d="M7 29V17M12 29V11M17 29V20"/><path d="M21 29v-6M25 29v-12M29 29v-17" stroke="#E2AFB1"/><path d="M19 5v24" stroke-dasharray="2 2"/></svg>';
    if (name === "process") return '<svg viewBox="0 0 34 34" ' + S + '><circle cx="6" cy="9" r="3"/><circle cx="17" cy="17" r="3"/><circle cx="28" cy="25" r="3" stroke="#E2AFB1"/><path d="M8.5 10.5 14.5 15.5M19.5 18.5 25.5 23.5"/></svg>';
    if (name === "lab") return '<svg viewBox="0 0 34 34" ' + S + '><ellipse cx="17" cy="8" rx="11" ry="4"/><path d="M6 8v18c0 2.2 4.9 4 11 4s11-1.8 11-4V8M6 17c0 2.2 4.9 4 11 4s11-1.8 11-4"/></svg>';
    return "";
  }
  window.STUDIO = { check: check, makeover: makeover, process: process, sample: sample, icon: icon };
})();
