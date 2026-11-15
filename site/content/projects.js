/* ------------------------------------------------------------
   One block for each project. Copy a block to add a project,
   delete a block to remove one. Order here is order on the site.

   icon can be: pulse, chart, user, star, box, tool
   theme can be: green, navy, sky, grey, pink
   tools appear under the project. Keep three insights.
   Write both languages: en for English, ar for Arabic.
   github: paste the link between the quotes. While it is empty, no button shows.

   type can be: data, app, design. It picks the filter button and the page layout.
     data:   goal, insights, recommendation, dashboard (as now)
     app:    goal (what it does), screens: ["path.png", ...], video (optional),
             link: "https://..." for the "Try it" button
     design: goal (the idea, one or two lines), images: ["path.png", ...]
   The main page lists data first, then apps, then designs.

   process (data projects) fills "How I work" in Folders, always in the same six steps:
     data: one line on the source; counts: [[label, number], ...]
     clean: [[what I did, rows affected], ...]; test: [one line per check, ...]
   ------------------------------------------------------------ */
window.PROJECTS = [
  {
    id: "ev-global-sales",
    type: "data",
    category: { en: "AUTOMOTIVE", ar: "قطاع السيارات" },
    cardTitle: "EV SALES",
    cardLine: { en: "GLOBAL MARKET", ar: "السوق العالمي" },
    icon: "pulse",
    title: { en: "Global Electric Car Sales", ar: "مبيعات السيارات الكهربائية عالميًا" },
    headline: {
      en: "One in four new cars sold worldwide in 2025 was electric",
      ar: "سيارة من كل أربع سيارات جديدة بيعت عالميًا في 2025 كانت كهربائية"
    },
    theme: "green",
    thumbnail: "projects/ev-global-sales/thumb.jpg",
    dashboard: "projects/ev-global-sales/dashboard.jpg",
    video: "projects/ev-global-sales/demo.mp4",
    github: "https://github.com/inourahwahaq/ev-global-sales-analysis",
    tools: ["Python", "Excel", "Tableau"],

    goal: {
      en: "Measure how fast electric cars are growing worldwide, where adoption is strongest, and what the trend means for emerging markets such as the Middle East and Caspian region.",
      ar: "قياس سرعة نمو السيارات الكهربائية عالميًا، وأين ينتشر استخدامها أكثر، وماذا يعني هذا الاتجاه للأسواق الناشئة مثل منطقة الشرق الأوسط وبحر قزوين."
    },

    process: {
      data: { en: "Two public tables on electric cars: sales and stock by market, and car prices by type.", ar: "جدولان عامّان عن السيارات الكهربائية: المبيعات والأعداد حسب السوق، وأسعار السيارات حسب النوع." },
      counts: [[{ en: "sales rows", ar: "صفوف المبيعات" }, 26778], [{ en: "price rows", ar: "صفوف الأسعار" }, 3226]],
      clean: [
        [{ en: "Removed exact duplicate rows", ar: "حذف الصفوف المكررة تمامًا" }, 15],
        [{ en: "Filled blank units with 2025 USD", ar: "تعبئة الوحدات الفارغة بالدولار 2025" }, 22582],
        [{ en: "Separated projections from history", ar: "فصل التوقعات عن البيانات الفعلية" }, 1261],
        [{ en: "Flagged totals of other powertrains", ar: "تعليم الصفوف التي هي مجموع لأنواع أخرى" }, 16969]
      ],
      test: [
        { en: "Projections never appear in an actual sales chart.", ar: "التوقعات لا تظهر أبدًا في رسم المبيعات الفعلية." },
        { en: "EV is a total, so it is never added to BEV and PHEV.", ar: "EV مجموع، فلا يُجمع مع BEV وPHEV." },
        { en: "World, region and country rows are kept apart, so nothing is counted twice.", ar: "صفوف العالم والمناطق والدول منفصلة، فلا يُحسب شيء مرتين." }
      ]
    },
    insights: [
      { value: "25%", text: { en: "of new cars sold worldwide in 2025 were electric, up 4 points in one year.", ar: "من السيارات الجديدة المبيعة عالميًا في 2025 كانت كهربائية، بزيادة 4 نقاط خلال سنة." } },
      { value: "62%", text: { en: "of global electric car sales came from China, 13M of 21M.", ar: "من مبيعات السيارات الكهربائية عالميًا جاءت من الصين، 13 مليون من أصل 21 مليون." } },
      { value: "+72%", text: { en: "growth in the Middle East and Caspian region in one year, reaching 150K cars and a 4% share.", ar: "نمو في منطقة الشرق الأوسط وبحر قزوين خلال سنة واحدة، لتصل المبيعات إلى 150 ألف سيارة وحصة 4%." } }
    ],

    recommendation: {
      en: "Build public charging ahead of demand in the Middle East and Caspian region. The region has 96 electric cars and vans per public charging point, against a world average of 11.",
      ar: "التوسع في نقاط الشحن العامة قبل زيادة الطلب في منطقة الشرق الأوسط وبحر قزوين. في المنطقة 96 سيارة ومركبة خفيفة كهربائية لكل نقطة شحن عامة، مقابل متوسط عالمي يبلغ 11."
    }
  },
  {
    id: "saudi-real-estate",
    type: "data",
    category: { en: "REAL ESTATE", ar: "قطاع العقار" },
    cardTitle: "PROPERTY DEALS",
    cardLine: { en: "SAUDI MARKET", ar: "السوق السعودي" },
    icon: "chart",
    title: { en: "Saudi Real Estate Deals", ar: "الصفقات العقارية في السعودية" },
    headline: {
      en: "Saudi property deals fell 18% year on year in Q2 2026",
      ar: "انخفضت الصفقات العقارية في السعودية 18% في الربع الثاني من 2026 مقارنة بالعام السابق"
    },
    theme: "navy",
    thumbnail: "projects/saudi-real-estate/thumb.jpg",
    dashboard: "projects/saudi-real-estate/dashboard.jpg",
    video: "",
    github: "https://github.com/inourahwahaq/saudi-real-estate-analysis",
    tools: ["Python", "Excel", "Tableau"],

    goal: {
      en: "Track how Saudi property sales moved over 18 months, where value is concentrated, and whether falling deal numbers came with falling prices.",
      ar: "تتبع حركة مبيعات العقار في السعودية خلال 18 شهرًا، وأين تتركز القيمة، وهل صاحب انخفاض عدد الصفقات انخفاض في الأسعار."
    },

    process: {
      data: { en: "Six quarterly files of Saudi property deals, from 2025 Q1 to 2026 Q2.", ar: "ستة ملفات ربعية للصفقات العقارية في السعودية، من الربع الأول 2025 إلى الربع الثاني 2026." },
      counts: [[{ en: "rows in the files", ar: "صفوف الملفات" }, 268808], [{ en: "deals after cleaning", ar: "صفقات بعد التنظيف" }, 268806]],
      clean: [
        [{ en: "Removed fully empty rows", ar: "حذف الصفوف الفارغة بالكامل" }, 2],
        [{ en: "Checked for duplicate deals", ar: "فحص الصفقات المكررة" }, 0],
        [{ en: "Converted prices and areas from text to numbers", ar: "تحويل الأسعار والمساحات من نص إلى أرقام" }, 268806],
        [{ en: "Flagged extreme prices per square metre", ar: "تعليم أسعار المتر الشاذة" }, 7267]
      ],
      test: [
        { en: "Extreme prices are flagged, not deleted: they still count in deals and value.", ar: "الأسعار الشاذة مُعلَّمة وليست محذوفة، فما زالت تُحسب في عدد الصفقات وقيمتها." },
        { en: "2,040 deals that cover several properties are left out of price per square metre, since one price covers several plots.", ar: "استُبعدت 2,040 صفقة تشمل أكثر من عقار من سعر المتر، لأن السعر الواحد يغطي عدة قطع." },
        { en: "Every deal reference is unique, so no deal is counted twice.", ar: "كل رقم صفقة فريد، فلا تُحسب صفقة مرتين." }
      ]
    },
    insights: [
      { value: "-18%", text: { en: "fewer deals in Q2 2026 than in Q2 2025, and 29% less total value.", ar: "انخفاض في عدد الصفقات في الربع الثاني 2026 مقارنة بالربع الثاني 2025، وانخفاض القيمة 29%." } },
      { value: "-74%", text: { en: "deals in Riyadh city in one year, while its residential price per m2 rose 7%.", ar: "انخفاض صفقات مدينة الرياض خلال سنة، بينما ارتفع سعر المتر السكني فيها 7%." } },
      { value: "70%", text: { en: "of total deal value over the 18 months came from the Riyadh and Makkah regions.", ar: "من إجمالي قيمة الصفقات خلال 18 شهرًا جاءت من منطقتي الرياض ومكة المكرمة." } }
    ],

    recommendation: {
      en: "Track prices by city rather than by region. The median for the Riyadh region halved because deals moved away from the city, while the city's own price rose.",
      ar: "تتبع الأسعار على مستوى المدينة بدل المنطقة. انخفض وسيط منطقة الرياض إلى النصف لأن الصفقات ابتعدت عن المدينة، بينما ارتفع سعر المدينة نفسها."
    }
  },
  {
    id: "court-sessions",
    type: "data",
    category: { en: "JUSTICE", ar: "القطاع العدلي" },
    cardTitle: "COURT SESSIONS",
    cardLine: { en: "SAUDI COURTS", ar: "المحاكم السعودية" },
    icon: "tool",
    title: { en: "Saudi Court Sessions", ar: "جلسات المحاكم في السعودية" },
    headline: {
      en: "Saudi courts held 10.7K sessions every working day from January to September 2026",
      ar: "عقدت المحاكم السعودية 10.7 ألف جلسة في كل يوم عمل من يناير إلى سبتمبر 2026"
    },
    theme: "grey",
    thumbnail: "projects/court-sessions/thumb.jpg",
    dashboard: "projects/court-sessions/dashboard.jpg",
    video: "",
    github: "https://github.com/inourahwahaq/saudi-court-sessions-sql",
    tools: ["SQL", "Tableau"],

    goal: {
      en: "Use SQL to measure court workload across 1.89 million sessions, separating real changes in daily activity from months with fewer working days.",
      ar: "استخدام SQL لقياس عبء العمل في المحاكم عبر 1.89 مليون جلسة، وفصل التغير الحقيقي في النشاط اليومي عن أثر الأشهر الأقل في أيام العمل."
    },

    process: {
      data: { en: "Nine monthly files of court sessions, January to September 2026, across 129 cities.", ar: "تسعة ملفات شهرية لجلسات المحاكم، من يناير إلى سبتمبر 2026، في 129 مدينة." },
      counts: [[{ en: "sessions in the files", ar: "جلسات في الملفات" }, 1892721], [{ en: "sessions after cleaning", ar: "جلسات بعد التنظيف" }, 1892721]],
      clean: [
        [{ en: "Checked for invalid dates", ar: "فحص التواريخ غير الصحيحة" }, 0],
        [{ en: "Checked rows lost when joining tables", ar: "فحص الصفوف المفقودة عند ربط الجداول" }, 0],
        [{ en: "Found reference numbers used twice", ar: "أرقام مرجعية مستخدمة مرتين" }, 10],
        [{ en: "Separated digital service sessions from physical courts", ar: "فصل جلسات الخدمات الرقمية عن المحاكم الحضورية" }, 56353]
      ],
      test: [
        { en: "Months are compared per working day, not by raw totals.", ar: "الأشهر تُقارن بمعدل يوم العمل، لا بالمجموع الخام." },
        { en: "March had 30.3% fewer sessions, but only 11.7% fewer per working day: it had 15 working days.", ar: "مارس فيه جلسات أقل بـ 30.3%، لكن أقل بـ 11.7% فقط لكل يوم عمل، لأنه كان 15 يوم عمل." },
        { en: "No row was lost between the raw files and the final table.", ar: "لم يُفقد أي صف بين الملفات الأصلية والجدول النهائي." }
      ]
    },
    insights: [
      { value: "+9%", text: { en: "more sessions per working day in September than in January.", ar: "زيادة في الجلسات لكل يوم عمل في سبتمبر مقارنة بيناير." } },
      { value: "55%", text: { en: "of sessions at physical courts took place in Riyadh, Jeddah and Dammam.", ar: "من جلسات المحاكم الحضورية عُقدت في الرياض وجدة والدمام." } },
      { value: "-12%", text: { en: "fall in daily sessions from February to March, against a 30% fall in the monthly total.", ar: "انخفاض في الجلسات اليومية من فبراير إلى مارس، مقابل انخفاض 30% في الإجمالي الشهري." } }
    ],

    recommendation: {
      en: "Plan court capacity on sessions per working day rather than monthly totals, which swing with the number of working days. Commercial and personal status cases ended September 15% above their average, so start with these two when reviewing capacity.",
      ar: "خطط لطاقة المحاكم على أساس الجلسات لكل يوم عمل بدل الإجمالي الشهري الذي يتغير مع عدد أيام العمل. وأنهت القضايا التجارية والأحوال الشخصية شهر سبتمبر أعلى من متوسطها بنسبة 15%، فيبدأ بهما عند مراجعة الطاقة."
    }
  },
  {
    id: "global-layoffs",
    type: "data",
    category: { en: "WORKFORCE", ar: "سوق العمل" },
    cardTitle: "GLOBAL LAYOFFS",
    cardLine: { en: "NEWS MONITOR", ar: "رصد الأخبار" },
    icon: "user",
    title: { en: "Global Company Layoffs", ar: "تسريح الموظفين في الشركات عالميًا" },
    headline: {
      en: "The US and UK made up 57% of layoffs reported in the news",
      ar: "شكلت أمريكا وبريطانيا 57% من أحداث التسريح المنشورة في الأخبار"
    },
    theme: "pink",
    thumbnail: "projects/global-layoffs/thumb.jpg",
    dashboard: "projects/global-layoffs/dashboard.jpg",
    video: "projects/global-layoffs/demo.mp4",
    github: "https://github.com/inourahwahaq/global-layoffs-monitor",
    tools: ["Python", "Excel", "Tableau"],

    goal: {
      en: "Measure where reported company layoffs concentrate and what level to expect next, after testing which findings a sample built from news reports can support.",
      ar: "قياس أين تتركز أحداث التسريح المنشورة وما المستوى المتوقع لاحقًا، بعد اختبار النتائج التي تتحملها عينة مبنية على الأخبار."
    },

    process: {
      data: { en: "A sample of 5,000 reported layoff events, out of 19,208 in the publisher's full tables.", ar: "عينة من 5,000 حدث تسريح منشور، من أصل 19,208 في جداول الناشر الكاملة." },
      counts: [[{ en: "events in the sample", ar: "أحداث في العينة" }, 5000], [{ en: "events after review", ar: "أحداث بعد المراجعة" }, 4991]],
      clean: [
        [{ en: "Reviewed rows by hand and logged each change", ar: "مراجعة يدوية مع تسجيل كل تعديل" }, 57],
        [{ en: "Unified country names", ar: "توحيد أسماء الدول" }, 32],
        [{ en: "Fixed companies linked to the wrong country", ar: "تصحيح شركات مرتبطة بدولة خاطئة" }, 16],
        [{ en: "Removed yearly recaps, sector totals and rumours", ar: "حذف الملخصات السنوية ومجاميع القطاعات والإشاعات" }, 9]
      ],
      test: [
        { en: "Checked the sample against the publisher's full tables, year by year.", ar: "قارنت العينة بجداول الناشر الكاملة سنة بسنة." },
        { en: "Tested whether the changes from one year to the next are larger than chance.", ar: "اختبرت هل التغير من سنة لسنة أكبر من الصدفة." },
        { en: "Tested the forecast against a plain average on months it had not seen.", ar: "اختبرت التوقع مقابل متوسط بسيط على أشهر لم يرها." }
      ]
    },
    insights: [
      { value: "57%", text: { en: "of reported events with a known country in the last 12 months came from the US and UK.", ar: "من الأحداث المنشورة المعروف بلدها في آخر 12 شهرًا جاءت من أمريكا وبريطانيا." } },
      { value: "9/32", text: { en: "of the largest job figures reviewed did not describe one layoff round. Removing them cut job growth from 8.4% to 2.6%.", ar: "من أكبر أرقام الوظائف التي رُوجعت لم تمثل جولة تسريح واحدة، وبعد حذفها انخفض نمو الوظائف من 8.4% إلى 2.6%." } },
      { value: "65", text: { en: "events a month expected in the sample, likely between 48 and 85. No method tested clearly beat the 12 month average.", ar: "حدثًا متوقعًا في الشهر داخل العينة، والنطاق المرجح بين 48 و85. ولم تتفوق أي طريقة مختبرة بوضوح على متوسط 12 شهرًا." } }
    ],

    recommendation: {
      en: "Use news counts as a measure of reported activity, not of all layoffs. Review the largest job figures against their source before adding them up, because a few rows can inflate a year on year change.",
      ar: "استخدام أعداد الأخبار لقياس النشاط المنشور وليس كل حالات التسريح، ومراجعة أكبر أرقام الوظائف مع مصدرها قبل جمعها، لأن صفوفًا قليلة قد تضخم التغير السنوي."
    }
  },
  {
    id: "olist-delivery-impact",
    type: "data",
    category: { en: "E-COMMERCE", ar: "التجارة الإلكترونية" },
    cardTitle: "DELIVERY",
    cardLine: { en: "AND RATINGS", ar: "والتقييمات" },
    icon: "box",
    title: { en: "Delivery and Customer Ratings", ar: "التوصيل وتقييمات العملاء" },
    headline: {
      en: "A late order is rated about 2 points lower out of 5",
      ar: "الطلب المتأخر يحصل على تقييم أقل بنقطتين تقريبًا من 5"
    },
    theme: "sky",
    thumbnail: "projects/olist-delivery-impact/thumb.jpg",
    dashboard: "projects/olist-delivery-impact/dashboard.jpg",
    video: "",
    github: "https://github.com/inourahwahaq/olist-delivery-impact",
    tools: ["SQL", "Python", "Tableau"],

    goal: {
      en: "Find where delivery delays are concentrated on a Brazilian marketplace, how much they lower customer ratings, and which improvements would have the largest effect.",
      ar: "معرفة أين يتركز تأخر التوصيل في متجر إلكتروني برازيلي، وكم يخفض تقييمات العملاء، وأي التحسينات لها أكبر أثر."
    },

    process: {
      data: { en: "Seven linked tables from an online store: orders, customers, items, reviews, products, sellers and category names.", ar: "سبعة جداول مرتبطة من متجر إلكتروني: الطلبات، والعملاء، والمنتجات المطلوبة، والتقييمات، والمنتجات، والبائعون، وأسماء الأقسام." },
      counts: [[{ en: "all orders", ar: "كل الطلبات" }, 99441], [{ en: "delivered, with a date", ar: "وصلت ولها تاريخ" }, 96470], [{ en: "in the study period", ar: "داخل فترة الدراسة" }, 96018], [{ en: "with a review", ar: "لها تقييم" }, 95376]],
      clean: [
        [{ en: "Kept one review per order: the latest", ar: "تقييم واحد لكل طلب: الأحدث" }, 95376],
        [{ en: "Kept only delivered orders with a delivery date", ar: "الطلبات الواصلة التي لها تاريخ توصيل فقط" }, 96470],
        [{ en: "Flagged reviews written before the order arrived", ar: "تعليم التقييمات المكتوبة قبل وصول الطلب" }, 4957]
      ],
      test: [
        { en: "Simple comparison: late orders score 2.02 points lower.", ar: "مقارنة مباشرة: الطلب المتأخر أقل بـ 2.02 نقطة." },
        { en: "Accounting for region, category, month, price and freight: 1.96 lower. Same seller only: 1.92.", ar: "مع ضبط المنطقة والقسم والشهر والسعر والشحن: أقل بـ 1.96. ونفس البائع فقط: 1.92." },
        { en: "Only reviews written after delivery: 0.74 lower. This shows a strong link, not proof of cause.", ar: "التقييمات المكتوبة بعد الوصول فقط: أقل بـ 0.74. هذا ارتباط قوي، وليس إثباتًا للسبب." }
      ]
    },
    insights: [
      { value: "-1.96", text: { en: "points on a 5 point rating for late orders, after accounting for region, category, month, price and freight.", ar: "نقطة من 5 ينخفض تقييم الطلب المتأخر، بعد ضبط المنطقة والقسم والشهر والسعر والشحن." } },
      { value: "50.7%", text: { en: "of late orders were in São Paulo and Rio de Janeiro. The São Paulo to Rio route alone had 1,152.", ar: "من الطلبات المتأخرة كانت في ساو باولو وريو دي جانيرو، وخط ساو باولو إلى ريو وحده فيه 1,152 طلبًا." } },
      { value: "3%", text: { en: "of customers bought more than once, so the gain from fixing delays is in satisfaction, not repeat revenue.", ar: "فقط من العملاء اشتروا أكثر من مرة، فمكسب تقليل التأخر في رضا العملاء وليس في إيراد الشراء المتكرر." } }
    ],

    recommendation: {
      en: "Start with the São Paulo to Rio route, prepare extra capacity for peak months, and test the change on part of the route before rolling it out. Measure success by late rate and low ratings.",
      ar: "البدء بخط ساو باولو إلى ريو، وتجهيز طاقة إضافية لأشهر الذروة، وتجربة التحسين على جزء من الخط قبل تعميمه، وقياس النجاح بنسبة التأخر والتقييمات المنخفضة."
    }
  }
];
