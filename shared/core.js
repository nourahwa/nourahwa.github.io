/* Shared by the three versions: language, routing, project page and the Ask me guide.
   All text comes from site/content/settings.js and site/content/projects.js. */
(function () {
  "use strict";
  var S = window.SITE, P = window.PROJECTS || [], BASE = "site/";
  var $ = function (id) { return document.getElementById(id); };

  var THEMES = {
    green: { page: "#152920", panel: "#21392E", ink: "#E6F3F8", muted: "#B4C8BC", acc: "#E2AFB1", neon: "#5BE3A0" },
    navy: { page: "#172D43", panel: "#233F5B", ink: "#E6F3F8", muted: "#B4CADB", acc: "#E2AFB1", neon: "#7FB8FF" },
    sky: { page: "#88C9E2", panel: "#E6F3F8", ink: "#0D1E2F", muted: "#3C5A70", acc: "#233F5B", neon: "#88C9E2" },
    grey: { page: "#2B3238", panel: "#3A444C", ink: "#EEF1F3", muted: "#BFC9D0", acc: "#E2AFB1", neon: "#C9D3DA" },
    pink: { page: "#E2AFB1", panel: "#F8E9E9", ink: "#0D1E2F", muted: "#5A4650", acc: "#233F5B", neon: "#F09AA6" }
  };

  var UI = {
    en: { about: "About me", skills: "Skills", tools: "Tools", projects: "Projects", back: "Back", dashboard: "Dashboard", video: "Video", goal: "Goal", results: "Key results", rec: "Recommendation", open: "Open", github: "GitHub", contact: "Contact", ask: "Ask me", other: "عربي", otherName: "Switch to Arabic", send: "Send", close: "Close", placeholder: "Ask about my work...", dash: "dashboard" },
    ar: { about: "نبذة عني", skills: "المهارات", tools: "الأدوات", projects: "المشاريع", back: "رجوع", dashboard: "الشاشة", video: "الفيديو", goal: "الهدف", results: "أهم النتائج", rec: "التوصية", open: "فتح", github: "GitHub", contact: "تواصل", ask: "اسألني", other: "EN", otherName: "التبديل إلى الإنجليزية", send: "إرسال", close: "إغلاق", placeholder: "اسأل عن أعمالي...", dash: "لوحة البيانات" }
  };

  var LANG = (function () { try { return localStorage.getItem("lang") === "ar" ? "ar" : "en"; } catch (e) { return "en"; } })();
  function tr(v) { return v && typeof v === "object" && !Array.isArray(v) ? (v[LANG] || v.en || "") : v; }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function link(href, cls, text, external) {
    var a = el("a", cls, text);
    a.href = href;
    if (external) { a.target = "_blank"; a.rel = "noopener"; }
    return a;
  }
  function safe(u) { return /^https:\/\//i.test(u || "") ? u : ""; }
  function mailto() { return /^[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]+$/.test(S.email || "") ? "mailto:" + S.email : ""; }
  function theme(p) { return THEMES[p.theme] || THEMES.green; }
  function asset(path) { return path ? BASE + path : ""; }

  function langButton(cls) {
    var b = el("button", cls || "lang", UI[LANG].other);
    b.type = "button";
    b.setAttribute("aria-label", UI[LANG].otherName);
    b.addEventListener("click", function () {
      LANG = LANG === "ar" ? "en" : "ar";
      try { localStorage.setItem("lang", LANG); } catch (e) { /* not remembered */ }
      refresh();
    });
    return b;
  }

  function typeInto(node, text) {
    clearInterval(node._typing);
    node.setAttribute("aria-label", text);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { node.textContent = text; return; }
    var n = 0;
    node.textContent = "";
    node._typing = setInterval(function () {
      node.textContent = text.slice(0, ++n);
      if (n >= text.length) clearInterval(node._typing);
    }, 50);
  }

  /* ---------- project page ---------- */
  function renderDetail(p) {
    var t = theme(p), d = $("detail"), u = UI[LANG], title = tr(p.title);
    Object.keys(t).forEach(function (k) { d.style.setProperty("--t-" + k, t[k]); });
    d.innerHTML = "";
    var w = el("div", "d-wrap");

    var bar = el("div", "d-bar");
    var back = link("#", "d-back", "← " + u.back);
    bar.appendChild(back);
    bar.appendChild(langButton("lang d-lang"));
    w.appendChild(bar);

    var head = el("header", "d-head");
    head.appendChild(el("span", "d-level", tr(p.category)));
    head.appendChild(el("h1", "d-title", title));
    head.appendChild(el("p", "d-line", tr(p.headline)));
    var act = el("div", "d-actions");
    (p.tools || []).forEach(function (x) { act.appendChild(el("span", "d-tool", x)); });
    if (safe(p.github)) act.appendChild(link(p.github, "d-gh", "GitHub ↗", true));
    head.appendChild(act);
    w.appendChild(head);

    var frame = el("div", "d-media"), im = document.createElement("img");
    im.src = asset(p.dashboard); im.alt = title + " " + u.dash;
    frame.appendChild(im);
    if (p.video) {
      var sw = el("div", "d-switch"), bI = el("button", "on", u.dashboard), bV = el("button", "", u.video);
      bI.type = bV.type = "button";
      sw.appendChild(bI); sw.appendChild(bV); w.appendChild(sw);
      var v = document.createElement("video");
      v.src = asset(p.video); v.controls = true; v.muted = true; v.playsInline = true; v.preload = "metadata"; v.poster = asset(p.dashboard); v.hidden = true;
      frame.appendChild(v);
      var show = function (video) { im.hidden = video; v.hidden = !video; bI.className = video ? "" : "on"; bV.className = video ? "on" : ""; if (!video) v.pause(); };
      bI.addEventListener("click", function () { show(false); });
      bV.addEventListener("click", function () { show(true); });
    }
    w.appendChild(frame);

    function block(h, node) { var b = el("section", "d-block"); b.appendChild(el("h3", "", h)); b.appendChild(node); return b; }
    w.appendChild(block(u.goal, el("p", "", tr(p.goal))));
    var ins = el("div", "d-ins");
    (p.insights || []).forEach(function (x) { var c = el("div", "d-in"); c.appendChild(el("b", "", x.value)); c.appendChild(el("span", "", tr(x.text))); ins.appendChild(c); });
    w.appendChild(block(u.results, ins));
    w.appendChild(block(u.rec, el("p", "", tr(p.recommendation))));
    d.appendChild(w);
  }

  /* ---------- Ask me: matches words in the question to the site's own text ---------- */
  var WORDS = {
    hello: ["hi", "hello", "hey", "مرحبا", "السلام", "هلا", "اهلا"],
    tools: ["tool", "tools", "software", "program", "use", "stack", "ادوات", "اداه", "برامج", "برنامج", "تستخدم"],
    skills: ["skill", "skills", "good at", "strength", "مهارات", "مهاره", "تقدر", "تجيد"],
    about: ["who", "about", "yourself", "background", "bio", "من انت", "مين", "نبذه", "عنك", "تعريف"],
    contact: ["email", "contact", "reach", "hire", "mail", "تواصل", "ايميل", "بريد", "اتواصل", "توظيف"],
    github: ["github", "code", "repo", "repository", "source", "كود", "قيت", "جيت", "الكود"],
    projects: ["project", "projects", "work", "portfolio", "مشاريع", "مشروع", "اعمال", "شغل"],
    rec: ["recommend", "recommendation", "suggest", "advice", "توصيه", "توصيات", "توصيتك", "تنصح", "تنصحني", "نصيحه"],
    results: ["result", "results", "finding", "findings", "insight", "number", "نتائج", "نتيجه", "ارقام"]
  };
  var TOPIC = {
    "ev-global-sales": ["ev", "electric", "car", "cars", "vehicle", "charging", "سيارات", "سياره", "كهربائيه", "شحن"],
    "saudi-real-estate": ["property", "real estate", "estate", "housing", "deals", "price", "عقار", "عقاري", "عقارات", "صفقات", "اسعار"],
    "court-sessions": ["court", "courts", "sessions", "justice", "legal", "محاكم", "محكمه", "جلسات", "عدلي"],
    "global-layoffs": ["layoff", "layoffs", "jobs", "fired", "workforce", "تسريح", "وظائف", "موظفين"],
    "olist-delivery-impact": ["delivery", "late", "rating", "ratings", "olist", "orders", "shipping", "ecommerce", "توصيل", "تاخير", "تقييم", "طلبات", "شحن الطلبات", "متاجر"]
  };
  P.forEach(function (p) {
    var extra = [p.cardTitle, p.title.en, p.title.ar, p.category.en, p.category.ar].join(" ").toLowerCase();
    TOPIC[p.id] = (TOPIC[p.id] || []).concat(norm(extra).split(/\s+/).filter(function (w) { return w.length > 3; }));
  });

  function norm(s) {
    return String(s).toLowerCase()
      .replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
      .replace(/^ال|\sال/g, " ").replace(/[^\w؀-ۿ%.\s]/g, " ").replace(/\s+/g, " ").trim();
  }
  function hits(q, list) {
    var padded = " " + q + " ";
    return list.reduce(function (n, w) { w = norm(w); return n + (w && (padded.indexOf(" " + w + " ") >= 0 || (w.length > 4 && q.indexOf(w) >= 0)) ? 1 : 0); }, 0);
  }

  function answer(question) {
    var q = norm(question), L = /[؀-ۿ]/.test(question) ? "ar" : (LANG === "ar" ? "ar" : "en");
    var T = function (v) { return v && typeof v === "object" && !Array.isArray(v) ? (v[L] || v.en) : v; };
    var ar = L === "ar", links = [];

    var best = null, bestN = 0;
    P.forEach(function (p) { var n = hits(q, TOPIC[p.id]); if (n > bestN) { best = p; bestN = n; } });
    var toolHit = S.tools.filter(function (t) { return hits(q, [t]); });
    var is = function (k) { return hits(q, WORDS[k]) > 0; };

    if (best) {
      links.push({ href: "#project/" + best.id, text: ar ? "افتح المشروع" : "Open the project" });
      if (safe(best.github)) links.push({ href: best.github, text: "GitHub ↗", external: true });
      if (is("tools")) return { text: (ar ? "الأدوات في هذا المشروع: " : "Tools in this project: ") + best.tools.join(", ") + ".", links: links };
      if (is("rec")) return { text: T(best.recommendation), links: links };
      if (is("results")) return { text: best.insights.map(function (x) { return x.value + " " + T(x.text); }).join("\n"), links: links };
      return { text: T(best.title) + ": " + T(best.headline) + "\n" + T(best.goal), links: links };
    }
    if (toolHit.length) {
      var used = P.filter(function (p) { return (p.tools || []).some(function (t) { return toolHit.indexOf(t) >= 0; }); });
      used.forEach(function (p) { links.push({ href: "#project/" + p.id, text: T(p.title) }); });
      return { text: (ar ? "استخدمت " + toolHit.join(" و ") + " في " + used.length + " مشاريع:" : "I used " + toolHit.join(" and ") + " in " + used.length + " projects:"), links: links };
    }
    if (is("contact")) {
      if (mailto()) return { text: (ar ? "تقدر تراسلني على " : "You can email me at ") + S.email, links: [{ href: mailto(), text: S.email }] };
      return { text: ar ? "التواصل عبر GitHub." : "You can reach me through GitHub.", links: [] };
    }
    if (is("github")) {
      P.forEach(function (p) { if (safe(p.github)) links.push({ href: p.github, text: T(p.title) + " ↗", external: true }); });
      return { text: ar ? "كل مشروع له كود منشور في GitHub:" : "Each project has its code on GitHub:", links: links };
    }
    if (is("tools")) return { text: (ar ? "أدواتي: " : "My tools: ") + S.tools.join(", ") + ".", links: [] };
    if (is("skills")) return { text: S.skills.map(T).join(ar ? "، " : ", "), links: [] };
    if (is("projects")) {
      P.forEach(function (p) { links.push({ href: "#project/" + p.id, text: T(p.title) }); });
      return { text: (ar ? "عندي " + P.length + " مشاريع:" : "I have " + P.length + " projects:"), links: links };
    }
    if (is("about")) return { text: T(S.bio), links: [] };
    if (is("hello")) return { text: ar ? "هلا! اسألني عن مشاريعي أو أدواتي أو طريقة التواصل." : "Hi! Ask me about my projects, tools or how to reach me.", links: [] };
    return { text: ar ? "أجاوب فقط من محتوى هذا الموقع. جرّب أحد هذه الأسئلة:" : "I only answer from what is on this site. Try one of these:", links: [], suggest: true };
  }

  var SUGGEST = {
    en: ["Who are you?", "What tools do you use?", "Show me your projects", "Delivery project results", "How can I contact you?"],
    ar: ["من أنت؟", "وش الأدوات اللي تستخدمها؟", "وش مشاريعك؟", "نتائج مشروع التوصيل", "كيف أتواصل معك؟"]
  };

  function askBox(root) {
    root.innerHTML = "";
    var u = UI[LANG];
    var log = el("div", "ask-log"); log.setAttribute("aria-live", "polite");
    var chips = el("div", "ask-chips");
    var form = el("form", "ask-form"), input = el("input", "ask-input"), send = el("button", "ask-send", u.send);
    input.type = "text"; input.placeholder = u.placeholder; input.setAttribute("aria-label", u.placeholder); input.maxLength = 160;
    send.type = "submit";
    form.appendChild(input); form.appendChild(send);
    root.appendChild(log); root.appendChild(chips); root.appendChild(form);

    function say(who, text, links) {
      var m = el("div", "msg " + who);
      text.split("\n").forEach(function (line, i) { if (i) m.appendChild(document.createElement("br")); m.appendChild(document.createTextNode(line)); });
      if (links && links.length) {
        var row = el("div", "msg-links");
        links.forEach(function (l) { row.appendChild(link(l.href, "msg-link", l.text, l.external)); });
        m.appendChild(row);
      }
      log.appendChild(m);
      log.scrollTop = log.scrollHeight;
    }
    function ask(q) {
      q = q.trim();
      if (!q) return;
      say("you", q);
      var a = answer(q);
      setTimeout(function () { say("me", a.text, a.links); }, 250);
    }
    SUGGEST[LANG].forEach(function (s) {
      var b = el("button", "ask-chip", s); b.type = "button";
      b.addEventListener("click", function () { ask(s); });
      chips.appendChild(b);
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); ask(input.value); input.value = ""; });
    say("me", LANG === "ar" ? "هلا! اسألني عن أعمالي، وأجاوبك من محتوى الموقع." : "Hi! Ask me about my work. I answer from what is on this site.");
    return input;
  }

  /* ---------- routing ---------- */
  var HOME = null;
  function route() {
    var m = location.hash.match(/^#project\/(.+)$/), p = null;
    if (m) p = P.filter(function (x) { return x.id === decodeURIComponent(m[1]); })[0];
    $("home").hidden = !!p;
    $("detail").hidden = !p;
    if (p) {
      renderDetail(p);
      document.title = tr(p.title) + " | " + S.name;
      window.scrollTo(0, 0);
      return;
    }
    $("detail").innerHTML = "";
    document.title = S.pageTitle;
    if (HOME.show) HOME.show(location.hash.slice(1));
  }
  function refresh() {
    document.documentElement.lang = LANG;
    document.documentElement.dir = LANG === "ar" ? "rtl" : "ltr";
    HOME.render();
    route();
  }

  /* ---------- pieces every version shares, so the identity stays the same ---------- */
  function mark() {
    var m = el("span", "mark");
    m.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 4; i++) m.appendChild(el("i"));
    return m;
  }
  function greeting() {
    var g = el("p", "greet");
    g.innerHTML = window.PIX.plain(S.greeting);
    return g;
  }
  /* same links, same order everywhere: About me, Projects, Ask me, Contact, language */
  function nav(box, cls) {
    var u = UI[LANG];
    box.innerHTML = "";
    box.appendChild(link("#about", cls, u.about));
    box.appendChild(link("#projects", cls, u.projects));
    box.appendChild(link("#ask", cls, u.ask));
    if (mailto()) box.appendChild(link(mailto(), cls, u.contact));
    box.appendChild(langButton("lang " + cls));
  }
  function hint(node, text) {
    node.className = "hint";
    node.textContent = tr(text);
  }

  window.CORE = {
    mark: mark, greeting: greeting, nav: nav, hint: hint, profile: "https://github.com/inourahwahaq",
    S: S, P: P, UI: function () { return UI[LANG]; }, lang: function () { return LANG; },
    tr: tr, el: el, link: link, safe: safe, mailto: mailto, theme: theme, asset: asset,
    useLang: function (l) { LANG = l === "ar" ? "ar" : "en"; },
    pix: window.PIX, plain: window.PIX.plain, langButton: langButton, typeInto: typeInto, askBox: askBox, answer: answer,
    start: function (home) {
      HOME = home;
      window.addEventListener("hashchange", route);
      refresh();
    }
  };
})();
