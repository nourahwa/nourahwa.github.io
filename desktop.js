/* Desktop version shell: login screen, menu bar, colours, icons, dock and the window. */
(function () {
  "use strict";
  var C = window.CORE, A = window.ART, D = window.DESK, S = C.S, el = C.el, $ = function (id) { return document.getElementById(id); };
  var T = function (en, ar) { return C.lang() === "ar" ? ar : en; };
  var TZ = "Asia/Riyadh";

  /* ---------- backgrounds: three colours that drift, plus the folder colour that goes with them ---------- */
  var PALETTES = [
    /* three soft gradients. n1-n3 colour the windows in night mode */
    { id: "garden", en: "Garden", ar: "الحديقة", a: "#1B3226", b: "#2E4A35", c: "#56684A", folder: "#9DBF8F", top: "#C9E0BA", back: "#7FA373", intro: "#F7F3E3", fg: "#F7F3E3", n1: "#18241E", n2: "#1F2C25", n3: "#2A3A31" },
    { id: "lemon", en: "Lemon", ar: "الليمون", a: "#5A6246", b: "#6F6848", c: "#77705B", folder: "#D9C15E", top: "#EDDB8C", back: "#B9A043", intro: "#FBF6E2", fg: "#FBF6E2", n1: "#2E2F24", n2: "#3A3B2D", n3: "#47483A" },
    { id: "sky", en: "Sky", ar: "السماوي", a: "#2C4656", b: "#44647A", c: "#6C8496", folder: "#7FB2D0", top: "#A9CDE2", back: "#5E93B3", intro: "#EEF6FA", fg: "#EEF6FA", n1: "#1E2C33", n2: "#25363F", n3: "#30434D" },
    /* photo backgrounds (Unsplash, free to use); a, b and c are only used for the swatch and the wipe */
    { id: "hills", en: "Hills", ar: "التلال", photo: "photos/hills.jpg", thumb: "photos/hills-thumb.jpg", a: "#B9C9B8", b: "#7FA36A", c: "#4E7A3E", folder: "#9DBF8F", top: "#C9E0BA", back: "#7FA373", intro: "#FFFFFF", fg: "#FFFFFF", n1: "#1C2B22", n2: "#24362B", n3: "#2F4436" },
    { id: "clouds", en: "Clouds", ar: "الغيوم", photo: "photos/clouds.jpg", thumb: "photos/clouds-thumb.jpg", a: "#7E93B8", b: "#C9D3E2", c: "#EEF1F5", folder: "#7FB2D0", top: "#A9CDE2", back: "#5E93B3", intro: "#FFFFFF", fg: "#FFFFFF", n1: "#222B3A", n2: "#2A3446", n3: "#354055" }
  ];
  var palIndex = 0;
  function setPalette(i, announce, at) {
    var next = (i + PALETTES.length) % PALETTES.length;
    if (announce && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) { wipe(next, at); return; }
    apply(next, announce);
  }
  /* the new background spreads out from where you touched, like ink in water */
  var wiping = false;
  function wipe(next, at) {
    if (wiping) return;
    var p = PALETTES[next], ink = $("ink"), x = at ? at[0] : window.innerWidth / 2, y = at ? at[1] : window.innerHeight;
    wiping = true;
    ink.style.background = p.photo ? "center / cover no-repeat url(" + p.photo + ")" : "linear-gradient(172deg," + p.a + " 0%," + p.a + " 34%," + p.b + " 50%," + p.c + " 64%," + p.c + " 100%)";
    ink.style.setProperty("--x", x + "px"); ink.style.setProperty("--y", y + "px");
    ink.classList.remove("go"); ink.hidden = false;
    void ink.offsetWidth;
    ink.classList.add("go");
    setTimeout(function () { apply(next, true); setTimeout(function () { ink.hidden = true; ink.classList.remove("go"); wiping = false; }, 40); }, 320);
  }
  function apply(i, announce) {
    palIndex = i;
    var p = PALETTES[palIndex], r = document.documentElement.style;
    document.documentElement.classList.toggle("photo", !!p.photo);
    if (p.photo) r.setProperty("--photo", "url(" + p.photo + ")"); else r.removeProperty("--photo");
    r.setProperty("--a", p.a); r.setProperty("--b", p.b); r.setProperty("--c", p.c);
    r.setProperty("--folder", p.folder); r.setProperty("--folder-top", p.top); r.setProperty("--folder-back", p.back); r.setProperty("--intro", p.intro); r.setProperty("--fg", p.fg); r.setProperty("--n1", p.n1); r.setProperty("--n2", p.n2); r.setProperty("--n3", p.n3);
    try { localStorage.setItem("desk-palette", p.id); } catch (e) { /* not remembered */ }
    document.querySelectorAll(".dot").forEach(function (d, j) { d.classList.toggle("on", j === palIndex); d.setAttribute("aria-pressed", String(j === palIndex)); });
    if (announce) { toast(C.tr(p)); if (window.BADGES) window.BADGES.give("colour"); }
  }
  try { if (localStorage.getItem("desk-mode") === "night") document.documentElement.dataset.mode = "night"; } catch (e) { /* day */ }
  (function () {
    var saved = "garden"; try { saved = localStorage.getItem("desk-palette") || "garden"; } catch (e) { /* default */ }
    palIndex = Math.max(0, PALETTES.map(function (p) { return p.id; }).indexOf(saved));
  })();

  /* swipe up (touch) or scroll up (wheel / trackpad) on the desktop: next colour */
  function deskFits() { return document.documentElement.scrollHeight <= window.innerHeight + 4; }
  var wheelSum = 0, wheelAt = 0, cool = 0;
  window.addEventListener("wheel", function (e) {
    if (current || !$("home").offsetParent || !$("login").hidden || !deskFits()) return;
    var now = Date.now();
    if (now - wheelAt > 400) wheelSum = 0;
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    wheelAt = now; wheelSum += e.deltaX;
    if (wheelSum > 120 && now > cool) { cool = now + 1100; wheelSum = 0; setPalette(palIndex + 1, true, [e.clientX, e.clientY]); }
  }, { passive: true });
  var touch = null;
  $("home").addEventListener("touchstart", function (e) { touch = e.target.closest(".icon,.dock,.palette,.menubar,.codepanel") ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }; }, { passive: true });
  $("home").addEventListener("touchend", function (e) {
    if (!touch || current || !deskFits()) return;
    var dx = e.changedTouches[0].clientX - touch.x, dy = e.changedTouches[0].clientY - touch.y;
    if (dx < -70 && Math.abs(dy) < Math.abs(dx) && Date.now() - touch.t < 700) setPalette(palIndex + 1, true, [touch.x, touch.y]);
    touch = null;
  }, { passive: true });

  /* ---------- toast ---------- */
  var toastTimer;
  function toast(text, node) {
    var t = $("toast");
    t.innerHTML = ""; t.appendChild(document.createTextNode(text)); if (node) t.appendChild(node);
    t.hidden = false; clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, node ? 6000 : 1800);
  }

  /* ---------- Riyadh time and weather ---------- */
  function fmt(opts) { try { return new Intl.DateTimeFormat(C.lang() === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", Object.assign({ timeZone: TZ }, opts)).format(new Date()); } catch (e) { return ""; } }
  /* 12-hour time with AM / PM, short day and month, all in Riyadh time */
  function parts() {
    try {
      var p = {};
      new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return { time: p.hour + ":" + p.minute, ampm: (p.dayPeriod || "").toUpperCase() };
    } catch (e) { return { time: "", ampm: "" }; }
  }
  function tick() {
    var t = parts(), date = fmt({ weekday: "short", day: "numeric", month: "short" });
    $("mbTime").textContent = t.time + " " + t.ampm;
    $("mbDate").textContent = date;
    if (!$("login").hidden) {
      $("loginTime").textContent = t.time;
      $("loginAmPm").textContent = t.ampm;
      $("loginDate").textContent = date;
    }
  }
  setInterval(tick, 15000);
  var WX = { 0: ["☀", "Clear", "صافٍ"], 1: ["🌤", "Mostly clear", "صافٍ غالبًا"], 2: ["⛅", "Partly cloudy", "غائم جزئيًا"], 3: ["☁", "Cloudy", "غائم"], 45: ["🌫", "Fog", "ضباب"], 61: ["🌧", "Rain", "مطر"], 80: ["🌦", "Showers", "زخات"], 95: ["⛈", "Storm", "عاصفة"] };
  var weather = null;
  function showWeather() {
    if (!weather) return;
    var code = weather.code, key = code >= 95 ? 95 : code >= 80 ? 80 : code >= 51 ? 61 : code >= 45 ? 45 : Math.min(code, 3), w = WX[key];
    $("weather").textContent = w[0] + " " + Math.round(weather.temp) + "°";
    $("weather").title = T("Riyadh · ", "الرياض · ") + (C.lang() === "ar" ? w[2] : w[1]);
    $("weather").hidden = false;
  }
  (function getWeather() {
    /* free service, no key; if the page cannot reach it the weather simply stays hidden */
    var ctrl = window.AbortController ? new AbortController() : null;
    if (ctrl) setTimeout(function () { ctrl.abort(); }, 6000);
    try {
      fetch("https://api.open-meteo.com/v1/forecast?latitude=24.71&longitude=46.68&current=temperature_2m,weather_code&timezone=Asia%2FRiyadh", ctrl ? { signal: ctrl.signal } : {})
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (j && j.current) { weather = { temp: j.current.temperature_2m, code: j.current.weather_code }; showWeather(); } })
        .catch(function () { /* stays hidden */ });
    } catch (e) { /* stays hidden */ }
  })();

  /* ---------- login screen: no password, one click ---------- */
  function lockScreen() {
    closeApp(true);
    var L = $("login");
    L.classList.remove("out"); L.hidden = false;
    tick();
    sunrise();
    $("loginGo").focus();
  }

  /* ---------- data sunrise: a thin translucent half sun rises from a line in the middle,
     its five rays spread, and tiny points of light drift up ---------- */
  var riseFrame = null;
  function sunrise() {
    var cv = $("sunrise"), ctx = cv.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = cv.clientWidth || 300, H = cv.clientHeight || 160;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var R = Math.min(30, H * 0.3), cx = W / 2, base = H * 0.72, start = performance.now(), dots = [];
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var ink = "rgba(255,255,255,.62)";
    cancelAnimationFrame(riseFrame);
    function frame(now) {
      var t = still ? 1 : Math.min(1, (now - start) / 1900), e = 1 - Math.pow(1 - t, 3);
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = ink; ctx.lineCap = "round";
      /* the line: twice the width of the sun */
      ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx - R * 2, base); ctx.lineTo(cx + R * 2, base); ctx.stroke();
      /* the sun rises out of the line; nothing shows below it */
      var y = base + R * (1 - e) * 1.05;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, base); ctx.clip();
      ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(cx, y, R, Math.PI, 0); ctx.stroke();
      var spread = Math.max(0, (t - 0.45) / 0.55), pulse = still ? 0 : Math.sin(now / 900) * 1.2 * (t >= 1 ? 1 : 0);
      [160, 125, 90, 55, 20].forEach(function (a, i) {
        var k = Math.max(0, Math.min(1, spread * 1.4 - i * 0.08)), r1 = R + 6, r2 = R + 6 + (8 + pulse) * k, rad = a * Math.PI / 180;
        if (k <= 0) return;
        ctx.globalAlpha = k; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(rad) * r1, y - Math.sin(rad) * r1); ctx.lineTo(cx + Math.cos(rad) * r2, y - Math.sin(rad) * r2); ctx.stroke();
      });
      ctx.restore(); ctx.globalAlpha = 1;
      /* tiny points of light drifting up from the line */
      if (!still && Math.random() < 0.35) dots.push({ x: cx + (Math.random() - 0.5) * R * 3.6, y: base - 2, v: 0.15 + Math.random() * 0.35, life: 1 });
      dots = dots.filter(function (d) { return d.life > 0; });
      dots.forEach(function (d) { d.y -= d.v; d.life -= 0.008; ctx.fillStyle = "rgba(255,255,255," + (0.5 * d.life) + ")"; ctx.fillRect(d.x, d.y, 1.4, 1.4); });
      if (!$("login").hidden && !still) riseFrame = requestAnimationFrame(frame);
    }
    riseFrame = requestAnimationFrame(frame);
  }

  /* ---------- screensaver after a minute without input ---------- */
  var idleTimer = null;
  function idle() {
    clearTimeout(idleTimer);
    if (!$("saver").hidden) stopSaver();
    idleTimer = setTimeout(startSaver, 30000);
  }
  ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"].forEach(function (k) { window.addEventListener(k, idle, { passive: true }); });
  /* the screensaver types one short piece of Python, presses Run and shows what it makes:
     the half sun, then a thank-you line in both languages. The desktop stays visible behind it. */
  var SAVER = {
    code: 'import numpy as np\nimport matplotlib.pyplot as plt\n\nt = np.linspace(0, np.pi, 100)\nplt.plot(np.cos(t), np.sin(t))   # half sun\nplt.plot([-2, 2], [0, 0])        # horizon, twice as wide\n\nfor a in np.radians([20, 55, 90, 125, 160]):\n    plt.plot([1.25 * np.cos(a), 1.6 * np.cos(a)],\n             [1.25 * np.sin(a), 1.6 * np.sin(a)])\n\nplt.axis("equal")\nplt.axis("off")\nplt.show()\n\nprint("شكرًا لزيارتك")\nprint("Thank you for visiting")',
    out: { type: "sun", lines: ["شكرًا لزيارتك", "Thank you for visiting"] }
  };
  function drawSun(out) {
    var cv = document.createElement("canvas"), W = 360, H = 160, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
    out.appendChild(cv);
    var ctx = cv.getContext("2d"), R = 46, cx = W / 2, cy = H - 26, start = performance.now();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    (function frame(now) {
      var t = Math.min(1, (now - start) / 1400);
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(246,231,161,.95)"; ctx.lineWidth = 2; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(cx - 2 * R * Math.min(1, t * 2), cy); ctx.lineTo(cx + 2 * R * Math.min(1, t * 2), cy); ctx.stroke();
      var arc = Math.max(0, Math.min(1, (t - 0.2) / 0.5));
      ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, Math.PI + Math.PI * arc); ctx.stroke();
      [20, 55, 90, 125, 160].forEach(function (a, i) {
        var k = Math.max(0, Math.min(1, (t - 0.65 - i * 0.05) / 0.2)), r = a * Math.PI / 180;
        if (!k) return;
        ctx.beginPath(); ctx.moveTo(cx + 1.25 * R * Math.cos(r), cy - 1.25 * R * Math.sin(r)); ctx.lineTo(cx + (1.25 + 0.35 * k) * R * Math.cos(r), cy - (1.25 + 0.35 * k) * R * Math.sin(r)); ctx.stroke();
      });
      if (t < 1 && !$("saver").hidden) requestAnimationFrame(frame);
    })(start);
  }
  var saverTimers = [];
  function later(fn, ms) { saverTimers.push(setTimeout(fn, ms)); }
  function startSaver() {
    if (!$("saver").hidden) return;
    if (!$("login").hidden || !$("home").offsetParent) { idle(); return; }
    var sv = $("saver"), s = SAVER;
    sv.innerHTML = "";
    var card = el("div", "py"), bar = el("div", "py-bar");
    bar.appendChild(el("i")); bar.appendChild(el("i")); bar.appendChild(el("i"));
    bar.appendChild(el("span", "py-file", "analysis.py"));
    var run = el("span", "py-run", "Run ▶"); bar.appendChild(run);
    var code = el("pre", "py-code"), out = el("div", "py-out");
    card.appendChild(bar); card.appendChild(code); card.appendChild(out);
    sv.appendChild(card);
    sv.hidden = false;
    function next() {
      var i = 0;
      code.textContent = ""; out.innerHTML = ""; out.classList.remove("show"); run.classList.remove("press");
      (function type() {
        if (sv.hidden) return;
        code.textContent = s.code.slice(0, ++i);
        if (i < s.code.length) later(type, s.code[i - 1] === "\n" ? 90 : 14 + Math.random() * 18);
        else later(function () { run.classList.add("press"); later(function () { show(s.out); }, 450); }, 600);
      })();
    }
    function show(o) {
      out.classList.add("show");
      if (o.type === "text") { out.appendChild(el("p", "py-text", o.text)); return; }
      if (o.type === "sun") {
        drawSun(out);
        o.lines.forEach(function (line, j) { var p = el("p", "py-line", line); p.style.animationDelay = (1.5 + j * 0.5) + "s"; out.appendChild(p); });
        return;
      }
      var cv = document.createElement("canvas"), W = 360, H = 170, dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
      out.appendChild(el("p", "py-title", o.title)); out.appendChild(cv);
      var ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var max = Math.max.apply(null, o.values), n = o.values.length, start = performance.now();
      (function grow(now) {
        var t = Math.min(1, (now - start) / 900), e = 1 - Math.pow(1 - t, 3);
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(30, H - 24); ctx.lineTo(W - 10, H - 24); ctx.stroke();
        ctx.font = "11px Inter, sans-serif"; ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.textAlign = "center";
        var step = (W - 50) / n;
        if (o.type === "bar") {
          o.values.forEach(function (v, j) {
            var h = (H - 50) * v / max * e, x = 36 + j * step;
            ctx.fillStyle = j ? "rgba(136,201,226,.85)" : "rgba(246,231,161,.95)";
            ctx.beginPath(); ctx.roundRect(x, H - 24 - h, step * 0.6, h, 3); ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.fillText(o.labels[j], x + step * 0.3, H - 9);
            if (t === 1) ctx.fillText(String(v), x + step * 0.3, H - 30 - h);
          });
        } else {
          ctx.strokeStyle = "rgba(246,231,161,.95)"; ctx.lineWidth = 2; ctx.beginPath();
          var shown = Math.max(1, Math.ceil(n * e));
          o.values.slice(0, shown).forEach(function (v, j) { var x = 40 + j * step, y = H - 24 - (H - 50) * v / max; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
          ctx.stroke();
          o.values.slice(0, shown).forEach(function (v, j) { var x = 40 + j * step, y = H - 24 - (H - 50) * v / max; ctx.fillStyle = "#F6E7A1"; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.fillText(o.labels[j], x, H - 9); });
        }
        if (t < 1 && !sv.hidden) requestAnimationFrame(grow);
      })(start);
    }
    next();
    if (window.BADGES) window.BADGES.give("saver");
  }
  D.saver = startSaver;
  function stopSaver() { saverTimers.forEach(clearTimeout); saverTimers = []; $("saver").hidden = true; $("saver").innerHTML = ""; }
  idle();
  function enter() {
    var L = $("login");
    if (L.hidden || L.classList.contains("out")) return;
    try { sessionStorage.setItem("desk-in", "1"); } catch (e) { /* shows again next time */ }
    L.classList.add("out");
    setTimeout(function () { L.hidden = true; }, 450);
  }
  $("loginGo").addEventListener("click", enter);
  $("login").addEventListener("keydown", function (e) { if (e.key === "Enter") enter(); });

  /* night mode darkens the windows and the bars; the desktop background stays as it is */
  function setMode(night, announce) {
    if (night) document.documentElement.dataset.mode = "night"; else delete document.documentElement.dataset.mode;
    if (night && announce && window.BADGES) window.BADGES.give("night");
    try { localStorage.setItem("desk-mode", night ? "night" : "day"); } catch (e) { /* not remembered */ }
    if (announce) toast(night ? T("Night mode", "الوضع الليلي") : T("Day mode", "الوضع النهاري"));
  }
  /* the sun opens a small menu like the Apple menu: about me, help, and shut down (back to the login screen) */
  function menu(show) { $("sunMenu").hidden = !show; $("sunBtn").setAttribute("aria-expanded", String(show)); }
  function fillMenu() {
    var m = $("sunMenu");
    m.innerHTML = "";
    function item(text, fn) { var b = el("button", "", text); b.type = "button"; b.addEventListener("click", function () { menu(false); fn(); }); m.appendChild(b); }
    var night = document.documentElement.dataset.mode === "night";
    item(night ? T("Day mode", "الوضع النهاري") : T("Night mode", "الوضع الليلي"), function () { setMode(!night, true); });
    item(T("Tidy up icons", "ترتيب الأيقونات"), tidy);
    m.appendChild(el("hr"));
    item(T("Shut down…", "إيقاف التشغيل…"), lockScreen);
  }
  $("sunBtn").addEventListener("click", function (e) { e.stopPropagation(); fillMenu(); menu($("sunMenu").hidden); });
  document.addEventListener("click", function (e) { if (!e.target.closest("#sunMenu")) menu(false); if (!e.target.closest("#progMenu,#progBtn")) progMenu(false); });
  $("mbName").addEventListener("click", function () { openApp("about"); });

  /* ---------- about_me.py: a side panel that drops down from the >_ button, types itself and prints my intro ---------- */
  var panel = (function () {
    var P = $("codePanel"), code = $("cpCode"), term = $("cpTerm"), run = $("cpRun"), timers = [];
    function stop() { timers.forEach(clearTimeout); timers = []; }
    function wait(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function play() {
      var A2 = window.DESK_ABOUT; if (!A2) return;
      stop();
      var m = A2.text[C.lang() === "ar" ? "ar" : "en"], src = A2.code(m), lines = A2.output(m), i = 0, ran = false;
      var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      code.classList.remove("done"); run.classList.remove("press"); run.disabled = false;
      term.innerHTML = ""; term.appendChild(el("p", "me-prompt", "$ python about_me.py"));
      function go() {
        if (ran) return; ran = true; stop();
        code.innerHTML = A2.highlight(src); code.classList.add("done"); code.scrollTop = 0;
        run.classList.add("press"); run.disabled = true;
        lines.forEach(function (line, k) { wait(function () { term.appendChild(el("p", "me-line" + (k === 0 ? " first" : ""), line || " ")); }, still ? 0 : 120 + k * 110); });
        if (window.BADGES) window.BADGES.give("about");
      }
      run.onclick = go;
      code.onclick = function () { if (!ran) go(); };
      if (still) { go(); return; }
      (function type() {
        i = Math.min(src.length, i + 4);
        code.innerHTML = A2.highlight(src.slice(0, i)); code.scrollTop = code.scrollHeight;
        if (i < src.length) wait(type, 16); else wait(go, 500);
      })();
    }
    function open() { P.hidden = false; void P.offsetWidth; P.classList.add("open"); $("termBtn").setAttribute("aria-expanded", "true"); $("termBtn").classList.add("on"); play(); }
    function close() { stop(); P.classList.remove("open"); $("termBtn").setAttribute("aria-expanded", "false"); $("termBtn").classList.remove("on"); setTimeout(function () { if (!P.classList.contains("open")) P.hidden = true; }, 260); }
    $("termBtn").addEventListener("click", function () { if (P.hidden) open(); else close(); });
    $("cpClose").addEventListener("click", close);
    return { play: play, close: close };
  })();

  /* ---------- badges: a small progress bar in the menu bar, like the battery on a Mac ---------- */
  function progMenu(show) { $("progMenu").hidden = !show; $("progBtn").setAttribute("aria-expanded", String(show)); }
  function prog() {
    if (!window.BADGES) { $("progBtn").hidden = true; return; }
    var n = window.BADGES.count(), total = window.BADGES.total, b = $("progBtn");
    b.innerHTML = '<span class="prog-bar"><i style="width:' + Math.round(100 * n / total) + '%"></i></span><span class="prog-num">' + n + "/" + total + "</span>";
    b.setAttribute("aria-label", T("Explored ", "استكشفت ") + n + T(" of ", " من ") + total);
    b.title = b.getAttribute("aria-label");
    var m = $("progMenu"); m.innerHTML = "";
    m.appendChild(el("p", "prog-head", n === total ? T("You found everything. Thank you!", "اكتشفت كل شيء، شكرًا لك!") : T("Explore the desktop to fill the bar", "استكشف سطح المكتب ليمتلئ الشريط")));
    window.BADGES.list().forEach(function (x) {
      var r = el("div", "prog-row" + (x.on ? " on" : ""));
      r.appendChild(el("span", "prog-check", x.on ? "✓" : ""));
      var t = el("span"); t.appendChild(el("b", "", x.name)); t.appendChild(el("small", "", x.how)); r.appendChild(t);
      m.appendChild(r);
    });
  }
  $("progBtn").addEventListener("click", function (e) { e.stopPropagation(); prog(); progMenu($("progMenu").hidden); });
  $("helpBtn").addEventListener("click", function () { openApp("help"); });

  /* ---------- a soft click on every press, with a switch to turn it off ---------- */
  var sound = true, audio = null;
  try { sound = localStorage.getItem("desk-sound") !== "off"; } catch (e) { /* on */ }
  function soundIcon() {
    $("soundBtn").innerHTML = A.speaker(sound);
    $("soundBtn").setAttribute("aria-pressed", String(sound));
    $("soundBtn").setAttribute("aria-label", sound ? T("Sound on", "الصوت مفعّل") : T("Sound off", "الصوت متوقف"));
    $("soundBtn").title = $("soundBtn").getAttribute("aria-label");
  }
  /* a short soft "tick", made from a little filtered noise. Phones only allow sound after a tap, so the
     first tap unlocks it; on an iPhone a silent clip also lets it play when the ringer switch is off */
  var tickBuf = null, unlocked = false;
  function ctx() {
    if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    return audio;
  }
  function unlock() {
    if (unlocked) return; unlocked = true;
    try {
      var n = 800, b = new ArrayBuffer(44 + n * 2), v = new DataView(b);
      [[0, 0x52494646], [8, 0x57415645], [12, 0x666d7420], [36, 0x64617461]].forEach(function (x) { v.setUint32(x[0], x[1]); });
      v.setUint32(4, 36 + n * 2, true); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, 16000, true); v.setUint32(28, 32000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); v.setUint32(40, n * 2, true);
      var el2 = new Audio(URL.createObjectURL(new Blob([b], { type: "audio/wav" })));
      el2.setAttribute("playsinline", ""); var pr = el2.play(); if (pr && pr.catch) pr.catch(function () {});
    } catch (e) { /* not needed here */ }
  }
  function click() {
    if (!sound) return;
    try {
      var a = ctx(), t = a.currentTime;
      if (!tickBuf) {
        var len = Math.floor(a.sampleRate * 0.03); tickBuf = a.createBuffer(1, len, a.sampleRate);
        var d = tickBuf.getChannelData(0);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
      }
      var src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      src.buffer = tickBuf; f.type = "bandpass"; f.frequency.value = 2400; f.Q.value = 0.9;
      g.gain.setValueAtTime(0.55, t);
      src.connect(f); f.connect(g); g.connect(a.destination); src.start(t);
    } catch (e) { /* no sound here */ }
  }
  ["pointerdown", "touchend", "keydown"].forEach(function (k) { window.addEventListener(k, function () { if (sound) { unlock(); try { ctx(); } catch (e) { /* none */ } } }, { once: true, passive: true }); });
  $("soundBtn").addEventListener("click", function () { sound = !sound; try { localStorage.setItem("desk-sound", sound ? "on" : "off"); } catch (e) { /* not remembered */ } soundIcon(); click(); });
  document.addEventListener("pointerdown", function (e) { if (e.target.closest("button,a,.tile")) click(); });

  /* ---------- the window ---------- */
  var current = null, closers = [], keyFn = null, back = null;
  function openApp(name, opts) {
    if (!D.apps[name]) return;
    closeApp(true);
    current = name; back = document.activeElement;
    var win = $("win");
    win.className = "win";
    $("winBody").innerHTML = ""; $("winTools").innerHTML = "";
    $("winClose").setAttribute("aria-label", T("Close", "إغلاق"));
    var api = {
      body: $("winBody"),
      title: function (t) { $("winTitle").textContent = t; },
      narrow: function () { win.classList.add("narrow"); },
      tall: function () { win.classList.add("tall"); },
      tool: function (t) { var b = el("button", "", t); b.type = "button"; $("winTools").appendChild(b); return b; },
      clearTools: function () { $("winTools").innerHTML = ""; },
      onClose: function (fn) { closers.push(fn); },
      keys: function (fn) { keyFn = fn; }
    };
    $("layer").hidden = false;
    D.apps[name](api, opts || {});
    if (window.BADGES) window.BADGES.app(name);
    if (!win.contains(document.activeElement)) $("winClose").focus();
  }
  function closeApp(quiet) {
    closers.forEach(function (fn) { try { fn(); } catch (e) { /* already stopped */ } });
    closers = []; keyFn = null;
    if (!current) return;
    current = null;
    $("layer").hidden = true;
    $("winBody").innerHTML = "";
    if (!quiet && back && back.focus) back.focus();
  }
  function shut() {
    if (/^#(about|projects)$/.test(location.hash)) location.hash = "";
    else closeApp();
  }
  $("winClose").addEventListener("click", shut);
  $("layer").addEventListener("click", function (e) { if (e.target === $("layer")) shut(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { menu(false); if (current) shut(); return; }
    if (keyFn && current) keyFn(e);
  });
  window.addEventListener("hashchange", function () {
    if (location.hash.indexOf("#project/") !== 0) return;
    closeApp(true);
    if (window.BADGES) window.BADGES.project(decodeURIComponent(location.hash.slice(9)));
  });
  /* a badge shows as a small note with its pixel medal */
  if (window.BADGES) window.BADGES.onGive(function (b, medal) {
    var m = el("span", "toast-medal"); m.innerHTML = medal;
    var t = $("toast"); t.innerHTML = ""; t.appendChild(m); t.appendChild(document.createTextNode(T(b[2], b[3]) + " · " + window.BADGES.count() + "/" + window.BADGES.total));
    prog(); $("progBtn").classList.remove("pulse"); void $("progBtn").offsetWidth; $("progBtn").classList.add("pulse");
    t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 3200);
  });

  /* visitor counting with GoatCounter, only when a site code is set in config.js */
  (function () {
    var code = (window.DESK_CONFIG || {}).goatcounter;
    if (!code || !/^[a-z0-9-]+$/.test(code)) return;
    var s = document.createElement("script");
    s.async = true; s.src = "https://gc.zgo.at/count.js"; s.dataset.goatcounter = "https://" + code + ".goatcounter.com/count";
    document.head.appendChild(s);
  })();

  /* ---------- icons can be dragged anywhere on the desktop; the spot is kept in this browser ---------- */
  var spots = {};
  try { spots = JSON.parse(localStorage.getItem("desk-icons") || "{}"); } catch (e) { spots = {}; }
  function saveSpots() { try { localStorage.setItem("desk-icons", JSON.stringify(spots)); } catch (e) { /* not kept */ } }
  function clampSpot(b, dx, dy) {
    b.style.transform = "";
    var r = b.getBoundingClientRect(), top = 34, bottom = window.innerHeight - 8;
    dx = Math.max(-r.left + 6, Math.min(window.innerWidth - r.right - 6, dx));
    dy = Math.max(top - r.top, Math.min(bottom - r.bottom, dy));
    return [Math.round(dx), Math.round(dy)];
  }
  function placeIcons() {
    document.querySelectorAll("#icons .icon").forEach(function (b) {
      var s = spots[b.dataset.app];
      if (!s) { b.style.transform = ""; return; }
      var c = clampSpot(b, s[0], s[1]);
      b.style.transform = "translate(" + c[0] + "px," + c[1] + "px)";
    });
  }
  function tidy() { spots = {}; saveSpots(); document.querySelectorAll("#icons .icon").forEach(function (b) { b.classList.add("settle"); b.style.transform = ""; setTimeout(function () { b.classList.remove("settle"); }, 400); }); }
  function draggable(b) {
    var start = null;
    b.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      var s = spots[b.dataset.app] || [0, 0];
      start = { x: e.clientX, y: e.clientY, dx: s[0], dy: s[1], moving: false, id: e.pointerId };
    });
    b.addEventListener("pointermove", function (e) {
      if (!start || e.pointerId !== start.id) return;
      var mx = e.clientX - start.x, my = e.clientY - start.y;
      if (!start.moving && Math.abs(mx) + Math.abs(my) < 6) return;
      if (!start.moving) { start.moving = true; b.setPointerCapture(e.pointerId); b.classList.add("dragging"); }
      b.style.transform = "translate(" + (start.dx + mx) + "px," + (start.dy + my) + "px)";
    });
    function end(e) {
      if (!start || e.pointerId !== start.id) return;
      if (start.moving) {
        var c = clampSpot(b, start.dx + e.clientX - start.x, start.dy + e.clientY - start.y);
        spots[b.dataset.app] = c; saveSpots();
        b.style.transform = "translate(" + c[0] + "px," + c[1] + "px)";
        b.classList.remove("dragging"); b.dataset.moved = "1";
        setTimeout(function () { delete b.dataset.moved; }, 300);
      }
      start = null;
    }
    b.addEventListener("pointerup", end);
    b.addEventListener("pointercancel", end);
  }
  window.addEventListener("resize", placeIcons);

  /* ---------- desktop ---------- */
  var ICONS = [
    ["projects", function () { return A.folder(false); }, "Projects", "المشاريع"],
    ["notebook", function () { return A.icon("notes"); }, "Notebook", "المذكرات"],
    ["sticky", function () { return A.icon("sticky"); }, "Sticky Notes", "ملاحظات الزوار"],
    ["resume", function () { return A.icon("resume"); }, "CV", "السيرة الذاتية"],
    ["sudoku", function () { return A.icon("sudoku"); }, "Sudoku", "سودوكو"],
    ["lab", function () { return A.icon("lab"); }, "Data lab", "مختبر البيانات"],
    ["contact", function () { return A.icon("mail"); }, "Contact", "تواصل"]
  ];
  var DOCK = ["excel", "sql", "python", "powerbi", "tableau", "|", "figma", "framer", "|", "notion", "claude", "chatgpt"];

  function render() {
    $("sunBtn").innerHTML = A.sun();
    setMode(document.documentElement.dataset.mode === "night");
    prog();
    $("mbName").textContent = (window.DESK_NAME ? window.DESK_NAME() : S.name);
    $("mbName").title = T("About me", "نبذة عني");
    $("sunBtn").setAttribute("aria-label", T("Menu", "القائمة"));
    /* the language shows as a letter, like the input menu on a Mac */
    var lb = C.langButton("lang"); lb.textContent = C.lang() === "ar" ? "ع" : "A"; lb.title = lb.getAttribute("aria-label");
    $("langSlot").innerHTML = ""; $("langSlot").appendChild(lb);
    showWeather();

    var pal = $("palette"); pal.innerHTML = "";
    pal.setAttribute("aria-label", T("Background colour", "لون الخلفية"));
    PALETTES.forEach(function (p, i) {
      if (p.photo && !PALETTES[i - 1].photo) pal.appendChild(el("i", "pal-sep"));
      var d = el("button", "dot" + (p.photo ? " pic" : "")); d.type = "button"; d.title = C.tr(p); d.setAttribute("aria-label", C.tr(p));
      d.style.background = p.photo ? "center / cover url(" + p.thumb + ")" : "linear-gradient(160deg," + p.a + "," + p.b + " 60%," + p.c + ")";
      d.addEventListener("click", function () { var r = d.getBoundingClientRect(); setPalette(i, true, [r.left + r.width / 2, r.top + r.height / 2]); });
      pal.appendChild(d);
    });
    pal.appendChild(el("span", "pal-hint", T("← swipe", "← اسحب")));
    apply(palIndex);

    ["avatar", "loginAvatar"].forEach(function (id) { $(id).innerHTML = A.avatar(); });
    /* the language changes, the layout does not flip */
    document.documentElement.dir = "ltr";
    $("helpBtn").textContent = T("Help", "مساعدة");
    soundIcon();
    $("loginName").textContent = (window.DESK_NAME ? window.DESK_NAME() : S.name);
    $("loginGo").textContent = T("Enter →", "دخول ←");
    $("loginHint").textContent = T("No password. Click to enter.", "دون كلمة مرور، اضغط للدخول.");
    $("introName").textContent = (window.DESK_NAME ? window.DESK_NAME() : S.name);
    var PR = window.DESK_PROFILE;
    $("introRole").textContent = PR ? (C.lang() === "ar" ? PR.role.ar : PR.role.en.toUpperCase()) : T("DATA ANALYST", "محللة بيانات");
    $("introBio").textContent = PR ? C.tr(PR.line) : C.tr(S.bio);
    $("termBtn").setAttribute("aria-label", T("Open about_me.py", "افتح about_me.py")); $("termBtn").title = "about_me.py";
    $("cpClose").setAttribute("aria-label", T("Close", "إغلاق"));
    $("cpRun").textContent = T("Run ▶", "تشغيل ▶");
    if (!$("codePanel").hidden) panel.play();

    var icons = $("icons"); icons.innerHTML = "";
    ICONS.forEach(function (x) {
      var b = el("button", "icon"); b.type = "button"; b.dataset.app = x[0];
      b.innerHTML = x[1]();
      b.appendChild(el("span", "", T(x[2], x[3])));
      b.addEventListener("click", function (e) { if (b.dataset.moved) { delete b.dataset.moved; e.preventDefault(); return; } openApp(x[0]); });
      draggable(b);
      icons.appendChild(b);
    });
    placeIcons();

    var dock = $("dock"); dock.innerHTML = "";
    DOCK.forEach(function (k) {
      if (k === "|") { dock.appendChild(el("i", "sep")); return; }
      var t = el("span", "tile"); t.innerHTML = A.tile(k); t.dataset.name = A.tileName(k); t.tabIndex = 0; t.setAttribute("aria-label", A.tileName(k));
      dock.appendChild(t);
    });
    $("copy").textContent = "© " + new Date().getFullYear() + " " + S.name;
    tick();
    if (current) openApp(current);
  }

  C.start({
    render: render,
    show: function (h) {
      /* coming back from a project page returns to the project list it was opened from */
      var backTo = null; try { backTo = sessionStorage.getItem("desk-back"); sessionStorage.removeItem("desk-back"); } catch (e) { /* none */ }
      if (backTo === "list" && !h) { openApp("projects", { list: true }); return; }
      if (h === "about" || h === "projects") openApp(h);
      else if (current && /^(about|projects)$/.test(current)) closeApp();
    }
  });

  /* first visit in this session starts at the login screen */
  (function () {
    var seen = false; try { seen = sessionStorage.getItem("desk-in") === "1"; } catch (e) { seen = true; }
    if (!seen && location.hash.indexOf("#project/") !== 0) lockScreen();
  })();
})();
