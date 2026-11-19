/* ============================================================================
   GeoDev Doctor Upgrade Patch v1.0 (geo-doctor-upgrade.js)
   تطوير شامل بناءً على الملاحظات الأكاديمية:
   1. بوابة المنصات البحثية العالمية وطرق استخدامها خطوة بخطوة.
   2. مكتبة الكتب الجغرافية المصنفة (عربي/إنجليزي) + الباحث الذكي للكتب.
   3. مسارات تدريبية للمحاضرين والبرامج مع مشغل مدمج وملفات تدريب (Datasets).
   4. مختبر الأكواد الجغرافي المطور (Text-to-GIS Code + أمثلة بالفيديو والخطوات).
   5. استوديو الباحث الأكاديمي في قسم الجيوماتكس (بديل الشات التقليدي).
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEODoctorUpgrade) return;
  window.GEODoctorUpgrade = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

  /* ==========================================================================
     1. قواعد البيانات المضافة (المنصات البحثية، الكتب، المسارات، الأكواد)
     ========================================================================== */

  // أ) دليل المنصات البحثية ومصادر البيانات الجغرافية مع طريقة الاستخدام
  const RESEARCH_PLATFORMS = [
    {
      id: "ekb",
      name: "بنك المعرفة المصري (EKB)",
      category: "قواعد بيانات أكاديمية",
      lang: "عربي / إنجليزي",
      access: "مجاني بالبريد الجامعي أو الرقم القومي داخل مصر",
      url: "https://www.ekb.eg/",
      desc: "أكبر مكتبة رقمية تتيح الوصول المجاني الكامل لأبحاث وكتب Springer و Elsevier (ScienceDirect) و Wiley وكتب دار المنظومة بدون رسوم.",
      steps: [
        "ادخل على موقع EKB واضغط على 'تسجيل' ثم اختر بوابة (الباحثين والجامعات) وسجل بإيميلك الجامعي (.edu.eg) لتفعيل الصلاحيات الكاملة.",
        "بعد الدخول، اضغط على القائمة واختر 'مصادرنا' ثم 'كل المصادر الإنجليزية' أو 'مصادرنا العربية'.",
        "للبحث عن أبحاث GIS عالمية مدفوعة وتحميلها مجاناً: افتح أيقونة ScienceDirect أو Springer Nature من داخل صفحة مصادر بنك المعرفة.",
        "للبحث عن رسائل ماجستير ودكتوراه عربية في الجغرافيا: افتح 'دار المنظومة (EduSearch)' من المصادر العربية واكتب عنوان بحثك."
      ]
    },
    {
      id: "usgs",
      name: "USGS EarthExplorer",
      category: "مرئيات فضائية وبيانات ارتفاعات",
      lang: "English",
      access: "مجاني (يتطلب حساب مجاني)",
      url: "https://earthexplorer.usgs.gov/",
      desc: "المنصة الرسمية لهيئة المسح الجيولوجي الأمريكية لتحميل مرئيات Landsat (من 1 إلى 9) ونماذج الارتفاعات الرقمية SRTM DEM مجاناً.",
      steps: [
        "أنشئ حساباً مجانياً عبر زر Login في أعلى اليمين (مطلوب لتفعيل أزرار التحميل).",
        "في تبويب Search Criteria: حدد منطقة الدراسة برسم مضلع على الخريطة أو برفع ملف Shapefile (مضغوط بامتداد .zip) أو KML.",
        "حدد الفترة الزمنية (Date Range) ونسبة السحب (Cloud Cover) بحيث تكون أقل من 10% في تبويب Cloud Cover.",
        "انتقل لتبويب Data Sets: للمرئيات اختر (Landsat -> Landsat Collection 2 Level-2)، وللارتفاعات اختر (Digital Elevation -> SRTM -> SRTM 1 Arc-Second Global).",
        "اضغط Results ثم اضغط على أيقونة التحميل (Download Options) بجانب المرئية المناسبة وحمّل ملف GeoTIFF."
      ]
    },
    {
      id: "copernicus",
      name: "Copernicus Data Space Ecosystem",
      category: "مرئيات فضائية عالية الدقة",
      lang: "English",
      access: "مجاني بالكامل",
      url: "https://dataspace.copernicus.eu/",
      desc: "المنصة الأوروبية المحدثة (البديلة لـ SciHub القديم) لتحميل مرئيات Sentinel-2 بدقة 10 أمتار ومرئيات الرادار Sentinel-1 SAR.",
      steps: [
        "اضغط على Open Browser من الصفحة الرئيسية ثم سجل دخولك بحساب مجاني.",
        "استخدم أداة البحث أو ارسم مستطيلاً (Area of Interest) حول منطقة الدراسة على الخريطة.",
        "من تبويب Search اختر القمر Sentinel-2 وفعل خيار L2A (المرئيات المصححة جوياً الجاهزة للتحليل مباشرة).",
        "حدد نسبة الغيوم القصوى والتاريخ، ثم اضغط Search واستعرض المرئية مباشرة على المتصفح قبل تحميلها."
      ]
    },
    {
      id: "mandumah",
      name: "دار المنظومة (المنظومة الجامعية)",
      category: "رسائل جامعية وأبحاث عربية",
      lang: "عربي",
      access: "متاح مجاناً عبر بنك المعرفة المصري أو حساب الجامعة",
      url: "https://search.mandumah.com/",
      desc: "أضخم قاعدة بيانات عربية تضم آلاف رسائل الماجستير والدكتوراه والدوريات العلمية المحكمة في الجغرافيا الطبيعية والبشرية ونظم المعلومات.",
      steps: [
        "ادخل إلى دار المنظومة من خلال حسابك في بنك المعرفة المصري (EKB) لضمان فتح النص الكامل (Full Text PDF).",
        "استخدم 'البحث المتقدم' واكتب الكلمات المفتاحية (مثل: الجيومورفولوجيا، التوسع العمراني، نظم المعلومات الجغرافية).",
        "يمكنك فلترة النتائج لاختيار 'الرسائل الجامعية فقط' لمعرفة أحدث المناهج العلمية المطبقة في الجامعات العربية."
      ]
    },
    {
      id: "scholar",
      name: "الباحث العلمي Google Scholar",
      category: "محرك بحث أكاديمي شامل",
      lang: "متعدد اللغات",
      access: "مجاني",
      url: "https://scholar.google.com/",
      desc: "أقوى محرك للوصول إلى الأوراق البحثية، الكتب الأكاديمية، والاقتباسات المعتمدة عالمياً في كافة التخصصات.",
      steps: [
        "استخدم علامات التنصيص للبحث عن مصطلح دقيق مثل: \"Spatial Analysis\" AND \"Urban Sprawl\".",
        "من القائمة الجانبية، اختر 'منذ 2022' أو 'منذ 2025' للحصول على أحدث الدراسات العلمية لمراجعتها في الإطار النظري.",
        "اضغط على علامة الاقتباس (Cite / اقتباس) أسفل أي بحث لنسخ التوثيق جاهزاً بنظام APA لوضعه في قائمة مراجعك فوراً.",
        "الروابط الموجودة على اليسار بصيغة [PDF] تعني أن البحث متاح للتحميل المباشر مجاناً."
      ]
    },
    {
      id: "sciencedirect",
      name: "ScienceDirect & SpringerLink",
      category: "دوريات عالمية محكمة (Q1/Q2)",
      lang: "English",
      access: "الأبحاث المفتوحة مجانية + الكل مجاني عبر الإيميل الجامعي/EKB",
      url: "https://www.sciencedirect.com/",
      desc: "أهم منصتين لنشر وتحميل الأبحاث العالمية والكتب المرجعية في الاستشعار عن بعد، النمذجة المكانية، والتغيرات المناخية.",
      steps: [
        "ابحث بالمصطلحات الإنجليزية التخصصية مثل: (Remote Sensing, Land Use Change, Hydrological Modeling, GIS).",
        "فعل فلتر 'Open Access' على اليسار إذا كنت تبحث بدون حساب جامعي لتحميل الأبحاث والكتب المفتوحة مجاناً.",
        "إذا كنت تملك إيميلاً جامعياً، سجل الدخول عبر خيار (Sign in via your institution) لتحميل الكتب الكاملة فصلاً بفصل."
      ]
    }
  ];

  // ب) مكتبة الكتب والمراجع المصنفة (عربي وإنجليزي في كافة فروع الجغرافيا)
  const GEO_BOOKS = [
    {
      title: "نظم المعلومات الجغرافية: الأسس والتطبيقات",
      author: "أ.د. جمعة محمد داود",
      lang: "ar",
      cat: "gis",
      level: "مبتدئ إلى متقدم",
      desc: "مرجع عربي أساسي شامل يشرح مفاهيم نظم المعلومات الجغرافية، قواعد البيانات المكانية، والتحليل المكاني بأسلوب تطبيقي مبسط.",
      searchQuery: "كتاب نظم المعلومات الجغرافية جمعة داود pdf"
    },
    {
      title: "التحليل المكاني في نظم المعلومات الجغرافية",
      author: "أ.د. جمعة محمد داود",
      lang: "ar",
      cat: "gis",
      level: "متقدم / باحثين",
      desc: "يركز على أدوات التحليل الإحصائي المكاني، الملاءمة المكانية، تحليل الشبكات، والنمذجة الهيدرولوجية داخل بيئة ArcGIS.",
      searchQuery: "كتاب التحليل المكاني في نظم المعلومات الجغرافية جمعة داود pdf"
    },
    {
      title: "مبادئ المساحة المستوية والجيوديسية والـ GPS",
      author: "مراجع الهندسة المساحية العربية",
      lang: "ar",
      cat: "surveying",
      level: "طلاب ومهندسين",
      desc: "يغطي أعمال الميزانية، الترافرسات، حساب الكميات، نظم الإحداثيات، والرفع المساحي باستخدام المحطة الشاملة Total Station والـ GNSS.",
      searchQuery: "كتاب المساحة المستوية والجيوديسية جمعة داود pdf"
    },
    {
      title: "أسس الاستشعار عن بعد ومعالجة المرئيات الفضائية",
      author: "د. محمد الخزامي عزيز / مراجع الاستشعار",
      lang: "ar",
      cat: "rs",
      level: "جامعي / باحثين",
      desc: "يتناول الخصائص الطيفية، الأقمار الصناعية، التصحيح الراديومتري والهندسي، والتصنيف الموجه وغير الموجه للمرئيات.",
      searchQuery: "كتاب الاستشعار عن بعد ومعالجة المرئيات الفضائية pdf"
    },
    {
      title: "الجغرافيا الطبيعية والجيومورفولوجيا التطبيقية",
      author: "أ.د. جودة حسنين جودة / مراجع الجغرافيا الطبيعية",
      lang: "ar",
      cat: "physical",
      level: "شامل",
      desc: "دراسة أشكال سطح الأرض، العمليات المورفوديناميكية، المناخ، الهيدرولوجيا، وتطبيقاتها في التنمية العمرانية والبيئية.",
      searchQuery: "كتب الجغرافيا الطبيعية والجيومورفولوجيا جودة حسنين pdf"
    },
    {
      title: "جغرافية العمران والسكان والتخطيط الإقليمي",
      author: "أ.د. فتحي مصيلحي / مراجع الجغرافيا البشرية",
      lang: "ar",
      cat: "human",
      level: "جامعي / دراسات عليا",
      desc: "منهجيات دراسة النمو السكاني، الهجرة، التركيب الوظيفي للمدن، التخطيط الإقليمي، واستخدامات الأرض الحضرية والريفية.",
      searchQuery: "كتاب جغرافية العمران والسكان والتخطيط الإقليمي pdf"
    },
    {
      title: "Geographic Information Systems and Science (Longley et al.)",
      author: "Paul A. Longley, Michael F. Goodchild",
      lang: "en",
      cat: "gis",
      level: "Academic / Reference",
      desc: "المرجع الأكاديمي الأول عالمياً في علوم المعلومات الجغرافية (GIScience) والنمذجة المكانية لطلاب الدراسات العليا والباحثين.",
      searchQuery: "Geographic Information Systems and Science Longley Goodchild pdf"
    },
    {
      title: "Remote Sensing and Image Interpretation (Lillesand & Kiefer)",
      author: "Thomas Lillesand, Ralph W. Kiefer",
      lang: "en",
      cat: "rs",
      level: "Academic / Reference",
      desc: "الكتاب الأشهر عالمياً في فيزياء الاستشعار عن بعد، تفسير المرئيات الفضائية، التصوير الجوي، والرادار وبيانات LiDAR.",
      searchQuery: "Remote Sensing and Image Interpretation Lillesand Kiefer pdf"
    },
    {
      title: "Python Scripting for ArcGIS Pro (Esri Press)",
      author: "Paul A. Zandbergen",
      lang: "en",
      cat: "code",
      level: "Intermediate / Pro",
      desc: "دليل عملي شامل لأتمتة المهام الجغرافية وبناء الأدوات المخصصة (Script Tools) داخل ArcGIS Pro باستخدام مكتبة ArcPy.",
      searchQuery: "Python Scripting for ArcGIS Pro Zandbergen pdf"
    },
    {
      title: "Cloud-Based Remote Sensing with Google Earth Engine",
      author: "Jeffrey A. Cardille et al. (Open Access - Springer)",
      lang: "en",
      cat: "code",
      level: "Beginner to Advanced",
      desc: "كتاب مجاني مفتوح المصدر بالكامل من Springer يشرح برمجة Google Earth Engine من الصفر حتى التطبيقات البحثية المتقدمة.",
      searchQuery: "https://www.eefabook.org/"
    }
  ];

  // ج) مسارات البرامج المتخصصة والمحاضرين المعتمدين (بديل روابط اليوتيوب العشوائية)
  const PRO_TRACKS = [
    {
      id: "track-arcgis-pro",
      title: "المسار الشامل لاحتراف ArcGIS Pro والتحليل المكاني",
      instructor: "نخبة محاضري الجيوماتكس (محتوى تطبيقي منظم)",
      software: "ArcGIS Pro 3.x",
      level: "من المبتدئ إلى مستوى الباحث",
      badge: "مسار متكامل + ملفات تدريب",
      lessonsCount: "4 وحدات عملية",
      datasetName: "Minya_GIS_Training_Data.geojson",
      embedUrl: "https://www.youtube.com/embed?listType=search&list=ArcGIS+Pro+Arabic+Course+Full",
      syllabus: [
        "الوحدة 1: واجهة ArcGIS Pro، إنشاء Geodatabase، وإدارة نظم الإحداثيات (UTM & ETM).",
        "الوحدة 2: الإرجاع الجغرافي (Georeferencing)، الترقيم (Digitizing)، وبناء الجداول الوصفية (Domains & Subtypes).",
        "الوحدة 3: أدوات التحليل المكاني (Buffer, Clip, Intersect, Spatial Join) والنمذجة باستخدام ModelBuilder.",
        "الوحدة 4: الإخراج الفني للخرائط الأكاديمية (Layout, Map Series) بمعايير النشر العلمي."
      ]
    },
    {
      id: "track-qgis-open",
      title: "دبلومة QGIS والبرمجة المكانية المفتوحة المصدر",
      instructor: "Spatial Thoughts & المعتمدة",
      software: "QGIS LTR + PyQGIS",
      level: "متوسط إلى متقدم",
      badge: "معتمد أكاديمياً",
      lessonsCount: "5 وحدات عملية",
      datasetName: "Egypt_Admin_Boundaries_Sample.geojson",
      embedUrl: "https://www.youtube.com/embed?listType=search&list=QGIS+Arabic+Tutorial+Course",
      syllabus: [
        "الوحدة 1: استيراد البيانات المتعددة، التعامل مع خدمات الخرائط (WMS/WFS)، وتنسيق الطبقات المتقدم.",
        "الوحدة 2: المعالجة المكانية المتقدمة وإدارة قواعد بيانات PostGIS.",
        "الوحدة 3: أتمتة الخرائط باستخدام Atlas وأدوات Processing Modeler.",
        "الوحدة 4: مدخل عملي لكتابة سكربتات PyQGIS داخل بيئة البرنامج."
      ]
    },
    {
      id: "track-rs-gee",
      title: "تحليل المرئيات الفضائية بـ ENVI و Google Earth Engine",
      instructor: "مسار الاستشعار عن بعد للباحثين",
      software: "ENVI + GEE Code Editor",
      level: "باحثين ودراسات عليا",
      badge: "خاص بالبحث العلمي",
      lessonsCount: "4 وحدات تطبيقية",
      datasetName: "Spectral_Indices_Formulas_Guide.csv",
      embedUrl: "https://www.youtube.com/embed?listType=search&list=Google+Earth+Engine+Arabic+GIS",
      syllabus: [
        "الوحدة 1: التصحيح الجوي والراديومتري ودمج النطاقات الطيفية (Layer Stacking & Pan-Sharpening).",
        "الوحدة 2: حساب المؤشرات الطيفية (NDVI, NDWI, NDBI, LST لدرجة حرارة السطح).",
        "الوحدة 3: التصنيف المراقب (Supervised Classification) وتقييم دقة التصنيف (Kappa & Overall Accuracy).",
        "الوحدة 4: معالجة السلاسل الزمنية الضخمة سحابياً على Google Earth Engine بدون تحميل المرئيات."
      ]
    },
    {
      id: "track-survey-civil",
      title: "المكتب الفني المساحي: AutoCAD & Civil 3D",
      instructor: "مسار المهندس المساحي التنفيذي",
      software: "AutoCAD 2025 + Civil 3D",
      level: "مهندسين وطلاب مساحة",
      badge: "تطبيقي لسوق العمل",
      lessonsCount: "4 وحدات هندسية",
      datasetName: "Survey_Points_PENZ_Sample.csv",
      embedUrl: "https://www.youtube.com/embed?listType=search&list=Civil+3D+Surveying+Arabic+Course",
      syllabus: [
        "الوحدة 1: استيراد نقاط الرفع المساحي من Total Station/GPS وإنشاء مجموعات النقاط (Point Groups).",
        "الوحدة 2: بناء الأسطح الطبوغرافية (TIN Surfaces) واستخراج خطوط الكنتور والمناسيب.",
        "الوحدة 3: حساب كميات الحفر والردم (Cut & Fill Volumes) وإخراج جداول الكميات المعتمدة.",
        "الوحدة 4: تصميم المسارات الأفقية والقطاعات الطولية والعرضية (Alignments, Profiles, Corridors)."
      ]
    }
  ];

  // د) مكتبة الأكواد الجغرافية المشروحة (أمثلة جاهزة + خطوات التشغيل داخل البرنامج)
  const GIS_CODE_TEMPLATES = [
    {
      id: "arcpy-clip",
      title: "قص جميع الطبقات دفعة واحدة على حدود منطقة الدراسة",
      env: "ArcPy (ArcGIS Pro)",
      lang: "python",
      desc: "يقوم هذا الكود بالمرور تلقائياً على كل طبقات الـ Feature Classes داخل قاعدة البيانات وقصها (Clip) على حدود منطقة الدراسة في ثوانٍ بدلاً من تكرار الأداة يدوياً.",
      whereToRun: [
        "افتح برنامج ArcGIS Pro وافتح مشروعك.",
        "من شريط التبويبات العلوي اضغط على تبويب (Analysis) ثم اضغط على السهم أسفل أيقونة (Python) واختر (Python Window).",
        "عدّل مسار قاعدة البيانات (workspace) ومسار طبقة الحدود (clip_boundary) في أول سطرين من الكود.",
        "الصق الكود في نافذة Python واضغط Enter مرتين ليبدأ القص التلقائي لجميع الطبقات."
      ],
      code: "# -*- coding: utf-8 -*-\n\"\"\"\n\u0642\u0635 \u0643\u0644 \u0637\u0628\u0642\u0627\u062a \u0627\u0644\u0640 Feature Classes \u062f\u0627\u062e\u0644 File Geodatabase \u0639\u0644\u0649 \u062d\u062f\u0648\u062f \u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u062f\u0631\u0627\u0633\u0629.\n\u0627\u0644\u0645\u062a\u0637\u0644\u0628\u0627\u062a: ArcGIS Pro \u0645\u0639 ArcPy (\u062a\u0631\u062e\u064a\u0635 Analysis Extension \u063a\u064a\u0631 \u0645\u0637\u0644\u0648\u0628 \u0644\u0644\u0640 Clip).\n\u0627\u0644\u062a\u0634\u063a\u064a\u0644: \u0645\u0646 \u0646\u0627\u0641\u0630\u0629 Python \u062f\u0627\u062e\u0644 ArcGIS Pro\u060c \u0623\u0648 \u0643\u0645\u0644\u0641 .py \u0645\u0646 Python Command Prompt \u0627\u0644\u062e\u0627\u0635 \u0628\u0640 ArcGIS Pro.\n\"\"\"\nimport os\nimport arcpy\n\n# ===== \u0625\u0639\u062f\u0627\u062f\u0627\u062a: \u0639\u062f\u0651\u0644 \u0647\u0630\u0647 \u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062a \u0641\u0642\u0637 =====\nINPUT_GDB = r\"C:\\GIS_Project\\Input_Data.gdb\"\nBOUNDARY = r\"C:\\GIS_Project\\Study_Area_Boundary.shp\"\nOUTPUT_GDB = r\"C:\\GIS_Project\\Clipped_Output.gdb\"\nSUFFIX = \"_Clip\"\n# =========================================\n\n\ndef ensure_file_gdb(gdb_path):\n    \"\"\"\u064a\u0646\u0634\u0626 \u0627\u0644\u0640 File Geodatabase \u0644\u0648 \u0645\u0634 \u0645\u0648\u062c\u0648\u062f.\"\"\"\n    if arcpy.Exists(gdb_path):\n        return\n    folder, name = os.path.split(gdb_path)\n    if not os.path.isdir(folder):\n        raise FileNotFoundError(f\"\u0627\u0644\u0645\u062c\u0644\u062f \u0627\u0644\u0623\u0628 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f: {folder}\")\n    arcpy.management.CreateFileGDB(folder, name)\n\n\ndef collect_feature_classes(gdb_path):\n    \"\"\"\u064a\u0631\u062c\u0639 \u0642\u0627\u0626\u0645\u0629 (\u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0643\u0627\u0645\u0644\u060c \u0627\u0644\u0627\u0633\u0645) \u0644\u0643\u0644 Feature Class \u062f\u0627\u062e\u0644 \u0627\u0644\u0640 GDB \u0628\u0645\u0627 \u0641\u064a\u0647\u0627 \u0627\u0644\u0640 Feature Datasets.\"\"\"\n    items = []\n    arcpy.env.workspace = gdb_path\n    for fc in arcpy.ListFeatureClasses() or []:\n        items.append((os.path.join(gdb_path, fc), fc))\n    for ds in arcpy.ListDatasets(feature_type=\"Feature\") or []:\n        for fc in arcpy.ListFeatureClasses(feature_dataset=ds) or []:\n            items.append((os.path.join(gdb_path, ds, fc), fc))\n    return items\n\n\ndef main():\n    for label, path in ((\"INPUT_GDB\", INPUT_GDB), (\"BOUNDARY\", BOUNDARY)):\n        if not arcpy.Exists(path):\n            raise FileNotFoundError(f\"{label} \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f: {path}\")\n\n    ensure_file_gdb(OUTPUT_GDB)\n    arcpy.env.overwriteOutput = True\n\n    layers = collect_feature_classes(INPUT_GDB)\n    if not layers:\n        print(\"\u26a0\ufe0f \u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0623\u064a Feature Class \u062f\u0627\u062e\u0644 \u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a.\")\n        return\n\n    ok, failed = 0, []\n    for full_path, name in layers:\n        out_path = os.path.join(OUTPUT_GDB, f\"{name}{SUFFIX}\")\n        try:\n            arcpy.analysis.Clip(full_path, BOUNDARY, out_path)\n            ok += 1\n            print(f\"\u2705 \u062a\u0645 \u0642\u0635 \u0627\u0644\u0637\u0628\u0642\u0629: {name}\")\n        except arcpy.ExecuteError:\n            failed.append((name, arcpy.GetMessages(2)))\n            print(f\"\u274c \u0641\u0634\u0644 \u0642\u0635 \u0627\u0644\u0637\u0628\u0642\u0629: {name}\")\n\n    print(f\"\\n\u0627\u0644\u0646\u062a\u064a\u062c\u0629: {ok} \u0646\u062c\u062d\u062a \u0645\u0646 \u0623\u0635\u0644 {len(layers)}\")\n    for name, msg in failed:\n        print(f\"  - {name}: {msg}\")\n\n\nif __name__ == \"__main__\":\n    main()\n"
    },
    {
      id: "gee-ndvi",
      title: "حساب مؤشر الغطاء النباتي NDVI من Sentinel-2 وتصديره كـ GeoTIFF",
      env: "Google Earth Engine (JavaScript)",
      lang: "js",
      desc: "يستدعي مرئيات Sentinel-2 لمنطقة الدراسة، يفلتر السحب، يحسب متوسط مؤشر الغطاء النباتي NDVI، ويعرضه على الخريطة مع إمكانية تحميله لبرنامج ArcGIS أو QGIS.",
      whereToRun: [
        "افتح منصة Google Earth Engine عبر الرابط: code.earthengine.google.com.",
        "باستخدام أداة المضلع (Draw a shape) في أعلى يسار الخريطة، ارسم حدود منطقة دراستك (ستظهر باسم geometry تلقائياً).",
        "الصق الكود في المحرر الأوسط (Code Editor) واضغط زر (Run) في الأعلى.",
        "ستظهر خريطة الـ NDVI فوراً، ولتحميلها افتح تبويب (Tasks) على اليمين واضغط Run بجانب Export_NDVI_Map لحفظها على Google Drive بصيغة GeoTIFF."
      ],
      code: "// ============================================================\n// \u0645\u0624\u0634\u0631 \u0627\u0644\u063a\u0637\u0627\u0621 \u0627\u0644\u0646\u0628\u0627\u062a\u064a NDVI \u0645\u0646 Sentinel-2 \u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u062f\u0631\u0627\u0633\u0629\n// \u0627\u0644\u062a\u0634\u063a\u064a\u0644: \u0627\u0641\u062a\u062d code.earthengine.google.com \u0648\u0627\u0644\u0635\u0642 \u0627\u0644\u0643\u0648\u062f \u0641\u064a Code Editor \u0648\u0627\u0636\u063a\u0637 Run.\n// \u0627\u0631\u0633\u0645 \u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u062f\u0631\u0627\u0633\u0629 \u0628\u0623\u062f\u0627\u0629 \u0627\u0644\u0645\u0636\u0644\u0639 (Draw a shape) \u0644\u062a\u0638\u0647\u0631 \u0628\u0627\u0633\u0645 geometry\u060c\n// \u0623\u0648 \u0633\u064a\u064f\u0633\u062a\u062e\u062f\u0645 \u0627\u0644\u0625\u062d\u062f\u0627\u062b\u064a \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a \u0628\u0627\u0644\u0623\u0633\u0641\u0644 (\u0639\u062f\u0651\u0644\u0647 \u0644\u0645\u0646\u0637\u0642\u062a\u0643).\n// ============================================================\n\n// ===== \u0625\u0639\u062f\u0627\u062f\u0627\u062a: \u0639\u062f\u0651\u0644 \u0647\u0630\u0647 \u0627\u0644\u0642\u064a\u0645 \u0641\u0642\u0637 =====\nvar START_DATE = '2025-01-01';   // \u0628\u062f\u0627\u064a\u0629 \u0641\u062a\u0631\u0629 \u0627\u0644\u0645\u0631\u0626\u064a\u0627\u062a (YYYY-MM-DD)\nvar END_DATE   = '2025-12-31';   // \u0646\u0647\u0627\u064a\u0629 \u0627\u0644\u0641\u062a\u0631\u0629\nvar MAX_CLOUD  = 10;             // \u0623\u0642\u0635\u0649 \u0646\u0633\u0628\u0629 \u0633\u062d\u0628 \u0645\u0633\u0645\u0648\u062d \u0628\u0647\u0627 %\nvar EXPORT_SCALE = 10;           // \u062f\u0642\u0629 \u0627\u0644\u062a\u0635\u062f\u064a\u0631 \u0628\u0627\u0644\u0645\u062a\u0631 (Sentinel-2 = 10 \u0645 \u0644\u0644\u0646\u0637\u0627\u0642\u0627\u062a B4 \u0648B8)\nvar EXPORT_NAME  = 'NDVI_Study_Area';\n// ========================================\n\n// 1) \u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u062f\u0631\u0627\u0633\u0629\nvar roi = (typeof geometry !== 'undefined')\n  ? geometry\n  : ee.Geometry.Point([30.7503, 28.1099]).buffer(10000);\n\n// 2) \u0645\u0631\u0626\u064a\u0627\u062a Sentinel-2 (\u0633\u0637\u062d \u0645\u064f\u0635\u062d\u0651\u062d) \u0645\u0639 \u0641\u0644\u062a\u0631 \u0627\u0644\u062d\u062f\u0648\u062f \u0648\u0627\u0644\u062a\u0627\u0631\u064a\u062e \u0648\u0627\u0644\u0633\u062d\u0628\nvar s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')\n  .filterBounds(roi)\n  .filterDate(START_DATE, END_DATE)\n  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', MAX_CLOUD));\n\n// \u062a\u0646\u0628\u064a\u0647 \u0644\u0648 \u0645\u0641\u064a\u0634 \u0645\u0631\u0626\u064a\u0627\u062a (\u0628\u064a\u062d\u0635\u0644 \u063a\u0627\u0644\u0628\u0627\u064b \u0644\u0648 \u0627\u0644\u0641\u062a\u0631\u0629 \u0623\u0648 \u0627\u0644\u0633\u062d\u0628 \u0645\u0642\u064a\u0651\u062f\u064a\u0646 \u0623\u0643\u062a\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645)\ns2.size().evaluate(function (n) {\n  if (n === 0) {\n    print('\u26a0\ufe0f \u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0631\u0626\u064a\u0627\u062a \u0628\u0647\u0630\u0647 \u0627\u0644\u0634\u0631\u0648\u0637. \u062c\u0631\u0651\u0628 \u0641\u062a\u0631\u0629 \u0623\u0648\u0633\u0639 \u0623\u0648 \u0631\u0641\u0639 MAX_CLOUD.');\n  } else {\n    print('\u0639\u062f\u062f \u0627\u0644\u0645\u0631\u0626\u064a\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u0629: ' + n);\n  }\n});\n\n// 3) \u0645\u0631\u0643\u0651\u0628 \u0648\u0633\u064a\u0637 \u062b\u0645 \u062d\u0633\u0627\u0628 NDVI = (B8 - B4) / (B8 + B4)\n//    B8 = Near Infrared\u060c B4 = Red \u0641\u064a Sentinel-2\nvar composite = s2.median().clip(roi);\nvar ndvi = composite.normalizedDifference(['B8', 'B4']).rename('NDVI');\n\n// 4) \u0627\u0644\u0639\u0631\u0636 \u0639\u0644\u0649 \u0627\u0644\u062e\u0631\u064a\u0637\u0629\nMap.centerObject(roi, 11);\nMap.addLayer(ndvi,\n  {min: -0.1, max: 0.8, palette: ['blue', 'white', 'yellow', 'green', 'darkgreen']},\n  'NDVI');\n\n// 5) \u0627\u0644\u062a\u0635\u062f\u064a\u0631 \u0625\u0644\u0649 Google Drive (\u0627\u0641\u062a\u062d \u062a\u0628\u0648\u064a\u0628 Tasks \u0648\u0627\u0636\u063a\u0637 Run \u0628\u062c\u0627\u0646\u0628 \u0627\u0644\u0645\u0647\u0645\u0629)\nExport.image.toDrive({\n  image: ndvi,\n  description: EXPORT_NAME,\n  folder: 'GEE_Exports',\n  region: roi,\n  scale: EXPORT_SCALE,\n  maxPixels: 1e13\n});\n"
    },
    {
      id: "pyqgis-area",
      title: "حساب المساحات بالمتر المربع والفدان تلقائياً في جدول الطبقة",
      env: "PyQGIS (QGIS Python)",
      lang: "python",
      desc: "يقوم بإنشاء حقل جديد باسم Area_Feddan في الطبقة المحددة داخل برنامج QGIS وحساب مساحة كل مضلع بالفدان تلقائياً.",
      whereToRun: [
        "افتح برنامج QGIS وحدد (انقر على) طبقة المضلعات في لوحة الطبقات (Layers Panel).",
        "من القائمة العلوية اختر (Plugins) ثم (Python Console) أو اضغط Ctrl+Alt+P.",
        "اضغط على أيقونة المفكرة (Show Editor) داخل نافذة البايثون، والصق الكود ثم اضغط زر التشغيل الأخضر (Run Script).",
        "افتح جدول البيانات الوصفية (Attribute Table) للطبقة ستجد حقل الفدان محسوباً وجاهزاً."
      ],
      code: "# -*- coding: utf-8 -*-\n# ============================================================\n# \u062d\u0633\u0627\u0628 \u0645\u0633\u0627\u062d\u0629 \u0643\u0644 \u0645\u0636\u0644\u0639 \u0628\u0627\u0644\u0641\u062f\u0627\u0646 \u0641\u064a \u0627\u0644\u0637\u0628\u0642\u0629 \u0627\u0644\u0646\u0634\u0637\u0629 (QGIS Python Console)\n# \u0627\u0644\u062a\u0634\u063a\u064a\u0644: QGIS > Plugins > Python Console > \u0627\u0644\u0635\u0642 \u0627\u0644\u0643\u0648\u062f > Enter\n# \u0645\u0644\u0627\u062d\u0638\u0629 \u0645\u0647\u0645\u0629: \u0627\u0644\u0645\u0633\u0627\u062d\u0629 \u0628\u062a\u062a\u062d\u0633\u0628 \u0639\u0644\u0649 \u0627\u0644\u0625\u0647\u0644\u064a\u0644\u062c \u0627\u0644\u0645\u0631\u062c\u0639\u064a (ellipsoidal)\u060c \u0648\u062f\u0647 \u0635\u062d \u062d\u062a\u0649 \u0644\u0648\n# \u0627\u0644\u0637\u0628\u0642\u0629 \u0628\u0625\u062d\u062f\u0627\u062b\u064a\u0627\u062a \u062c\u063a\u0631\u0627\u0641\u064a\u0629 (\u062f\u0631\u062c\u0627\u062a)\u060c \u0644\u0623\u0646 \u062d\u0633\u0627\u0628 \u0627\u0644\u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u0645\u0633\u062a\u0648\u064a \u0628\u0627\u0644\u062f\u0631\u062c\u0627\u062a \u0628\u064a\u0637\u0644\u0639 \u0646\u062a\u064a\u062c\u0629 \u063a\u0644\u0637.\n# ============================================================\nfrom qgis.core import QgsDistanceArea, QgsField, QgsProject, QgsWkbTypes\nfrom qgis.PyQt.QtCore import QVariant\nfrom qgis.utils import iface\n\nFIELD_NAME = \"Area_Fed\"\nM2_PER_FEDDAN = 4200.833  # 1 \u0641\u062f\u0627\u0646 = 4200.833 \u0645\u00b2\nWGS84_ELLIPSOID = \"EPSG:7030\"\n\n\ndef build_distance_area(layer):\n    \"\"\"\u064a\u0646\u0634\u0626 \u062d\u0627\u0633\u0628\u0629 \u0645\u0633\u0627\u062d\u0627\u062a \u0628\u0627\u0644\u0625\u0647\u0644\u064a\u0644\u062c \u0627\u0644\u0645\u0631\u062c\u0639\u064a \u0644\u0644\u0645\u0634\u0631\u0648\u0639 (\u0623\u0648 WGS84 \u0644\u0648 \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0645\u0634 \u0645\u0639\u0631\u0651\u0641).\"\"\"\n    da = QgsDistanceArea()\n    da.setSourceCrs(layer.crs(), QgsProject.instance().transformContext())\n    ellipsoid = QgsProject.instance().ellipsoid()\n    if not ellipsoid or ellipsoid == \"NONE\":\n        ellipsoid = WGS84_ELLIPSOID\n    da.setEllipsoid(ellipsoid)\n    return da\n\n\ndef main():\n    layer = iface.activeLayer()\n    if layer is None or layer.geometryType() != QgsWkbTypes.PolygonGeometry:\n        print(\"\u26a0\ufe0f \u062d\u062f\u0651\u062f \u0637\u0628\u0642\u0629 \u0645\u0636\u0644\u0639\u0627\u062a (Polygon) \u0623\u0648\u0644\u0627\u064b.\")\n        return\n\n    if not layer.startEditing():\n        print(\"\u26a0\ufe0f \u062a\u0639\u0630\u0651\u0631 \u062a\u0641\u0639\u064a\u0644 \u0648\u0636\u0639 \u0627\u0644\u062a\u0639\u062f\u064a\u0644. \u062a\u0623\u0643\u062f \u0623\u0646 \u0627\u0644\u0637\u0628\u0642\u0629 \u0644\u064a\u0633\u062a \u0644\u0644\u0642\u0631\u0627\u0621\u0629 \u0641\u0642\u0637.\")\n        return\n\n    try:\n        if layer.fields().indexFromName(FIELD_NAME) == -1:\n            layer.addAttribute(QgsField(FIELD_NAME, QVariant.Double, \"double\", 20, 4))\n            layer.updateFields()\n        idx = layer.fields().indexFromName(FIELD_NAME)\n\n        da = build_distance_area(layer)\n        count = 0\n        for feat in layer.getFeatures():\n            geom = feat.geometry()\n            if geom is None or geom.isEmpty():\n                continue\n            area_m2 = da.measureArea(geom)\n            layer.changeAttributeValue(feat.id(), idx, round(area_m2 / M2_PER_FEDDAN, 4))\n            count += 1\n\n        if not layer.commitChanges():\n            layer.rollBack()\n            print(\"\u274c \u0641\u0634\u0644 \u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a:\", layer.commitErrors())\n            return\n        print(f\"\u2705 \u062a\u0645 \u062d\u0633\u0627\u0628 \u0645\u0633\u0627\u062d\u0629 {count} \u0645\u0636\u0644\u0639 \u0628\u0627\u0644\u0641\u062f\u0627\u0646 \u0641\u064a \u0627\u0644\u062d\u0642\u0644 {FIELD_NAME}.\")\n\n    except Exception as exc:\n        layer.rollBack()\n        print(\"\u274c \u062d\u062f\u062b \u062e\u0637\u0623\u060c \u062a\u0645 \u0627\u0644\u062a\u0631\u0627\u062c\u0639 \u0639\u0646 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a:\", exc)\n\n\nmain()\n"
    },
    {
      id: "autolisp-coords",
      title: "استخراج إحداثيات نقاط البولي لاين وتصديرها لملف CSV للرفع والتوقيع",
      env: "AutoLISP (AutoCAD / Civil 3D)",
      lang: "lisp",
      desc: "أمر مخصص للأوتوكاد (EXCOORDS) بمجرد اختيار أي مضلع أو خط يقوم باستخراج إحداثيات جميع رؤوسه (E, N) وحفظها في ملف CSV جاهز للإرسال للتوتال ستيشن.",
      whereToRun: [
        "انسخ الكود واحفظه في ملف نصي على جهازك بامتداد .lsp (مثلاً: ExportCoords.lsp).",
        "داخل برنامج AutoCAD أو Civil 3D، اكتب الأمر APPLOAD في شريط الأوامر واضغط Enter.",
        "اختر الملف الذي حفظته واضغط Load ثم Close.",
        "اكتب في شريط أوامر الأوتوكاد كلمة EXCOORDS واضغط Enter، ثم اختر البولي لاين وحدد مكان حفظ ملف الإحداثيات."
      ],
      code: ";;; EXCOORDS: export the vertex coordinates of an LWPOLYLINE to a CSV file.\n;;; Usage: APPLOAD this file, then type EXCOORDS at the command line.\n;;; Prompts are in English on purpose to avoid encoding issues in AutoCAD.\n\n(defun c:EXCOORDS ( / ent obj coords file path n k x y)\n  (vl-load-com)\n  (setq ent (entsel \"\\nSelect a LWPOLYLINE: \"))\n  (cond\n    ((null ent)\n     (princ \"\\nCancelled.\"))\n    ((/= (cdr (assoc 0 (entget (car ent)))) \"LWPOLYLINE\")\n     (princ \"\\nThe selected object is not a LWPOLYLINE.\"))\n    (t\n     (setq path (getfiled \"Save coordinates as CSV\" \"Points_Export\" \"csv\" 1))\n     (cond\n       ((null path)\n        (princ \"\\nCancelled.\"))\n       ((null (setq file (open path \"w\")))\n        (princ \"\\nCould not open the file for writing.\"))\n       (t\n        (setq obj    (vlax-ename->vla-object (car ent)))\n        ;; LWPOLYLINE Coordinates is a flat list: x0 y0 x1 y1 ...\n        (setq coords (vlax-safearray->list\n                       (vlax-variant-value (vlax-get obj 'Coordinates))))\n        (setq n (/ (length coords) 2))\n        (write-line \"Point_No,Easting,Northing\" file)\n        (setq k 0)\n        (while (< k n)\n          (setq x (nth (* 2 k) coords)\n                y (nth (1+ (* 2 k)) coords))\n          (write-line (strcat (itoa (1+ k)) \",\"\n                              (rtos x 2 4) \",\"\n                              (rtos y 2 4))\n                      file)\n          (setq k (1+ k)))\n        (close file)\n        (princ (strcat \"\\nExported \" (itoa n) \" points to: \" path))))))\n  (princ)\n)\n"
    }
  ];

  /* ==========================================================================
     2. حقن التنسيقات البصرية (CSS) للأقسام المطورة
     ========================================================================== */
  function injectUpgradeStyles() {
    if ($("geoDoctorUpgradeStyles")) return;
    const st = document.createElement("style");
    st.id = "geoDoctorUpgradeStyles";
    st.textContent = `
      .doc-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 800;
        background: color-mix(in srgb, var(--bl) 18%, transparent);
        color: var(--bl);
        border: 1px solid color-mix(in srgb, var(--bl) 35%, transparent);
      }
      .doc-badge.green {
        background: color-mix(in srgb, var(--gr) 18%, transparent);
        color: var(--gr);
        border-color: color-mix(in srgb, var(--gr) 35%, transparent);
      }
      .doc-badge.amber {
        background: color-mix(in srgb, var(--am) 18%, transparent);
        color: var(--am);
        border-color: color-mix(in srgb, var(--am) 35%, transparent);
      }
      .doc-steps {
        margin: 10px 0 0;
        padding: 12px 16px;
        background: var(--bg);
        border: 1px solid var(--ln);
        border-right: 3px solid var(--gr);
        border-radius: 12px;
        font-size: 13px;
        line-height: 1.85;
      }
      .doc-steps ol {
        margin: 6px 0 0;
        padding-right: 18px;
      }
      .doc-steps li {
        margin-bottom: 6px;
      }
      .doc-filter-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 12px 0;
      }
      .doc-filter-bar select, .doc-filter-bar input {
        flex: 1 1 180px;
        margin: 0 !important;
      }
      .code-lab-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 310px), 1fr));
        gap: 14px;
        margin-top: 12px;
      }
      .code-snippet-card {
        background: var(--cd);
        border: 1px solid var(--ln);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .code-snippet-card pre {
        margin: 0;
        padding: 12px;
        border-radius: 10px;
        background: #0d1117;
        color: #e6edf3;
        font-size: 12px;
        max-height: 190px;
        overflow: auto;
        border: 1px solid var(--ln);
        direction: ltr;
        text-align: left;
      }
      .gis-academic-toolbar {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 210px), 1fr));
        gap: 10px;
        margin-bottom: 14px;
      }
      .gis-academic-btn {
        text-align: right;
        padding: 12px 14px;
        background: var(--bg);
        border: 1px solid var(--ln);
        border-radius: 14px;
        color: var(--tx);
        cursor: pointer;
        transition: all .2s ease;
      }
      .gis-academic-btn:hover {
        border-color: var(--bl);
        transform: translateY(-2px);
      }
      .gis-academic-btn b {
        display: block;
        color: var(--bl);
        font-size: 13.5px;
        margin-bottom: 4px;
      }
      .gis-academic-btn span {
        display: block;
        color: var(--mt);
        font-size: 11.5px;
        font-weight: 400;
        line-height: 1.5;
      }
    `;
    document.head.appendChild(st);
  }

  /* ==========================================================================
     3. ترقية الأكاديمية: إضافة تبويب "المنصات البحثية" وتبويب "مكتبة الكتب" وتطوير "الكورسات"
     ========================================================================== */
  let currentBookLang = "all";
  let currentBookCat = "all";
  let currentBookSearch = "";

  function upgradeAcademyTabs() {
    const tabsBar = document.querySelector("#s-academy .academy-tabs");
    if (!tabsBar || tabsBar.dataset.upgraded === "1") return;
    tabsBar.dataset.upgraded = "1";

    // تحديث نص الرأس ليعكس شمولية المنصة للطالب والمهندس والباحث
    const headerP = document.querySelector("#s-academy .academy-header p");
    if (headerP) {
      headerP.textContent = "بيئة أكاديمية وتطبيقية متكاملة تخدم الطالب المبتدئ، المهندس التطبيقي، والباحث الأكاديمي — مسارات تدريبية، مكتبة كتب مصنفة، ودليل المنصات البحثية العالمية.";
    }

    // إضافة التبويبين الجديدين في بداية شريط الأكاديمية
    const coursesTab = tabsBar.querySelector('[data-academy-tab="courses"]');
    if (coursesTab) {
      coursesTab.innerHTML = '<i data-lucide="graduation-cap"></i> المسارات والبرامج';
      coursesTab.insertAdjacentHTML("afterend", `
        <button class="academy-tab" data-academy-tab="research-hub">
          <i data-lucide="compass"></i> المنصات البحثية
        </button>
        <button class="academy-tab" data-academy-tab="books-lib">
          <i data-lucide="library"></i> مكتبة الكتب
        </button>
      `);
    }

    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons({ root: tabsBar, attrs: { "stroke-width": 1.8 } });
    }
  }

  // عرض تبويب دليل المنصات البحثية وطريقة استخدامها
  function renderResearchHub() {
    const content = $("academyContent");
    if (!content) return;

    content.innerHTML = `
      <div class="academy-card" style="margin-bottom:14px">
        <span class="doc-badge green">توفير شهور من البحث العلمي</span>
        <h3 style="margin-top:8px">🌍 بوابة المنصات البحثية ومصادر البيانات العالمية</h3>
        <p>تجمع هذه البوابة أهم المنصات العلمية وقواعد بيانات المرئيات الفضائية والرسائل الجامعية في مكان واحد، مع <b>دليل استخدام عملي خطوة بخطوة</b> لكيفية البحث والتحميل المجاني منها.</p>
      </div>

      <div class="academy-grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))">
        ${RESEARCH_PLATFORMS.map(p => `
          <div class="academy-card" style="display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
                <span class="doc-badge">${esc(p.category)}</span>
                <span class="academy-muted">${esc(p.lang)}</span>
              </div>
              <h3 style="margin:10px 0 6px">${esc(p.name)}</h3>
              <p style="font-size:13.5px">${esc(p.desc)}</p>
              <div class="academy-muted" style="margin:6px 0">🔑 <b>طريقة الإتاحة:</b> ${esc(p.access)}</div>

              <details style="margin-top:10px">
                <summary style="font-weight:800;color:var(--gr);cursor:pointer">📖 طريقة الاستخدام والتحميل خطوة بخطوة</summary>
                <div class="doc-steps">
                  <ol>
                    ${p.steps.map(s => `<li>${esc(s)}</li>`).join("")}
                  </ol>
                </div>
              </details>
            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
              <a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" class="academy-btn" style="flex:1;text-decoration:none">
                فتح المنصة الرسمية ↗
              </a>
              <button type="button" class="academy-btn secondary" onclick="window.GEODoctorAskPlatform('${esc(p.name)}')">
                اسأل الخبير عنها 🤖
              </button>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  // عرض تبويب مكتبة الكتب والمراجع المصنفة (عربي / إنجليزي)
  function renderBooksLibrary() {
    const content = $("academyContent");
    if (!content) return;

    const filtered = GEO_BOOKS.filter(b => {
      const matchLang = currentBookLang === "all" || b.lang === currentBookLang;
      const matchCat = currentBookCat === "all" || b.cat === currentBookCat;
      const q = currentBookSearch.trim().toLowerCase();
      const matchQ = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.desc.toLowerCase().includes(q);
      return matchLang && matchCat && matchQ;
    });

    const catLabels = {
      gis: "نظم المعلومات الجغرافية GIS",
      rs: "الاستشعار عن بعد",
      surveying: "المساحة والجيوديسيا",
      physical: "الجغرافيا الطبيعية والمناخ",
      human: "الجغرافيا البشرية والعمران",
      code: "برمجة GIS و GEE"
    };

    content.innerHTML = `
      <div class="academy-card" style="margin-bottom:14px">
        <span class="doc-badge">عربي + إنجليزي في مكان واحد</span>
        <h3 style="margin-top:8px">📚 المكتبة الجغرافية الأكاديمية الشاملة</h3>
        <p>مراجع وكتب مصنفة في كافة تخصصات الجغرافيا والجيوماتكس، بالإضافة إلى محرك بحث مباشر للوصول إلى الكتب والأبحاث المفتوحة المصدر بصيغة PDF.</p>

        <div class="doc-filter-bar">
          <input id="docBookSearch" class="academy-input" placeholder="ابحث باسم الكتاب أو المؤلف أو التخصص..." value="${esc(currentBookSearch)}" oninput="window.GEODoctorFilterBooks()">
          <select id="docBookLang" class="academy-input" onchange="window.GEODoctorFilterBooks()">
            <option value="all" ${currentBookLang === "all" ? "selected" : ""}>كل اللغات (عربي + إنجليزي)</option>
            <option value="ar" ${currentBookLang === "ar" ? "selected" : ""}>الكتب العربية فقط</option>
            <option value="en" ${currentBookLang === "en" ? "selected" : ""}>الكتب الإنجليزية فقط (English)</option>
          </select>
          <select id="docBookCat" class="academy-input" onchange="window.GEODoctorFilterBooks()">
            <option value="all" ${currentBookCat === "all" ? "selected" : ""}>جميع التخصصات الجغرافية</option>
            <option value="gis" ${currentBookCat === "gis" ? "selected" : ""}>نظم المعلومات الجغرافية (GIS)</option>
            <option value="rs" ${currentBookCat === "rs" ? "selected" : ""}>الاستشعار عن بعد ومرئيات الأقمار</option>
            <option value="surveying" ${currentBookCat === "surveying" ? "selected" : ""}>المساحة والجيوديسيا</option>
            <option value="physical" ${currentBookCat === "physical" ? "selected" : ""}>الجغرافيا الطبيعية والجيومورفولوجيا</option>
            <option value="human" ${currentBookCat === "human" ? "selected" : ""}>الجغرافيا البشرية والعمران</option>
            <option value="code" ${currentBookCat === "code" ? "selected" : ""}>برمجة الأكواد الجغرافية و GEE</option>
          </select>
        </div>

        <div style="margin-top:10px;padding:12px;background:var(--bg);border:1px solid var(--ln);border-radius:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <input id="docLiveBookInput" class="academy-input" style="flex:1;margin:0" placeholder="لم تجد كتابك؟ اكتب اسم أي كتاب أو موضوع جغرافي للبحث عن روابط PDF الرسمية له...">
          <button type="button" class="academy-btn" onclick="window.GEODoctorLiveBookSearch()">🔎 ابحث عن الكتاب بالذكاء الاصطناعي</button>
        </div>
        <div id="docLiveBookResult" style="margin-top:10px"></div>
      </div>

      <div class="academy-grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))">
        ${filtered.length ? filtered.map(b => {
          const isDirectUrl = /^https?:\/\//i.test(b.searchQuery);
          const link = isDirectUrl ? b.searchQuery : "https://scholar.google.com/scholar?q=" + encodeURIComponent(b.searchQuery);
          const googlePdfLink = "https://www.google.com/search?q=" + encodeURIComponent(b.searchQuery + " filetype:pdf");
          return `
            <div class="academy-card" style="display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <div style="display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap">
                  <span class="doc-badge ${b.lang === "ar" ? "green" : "amber"}">${b.lang === "ar" ? "مرجع عربي" : "English Reference"}</span>
                  <span class="academy-muted">${esc(catLabels[b.cat] || b.cat)}</span>
                </div>
                <h3 style="margin:10px 0 4px">${esc(b.title)}</h3>
                <div class="academy-muted" style="margin-bottom:8px">✍️ المؤلف: ${esc(b.author)} • المستوى: ${esc(b.level)}</div>
                <p style="font-size:13.5px">${esc(b.desc)}</p>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
                <a href="${esc(googlePdfLink)}" target="_blank" rel="noopener noreferrer" class="academy-btn" style="flex:1;text-decoration:none">
                  البحث عن نسخة PDF 📥
                </a>
                <a href="${esc(link)}" target="_blank" rel="noopener noreferrer" class="academy-btn secondary" style="text-decoration:none">
                  Google Scholar ↗
                </a>
              </div>
            </div>
          `;
        }).join("") : `<div class="academy-empty">لا توجد كتب مطابقة للفلتر الحالي. جرب تغيير اللغة أو التخصص.</div>`}
      </div>
    `;
  }

  // ترقية تبويب الكورسات ليضيف "المسارات التدريبية الاحترافية + المشغل المدمج + ملفات التدريب" فوق الدليل الحالي
  function enhanceCoursesView() {
    const content = $("academyContent");
    if (!content || $("proTracksContainer")) return;

    const proHtml = `
      <div id="proTracksContainer" class="academy-card" style="margin-bottom:18px;border:1px solid var(--bl)">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <span class="doc-badge green">محتوى تطبيقي منظم + ملفات عمل</span>
          <span class="academy-muted">يخدم الطالب المبتدئ • المهندس • الباحث الأكاديمي</span>
        </div>
        <h3 style="margin:10px 0 6px">🎯 المسارات التدريبية الاحترافية للبرامج الهندسية والجغرافية</h3>
        <p>بدلاً من التشتت في البحث العشوائي، اختر مسار البرنامج المطلوب، استعرض المنهج التدريبي المنظم، شاهد الشروحات داخل المنصة مباشرة، وحمّل <b>ملفات التدريب العملية (Datasets / Shapefiles / Points)</b> للتطبيق العملي.</p>

        <div class="academy-grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr));margin-top:14px">
          ${PRO_TRACKS.map(t => `
            <div class="academy-card" style="background:var(--bg);display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <div style="display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap">
                  <span class="doc-badge">${esc(t.software)}</span>
                  <span class="doc-badge amber">${esc(t.badge)}</span>
                </div>
                <h3 style="margin:10px 0 4px">${esc(t.title)}</h3>
                <div class="academy-muted">👨‍🏫 ${esc(t.instructor)} • 📊 ${esc(t.level)}</div>

                <div class="doc-steps" style="margin-top:10px">
                  <b>المنهج التطبيقي للمسار (${esc(t.lessonsCount)}):</b>
                  <ol>
                    ${t.syllabus.map(s => `<li>${esc(s)}</li>`).join("")}
                  </ol>
                </div>
              </div>

              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
                <button type="button" class="academy-btn" style="flex:1" onclick="window.GEODoctorOpenCourseModal('${esc(t.id)}')">
                  ▶ فتح قاعة الدرس والفيديو
                </button>
                <button type="button" class="academy-btn secondary" onclick="window.GEODoctorDownloadDataset('${esc(t.id)}')">
                  📦 تحميل بيانات التدريب
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    content.insertAdjacentHTML("afterbegin", proHtml);
  }

  /* ==========================================================================
     4. تطوير قسم المختبر (#s-py) إلى "مختبر الأكواد الجغرافي المتقدم"
     ========================================================================== */
  function upgradeCodeLabSection() {
    const pySec = $("s-py");
    if (!pySec || $("gisCodeLabUpgraded")) return;

    const labHtml = `
      <div id="gisCodeLabUpgraded">
        <!-- 1. مولد الأكواد الجغرافية من الوصف (Text-to-GIS Code) -->
        <div class="card" style="border-color:var(--bl)">
          <div class="row" style="justify-content:space-between;margin-bottom:6px">
            <h3 style="margin:0;font-size:16px">⚡ حوّل فكرتك إلى كود جغرافي جاهز (Text-to-GIS Code)</h3>
            <span class="doc-badge green">مع شرح طريقة التركيب والتشغيل خطوة بخطوة</span>
          </div>
          <p class="mt" style="margin:0 0 10px;line-height:1.7">
            اكتب المهمة الجغرافية أو المساحية التي تريد تنفيذها بالعربية، وسيقوم المحرك بكتابة الكود الكامل مع شرح دقيق للمكان الذي تضع فيه الكود داخل البرنامج (ArcGIS Pro / QGIS / GEE / AutoCAD).
          </p>

          <div class="g2" style="margin-bottom:8px">
            <div>
              <label class="mt">1. اختر البرنامج أو البيئة المستهدفة:</label>
              <select id="gisCodeEnv">
                <option value="ArcPy لبرنامج ArcGIS Pro">ArcPy — داخل برنامج ArcGIS Pro</option>
                <option value="PyQGIS لبرنامج QGIS">PyQGIS — داخل برنامج QGIS</option>
                <option value="Google Earth Engine (JavaScript API)">Google Earth Engine (GEE Code Editor)</option>
                <option value="AutoLISP لبرنامج AutoCAD و Civil 3D">AutoLISP — أوتوكاد و Civil 3D</option>
                <option value="Python (GeoPandas / Rasterio / Shapely)">Python مستقل (GeoPandas & Rasterio)</option>
              </select>
            </div>
            <div>
              <label class="mt">2. اختر مثالاً سريعاً أو اكتب طلبك بالأسفل:</label>
              <select onchange="if(this.value)$('gisCodePrompt').value=this.value">
                <option value="">-- اختر مهمة شائعة لتجربتها --</option>
                <option value="أريد كود يقوم بتحويل جميع ملفات الـ Shapefile في مجلد معين إلى قاعدة بيانات File Geodatabase مع توحيد مسقطها إلى UTM Zone 36N">تحويل وتوحيد مسقط طبقات Shapefile إلى UTM 36N</option>
                <option value="أريد كود Google Earth Engine يحسب درجة حرارة سطح الأرض (LST) من مرئيات Landsat 8 لمنطقة دراسة محددة وتصديرها">حساب درجة حرارة سطح الأرض (LST) في Google Earth Engine</option>
                <option value="أريد كود يقوم بفلترة وحذف المضلعات الصغيرة التي تقل مساحتها عن 100 متر مربع لتنظيف طبقة المباني">حذف وتنظيف المضلعات الصغيرة أقل من 100 متر مربع</option>
                <option value="أريد كود AutoLISP يقوم بترقيم نقاط أو بلوكات المساحة تلقائياً في اللوحة مع كتابة الإحداثيات بجانب كل نقطة">ترقيم النقاط وكتابة إحداثياتها تلقائياً في AutoCAD</option>
              </select>
            </div>
          </div>

          <textarea id="gisCodePrompt" rows="3" placeholder="اكتب ما تحتاجه بالتفصيل... مثال: أريد كود يحسب مؤشر المياه NDWI ويستخرج المسطحات المائية..."></textarea>

          <div class="row" style="margin-top:6px">
            <button type="button" class="g" style="flex:1;padding:12px" id="gisCodeGenBtn" onclick="window.GEODoctorGenerateCode()">
              🚀 توليد الكود + خطوات الاستخدام داخل البرنامج
            </button>
          </div>

          <div id="gisCodeGenResult" class="res" style="display:none;margin-top:12px;padding:14px;line-height:1.9"></div>
        </div>

        <!-- 2. مكتبة الأكواد الجغرافية الجاهزة المشروحة -->
        <div class="card">
          <h3 style="margin:0 0 6px;font-size:16px">📂 مكتبة الأكواد الجغرافية والمساحية الجاهزة (مع فيديو ودليل التطبيق)</h3>
          <p class="mt" style="margin:0">أكواد مختبرة لأهم المهام اليومية للباحث والمهندس — اضغط على "طريقة الاستخدام" لمعرفة خطوات تشغيل الكود بالتفصيل الممل.</p>

          <div class="code-lab-grid">
            ${GIS_CODE_TEMPLATES.map(item => `
              <div class="code-snippet-card">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
                  <span class="doc-badge">${esc(item.env)}</span>
                </div>
                <b style="font-size:14.5px;color:var(--tx)">${esc(item.title)}</b>
                <span class="mt" style="line-height:1.6">${esc(item.desc)}</span>

                <pre><code>${esc(item.code)}</code></pre>

                <details>
                  <summary style="color:var(--gr);font-weight:800;font-size:12.5px">🛠️ أين وكيف أضع هذا الكود داخل البرنامج؟ (خطوة بخطوة)</summary>
                  <div class="doc-steps">
                    <ol>
                      ${item.whereToRun.map(w => `<li>${esc(w)}</li>`).join("")}
                    </ol>
                  </div>
                </details>

                <div class="row" style="margin-top:auto;padding-top:6px">
                  <button type="button" class="k" style="flex:1" onclick="window.GEODoctorCopySnippet('${esc(item.id)}')">📋 نسخ الكود</button>
                  <button type="button" class="a" style="flex:1" onclick="window.GEODoctorVideoGuide('${esc(item.id)}')">🎬 فيديو شرح التطبيق</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;

    pySec.insertAdjacentHTML("afterbegin", labHtml);
  }

  /* ==========================================================================
     5. تطوير قسم الجيوماتكس (#s-gis) إلى "استوديو الباحث الأكاديمي" (يتفوق على الشات العادي)
     ========================================================================== */
  function upgradeGisSection() {
    const gisSec = $("s-gis");
    if (!gisSec || $("gisAcademicStudio")) return;

    const studioHtml = `
      <div id="gisAcademicStudio" class="card" style="border-color:var(--bl)">
        <div class="row" style="justify-content:space-between;margin-bottom:6px">
          <h3 style="margin:0;font-size:16px">🎓 أدوات الباحث الأكاديمي والمهندس المتخصص (Specialized Geo-Tools)</h3>
          <span class="doc-badge amber">قوالب منهجية لا يقدمها الشات التقليدي</span>
        </div>
        <p class="mt" style="margin:0 0 12px;line-height:1.7">
          اختر الأداة البحثية المطلوبة لتوليد مخرجات علمية مهيكلة وفق المعايير الأكاديمية للجامعات ودوريات النشر، مع إمكانية تصدير التقرير كاملاً بصيغة PDF.
        </p>

        <div class="gis-academic-toolbar">
          <button type="button" class="gis-academic-btn" onclick="window.GEODoctorRunAcademicTool('proposal')">
            <b>📐 بناء خطة بحث علمي (Proposal)</b>
            <span>يصيغ المشكلة البحثية، الأهداف، الفرضيات، المنهجية، والبيانات المكانية المطلوبة لأي موضوع.</span>
          </button>

          <button type="button" class="gis-academic-btn" onclick="window.GEODoctorRunAcademicTool('sensor')">
            <b>🛰️ مستشار اختيار المرئيات والمؤشرات</b>
            <span>يحدد لك أنسب قمر صناعي، الدقة المكانية والطيفية، والمؤشر الطيفي بمعادلته الرياضية لظاهرتك.</span>
          </button>

          <button type="button" class="gis-academic-btn" onclick="window.GEODoctorRunAcademicTool('workflow')">
            <b>🗺️ مصمم خريطة سير العمل (GIS Workflow)</b>
            <span>يبني لك خطوات التحليل المكاني بالترتيب بأسماء الأدوات الفعلية داخل ArcGIS Pro و QGIS.</span>
          </button>

          <button type="button" class="gis-academic-btn" onclick="window.GEODoctorRunAcademicTool('debug')">
            <b>🔧 محلل أخطاء البرامج المساحية و GIS</b>
            <span>حل فوري لرسائل الخطأ في ArcGIS (مثل Error 999999) ومشاكل عدم تطابق المساقط والإحداثيات.</span>
          </button>
        </div>
      </div>
    `;

    gisSec.insertAdjacentHTML("afterbegin", studioHtml);
  }

  /* ==========================================================================
     6. الدوال التفاعلية للأزرار والنوافذ المنبثقة (Modals & AI Handlers)
     ========================================================================== */

  // فلترة مكتبة الكتب
  window.GEODoctorFilterBooks = function () {
    currentBookSearch = $("docBookSearch")?.value || "";
    currentBookLang = $("docBookLang")?.value || "all";
    currentBookCat = $("docBookCat")?.value || "all";
    const pos = $("docBookSearch")?.selectionStart || currentBookSearch.length;
    renderBooksLibrary();
    const next = $("docBookSearch");
    if (next) {
      next.focus();
      try { next.setSelectionRange(pos, pos); } catch (_) {}
    }
  };

  // بحث حي بالذكاء الاصطناعي والويب عن أي كتاب جغرافي
  window.GEODoctorLiveBookSearch = async function () {
    const q = $("docLiveBookInput")?.value.trim();
    const out = $("docLiveBookResult");
    if (!q || !out) return window.toast && window.toast("اكتب اسم الكتاب أو الموضوع أولاً", "warn");

    out.innerHTML = `<div class="academy-status">⏳ جاري البحث في قواعد البيانات والويب عن كتب ومراجع حول: <b>${esc(q)}</b>...</div>`;
    try {
      if (window.GEOAcademyEngines && typeof window.GEOAcademyEngines.search === "function") {
        const res = await window.GEOAcademyEngines.search("كتاب أو مرجع PDF في الجغرافيا أو الجيوماتكس عن: " + q);
        const links = (res.results || []).map(r => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--bl);font-weight:bold">${esc(r.title)}</a> — <span class="academy-muted">${esc((r.content || "").slice(0, 140))}...</span></li>`).join("");
        out.innerHTML = `
          <div class="doc-steps">
            <b>نتائج البحث عن المراجع والكتب:</b>
            <ul>${links || "<li>لم يتم العثور على روابط مباشرة، راجع التحليل بالأسفل.</li>"}</ul>
            <div style="margin-top:8px">${esc(res.analysis || "")}</div>
          </div>
        `;
      } else if (typeof window.callAIWithRetry === "function") {
        const r = await window.callAIWithRetry(`اقترح أهم الكتب والمراجع العلمية العربية والإنجليزية المتخصصة في موضوع (${q}) مع ذكر اسم المؤلف وكيفية الوصول إليها عبر Google Scholar أو بنك المعرفة المصري.`, { tier: "default" });
        out.innerHTML = `<div class="doc-steps">${typeof window.md === "function" ? window.md(r.text) : esc(r.text)}</div>`;
      }
    } catch (e) {
      out.innerHTML = `<div class="doc-steps" style="border-color:#ef4444">تعذر البحث التلقائي (${esc(e.message)}). يمكنك البحث مباشرة في <a href="https://scholar.google.com/scholar?q=${encodeURIComponent(q)}" target="_blank" style="color:var(--bl)">Google Scholar ↗</a></div>`;
    }
  };

  // سؤال الخبير عن منصة بحثية معينة
  window.GEODoctorAskPlatform = function (platformName) {
    if (typeof window.go === "function") window.go("gis");
    const input = $("gisInput");
    if (input) {
      input.value = `اشرح لي بالتفصيل الممل كأستاذ جامعي كيف أستفيد من منصة (${platformName}) في بحثي العلمي، وكيف أحمّل منها الأبحاث أو البيانات مجاناً خطوة بخطوة.`;
      if (typeof window.gisSend === "function") window.gisSend();
    }
  };

  // فتح قاعة الدرس المدمجة للمسار التدريبي
  window.GEODoctorOpenCourseModal = function (trackId) {
    const t = PRO_TRACKS.find(x => x.id === trackId);
    if (!t) return;
    $("docCourseModal")?.remove();

    const modalHtml = `
      <div id="docCourseModal" class="tool-modal on" style="z-index:140" onclick="if(event.target===this)this.remove()">
        <div class="tool-content" style="max-width:780px">
          <div class="tool-header">
            <h3>🎓 ${esc(t.title)}</h3>
            <button class="close-btn" onclick="$('docCourseModal').remove()">✕</button>
          </div>
          <div class="tool-body">
            <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px">
              <span class="doc-badge">${esc(t.software)}</span>
              <span class="doc-badge green">${esc(t.level)}</span>
            </div>

            <div style="border-radius:14px;overflow:hidden;border:1px solid var(--ln);background:#000;margin-bottom:14px">
              <iframe src="${esc(t.embedUrl)}" style="width:100%;height:340px;border:0" allowfullscreen loading="lazy"></iframe>
            </div>

            <div class="doc-steps">
              <b>خطوات التطبيق العملي لهذا المسار:</b>
              <ol>
                ${t.syllabus.map(s => `<li>${esc(s)}</li>`).join("")}
              </ol>
            </div>

            <div class="row" style="margin-top:14px">
              <button type="button" class="g" style="flex:1" onclick="window.GEODoctorDownloadDataset('${esc(t.id)}')">
                📦 تحميل ملفات العمل والتدريب (${esc(t.datasetName)})
              </button>
              <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(t.software + ' كورس كامل شرح عربي')}" target="_blank" rel="noopener noreferrer" class="k" style="padding:10px 14px;border-radius:10px;color:#fff;text-decoration:none;font-weight:bold;font-size:12px">
                قوائم تشغيل إضافية ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
  };

  // توليد وتحميل ملفات التدريب العملية (Datasets) للتطبيق الفوري داخل البرامج
  window.GEODoctorDownloadDataset = function (trackId) {
    const t = PRO_TRACKS.find(x => x.id === trackId);
    if (!t) return;

    let content = "";
    if (t.datasetName.endsWith(".geojson")) {
      content = JSON.stringify({
        type: "FeatureCollection",
        name: "GeoDev_Training_Layer_Minya",
        crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        features: [
          { type: "Feature", properties: { ID: 1, Name_AR: "منطقة تدريب المنيا الجديدة", LandUse: "Urban", Area_Feddan: 120.5 }, geometry: { type: "Polygon", coordinates: [[[30.78, 28.08], [30.82, 28.08], [30.82, 28.12], [30.78, 28.12], [30.78, 28.08]]] } },
          { type: "Feature", properties: { ID: 2, Name_AR: "نطاق زراعي - وادي النيل", LandUse: "Agriculture", Area_Feddan: 340.0 }, geometry: { type: "Polygon", coordinates: [[[30.73, 28.09], [30.77, 28.09], [30.77, 28.14], [30.73, 28.14], [30.73, 28.09]]] } }
        ]
      }, null, 2);
    } else {
      content = [
        "Point_ID,Easting,Northing,Elevation,Code",
        "1,672150.250,3109420.110,42.55,BM1",
        "2,672185.400,3109455.320,42.80,NGL",
        "3,672220.100,3109490.000,43.15,NGL",
        "4,672260.750,3109510.450,43.05,CL",
        "5,672300.000,3109540.900,42.90,BLDG"
      ].join("\n");
    }

    if (typeof window.dlText === "function") {
      window.dlText(content, t.datasetName);
    } else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
      a.download = t.datasetName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    if (window.toast) window.toast("تم تحميل ملف التدريب العملي: " + t.datasetName, "success");
  };

  // ===== توليد كود GIS مع فحص ثابت وإعادة توليد تلقائية عند وجود أخطاء =====
  const LAB_RULES = String.raw`
القواعد الإلزامية للكود:
- استخدم فقط دوال وأوامر موثّقة رسمياً في البيئة المطلوبة. لو لست متأكداً من دالة فلا تكتبها، واذكر أنها غير مؤكدة خارج الكود.
- ضع كل المسارات في متغيرات واضحة في أول الكود. مسارات ويندوز تُكتب داخل raw string بباكسلاش واحد، مثال: r"C:\GIS_Project\data.gdb".
- تحقق من وجود المدخلات قبل التشغيل، وأنشئ المخرجات (File Geodatabase أو مجلد) إن لم تكن موجودة.
- عالج الأخطاء بـ try/except في ArcPy، وبفحص null/nil في AutoLISP، واطبع رسالة واضحة.
- في AutoLISP عرّف الأمر بالشكل (defun c:NAME ...)، واستخدم (vl-load-com) إذا استخدمت vlax.
- اكتب الكود كاملاً داخل بلوك برمجي واحد على الأقل، ولا تكتب كود ناقص بـ "..." .`;

  function extractCodeBlocks(text) {
    const blocks = [];
    const re = /```([\w+-]*)[ \t]*\n([\s\S]*?)```/g;
    let m;
    while ((m = re.exec(text))) blocks.push({ lang: (m[1] || "").toLowerCase(), code: m[2] });
    return blocks;
  }

  function langFor(env, lang) {
    if (lang) return lang;
    if (/autolisp|autocad|civil/i.test(env)) return "lisp";
    if (/arcpy|pyqgis|python/i.test(env)) return "python";
    return "js";
  }

  function runStaticChecks(text, env) {
    const V = window.GEOLabVerifier;
    const errors = [], warnings = [];
    if (!V) {
      warnings.push("فاحص الكود (geo-lab-verifier.js) غير محمّل، الكود لم يُفحص.");
      return { ok: true, errors, warnings, checked: 0 };
    }
    const blocks = extractCodeBlocks(text).filter(b => b.code.trim());
    if (!blocks.length) errors.push("الرد لم يحتوِ على كود داخل بلوك برمجي.");
    blocks.forEach((b, i) => {
      const r = V.verify(b.code, langFor(env, b.lang));
      r.errors.forEach(x => errors.push(`[كود ${i + 1}] ${x}`));
      r.warnings.forEach(x => warnings.push(`[كود ${i + 1}] ${x}`));
    });
    return { ok: errors.length === 0, errors, warnings, checked: blocks.length };
  }

  function renderGenResult(text, check) {
    const md = typeof window.md === "function" ? window.md(text) : esc(text);
    let banner;
    if (check.ok && check.checked) {
      banner = `<div style="background:rgba(16,185,129,.12);border:1px solid #10b981;border-radius:10px;padding:10px;margin-bottom:10px;font-size:13px">
        ✅ الكود اجتاز الفحص الثابت (${check.checked} بلوك). ده بيتأكد من الشكل والمسارات والدوال المعتمدة، بس لازم تجربه على نسخة من بياناتك قبل الاعتماد عليه في شغل حقيقي.</div>`;
    } else {
      banner = `<div style="background:rgba(248,113,113,.12);border:1px solid #f87171;border-radius:10px;padding:10px;margin-bottom:10px;font-size:13px">
        ❌ الكود لسه فيه مشاكل بعد المحاولتين. راجعها قبل الاستخدام:<ul style="margin:6px 0 0;padding-right:18px">${check.errors.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
    }
    const warn = check.warnings.length
      ? `<details style="margin-bottom:10px;font-size:12px;color:#fbbf24"><summary>⚠️ ملاحظات تحتاج انتباهك (${check.warnings.length})</summary><ul style="margin:6px 0 0;padding-right:18px">${check.warnings.map(x => `<li>${esc(x)}</li>`).join("")}</ul></details>`
      : "";
    return banner + warn + md;
  }

  window.GEODoctorGenerateCode = async function () {
    const env = $("gisCodeEnv")?.value || "ArcPy";
    const req = $("gisCodePrompt")?.value.trim();
    const out = $("gisCodeGenResult");
    const btn = $("gisCodeGenBtn");

    if (!req) return window.toast && window.toast("اكتب وصف المهمة التي تريد تحويلها لكود أولاً", "warn");

    btn.disabled = true;
    btn.textContent = "⏳ جاري كتابة الكود وفحصه...";
    out.style.display = "block";
    out.innerHTML = "جاري توليد الكود لبيئة <b>" + esc(env) + "</b>...";

    const sysPrompt = `أنت خبير برمجة نظم معلومات جغرافية واستشعار عن بعد ومساحة (GeoDev GIS Code Architect).
المطلوب: تحويل طلب المستخدم إلى كود احترافي جاهز للتشغيل في بيئة (${env}).
يجب أن تقسم إجابتك إلى 3 أقسام واضحة كالتالي:
### 1. الكود البرمجي الكامل الجاهز للنسخ
(ضع الكود داخل بلوك برمجي مع تعليقات توضيحية باللغة العربية داخل الكود).
### 2. خطوات تشغيل الكود داخل البرنامج خطوة بخطوة (للمبتدئ والباحث)
(اشرح في نقاط مرقمة 1، 2، 3 من أي قائمة داخل البرنامج يفتح نافذة الكود، وأين يلصقه، وكيف يغير مسارات ملفاته).
### 3. النتيجة المتوقعة ونصائح لتجنب الأخطاء
${LAB_RULES}`;

    const baseMsg = `البيئة المطلوبة: ${env}\nالمهمة المطلوبة: ${req}`;
    let userMsg = baseMsg;
    let text = "", check = null;

    try {
      for (let attempt = 1; attempt <= 2; attempt++) {
        const r = await window.callAIWithRetry(userMsg, {
          sysPrompt,
          tier: "default",
          onText: ({ text: t }) => { out.innerHTML = typeof window.md === "function" ? window.md(t) : esc(t); }
        });
        text = r.text;
        check = runStaticChecks(text, env);
        if (check.ok) break;
        userMsg = `${baseMsg}\n\nالمحاولة السابقة فيها الأخطاء دي، صحّحها وأعد كتابة الكود كاملاً:\n- ${check.errors.join("\n- ")}`;
      }
      out.innerHTML = renderGenResult(text, check);
    } catch (e) {
      out.innerHTML = `<span style="color:#f87171">حدث خطأ أثناء توليد الكود: ${esc(e.message || e)}</span>`;
    } finally {
      btn.disabled = false;
      btn.textContent = "🚀 توليد الكود + خطوات الاستخدام داخل البرنامج";
    }
  };

  // نسخ كود جاهز من المكتبة
  window.GEODoctorCopySnippet = function (id) {
    const item = GIS_CODE_TEMPLATES.find(x => x.id === id);
    if (!item) return;
    navigator.clipboard?.writeText(item.code);
    if (window.toast) window.toast("تم نسخ الكود بنجاح! راجع خطوات التشغيل أسفل الكارت", "success");
  };

  // فتح فيديو شرح تطبيق الكود داخل البرنامج
  window.GEODoctorVideoGuide = function (id) {
    const item = GIS_CODE_TEMPLATES.find(x => x.id === id);
    if (!item) return;
    $("docVideoModal")?.remove();

    const q = encodeURIComponent(item.env + " tutorial " + item.title);
    const modalHtml = `
      <div id="docVideoModal" class="tool-modal on" style="z-index:140" onclick="if(event.target===this)this.remove()">
        <div class="tool-content" style="max-width:680px">
          <div class="tool-header">
            <h3>🎬 طريقة تطبيق الكود في ${esc(item.env)}</h3>
            <button class="close-btn" onclick="$('docVideoModal').remove()">✕</button>
          </div>
          <div class="tool-body">
            <div class="doc-steps" style="margin-bottom:14px">
              <b>خطوات التنفيذ العملية داخل البرنامج:</b>
              <ol>
                ${item.whereToRun.map(w => `<li>${esc(w)}</li>`).join("")}
              </ol>
            </div>
            <div style="border-radius:12px;overflow:hidden;border:1px solid var(--ln);background:#000">
              <iframe src="https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(item.env + ' python script tutorial')}" style="width:100%;height:300px;border:0" allowfullscreen loading="lazy"></iframe>
            </div>
            <div class="row" style="margin-top:12px">
              <button type="button" class="g" style="flex:1" onclick="window.GEODoctorCopySnippet('${esc(item.id)}')">📋 نسخ الكود الآن</button>
              <a href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener noreferrer" class="k" style="padding:10px 14px;border-radius:10px;color:#fff;text-decoration:none;font-weight:bold">فتح المزيد على يوتيوب ↗</a>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
  };

  // تشغيل أدوات الباحث الأكاديمي في قسم الجيوماتكس
  window.GEODoctorRunAcademicTool = function (toolType) {
    const prompts = {
      proposal: {
        askUser: "اكتب عنوان البحث أو الظاهرة الجغرافية ومنطقة الدراسة (مثال: تقييم مخاطر السيول في شرق المنيا باستخدام GIS):",
        build: topic => `أنت أستاذ دكتور ومشرف أكاديمي في الجغرافيا والجيوماتكس. قم بإعداد خطة بحث علمي (Research Proposal) متكاملة ومفصلة حول موضوع: (${topic}).
قسّم الخطة أكاديمياً إلى:
1. مقترح العنوان الأكاديمي الدقيق (بالعربية والإنجليزية).
2. مشكلة الدراسة وتساؤلاتها البحثية.
3. أهداف الدراسة وأهميتها العلمية والتطبيقية.
4. البيانات المكانية والمرئيات الفضائية المطلوبة ومصادر تحميلها (مع تحديد دقة المرئيات).
5. المنهجية العلمية وأدوات التحليل المكاني والـ GIS التي سيتم تطبيقها خطوة بخطوة.
6. قائمة بأهم المراجع المقترحة ومفاهيم الدراسة.`
      },
      sensor: {
        askUser: "اكتب الظاهرة التي تريد دراستها بالاستشعار عن بعد (مثال: رصد الزحف العمراني على الأراضي الزراعية، أو دراسة الملوحة، أو الجزر الحرارية):",
        build: topic => `أنت خبير استشعار عن بعد ومعالجة مرئيات فضائية. يريد الباحث دراسة ظاهرة: (${topic}).
قدم له تقريراً فنياً يشمل:
1. أنسب الأقمار الصناعية المجانية والمدفوعة لهذه الدراسة (Landsat 8/9, Sentinel-2, Sentinel-1 SAR, MODIS, أو DEM) مع مقارنة الدقة المكانية والزمنية.
2. أفضل المؤشرات الطيفية (Spectral Indices) المناسبة للظاهرة مع كتابة المعادلة الرياضية الدقيقة وأرقام النطاقات (Bands) لكل قمر.
3. خطوات المعالجة المسبقة والتصنيف أو الاستخلاص داخل ENVI أو ArcGIS Pro أو Google Earth Engine.`
      },
      workflow: {
        askUser: "اكتب التحليل الجغرافي الذي تريد معرفة خطوات تنفيذه على البرامج (مثال: اختيار أفضل موقع لإنشاء محطة طاقة شمسية أو دفن صحي):",
        build: topic => `أنت خبير نظم معلومات جغرافية (GIS Specialist). صمم خريطة سير عمل تطبيقية (GIS Workflow & ModelBuilder) لتنفيذ مشروع: (${topic}).
وضح بالترتيب المنهجي:
1. الطبقات والمعايير المطلوبة (Layers & Criteria) وأوزانها النسبية (AHP / Weighted Overlay).
2. خطوات تجهيز كل طبقة بأسماء الأدوات الحقيقية بالإنجليزية داخل ArcGIS Pro و QGIS (مثل: Euclidean Distance, Slope, Reclassify, Raster Calculator).
3. كيفية إخراج الخريطة النهائية والتحقق من دقتها.`
      },
      debug: {
        askUser: "صف المشكلة أو رسالة الخطأ التي تواجهك في ArcGIS أو QGIS أو AutoCAD Civil 3D:",
        build: topic => `أنت مهندس دعم فني خبير في برامج الجيوماتكس (ArcGIS Pro, ArcMap, QGIS, Civil 3D). يواجه المستخدم المشكلة التالية: (${topic}).
اشرح له:
1. السبب العلمي والتقني المباشر لحدوث هذه المشكلة (مثل تعارض المساقط، أسماء الحقول، مسارات الملفات العربية، أو الطوبولوجيا).
2. خطوات الحل السريع بالترتيب من داخل قوائم البرنامج.
3. نصيحة وقائية لعدم تكرار الخطأ في المشاريع القادمة.`
      }
    };

    const cfg = prompts[toolType];
    if (!cfg) return;
    const userTopic = prompt(cfg.askUser);
    if (!userTopic || !userTopic.trim()) return;

    const gisInput = $("gisInput");
    if (gisInput) {
      gisInput.value = cfg.build(userTopic.trim());
      if (typeof window.gisSend === "function") window.gisSend();
    }
  };

  /* ==========================================================================
     7. ربط التبويبات ومراقبة الـ DOM لضمان عمل التحديثات بسلاسة
     ========================================================================== */
  function setupEventsAndObservers() {
    // التقاط النقرات على التبويبات الجديدة في الأكاديمية
    document.addEventListener("click", e => {
      const tab = e.target.closest && e.target.closest("[data-academy-tab]");
      if (!tab) return;
      const tabName = tab.dataset.academyTab;

      if (tabName === "research-hub" || tabName === "books-lib") {
        e.stopImmediatePropagation();
        document.querySelectorAll("[data-academy-tab]").forEach(b => {
          b.classList.toggle("active", b.dataset.academyTab === tabName);
        });
        if (tabName === "research-hub") renderResearchHub();
        if (tabName === "books-lib") renderBooksLibrary();
      } else if (tabName === "courses") {
        setTimeout(enhanceCoursesView, 60);
      }
    }, true);

    // مراقبة تغير محتوى الأكاديمية لإضافة المسارات الاحترافية تلقائياً عند فتح تبويب الكورسات
    const acadSec = $("s-academy");
    if (acadSec) {
      new MutationObserver(() => {
        upgradeAcademyTabs();
        const activeBtn = document.querySelector('[data-academy-tab="courses"].active');
        if (activeBtn && $("academyCatalogSearch") && !$("proTracksContainer")) {
          enhanceCoursesView();
        }
      }).observe(acadSec, { childList: true, subtree: true });
    }
  }

  function initAllUpgrades() {
    injectUpgradeStyles();
    upgradeAcademyTabs();
    enhanceCoursesView();
    upgradeCodeLabSection();
    upgradeGisSection();
    setupEventsAndObservers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAllUpgrades);
  } else {
    initAllUpgrades();
  }
})();
