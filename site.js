/* Main page: loading screen, sections you drag between, my intro written as code first,
   projects and folders one under another with a sample on hover, tools, CV on request, contact. */
(function () {
  "use strict";
  var S = window.SITE || {}, P = window.PROJECTS || [], D = window.DESK_PROFILE || {}, CFG = window.DESK_CONFIG || {}, X = window.FX, A = window.ART;
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }

  /* ---------- language ---------- */
  var LANG = (function () { try { return localStorage.getItem("lang") === "ar" ? "ar" : "en"; } catch (e) { return "en"; } })();
  var T = function (en, ar) { return LANG === "ar" ? ar : en; };
  var L = function (o) { return o ? (typeof o === "string" ? o : (o[LANG] || o.en || "")) : ""; };
  var WORDS = {
    portTag: ["[·Portfolio·]", "[·ملف أعمال·]"], about: ["About", "نبذة"], projects: ["Projects", "المشاريع"], desk: ["Folders", "المجلدات"],
    cv: ["CV", "السيرة"], contact: ["Contact", "تواصل"], projectsBig: ["projects", "المشاريع"], deskBig: ["folders", "المجلدات"],
    tools: ["tools I use", "أدواتي"], cvBig: ["cv on request", "السيرة عند الطلب"], say: ["say hello", "تواصل معي"],
    explore: ["[ · Scroll down to explore · ]", "[ · انزل للاستكشاف · ]"],
    yourName: ["Your name", "اسمك"], yourMail: ["Your email", "بريدك الإلكتروني"], yourRole: ["Your job title", "مسماك الوظيفي"],
    request: ["[ · Request my CV · ]", "[ · اطلب السيرة الذاتية · ]"], desktop: ["Desktop version", "نسخة سطح المكتب"],
    local: ["Riyadh", "الرياض"], badge: ["data made clear · open to work · ", "بيانات تُفهم بوضوح · متاحة للعمل · "]
  };
  function words() {
    document.documentElement.lang = LANG;
    /* the language changes, the layout does not flip */
    document.documentElement.dir = "ltr";
    document.querySelectorAll("[data-t]").forEach(function (n) { var w = WORDS[n.getAttribute("data-t")]; if (w) n.textContent = w[LANG === "ar" ? 1 : 0]; });
    $("lang").textContent = LANG === "ar" ? "EN" : "ع";
    $("lang").setAttribute("aria-label", T("Switch to Arabic", "التبديل إلى الإنجليزية"));
    $("menuBtn").setAttribute("aria-label", T("Menu", "القائمة"));
  }

  /* ---------- sections side by side: drag, swipe, keys or the menu ---------- */
  var IDS = ["about", "work", "desk", "cv", "contact"], cur = 0, page = $("page"), entered = {}, ready = false;
  /* the page scrolls down on every screen; the old side-by-side code stays switched off */
  var PHONE = { matches: true, addEventListener: function () {} };
  function place() { page.style.transform = PHONE.matches ? "none" : "translateX(" + cur * -100 + "vw)"; }
  function mark() {
    /* on About my name is already big on the page, so the ribbon shows it only on the other sections */
    document.body.classList.toggle("on-about", IDS[cur] === "about");
    document.querySelectorAll(".top-nav a").forEach(function (a, k) { a.classList.toggle("on", k === cur); });
    document.querySelectorAll(".pager button").forEach(function (b, k) { b.classList.toggle("on", k === cur); b.setAttribute("aria-current", k === cur ? "true" : "false"); });
  }
  function go(i, fromHash) {
    cur = Math.max(0, Math.min(IDS.length - 1, i));
    if (PHONE.matches) {
      document.querySelectorAll(".sec").forEach(function (s) { s.inert = false; });
      var target = $(IDS[cur]);
      if (target && fromHash !== "quiet") {
        var far = Math.abs(target.getBoundingClientRect().top) > window.innerHeight * 0.6;
        if (ready && far) curtain(IDS[cur], function () { target.scrollIntoView({ behavior: "auto" }); });
        else target.scrollIntoView({ behavior: ready ? "smooth" : "auto" });
      }
      mark(); if (!fromHash && location.hash !== "#" + IDS[cur]) history.replaceState(null, "", "#" + IDS[cur]);
      enter(IDS[cur]); return;
    }
    place();
    mark();
    document.querySelectorAll(".sec").forEach(function (s, k) { s.inert = k !== cur; });
    if (!fromHash && location.hash !== "#" + IDS[cur]) history.replaceState(null, "", "#" + IDS[cur]);
    enter(IDS[cur]);
  }
  function pager() {
    var old = document.querySelector(".pager"); if (old) old.remove();
    var bar = document.createElement("div"); bar.className = "pager";
    IDS.forEach(function (id, k) {
      var b = document.createElement("button"); b.type = "button";
      b.setAttribute("aria-label", WORDS[id === "work" ? "projects" : id][LANG === "ar" ? 1 : 0]);
      b.addEventListener("click", function () { go(k); });
      bar.appendChild(b);
    });
    var h = document.createElement("span"); h.className = "drag-hint"; h.textContent = T("← drag →", "← اسحب →"); bar.appendChild(h);
    document.body.appendChild(bar);
  }
  (function dragging() {
    var x0 = 0, y0 = 0, dx = 0, on = false, decided = false, horizontal = false, moved = false, id = null;
    page.addEventListener("pointerdown", function (e) {
      if (PHONE.matches || e.button !== 0 || e.target.closest("input,textarea,select,video,form")) return;
      x0 = e.clientX; y0 = e.clientY; dx = 0; on = true; decided = horizontal = moved = false; id = e.pointerId;
    });
    page.addEventListener("pointermove", function (e) {
      if (!on || e.pointerId !== id) return;
      dx = e.clientX - x0; var dy = e.clientY - y0;
      if (!decided && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        decided = true; horizontal = Math.abs(dx) > Math.abs(dy);
        if (horizontal) { page.classList.add("dragging"); $("peek").classList.remove("on"); try { page.setPointerCapture(id); } catch (err) { /* fine */ } }
      }
      if (horizontal) {
        moved = true;
        var edge = (cur === 0 && dx > 0) || (cur === IDS.length - 1 && dx < 0);
        page.style.transform = "translateX(calc(" + cur * -100 + "vw + " + (edge ? dx * 0.3 : dx) + "px))";
        e.preventDefault();
      }
    });
    function up(e) {
      if (!on || (e && e.pointerId !== id)) return;
      on = false; page.classList.remove("dragging");
      if (!decided && e) { dx = e.clientX - x0; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - y0)) horizontal = moved = true; }
      if (!horizontal) return;
      var next = dx < 0;
      if (Math.abs(dx) > Math.min(140, window.innerWidth * 0.14)) go(cur + (next ? 1 : -1)); else place();
    }
    page.addEventListener("pointerup", up);
    page.addEventListener("pointercancel", up);
    page.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    var lock = 0;
    page.addEventListener("wheel", function (e) {
      if (PHONE.matches || Math.abs(e.deltaX) < 30 || Math.abs(e.deltaX) < Math.abs(e.deltaY) * 1.5 || Date.now() < lock) return;
      lock = Date.now() + 900; go(cur + (e.deltaX > 0 ? 1 : -1));
    }, { passive: true });
    document.addEventListener("keydown", function (e) {
      if (PHONE.matches || !$("project").hidden || !$("appSheet").hidden || e.target.closest("input,textarea")) return;
      if (e.key === "ArrowRight") go(cur + 1);
      else if (e.key === "ArrowLeft") go(cur - 1);
    });
    window.addEventListener("resize", place);
    /* on phones the page scrolls down; the menu follows the section on screen */
    if ("IntersectionObserver" in window) {
      var seen = new IntersectionObserver(function (es) {
        if (!PHONE.matches) return;
        es.forEach(function (en) { if (en.isIntersecting) { var k = IDS.indexOf(en.target.id); if (k >= 0 && k !== cur) { cur = k; mark(); enter(IDS[k]); } } });
      }, { rootMargin: "-45% 0px -50% 0px" });
      IDS.forEach(function (id) { seen.observe($(id)); });
    }
    var was = PHONE.matches;
    PHONE.addEventListener("change", function () { if (PHONE.matches !== was) { was = PHONE.matches; document.querySelectorAll(".sec").forEach(function (s, k) { s.inert = !PHONE.matches && k !== cur; }); place(); } });
  })();

  /* ---------- about ---------- */
  function about() {
    $("rbSun").innerHTML = X.sun();
    $("rbName").textContent = LANG === "ar" ? (L(D.name) || "نورة") : (S.name || "NOURAH WA");
    $("name").innerHTML = LANG === "ar" ? esc(L(D.name) || "نورة") + "·" : "Nourah<br>WA·";
    $("role").textContent = L(D.role);
    $("motto").innerHTML = T('·Data <span class="o">made clear ©</span>', '·بيانات <span class="o">تُفهم بوضوح ©</span>');
    ["hello", "bio"].forEach(function (k) { $(k).textContent = ""; });
  }
  function playAbout() {
    X.py($("hello"), T("· Hello, I'm", "· مرحبًا، أنا"), { code: ">>> print(hello)", dur: 500 });
    X.py($("bio"), L(D.bio), { code: '>>> print(me.bio)', delay: 500 });
  }

  /* ---------- a sample next to the pointer ---------- */
  var peek = $("peek"), px = 0, py = 0, tx = 0, ty = 0, raf = 0;
  function loop() { px += (tx - px) * 0.18; py += (ty - py) * 0.18; peek.style.left = px + "px"; peek.style.top = py + "px"; raf = Math.abs(tx - px) + Math.abs(ty - py) > 0.5 ? requestAnimationFrame(loop) : 0; }
  function aim(e) { tx = Math.min(window.innerWidth - 150, e.clientX + 170); ty = Math.max(110, Math.min(window.innerHeight - 110, e.clientY)); }
  function hover(a, html, tag) {
    a.addEventListener("pointerenter", function (e) {
      if (e.pointerType !== "mouse") return;
      peek.innerHTML = html() + '<span class="pk-tag">' + esc(tag) + "</span>";
      aim(e); px = tx; py = ty; peek.style.left = px + "px"; peek.style.top = py + "px"; peek.classList.add("on");
    });
    a.addEventListener("pointermove", function (e) { if (e.pointerType !== "mouse") return; aim(e); if (!raf) raf = requestAnimationFrame(loop); });
    a.addEventListener("pointerleave", function () { if (!touchy) peek.classList.remove("on"); });
    a._peek = function () { return html() + '<span class="pk-tag">' + esc(tag) + "</span>"; };
  }
  /* on touch screens there is no mouse: while you scroll, the row in the middle of the screen shows its picture */
  var touchy = window.matchMedia("(hover: none)").matches, live = null;
  function middle() {
    if (!touchy || !$("project").hidden || !$("appSheet").hidden) return;
    var mid = window.innerHeight * 0.5, best = null, bd = 1e9;
    document.querySelectorAll(".folder a").forEach(function (a) {
      var r = a.getBoundingClientRect(); if (!r.height || r.bottom < 0 || r.top > window.innerHeight || r.width === 0) return;
      var d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = a; }
    });
    if (!best || bd > 140) { peek.classList.remove("on"); if (live) live.classList.remove("live"); live = null; return; }
    var r = best.getBoundingClientRect();
    if (best !== live) { if (live) live.classList.remove("live"); live = best; best.classList.add("live"); peek.innerHTML = best._peek ? best._peek() : ""; }
    tx = window.innerWidth - Math.min(130, window.innerWidth * 0.3); ty = r.top + r.height / 2 - 70;
    if (!peek.classList.contains("on")) { px = tx; py = ty + 30; peek.classList.add("on"); }
    if (!raf) raf = requestAnimationFrame(loop);
  }
  if (touchy) {
    var mt = 0, kick = function () { if (!mt) mt = requestAnimationFrame(function () { mt = 0; middle(); }); };
    window.addEventListener("scroll", kick, { passive: true });
    document.addEventListener("scroll", kick, { passive: true, capture: true });
  }

  /* ---------- lists that rise in, one under another ---------- */
  var obs = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (!en.isIntersecting) return;
      var n = en.target; obs.unobserve(n); n.classList.add("in");
      var nm = n.querySelector(".f-name"); if (nm) X.decode(nm, nm.dataset.text, { dur: 600, delay: parseInt(n.style.transitionDelay, 10) || 0 });
    });
  }, { threshold: 0.15 }) : null;
  function rise(n, i) { n.style.transitionDelay = (i * 90) + "ms"; if (obs) obs.observe(n); else n.classList.add("in"); }
  function row(list, i, href, num, name, cat) {
    var li = document.createElement("li"); li.className = "folder";
    var a = document.createElement("a"); a.href = href;
    a.innerHTML = '<span class="f-num">' + num + '</span><span class="f-name"></span><span class="f-cat"></span><span class="f-arrow" aria-hidden="true">→</span>';
    var nm = a.querySelector(".f-name"); nm.textContent = name; nm.dataset.text = name;
    a.querySelector(".f-cat").textContent = cat;
    li.appendChild(a); list.appendChild(li); rise(li, i);
    return a;
  }
  /* projects by type: data analysis first, then apps, then designs */
  var TYPES = [["all", "All", "الكل"], ["data", "Data analysis", "تحليل بيانات"], ["app", "Apps", "تطبيقات"], ["design", "Design", "تصميم"]];
  var typeOf = function (p) { return p.type === "app" || p.type === "design" ? p.type : "data"; };
  var typeName = function (k) { var t = TYPES.filter(function (x) { return x[0] === k; })[0]; return t ? T(t[1], t[2]) : ""; };
  var filter = "all";
  function sorted() {
    var order = { data: 0, app: 1, design: 2 };
    return P.map(function (p, i) { return { p: p, i: i }; }).sort(function (a, b) { return (order[typeOf(a.p)] - order[typeOf(b.p)]) || a.i - b.i; }).map(function (x) { return x.p; });
  }
  function projects() {
    $("workNote").textContent = T("Data analysis, apps and design. Each analysis is the full story: the question, the data work, and what to do next. Point at one for a look, open it to read.",
      "تحليل بيانات، وتطبيقات، وتصميم. كل تحليل قصة كاملة: السؤال، والعمل على البيانات، وما يجب فعله بعدها. مرّر المؤشر لترى لمحة، وافتحه لتقرأ.");
    var bar = $("filters"); bar.innerHTML = "";
    var have = {}; P.forEach(function (p) { have[typeOf(p)] = (have[typeOf(p)] || 0) + 1; });
    if (filter !== "all" && !have[filter]) filter = "all";
    TYPES.forEach(function (t) {
      var n = t[0] === "all" ? P.length : have[t[0]] || 0; if (!n) return;
      var b = document.createElement("button"); b.type = "button"; b.dataset.type = t[0];
      b.innerHTML = "<span>" + esc(T(t[1], t[2])) + "</span><sup>" + n + "</sup>";
      b.classList.toggle("on", t[0] === filter); b.setAttribute("aria-pressed", String(t[0] === filter));
      b.addEventListener("click", function () { filter = t[0]; projects(); });
      bar.appendChild(b);
    });
    var list = $("projectList"); list.innerHTML = "";
    sorted().filter(function (p) { return filter === "all" || typeOf(p) === filter; }).forEach(function (p, i) {
      var name = LANG === "ar" ? L(p.title) : String(p.cardTitle || L(p.title)).toLowerCase();
      var a = row(list, i, "#p/" + p.id, (i < 9 ? "0" : "") + (i + 1), name, L(p.category) || typeName(typeOf(p)));
      a.parentNode.dataset.type = typeOf(p);
      var pic = p.thumbnail || (p.screens || p.images || [])[0];
      hover(a, function () { return pic ? '<img alt="" src="site/' + esc(pic) + '">' : ""; }, typeName(typeOf(p)) + " · " + (p.tools || []).join(" / "));
    });
  }
  /* working tools that show how I work: check the data, write the query, design the chart */
  var DESK = [
    ["check", "check", "Data check", "فحص البيانات", "drop a CSV, get a quality report", "أرفق ملف CSV واحصل على تقرير الجودة"],
    ["makeover", "makeover", "Chart makeover", "إعادة تصميم رسم", "same numbers, clearer story", "نفس الأرقام، قصة أوضح"],
    ["process", "process", "How I work", "كيف أعمل", "six steps, every project", "ست خطوات في كل مشروع"]
  ];
  var NATIVE = { check: 1, makeover: 1, process: 1 };
  function desk() {
    $("deskNote").textContent = T("Three things you can use: check any data file, see how I redesign a chart, and walk through the six steps I follow on every project.",
      "ثلاثة أشياء تستطيع تجربتها: افحص أي ملف بيانات، وشاهد كيف أعيد تصميم رسم، وامشِ معي في الخطوات الست التي أتبعها في كل مشروع.");
    var list = $("deskList"); list.innerHTML = "";
    DESK.forEach(function (d, i) {
      var a = row(list, i, "#app/" + d[0], "", T(d[2], d[3]).toLowerCase(), T(d[4], d[5]));
      a.querySelector(".f-num").innerHTML = window.STUDIO.icon(d[1]);
      a.querySelector(".f-name").dataset.text = a.querySelector(".f-name").textContent;
      hover(a, function () { return NATIVE[d[0]] ? window.STUDIO.sample(d[0], LANG) : X.sample(d[0], LANG); }, T(d[2], d[3]));
    });
    var tools = $("tools"); tools.innerHTML = "";
    ["excel", "sql", "python", "powerbi", "tableau", "figma", "framer", "notion", "claude", "chatgpt"].forEach(function (k, i) {
      var t = document.createElement("span"); t.className = "tool";
      t.innerHTML = A.tile(k) + "<span>" + esc(A.tileName(k)) + "</span>";
      tools.appendChild(t); rise(t, i);
    });
  }

  /* ---------- one project ---------- */
  function openProject(id) {
    var p = P.filter(function (q) { return q.id === id; })[0]; if (!p) { location.hash = "#work"; return; }
    peek.classList.remove("on");
    $("pjMood").innerHTML = X.mood(p.id);
    var h = '<button class="pj-back" id="pjBack" type="button">' + T("[ ← back to projects ]", "[ → العودة إلى المشاريع ]") + "</button>" +
      '<p class="pj-cat">[· ' + esc(typeName(typeOf(p))) + (L(p.category) ? " · " + esc(L(p.category)) : "") + ' ·]</p><h2 class="pj-title" id="pjTitle">' + esc(L(p.title)) + "</h2>" +
      '<p class="pj-head">' + esc(L(p.headline)) + "</p>" +
      '<div class="pj-tools">' + (p.tools || []).map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") +
      (p.link && typeOf(p) === "app" ? '<a class="btn pj-gh" href="' + esc(p.link) + '" target="_blank" rel="noopener">' + T("[ · Try it · ]", "[ · جرّبه · ]") + "</a>" : "") +
      (p.github ? '<a class="btn pj-gh" href="' + esc(p.github) + '" target="_blank" rel="noopener">[ · GitHub · ]</a>' : "") + "</div>";
    var pics = function (arr, cls) { return '<div class="' + cls + '">' + (arr || []).map(function (src, k) {
      return '<figure><img loading="lazy" src="site/' + esc(src) + '" alt="' + esc(L(p.title) + " " + (k + 1)) + '"></figure>'; }).join("") + "</div>"; };
    if (typeOf(p) === "app") {
      h += '<div class="pj-block"><h3>' + T("What it does", "وش يسوي") + "</h3><p>" + esc(L(p.goal)) + "</p></div>" +
        (p.video ? '<div class="pj-media"><video src="site/' + esc(p.video) + '" controls playsinline muted autoplay loop></video></div>' : "") +
        '<div class="pj-block"><h3>' + T("Screens", "الشاشات") + "</h3>" + pics(p.screens, "pj-screens") + "</div>" +
        (L(p.recommendation) ? '<div class="pj-block"><h3>' + T("What I learned", "وش تعلمت") + "</h3><p>" + esc(L(p.recommendation)) + "</p></div>" : "");
      return show(h);
    }
    if (typeOf(p) === "design") {
      h += '<div class="pj-block"><p>' + esc(L(p.goal)) + "</p></div>" + pics(p.images, "pj-gallery");
      return show(h);
    }
    if (p.video && p.dashboard) h += '<div class="pj-switch"><button type="button" class="on" data-v="img">' + T("Dashboard", "اللوحة") + '</button><button type="button" data-v="vid">' + T("Video", "الفيديو") + "</button></div>";
    h += '<div class="pj-media" id="pjMedia"></div>' +
      '<div class="pj-block"><h3>' + T("The question", "السؤال") + "</h3><p>" + esc(L(p.goal)) + "</p></div>" +
      '<div class="pj-block"><h3>' + T("What I found", "ما وجدته") + '</h3><div class="pj-ins">' + (p.insights || []).map(function (x) {
        return '<div class="pj-in"><b>' + esc(x.value) + "</b><span>" + esc(L(x.text)) + "</span></div>"; }).join("") + "</div></div>" +
      '<div class="pj-block"><h3>' + T("What to do next", "التوصية") + "</h3><p>" + esc(L(p.recommendation)) + "</p></div>";
    var w = show(h);
    function media(kind) {
      $("pjMedia").innerHTML = kind === "vid"
        ? '<video src="site/' + esc(p.video) + '" controls playsinline muted autoplay loop></video>'
        : '<img src="site/' + esc(p.dashboard || p.thumbnail) + '" alt="' + esc(T("Dashboard for ", "لوحة ") + L(p.title)) + '">';
    }
    media("img");
    w.querySelectorAll(".pj-switch button").forEach(function (b) {
      b.addEventListener("click", function () { w.querySelectorAll(".pj-switch button").forEach(function (x) { x.classList.toggle("on", x === b); }); media(b.dataset.v); });
    });
  }
  function show(h) {
    var w = $("pjWrap"); w.innerHTML = h;
    $("pjBack").addEventListener("click", function () { location.hash = "#work"; });
    $("project").hidden = false; $("project").scrollTop = 0; document.body.classList.add("pj-open");
    $("pjBack").focus({ preventScroll: true });
    return w;
  }

  /* ---------- a folder app opens on this page, over the site ---------- */
  function openApp(name) {
    if (!DESK.some(function (d) { return d[0] === name; })) { location.hash = "#desk"; return; }
    peek.classList.remove("on");
    var sheet = $("appSheet"), f = $("appFrame"), st = $("studio");
    if (NATIVE[name]) {
      f.hidden = true; f.removeAttribute("src"); st.hidden = false; st.scrollTop = 0;
      window.STUDIO[name]($("studioBody"), LANG);
    } else {
      st.hidden = true; f.hidden = false;
      var src = "desktop.html?open=" + encodeURIComponent(name) + "&solo=1";
      if (f.getAttribute("src") !== src) f.setAttribute("src", src);
      f.title = T("SQL lab", "مختبر SQL");
    }
    sheet.hidden = false; document.body.classList.add("app-open");
    /* opened straight from a link: show it at once, no slide */
    if (!ready) { sheet.style.transition = "none"; sheet.classList.add("on"); setTimeout(function () { sheet.style.transition = ""; }, 50); }
    else { void sheet.offsetWidth; sheet.classList.add("on"); }
    $("appClose").setAttribute("aria-label", T("Close", "إغلاق"));
    $("appClose").focus({ preventScroll: true });
  }
  function closeApp() {
    var sheet = $("appSheet"); if (sheet.hidden) return;
    sheet.classList.remove("on"); document.body.classList.remove("app-open");
    setTimeout(function () { if (!sheet.classList.contains("on")) { sheet.hidden = true; $("appFrame").removeAttribute("src"); $("studioBody").innerHTML = ""; } }, 450);
  }
  $("appClose").addEventListener("click", function () { location.hash = "#desk"; });
  window.addEventListener("message", function (e) {
    if (e.origin !== location.origin || e.source !== $("appFrame").contentWindow) return;
    if (e.data === "close-app") location.hash = "#desk";
  });
  function closeProject() {
    if ($("project").hidden) return;
    $("project").hidden = true; document.body.classList.remove("pj-open"); $("pjWrap").innerHTML = ""; $("pjMood").innerHTML = "";
  }
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!$("project").hidden) location.hash = "#work"; else if (!$("appSheet").hidden) location.hash = "#desk";
  });

  /* ---------- CV on request ---------- */
  function mailTo() { var k = CFG.formsubmit || S.email; return k ? "https://formsubmit.co/ajax/" + encodeURIComponent(k) : ""; }
  var SB = (function () {
    var url = String(CFG.supabaseUrl || "").replace(/\/+$/, ""), key = String(CFG.supabaseKey || "");
    if (!url || !key || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) || /^sb_secret_/.test(key)) return null;
    return { url: url, key: key };
  })();
  var lastSend = 0;
  function cv() {
    $("cvLead").textContent = T("My CV is shared on request. Tell me who you are and I will email it to you.", "السيرة الذاتية تُرسل عند الطلب. عرّف بنفسك وسأرسلها إلى بريدك.");
  }
  $("cvForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    var info = $("cvInfo"), send = $("cvSend");
    var clean = function (v, n) { return String(v || "").replace(/[<>]/g, "").trim().slice(0, n); };
    var r = { name: clean($("cvName").value, 60), email: clean($("cvMail").value, 120), role: clean($("cvRole").value, 80) };
    if (!r.name) { $("cvName").focus(); info.textContent = T("Add your name.", "اكتب اسمك."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) { $("cvMail").focus(); info.textContent = T("Add a valid email.", "اكتب بريدًا إلكترونيًا صحيحًا."); return; }
    if (!r.role) { $("cvRole").focus(); info.textContent = T("Add your job title.", "اكتب مسماك الوظيفي."); return; }
    if ($("cvHp").value) { info.textContent = T("Thank you!", "شكرًا لك!"); return; }
    if (Date.now() - lastSend < 20000) { info.textContent = T("Please wait a few seconds before sending again.", "يُرجى الانتظار بضع ثوانٍ قبل الإرسال مرة أخرى."); return; }
    send.disabled = true; info.textContent = T("Sending...", "جاري الإرسال...");
    try {
      if (SB) {
        var res = await fetch(SB.url + "/rest/v1/cv_requests", { method: "POST", headers: { apikey: SB.key, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ name: r.name, email: r.email, job_title: r.role }) });
        if (!res.ok) throw new Error("not sent");
      }
      var to = mailTo();
      if (to) {
        var fd = new FormData();
        fd.append("_subject", "CV request from " + r.name); fd.append("_template", "table"); fd.append("_captcha", "false");
        fd.append("name", r.name); fd.append("email", r.email); fd.append("job_title", r.role); fd.append("_replyto", r.email);
        var mail = fetch(to, { method: "POST", headers: { Accept: "application/json" }, body: fd, keepalive: true });
        if (!SB) { var m = await mail; if (!m.ok) throw new Error("not sent"); } else mail.catch(function () {});
      } else if (!SB) throw new Error("not sent");
      lastSend = Date.now();
      info.textContent = T("Thank you! I will email my CV to ", "شكرًا لك! سأرسل السيرة الذاتية إلى ") + r.email; $("cvForm").reset();
    } catch (err) { info.textContent = T("Could not send. Try again in a moment.", "تعذّر الإرسال، يُرجى المحاولة بعد قليل."); }
    send.disabled = false;
  });

  /* ---------- contact ---------- */
  function contact() {
    var items = [];
    if (S.email) items.push(["mailto:" + S.email, T("Email", "البريد الإلكتروني"), S.email]);
    items.push(["https://www.linkedin.com/in/nourahwahag/", "LinkedIn", "/in/nourahwahag"]);
    items.push(["https://github.com/inourahwahaq", "GitHub", "@inourahwahaq"]);
    $("links").innerHTML = "";
    items.forEach(function (it) {
      var li = document.createElement("li"), a = document.createElement("a");
      a.href = it[0]; if (!/^mailto:/.test(it[0])) { a.target = "_blank"; a.rel = "noopener"; }
      a.appendChild(document.createTextNode(it[1]));
      var s = document.createElement("small"); s.textContent = it[2]; a.appendChild(s);
      li.appendChild(a); $("links").appendChild(li);
    });
    $("copy").textContent = "© " + new Date().getFullYear() + " " + (S.name || "NOURAH WA");
    $("contactNote").textContent = T("For a role, a project or a question about data, write to me.", "لوظيفة، أو مشروع، أو سؤال عن البيانات، راسلني.");
  }

  /* ---------- small moving things ---------- */
  function split(node) {
    /* each letter of a big title rises on its own when the section comes in */
    var txt = node.textContent; node.setAttribute("aria-label", txt); node.innerHTML = "";
    /* Arabic letters join, so an Arabic title rises as one piece */
    (LANG === "ar" ? [txt] : Array.from(txt)).forEach(function (c, k) { var s = document.createElement("span"); s.className = "ch"; s.setAttribute("aria-hidden", "true"); s.style.setProperty("--k", k); s.textContent = c === " " ? "\u00a0" : c; node.appendChild(s); });
  }
  function moving() {
    document.querySelectorAll(".big-title [data-t]").forEach(split);
    /* a band of words running across the about section */
    var band = $("band"), w = T(["SQL", "PYTHON", "TABLEAU", "POWER BI", "EXCEL", "DATA STORIES", "DASHBOARDS", "INSIGHT"], ["SQL", "بايثون", "تابلو", "باور بي آي", "إكسل", "قصص البيانات", "لوحات", "رؤى"]);
    var one = w.map(function (x) { return "<span>" + esc(x) + "</span><i>✳</i>"; }).join("");
    band.innerHTML = '<div class="band-run" dir="ltr">' + one + one + one + one + "</div>";
    /* text going round in a circle */
    var t = WORDS.badge[LANG === "ar" ? 1 : 0];
    $("badge").innerHTML = '<svg viewBox="0 0 120 120" aria-hidden="true"><defs><path id="ring" d="M60 60 m-46 0 a46 46 0 1 1 92 0 a46 46 0 1 1 -92 0"/></defs><text><textPath href="#ring" textLength="285">' + esc(t + t) + '</textPath></text></svg><span class="badge-sun">' + X.sun() + "</span>";
  }
  /* the time in Riyadh, in the top bar */
  function clock() {
    var c = $("clock"); if (!c) return;
    try { c.textContent = WORDS.local[LANG === "ar" ? 1 : 0] + " " + new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Riyadh", hour: "2-digit", minute: "2-digit" }).format(new Date()); }
    catch (e) { c.textContent = ""; }
  }
  clock(); setInterval(clock, 20000);
  $("lang").addEventListener("click", function () { setTimeout(clock, 0); });
  /* a small ring that follows the mouse and grows over things you can open */
  (function cursor() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var ring = document.createElement("div"); ring.className = "cursor"; ring.setAttribute("aria-hidden", "true"); document.body.appendChild(ring);
    var x = -100, y = -100, cx = -100, cy = -100;
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return; x = e.clientX; y = e.clientY;
      ring.classList.toggle("big", !!e.target.closest("a,button,.tool"));
      ring.classList.toggle("grab", !!e.target.closest("#page") && !e.target.closest("a,button,input,.tool") && !PHONE.matches);
    });
    document.addEventListener("pointerleave", function () { x = y = -100; });
    (function tick() { cx += (x - cx) * 0.22; cy += (y - cy) * 0.22; ring.style.transform = "translate(" + cx + "px," + cy + "px)"; requestAnimationFrame(tick); })();
  })();

  /* ---------- moving between sections: a curtain of running lines closes, the page jumps, it opens ---------- */
  var busy = false;
  function curtain(id, jump) {
    if (busy || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { jump(); return; }
    busy = true;
    var c = document.createElement("div"); c.className = "curtain"; c.setAttribute("aria-hidden", "true");
    var w = WORDS[id === "work" ? "projects" : id]; var label = w ? w[LANG === "ar" ? 1 : 0] : id;
    var lines = ""; for (var i = 0; i < 9; i++) lines += '<i class="ld-line' + (i % 3 === 0 ? " thick" : "") + (i % 2 ? " rev" : "") + '" style="top:' + (8 + i * 10.5) + "%;color:" + ["#88C9E2", "#E2AFB1", "#E6F3F8"][i % 3] + ";--d:" + (14 + (i * 23) % 60) + "px;--g:" + (10 + (i * 17) % 34) + "px;--s:" + (1.4 + (i % 4) * 0.6) + 's"></i>';
    c.innerHTML = '<div class="ct-half ct-top"></div><div class="ct-half ct-bot"></div><div class="ct-lines">' + lines + '</div><p class="ct-word">[ · ' + esc(label) + " · ]</p>";
    document.body.appendChild(c);
    void c.offsetWidth; c.classList.add("cover");
    setTimeout(function () {
      jump();
      c.classList.add("open");
      setTimeout(function () { c.remove(); busy = false; }, 900);
    }, 760);
  }

  /* links to a section use the curtain; without this the browser jumps there before we can */
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    var k = IDS.indexOf(a.getAttribute("href").slice(1)); if (k < 0) return;
    if (!$("project").hidden || !$("appSheet").hidden) return;
    e.preventDefault();
    if (location.hash !== "#" + IDS[k]) history.pushState(null, "", "#" + IDS[k]);
    go(k, "click");
  });

  /* ---------- while scrolling: a progress line, big section numbers and drawings that move at their own speed ---------- */
  (function scrolling() {
    var bar = document.createElement("div"); bar.className = "progress"; bar.setAttribute("aria-hidden", "true"); document.body.appendChild(bar);
    var secs = Array.prototype.slice.call(document.querySelectorAll(".sec"));
    secs.forEach(function (s, k) { var n = document.createElement("span"); n.className = "sec-num"; n.setAttribute("aria-hidden", "true"); n.textContent = "0" + (k + 1); s.appendChild(n); });
    var tick = 0;
    function frame() {
      tick = 0;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? window.scrollY / h : 0) + ")";
      secs.forEach(function (s) {
        var r = s.getBoundingClientRect(); if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
        s.style.setProperty("--p", ((window.innerHeight - r.top) / (window.innerHeight + r.height)).toFixed(3));
      });
    }
    window.addEventListener("scroll", function () { if (!tick) tick = requestAnimationFrame(frame); }, { passive: true });
    window.addEventListener("resize", frame); frame();
  })();

  /* ---------- Folders only: the mouse (or a finger) leaves soft green colour that spreads and is dragged along.
     On phones, where there is no mouse, a slow trail also wanders through the section while it is on screen. ---------- */
  (function ink() {
    var sec = $("desk");
    if (!sec || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var touch = !window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var cv = document.createElement("canvas"); cv.className = "ink"; cv.setAttribute("aria-hidden", "true"); sec.insertBefore(cv, sec.firstChild);
    var ctx = cv.getContext("2d"), dots = [], run = 0, last = null, dpr = Math.min(touch ? 1.5 : 2, window.devicePixelRatio || 1);
    var COLS = [[175, 226, 196], [120, 196, 160], [175, 226, 196], [136, 201, 226]];
    function size() { cv.width = Math.floor(sec.clientWidth * dpr); cv.height = Math.floor(sec.scrollHeight * dpr); cv.style.height = sec.scrollHeight + "px"; }
    size(); window.addEventListener("resize", size);
    function add(x, y, k) {
      if (Math.abs(cv.height - sec.scrollHeight * dpr) > 4) size();
      k = k || 1;
      if (last) {
        var dx = x - last.x, dy = y - last.y, d = Math.min(120, Math.hypot(dx, dy)), steps = Math.max(1, Math.round(d / 9));
        for (var i = 0; i < steps; i++) {
          var t = i / steps;
          dots.push({ x: last.x + dx * t, y: last.y + dy * t, vx: dx * 0.06 + (Math.random() - 0.5) * 1.6 * k, vy: dy * 0.06 + (Math.random() - 0.5) * 1.6 * k,
            r: (10 + Math.random() * 18 + d * 0.25) * k, life: 1, c: COLS[(Math.random() * COLS.length) | 0] });
        }
        if (dots.length > 260) dots.splice(0, dots.length - 260);
      }
      last = { x: x, y: y };
      if (!run) run = requestAnimationFrame(draw);
    }
    function at(cx, cy) { var r = sec.getBoundingClientRect(); return [cx - r.left, cy - r.top]; }
    sec.addEventListener("pointermove", function (e) { if (e.pointerType !== "mouse") return; var p = at(e.clientX, e.clientY); add(p[0], p[1]); });
    sec.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") last = null; });
    /* a finger: touchmove keeps coming while the page scrolls, so the colour follows the finger */
    var finger = false;
    sec.addEventListener("touchstart", function (e) { finger = true; last = null; var t = e.touches[0], p = at(t.clientX, t.clientY); add(p[0], p[1], 1.3); }, { passive: true });
    sec.addEventListener("touchmove", function (e) { var t = e.touches[0], p = at(t.clientX, t.clientY); add(p[0], p[1], 1.3); }, { passive: true });
    sec.addEventListener("touchend", function () { finger = false; last = null; }, { passive: true });
    /* on phones a slow trail wanders through the part of the section on screen */
    if (touch) {
      var t0 = performance.now(), gl = null;
      (function wander(now) {
        var r = sec.getBoundingClientRect(), vis = Math.min(window.innerHeight, r.bottom) - Math.max(0, r.top);
        if (vis < window.innerHeight * 0.25) gl = null;
        else if (!finger) {
          var t = (now - t0) / 1000 * 1.7, top = Math.max(0, -r.top);
          var x = r.width * (0.5 + 0.42 * Math.sin(t * 0.9) * Math.cos(t * 0.23)), y = top + vis * (0.5 + 0.38 * Math.sin(t * 0.61 + 1.3));
          var keep = last; last = gl; add(x, y, 2); gl = last; last = keep;
        }
        requestAnimationFrame(wander);
      })(t0);
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (var i = dots.length - 1; i >= 0; i--) {
        var p = dots[i];
        p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94; p.r *= 1.025; p.life -= 0.013;
        if (p.life <= 0) { dots.splice(i, 1); continue; }
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r), a = p.life * p.life * (touch ? 0.26 : 0.22);
        g.addColorStop(0, "rgba(" + p.c[0] + "," + p.c[1] + "," + p.c[2] + "," + a + ")");
        g.addColorStop(1, "rgba(" + p.c[0] + "," + p.c[1] + "," + p.c[2] + ",0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
      run = dots.length ? requestAnimationFrame(draw) : 0;
      if (!run) ctx.clearRect(0, 0, cv.width, cv.height);
    }
  })();

  /* ---------- a faint drawing behind each section ---------- */
  document.querySelectorAll(".sec").forEach(function (s) { s.querySelector(".mood").innerHTML = X.mood(s.dataset.mood); });

  function enter(id) {
    if (!ready || entered[id]) return; entered[id] = true;
    var sec = $(id); if (sec) sec.classList.add("seen");
    if (id === "about") playAbout();
    if (id === "work") X.py($("workNote"), $("workNote").textContent, { code: ">>> print(projects.note)", dur: 900 });
    if (id === "desk") X.py($("deskNote"), $("deskNote").textContent, { code: ">>> print(desk.note)", dur: 900 });
    if (id === "cv") X.py($("cvLead"), $("cvLead").textContent, { code: '>>> print(cv.how)', dur: 900 });
    if (id === "contact") X.py($("contactNote"), $("contactNote").textContent, { code: '>>> print(contact.me)', dur: 700 });
  }
  function route() {
    var h = location.hash.replace(/^#/, "");
    if (/^p\//.test(h)) { closeApp(); if (cur !== 1) go(1, true); openProject(h.slice(2)); return; }
    if (/^app\//.test(h)) { closeProject(); if (cur !== 2) go(2, true); openApp(h.slice(4)); return; }
    closeProject(); closeApp();
    var i = IDS.indexOf(h); go(i < 0 ? cur : i, true);
  }
  function render() { words(); about(); projects(); desk(); cv(); contact(); pager(); place(); moving(); }

  $("lang").addEventListener("click", function () {
    LANG = LANG === "ar" ? "en" : "ar";
    try { localStorage.setItem("lang", LANG); } catch (e) { /* not remembered */ }
    entered = {}; render(); route();
  });
  $("menuBtn").addEventListener("click", function () { var o = $("top").classList.toggle("menu-open"); this.setAttribute("aria-expanded", String(o)); });
  $("topNav").addEventListener("click", function () { $("top").classList.remove("menu-open"); $("menuBtn").setAttribute("aria-expanded", "false"); });
  window.addEventListener("hashchange", route);

  render(); route();

  /* ---------- loading screen, then the page opens ---------- */
  var box = $("loader");
  X.loader(box, LANG, function () {
    box.classList.add("out");
    ready = true; entered = {}; enter(IDS[cur]);
    box.querySelector(".ld-bottom").addEventListener("transitionend", function () { box.remove(); });
    setTimeout(function () { if (box.parentNode) box.remove(); }, 1600);
  });
  box.addEventListener("click", function () { if (box._finish) box._finish(); });
  box.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && box._finish) box._finish(); });
})();
