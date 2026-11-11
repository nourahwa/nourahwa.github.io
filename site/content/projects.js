/* ------------------------------------------------------------
   One block for each project. Copy a block to add a project,
   delete a block to remove one. Order here is order on the site.

   icon can be: pulse, chart, user, star, box, tool
   theme can be: green, navy, sky, grey, pink
   tools appear under the project. Keep three insights.
   Write both languages: en for English, ar for Arabic.
   github: paste the link between the quotes. While it is empty, no button shows.
   ------------------------------------------------------------ */
window.PROJECTS = [
  {
    id: "ev-global-sales",
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
