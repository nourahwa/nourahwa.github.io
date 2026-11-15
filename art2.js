/* Extra pieces for the desktop: the loading screen, code that turns into text,
   the line-drawn ID card, a sample when the pointer is over a folder,
   and a faint drawing behind each window. Colours come from settings.js. */
(function () {
  "use strict";
  var K = (window.SITE && window.SITE.colors) || {};
  var INK = K.ink || "#0D1E2F", NAVY = K.navyDark || "#172D43", SKY = K.sky || "#88C9E2", ICE = K.ice || "#E6F3F8", PINK = K.pink || "#E2AFB1", GOLD = "#F6E7A1";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  /* ---------- code that turns into text ---------- */
  var GLYPHS = "{}[]()<>/=;:_#$*+01%&|~";
  function decode(node, text, o) {
    o = o || {};
    if (node._run) cancelAnimationFrame(node._run);
    if (reduce || !text) { node.textContent = text || ""; return; }
    var chars = Array.from(text), n = chars.length, dur = o.dur || Math.min(2000, 300 + n * 13), delay = o.delay || 0, start = performance.now(), last = 0;
    function noise(c) { return c === " " || c === "\n" ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]; }
    function frame(now) {
      node._run = requestAnimationFrame(frame);
      if (now - last < 45) return; last = now;
      var t = now - start - delay, done = t < 0 ? 0 : Math.floor(n * Math.min(1, t / dur)), tail = "";
      for (var i = done; i < Math.min(n, done + 36); i++) tail += noise(chars[i]);
      node.innerHTML = esc(chars.slice(0, done).join("")) + '<span class="glyph">' + esc(tail) + "</span>";
      if (done >= n) { cancelAnimationFrame(node._run); node._run = 0; node.textContent = text; }
    }
    node._run = requestAnimationFrame(frame);
  }

  /* ---------- loading screen: running lines, a counter, then the screen opens ---------- */
  function loader(box, lang, done) {
    var lines = box.querySelector(".ld-lines"), pct = box.querySelector(".ld-pct"), stream = box.querySelector(".ld-stream");
    lines.innerHTML = ""; stream.innerHTML = "";
    box.classList.remove("fast", "out");
    var colors = [SKY, PINK, ICE, GOLD, SKY];
    for (var i = 0; i < 14; i++) {
      var d = document.createElement("i");
      d.className = "ld-line" + (i % 3 === 0 ? " thick" : "") + (i % 2 ? " rev" : "");
      d.style.top = (5 + Math.random() * 90).toFixed(1) + "%";
      d.style.color = colors[i % colors.length];
      d.style.setProperty("--d", (12 + Math.random() * 70 | 0) + "px");
      d.style.setProperty("--g", (8 + Math.random() * 40 | 0) + "px");
      d.style.setProperty("--s", (1.6 + Math.random() * 3.4).toFixed(2) + "s");
      d.style.opacity = (0.25 + Math.random() * 0.55).toFixed(2);
      lines.appendChild(d);
    }
    var s = document.createElement("span");
    s.textContent = "SELECT region, AVG(rating) FROM orders GROUP BY region;  df.groupby('month').late.mean()  →  plt.show()  ".repeat(8);
    stream.appendChild(s);
    box.querySelector(".ld-word").textContent = lang === "ar" ? "[ · جاري التحميل · ]" : "[ · LOADING · ]";
    box.querySelector(".ld-skip").textContent = lang === "ar" ? "[ اضغط للدخول ]" : "[ click to enter ]";
    var seen = false; try { seen = sessionStorage.getItem("desk-seen") === "1"; sessionStorage.setItem("desk-seen", "1"); } catch (e) { /* no storage */ }
    var total = reduce ? 200 : seen ? 900 : 2300, start = performance.now(), finished = false;
    function finish() {
      if (finished) return; finished = true;
      pct.textContent = "[ · 100% · ]";
      box.classList.add("fast");
      done();
    }
    box._finish = finish;
    (function tick(now) {
      if (finished) return;
      var p = Math.min(1, (now - start) / total), v = Math.round(100 * (1 - Math.pow(1 - p, 2)));
      pct.textContent = "[ · " + v + "%" + (p < 1 && Math.random() < 0.35 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : "") + " · ]";
      if (p >= 1) finish(); else requestAnimationFrame(tick);
    })(start);
    /* if the page is in the background, timers still finish it */
    setTimeout(finish, total + 400);
  }

  /* ---------- line portrait: long wavy hair, high-neck top, drawn in thin lines ---------- */
  function portrait() {
    var L = 'fill="none" stroke="' + ICE + '" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"';
    var T = 'fill="none" stroke="' + SKY + '" stroke-width=".9" stroke-linecap="round"';
    var hairOut = "M70 28 C44 26 30 46 33 70 C28 88 40 100 31 116 C22 132 37 144 28 158 C26 162 28 166 32 166";
    var hairOut2 = "M70 28 C96 26 110 46 107 70 C112 88 100 100 109 116 C118 132 103 144 112 158 C114 162 112 166 108 166";
    var strands = [
      "M60 34 C46 44 42 60 44 78 C40 96 50 108 42 124 C36 136 44 144 40 152",
      "M54 40 C40 54 38 74 38 88 C36 102 44 112 37 128",
      "M80 34 C94 44 98 60 96 78 C100 96 90 108 98 124 C104 136 96 144 100 152",
      "M86 40 C100 54 102 74 102 88 C104 102 96 112 103 128"
    ];
    return "<g>" +
      /* scan grid */
      '<g stroke="' + SKY + '" stroke-width=".4" opacity=".35">' + [20, 40, 60, 80, 100, 120].map(function (x) { return '<line x1="' + x + '" y1="0" x2="' + x + '" y2="190"/>'; }).join("") +
      [30, 60, 90, 120, 150, 180].map(function (y) { return '<line x1="0" y1="' + y + '" x2="140" y2="' + y + '"/>'; }).join("") + "</g>" +
      /* shoulders and the high neck */
      '<path d="M10 190 C14 160 34 148 52 142 L88 142 C106 148 126 160 130 190" ' + L + "/>" +
      '<path d="M57 104 V140 Q70 146 83 140 V104" ' + L + "/>" +
      '<path d="M57 112 Q70 116 83 112 M57 120 Q70 124 83 120 M57 128 Q70 132 83 128 M57 136 Q70 140 83 136" ' + T + "/>" +
      '<circle cx="34" cy="152" r="2" fill="' + PINK + '"/><circle cx="106" cy="152" r="2" fill="' + PINK + '"/>' +
      '<path d="M34 152 L20 166 M106 152 L120 166" ' + T + ' stroke-dasharray="2 3"/>' +
      /* face */
      '<path d="M50 60 C50 40 90 40 90 60 L90 76 C90 92 80 102 70 102 C60 102 50 92 50 76 Z" ' + L + "/>" +
      '<path d="M56 66 L66 64 M74 64 L84 66" ' + L + "/>" +
      '<path d="M57 73 Q61.5 70.5 66 73 M74 73 Q78.5 70.5 83 73" ' + L + "/>" +
      '<circle cx="61.5" cy="74.2" r="1" fill="' + ICE + '"/><circle cx="78.5" cy="74.2" r="1" fill="' + ICE + '"/>' +
      '<path d="M70 76 L68 85 L71 86" ' + L + "/>" +
      '<path d="M64 92 Q70 95.5 76 92" fill="none" stroke="' + PINK + '" stroke-width="1.6" stroke-linecap="round"/>' +
      '<circle cx="49" cy="84" r="1.6" fill="' + GOLD + '"/><circle cx="91" cy="84" r="1.6" fill="' + GOLD + '"/>' +
      /* hair: outline, a side part and wavy strands */
      '<path d="' + hairOut + '" ' + L + "/>" + '<path d="' + hairOut2 + '" ' + L + "/>" +
      '<path d="M50 62 C52 46 62 38 76 38 C88 40 94 50 92 64 M76 38 C70 46 60 52 50 58" ' + L + "/>" +
      strands.map(function (d) { return '<path d="' + d + '" ' + T + "/>"; }).join("") +
      /* target marks around the face */
      '<path d="M44 40 h6 M44 40 v6 M96 40 h-6 M96 40 v6 M44 108 h6 M44 108 v-6 M96 108 h-6 M96 108 v-6" stroke="' + PINK + '" stroke-width="1.2" fill="none"/>' +
      '<text x="6" y="12" style="font:500 6.5px JetBrains Mono,monospace;fill:' + SKY + ';letter-spacing:.08em">SCAN · 98%</text>' +
      '<text x="96" y="186" style="font:500 6.5px JetBrains Mono,monospace;fill:' + SKY + ';letter-spacing:.08em">N-WA·01</text>' +
      "</g>";
  }

  /* ---------- the ID card ---------- */
  function card(o) {
    var line = "rgba(230,243,248,.7)";
    var hex = function (x, y, f) {
      var p = []; for (var i = 0; i < 6; i++) { var a = Math.PI / 3 * i + Math.PI / 6; p.push((x + 12 * Math.cos(a)).toFixed(1) + "," + (y + 12 * Math.sin(a)).toFixed(1)); }
      return '<polygon points="' + p.join(" ") + '" fill="' + (f ? "rgba(136,201,226,.5)" : "none") + '" stroke="' + line + '" stroke-width="1.2"/>';
    };
    var rows = o.rows.map(function (t, i) {
      var y = 130 + i * 21, cx = o.rtl ? 236 : 42;
      return '<circle cx="' + cx + '" cy="' + (y - 4) + '" r="3.6" fill="' + (i === 0 ? PINK : "none") + '" stroke="' + ICE + '" stroke-width="1.1"/>' +
        (o.rtl ? '<text x="224" y="' + y + '" text-anchor="start" direction="rtl" class="cr ar">' : '<text x="54" y="' + y + '" class="cr">') + esc(t) + "</text>";
    }).join("");
    return '<svg viewBox="0 0 440 290" style="direction:ltr" role="img" aria-label="' + esc(o.label) + '">' +
      '<style>.cr{font:500 11px "JetBrains Mono",monospace;fill:' + ICE + ';letter-spacing:.05em}.cr.ar{font:500 12px "Readex Pro",sans-serif;letter-spacing:0}.cs{font:500 9px "JetBrains Mono",monospace;fill:' + ICE + ';letter-spacing:.2em}</style>' +
      '<defs><clipPath id="pf"><rect width="140" height="190"/></clipPath>' +
      '<linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + NAVY + '"/><stop offset="1" stop-color="' + INK + '"/></linearGradient></defs>' +
      '<path d="M22 8 H418 L432 22 V242 L410 264 H30 L8 242 V22 Z" fill="url(#cg)" fill-opacity=".92" stroke="' + ICE + '" stroke-width="1.5"/>' +
      '<path d="M30 16 H160 M300 16 H410" stroke="' + line + '" stroke-width="1"/>' +
      hex(42, 46, true) + hex(63, 46) + hex(84, 46, true) + hex(52.5, 64) + hex(73.5, 64) + hex(94.5, 64) +
      '<path d="M114 46 H236 L246 56 H258" stroke="' + line + '" stroke-width="1.1" fill="none"/>' +
      '<rect x="122" y="68" width="110" height="5" fill="' + SKY + '" opacity=".85"/><rect x="122" y="79" width="70" height="3" fill="' + PINK + '" opacity=".8"/>' +
      rows +
      '<g transform="translate(270 32)"><rect x="-6" y="-6" width="152" height="202" fill="none" stroke="' + ICE + '" stroke-width="1.1"/>' +
      '<g clip-path="url(#pf)"><rect width="140" height="190" fill="' + INK + '"/>' + portrait() + "</g>" +
      '<path d="M-6 -6 h14 M-6 -6 v14 M146 196 h-14 M146 196 v-14" stroke="' + PINK + '" stroke-width="2.2"/></g>' +
      '<text x="304" y="254" fill="' + GOLD + '" style="font:14px sans-serif;letter-spacing:2px">★★★★★</text>' +
      '<path d="M30 244 H230 L238 254 H30 Z" fill="rgba(230,243,248,.1)"/>' +
      '<text x="38" y="253" class="cs">[· ' + esc(o.id) + " ·]</text>" +
      "</svg>";
  }

  /* ---------- a sample of what is inside each folder ---------- */
  function sample(app, lang) {
    var ar = lang === "ar", P = window.PROJECTS || [];
    var t = function (en, a) { return ar ? a : en; };
    switch (app) {
      case "projects":
        return '<div class="pk-shots">' + P.slice(0, 3).map(function (p) { return '<img alt="" src="site/' + esc(p.thumbnail) + '">'; }).join("") + "</div>" +
          '<p class="pk-cap">' + P.length + t(" analyses inside", " تحليلات بالداخل") + "</p>";
      case "notebook": return '<div class="pk-paper"><b>' + t("Why I clean data first", "لماذا أنظف البيانات أولًا") + "</b><i></i><i></i><i></i><i></i></div>";
      case "sticky": return '<div class="pk-sticky"><span>' + t("Leave me a note ✎", "اترك لي ملاحظة ✎") + "</span></div>";
      case "resume": return '<div class="pk-paper lock"><b>CV</b><i></i><i></i><i></i><em>🔒 ' + t("on request", "عند الطلب") + "</em></div>";
      case "sudoku":
        var g = "530070000600195000098000060800060003400803001700020006060000280000419005000080079", h = "";
        for (var i = 0; i < 81; i++) h += "<span>" + (g[i] === "0" ? "" : g[i]) + "</span>";
        return '<div class="pk-sudoku">' + h + "</div>";
      case "lab": return '<pre class="pk-code">SELECT state,\n  AVG(late) AS rate\nFROM orders\nGROUP BY state\nORDER BY rate DESC;</pre>';
      case "contact": return '<div class="pk-mail"><span>✉</span><p>' + esc((window.SITE || {}).email || "") + "</p></div>";
      default: return "";
    }
  }

  /* ---------- a faint drawing behind each window ---------- */
  var S = 'fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
  var MOOD = {
    projects: '<svg viewBox="0 0 400 300"><g ' + S + '><path d="M20 70 a10 10 0 0 1 10-10 h90 l24 24 h226 a10 10 0 0 1 10 10 v180 a10 10 0 0 1-10 10 H30 a10 10 0 0 1-10-10 Z"/><path d="M80 250 V190 M140 250 V150 M200 250 V170 M260 250 V120 M320 250 V140"/></g></svg>',
    notebook: '<svg viewBox="0 0 300 380"><g ' + S + '><path d="M40 20 H240 V360 H40 Z"/><path d="M70 20 V360"/><path d="M90 90 H220 M90 130 H220 M90 170 H200 M90 210 H220 M90 250 H170"/></g></svg>',
    sticky: '<svg viewBox="0 0 300 300"><g ' + S + '><path d="M40 40 H260 V200 L200 260 H40 Z"/><path d="M260 200 H200 V260"/><circle cx="150" cy="40" r="14"/><path d="M80 110 H220 M80 150 H180"/></g></svg>',
    resume: '<svg viewBox="0 0 300 380"><g ' + S + '><path d="M40 20 H200 L260 80 V360 H40 Z"/><path d="M200 20 V80 H260"/><circle cx="110" cy="120" r="30"/><path d="M80 190 H220 M80 230 H220 M80 270 H180"/></g></svg>',
    sudoku: '<svg viewBox="0 0 300 300"><g ' + S + '><rect x="20" y="20" width="260" height="260"/><path d="M106 20 V280 M193 20 V280 M20 106 H280 M20 193 H280"/></g></svg>',
    lab: '<svg viewBox="0 0 300 340"><g ' + S + '><path d="M110 20 H190 M120 20 V120 L40 300 a12 12 0 0 0 11 18 H249 a12 12 0 0 0 11-18 L180 120 V20"/><path d="M75 230 H225"/><circle cx="130" cy="270" r="8"/><circle cx="170" cy="255" r="5"/></g></svg>',
    contact: '<svg viewBox="0 0 400 280"><g ' + S + '><rect x="20" y="40" width="360" height="220" rx="6"/><path d="M20 46 L200 170 L380 46"/></g></svg>',
    about: '<svg viewBox="0 0 400 300"><g ' + S + '><path d="M110 60 L40 150 L110 240"/><path d="M290 60 L360 150 L290 240"/><path d="M230 40 L170 260"/></g></svg>',
    help: '<svg viewBox="0 0 300 300"><g ' + S + '><circle cx="150" cy="150" r="120"/><path d="M110 115 a40 40 0 1 1 55 37 c-10 5-15 12-15 25 V190"/><circle cx="150" cy="225" r="4"/></g></svg>',
    "ev-global-sales": '<svg viewBox="0 0 400 300"><g ' + S + '><path d="M60 230 L120 120 H260 L330 230 Z"/><circle cx="120" cy="240" r="24"/><circle cx="280" cy="240" r="24"/><path d="M200 20 L170 90 H210 L185 150"/><path d="M10 290 H390" stroke-dasharray="20 14"/></g></svg>',
    "saudi-real-estate": '<svg viewBox="0 0 400 300"><g ' + S + '><path d="M20 290 V150 H90 V290 M90 290 V80 H170 V290 M170 290 V40 L210 10 L250 40 V290 M250 290 V120 H330 V290 M330 290 V180 H390 V290"/><path d="M110 110 H150 M110 150 H150 M110 190 H150 M190 70 H230 M190 110 H230 M190 150 H230 M270 150 H310 M270 190 H310"/><path d="M0 290 H400"/></g></svg>',
    "court-sessions": '<svg viewBox="0 0 400 300"><g ' + S + '><path d="M40 90 L200 20 L360 90 Z"/><path d="M50 100 H350 M50 270 H350 M30 290 H370"/><path d="M80 110 V260 M140 110 V260 M200 110 V260 M260 110 V260 M320 110 V260"/></g></svg>',
    "global-layoffs": '<svg viewBox="0 0 400 300"><g ' + S + '><path d="M40 270 H380 M40 270 V20"/><path d="M70 270 V60 M130 270 V100 M190 270 V140 M250 270 V190 M310 270 V230"/><path d="M60 40 L330 210"/><path d="M300 212 L332 212 L322 182"/></g></svg>',
    "olist-delivery-impact": '<svg viewBox="0 0 400 300"><g ' + S + '><path d="M230 130 L310 95 L390 130 L310 165 Z M230 130 V220 L310 255 V165 M390 130 V220 L310 255"/><path d="M270 112 L350 147"/><path d="M20 260 C80 260 60 160 130 160 C190 160 170 60 240 50" stroke-dasharray="10 12"/><circle cx="20" cy="260" r="8"/><circle cx="240" cy="50" r="12"/></g></svg>'
  };

  /* my sun mark, drawn as thin lines like the rest of the site: a half sun on a line with five rays */
  function sun() {
    var rays = [[5.5, 22, 2, 20.6], [11.2, 15, 9, 12.3], [20, 12, 20, 8.4], [28.8, 15, 31, 12.3], [34.5, 22, 38, 20.6]];
    return '<svg viewBox="0 0 40 32" overflow="visible" aria-hidden="true"><path class="sun-arc" d="M9 28 A11 11 0 0 1 31 28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" pathLength="1"/>' +
      '<line class="sun-flat" x1="1" y1="28" x2="39" y2="28" stroke="var(--pink,#E2AFB1)" stroke-width="1.6" stroke-linecap="round"/><g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
      rays.map(function (r) { return '<line class="ray" x1="' + r[0] + '" y1="' + r[1] + '" x2="' + r[2] + '" y2="' + r[3] + '"/>'; }).join("") + "</g></svg>";
  }

  /* text that is first typed as a line of Python, then runs and turns into the words */
  function py(node, text, o) {
    o = o || {};
    if (node._py) clearTimeout(node._py);
    if (node._run) cancelAnimationFrame(node._run);
    if (reduce || !text) { node.textContent = text || ""; return; }
    var code = o.code || ">>> print(" + (o.v || "text") + ")", i = 0, speed = o.speed || 38;
    node.classList.add("is-code");
    function type() {
      i++;
      node.innerHTML = '<span class="py-line">' + esc(code.slice(0, i)) + '<i class="py-caret"></i></span>';
      if (i < code.length) node._py = setTimeout(type, speed);
      else node._py = setTimeout(function () { node.classList.remove("is-code"); decode(node, text, { dur: o.dur }); }, o.hold || 320);
    }
    node.textContent = "";
    node._py = setTimeout(type, o.delay || 0);
  }

  window.FX = { sun: sun, decode: decode, py: py, loader: loader, card: card, sample: sample, mood: function (k) { return MOOD[k] || ""; } };
})();
