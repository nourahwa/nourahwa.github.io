/* ------------------------------------------------------------
   About me on the desktop. Edit the text between the quotes.
   en is English and ar is Arabic. Each skill has a name and a
   short line; both show in About me and in about_me.py.
   ------------------------------------------------------------ */
window.DESK_PROFILE = {
  role: { en: "Data Analyst · Digital Designer", ar: "محللة بيانات · مصممة رقمية" },

  /* the one sentence under my name on the desktop */
  line: {
    en: "I care about two things: that the numbers are right, and that they are understood.",
    ar: "يهمني أمران: أن تكون الأرقام صحيحة، وأن تكون مفهومة."
  },

  bio: {
    en: "I analyse data to find what matters, and design the way it is seen. My work joins the two: careful analysis, clear dashboards, and digital interfaces people can use without a manual.",
    ar: "أحلل البيانات لأصل إلى ما يهم، وأصمم الطريقة التي يُرى بها. يجمع عملي بين الاثنين: تحليل دقيق، ولوحات واضحة، وواجهات رقمية يستخدمها الناس دون شرح."
  },

  /* used inside about_me.py */
  mission: {
    en: "I turn data into clear decisions, and ideas into screens people enjoy.",
    ar: "أحوّل البيانات إلى قرارات واضحة، والأفكار إلى شاشات يستمتع بها الناس."
  },

  skills: [
    { en: "Data cleaning", ar: "تنظيف البيانات", how: { en: "messy files in, trusted tables out", ar: "ملفات مبعثرة تدخل، وجداول موثوقة تخرج" } },
    { en: "Exploratory analysis", ar: "التحليل الاستكشافي", how: { en: "questions before charts", ar: "الأسئلة قبل الرسوم" } },
    { en: "Dashboards & KPIs", ar: "لوحات المؤشرات", how: { en: "one screen, only the numbers that matter", ar: "شاشة واحدة بالأرقام المهمة فقط" } },
    { en: "Data storytelling", ar: "سرد القصص بالبيانات", how: { en: "findings a manager reads in a minute", ar: "نتيجة يقرؤها المدير في دقيقة" } },
    { en: "Business analysis", ar: "تحليل الأعمال", how: { en: "every number tied to a decision", ar: "كل رقم مرتبط بقرار" } },
    { en: "UI design", ar: "تصميم الواجهات", how: { en: "interfaces that explain themselves", ar: "واجهات تشرح نفسها" } },
    { en: "UX & user flows", ar: "تجربة المستخدم", how: { en: "the shortest path to what people need", ar: "أقصر طريق لما يحتاجه الناس" } },
    { en: "Prototyping", ar: "النماذج الأولية", how: { en: "test the idea before building it", ar: "أختبر الفكرة قبل بنائها" } },
    { en: "Web design", ar: "تصميم المواقع", how: { en: "sites that work on every screen", ar: "مواقع تعمل على كل شاشة" } },
    { en: "Visual design", ar: "التصميم البصري", how: { en: "type, colour and space used with intent", ar: "خط ولون ومساحة بقصد" } }
  ],

  tools: ["Excel", "SQL", "Python", "Power BI", "Tableau", "Figma", "Framer"]
};
