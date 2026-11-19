/* ============================================================================
   GEO Academy UI - النسخة الكاملة والنهائية (V8)
   - 8 بطاقات رئيسية: (الكورسات والدورات، كورسات رسمية، البحث الذكي، الكتب، المدرس، ملاحظاتي، ذاكرتي، تقدمي)
   - قسم الكورسات والدورات: بانر التخصصات الستة + اسم المحاضر + بطاقات المحاضرين التفصيلية
   - قفل تتابعي للمحاضرات + زر إكمال يظهر فقط بعد مشاهدة الفيديو بالكامل
   - ربط تلقائي مع "تقدمي التعليمي" + إشعار ذكي علوي عند رفع محاضرة جديدة
   - قفل الفيديوهات والمرفقات على المشتركين بالكود فقط (استبعاد التجريبي 3 أيام)
   ============================================================================ */
(function () {
  "use strict";

  const ADMIN_EMAIL = "eng.ahmedsamir.gis@gmail.com";
  const ADMIN_WHATSAPP = "201015912371";
  const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;

  const ourTracks = [
    { id: "AutoCAD + AI", title: "AutoCAD + AI", icon: "bot", desc: "ربط الأوتوكاد بالذكاء الاصطناعي وأتمتة الليسبات." },
    { id: "GIS", title: "نظم المعلومات الجغرافية GIS", icon: "globe", desc: "ArcGIS Pro و QGIS والتحليل المكاني وإخراج الخرائط." },
    { id: "Surveying", title: "المساحة والرفع المساحي", icon: "ruler", desc: "الترافيرس، الميزانية، GNSS، وحسابات المكتب الفني." },
    { id: "Civil 3D", title: "Civil 3D", icon: "drafting-compass", desc: "تصميم الطرق والأسطح وحساب كميات الحفر والردم." },
    { id: "Remote Sensing", title: "الاستشعار عن بعد", icon: "satellite", desc: "معالجة المرئيات الفضائية والمؤشرات الطيفية." },
    { id: "Programming", title: "برمجة GIS و Python", icon: "code", desc: "أتمتة المعالجة المكانية باستخدام Python و ArcPy." }
  ];

  const academySections = [
    {
      id: "courses",
      title: "الكورسات والدورات",
      icon: "graduation-cap",
      badge: "حصري PRO",
      desc: "كورسات المنصة التطبيقية، المحاضرون، ونظام فتح المحاضرات التتابعي."
    },
    {
      id: "official-courses",
      title: "كورسات رسمية",
      icon: "award",
      badge: "دليل عالمي",
      desc: "مكتبة الكورسات الرسمية المعتمدة من Esri و Autodesk و NARSS."
    },
    {
      id: "smart-search",
      title: "البحث الذكي",
      icon: "search",
      badge: "AI Search",
      desc: "ابحث عن كورسات وشروحات حقيقية من YouTube والمنصات العالمية بالـ AI."
    },
    {
      id: "books",
      title: "الكتب والمراجع",
      icon: "book-open-check",
      badge: "مكتبة PDF",
      desc: "كتب المساحة و GIS والاستشعار عن بعد وأدلة البرامج الهندسية."
    },
    {
      id: "teacher",
      title: "المدرس الذكي",
      icon: "bot",
      badge: "GEO Teacher",
      desc: "مدرسك الشخصي لشرح المسائل والأكواد خطوة بخطوة مع الصور والصوت."
    },
    {
      id: "notes",
      title: "ملاحظاتي الدراسية",
      icon: "notebook-pen",
      badge: "سحابي",
      desc: "دوّن ملخصات محاضراتك وأوامر البرامج واحفظها في حسابك."
    },
    {
      id: "memory",
      title: "ذاكرتي التعليمية",
      icon: "brain",
      badge: "تخصصات",
      desc: "احفظ القوانين والمعادلات والنقاط المهمة مصنفة حسب كل مادة."
    },
    {
      id: "progress",
      title: "تقدمي التعليمي",
      icon: "chart-no-axes-column-increasing",
      badge: "مرتبط بالدورات",
      desc: "تابع نسبة إنجازك الفعلية في كل كورس ومحاضرة أكملتها."
    }
  ];

  const defaultInstructors = [
    {
      id: "inst_ahmed_samir",
      name: "المهندس أحمد سمير",
      role: "مهندس مساحة وخرائط ونظم معلومات جغرافية (GIS) ومطور حلول GeoAI",
      age: "22 سنة",
      phone: "01015912371",
      teachingSince: "2024",
      specialties: "AutoCAD + AI، نظم المعلومات الجغرافية GIS، المساحة والرفع المساحي، أتمتة الليسبات والبرمجة الهندسية.",
      bio: "مؤسس منصة GeoDev Studio Pro، متخصص في دمج الذكاء الاصطناعي مع برامج المساحة والأوتوكاد وتطوير الأدوات الهندسية للمكاتب الفنية."
    },
    {
      id: "inst_amr_ashraf",
      name: "المهندس عمرو أشرف",
      role: "مهندس مساحة وبنية تحتية ومكتب فني",
      age: "24 سنة",
      phone: "",
      teachingSince: "2023",
      specialties: "Civil 3D، المساحة الهندسية، تصميم الطرق وحساب كميات الحفر والردم.",
      bio: "محاضر متخصص في أعمال المكتب الفني المساحي وتصميم الطرق والأسطح الطبوغرافية باستخدام Civil 3D."
    }
  ];

  let currentUser = null;
  let isAdminUser = false;
  let isCodeSubscriber = false;
  let notes = [];
  let memories = [];
  let completedLectures = [];
  let teacherMessages = [];
  let uploadedCourses = [];
  let instructorsList = [];
  let coursesSubView = "lectures";
  let selectedTrackFilter = "all";
  let selectedInstructorFilter = "all";
  let selectedCourseDetailId = null;
  let videoFinishedWatching = false;
  let ytWatchTimer = null;
  let courseComments = [];
  let activeTab = "courses";
  let eventsBound = false;

  const $ = id => document.getElementById(id);

  function refreshAcademyIcons(root = document) {
    try {
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons({ root, attrs: { "stroke-width": 1.8 } });
      }
    } catch (_) {}
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function safeURL(value) {
    try {
      const url = new URL(String(value || ""));
      if (url.protocol === "https:" || url.protocol === "http:" || url.protocol === "blob:") {
        return escapeHTML(url.href);
      }
    } catch (_) {}
    return "";
  }

  function notify(message, type = "info") {
    let box = $("academyToast");
    if (!box) {
      box = document.createElement("div");
      box.id = "academyToast";
      document.body.appendChild(box);
    }
    box.textContent = message;
    box.dataset.type = type;
    box.classList.add("show");
    clearTimeout(box._timer);
    box._timer = setTimeout(() => box.classList.remove("show"), 4000);
  }

  function injectStyles() {
    if ($("academyStyles")) return;
    const style = document.createElement("style");
    style.id = "academyStyles";
    style.textContent = `
      #s-academy {
        padding: 16px;
        direction: rtl;
        color: var(--tx, #e8edf7);
      }
      #s-academy .academy-header,
      #s-academy .teacher-header {
        position: relative;
        overflow: hidden;
        padding: 20px;
        margin-bottom: 16px;
        border: 1px solid color-mix(in srgb, var(--bl, #38bdf8) 35%, var(--ln, #334155));
        border-radius: 20px;
        background:
          radial-gradient(circle at 10% 10%, color-mix(in srgb, var(--bl, #38bdf8) 20%, transparent), transparent 45%),
          linear-gradient(145deg, var(--cd, #182334), color-mix(in srgb, var(--cd, #182334) 82%, var(--bl, #38bdf8)));
        box-shadow: 0 12px 35px rgba(0,0,0,.12);
      }
      #s-academy .academy-header h2 {
        margin: 0 0 8px;
        font-size: 22px;
        font-weight: 900;
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--tx, #f8fafc);
      }
      #s-academy .academy-header h2 svg { width: 27px; height: 27px; color: var(--bl, #38bdf8); flex-shrink: 0; }
      #s-academy .academy-header p { margin: 0; color: var(--mt, #94a3b8); line-height: 1.85; }

      #gdSmartVideoAlert {
        background: linear-gradient(90deg, #0f172a, #1e293b);
        color: #f8fafc;
        border: 2px solid #e09f24;
        border-radius: 14px;
        padding: 11px 14px;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        cursor: pointer;
        box-shadow: 0 8px 22px rgba(224, 159, 36, 0.25);
      }

      #s-academy .academy-hub-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 225px), 1fr));
        gap: 12px;
        margin-bottom: 18px;
      }
      #s-academy .academy-hub-card {
        position: relative;
        text-align: right;
        cursor: pointer;
        background: linear-gradient(145deg, color-mix(in srgb, var(--cd, #182334) 95%, var(--bl, #38bdf8)), var(--cd, #182334));
        border: 1.5px solid var(--ln, #334155);
        border-radius: 18px;
        padding: 14px;
        color: inherit;
        font-family: inherit;
        display: flex;
        flex-direction: column;
        gap: 7px;
        transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
      }
      #s-academy .academy-hub-card:hover { transform: translateY(-2px); border-color: var(--bl, #38bdf8); }
      #s-academy .academy-hub-card.active {
        border: 2px solid #e09f24;
        background: linear-gradient(145deg, color-mix(in srgb, #e09f24 14%, var(--cd, #182334)), var(--cd, #182334));
        box-shadow: 0 10px 26px rgba(224, 159, 36, 0.18);
      }
      #s-academy .hub-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      #s-academy .hub-card-badge {
        font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 99px;
        background: color-mix(in srgb, var(--bl, #38bdf8) 15%, var(--cd, #182334));
        color: var(--bl, #38bdf8);
        border: 1px solid color-mix(in srgb, var(--bl, #38bdf8) 30%, var(--ln, #334155));
      }
      #s-academy .academy-hub-card.active .hub-card-badge { background: #e09f24; color: #0f172a; border-color: #e09f24; }
      #s-academy .hub-card-title { margin: 0; font-size: 15.5px; font-weight: 900; color: var(--tx, #f8fafc); }
      #s-academy .hub-card-desc { margin: 0; font-size: 12px; line-height: 1.65; color: var(--mt, #94a3b8); }

      #s-academy .courses-sub-switcher {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 15px;
      }
      #s-academy .sub-switch-btn {
        flex: 1;
        min-width: 170px;
        padding: 12px 15px;
        border-radius: 14px;
        border: 1.5px solid var(--ln, #334155);
        background: var(--cd, #182334);
        color: var(--tx, #e8edf7);
        font-size: 14px;
        font-weight: 900;
        cursor: pointer;
        font-family: inherit;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      #s-academy .sub-switch-btn.active {
        background: #0f172a;
        color: #fbbf24;
        border-color: #e09f24;
      }

      #s-academy .instructor-card {
        border: 1.5px solid color-mix(in srgb, #e09f24 45%, var(--ln, #334155));
        background: linear-gradient(150deg, color-mix(in srgb, #e09f24 8%, var(--cd, #182334)), var(--cd, #182334));
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 10px;
      }
      #s-academy .inst-header { display: flex; align-items: center; gap: 12px; }
      #s-academy .inst-avatar {
        width: 54px; height: 54px; border-radius: 16px;
        background: linear-gradient(135deg, #e09f24, #b45309);
        color: #0f172a; display: grid; place-items: center; font-size: 24px; font-weight: 900; flex-shrink: 0;
      }
      #s-academy .inst-meta-grid {
        display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px;
        background: var(--bg, #101827); padding: 10px; border-radius: 12px;
        border: 1px solid var(--ln, #334155); font-size: 12px;
      }
      #s-academy .inst-meta-item b { color: #fbbf24; display: block; font-size: 11px; }
      #s-academy .lecturer-tag {
        display: inline-flex; align-items: center; gap: 5px;
        background: rgba(224, 159, 36, 0.14); border: 1px solid rgba(224, 159, 36, 0.4);
        color: #fbbf24; padding: 3px 10px; border-radius: 8px; font-size: 12px; font-weight: 800; margin: 4px 0;
      }

      #s-academy .tracks-banner {
        background: linear-gradient(135deg, color-mix(in srgb, #e09f24 14%, var(--cd, #182334)), var(--cd, #182334));
        border: 1.5px solid #e09f24; border-radius: 18px; padding: 15px; margin-bottom: 16px;
      }
      #s-academy .tracks-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
      #s-academy .track-pill-btn {
        border: 1.5px solid var(--ln, #334155); background: var(--bg, #101827); color: var(--tx, #e8edf7);
        border-radius: 12px; padding: 8px 13px; font-size: 12.5px; font-weight: 800;
        cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 6px;
      }
      #s-academy .track-pill-btn.active,
      #s-academy .track-pill-btn:hover { background: #e09f24; color: #0f172a; border-color: #e09f24; }

      #s-academy .academy-active-stage {
        border-top: 2px dashed color-mix(in srgb, var(--ln, #334155) 85%, #e09f24);
        padding-top: 16px; margin-top: 6px;
      }
      #s-academy .academy-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 265px), 1fr)); gap: 13px;
      }
      #s-academy .academy-card,
      #s-academy .academy-course-result {
        position: relative; overflow: hidden;
        background: linear-gradient(145deg, color-mix(in srgb, var(--cd, #182334) 96%, var(--bl, #38bdf8)), var(--cd, #182334));
        border: 1px solid color-mix(in srgb, var(--ln, #334155) 85%, var(--bl, #38bdf8));
        border-radius: 18px; padding: 16px; min-width: 0; overflow-wrap: anywhere;
        box-shadow: 0 8px 24px rgba(0,0,0,.09);
      }
      #s-academy .academy-card.lecture-locked { opacity: 0.78; border-style: dashed; }
      #s-academy .academy-card h3,
      #s-academy .academy-course-result h4 {
        font-size: 16.5px; margin: 6px 0 8px; color: var(--tx, #f8fafc); font-weight: 900;
        display: flex; align-items: center; gap: 8px;
      }
      #s-academy .academy-card p,
      #s-academy .academy-course-result p { line-height: 1.85; color: var(--mt, #cbd5e1); }
      #s-academy .academy-icon {
        width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
        border-radius: 13px; color: var(--bl, #38bdf8);
        background: color-mix(in srgb, var(--bl, #38bdf8) 14%, var(--cd, #182334));
        border: 1px solid color-mix(in srgb, var(--bl, #38bdf8) 28%, var(--ln, #334155));
      }
      #s-academy .academy-icon svg { width: 22px; height: 22px; }
      #s-academy .admin-upload-card {
        border: 2px solid #e09f24;
        background: linear-gradient(145deg, color-mix(in srgb, #e09f24 10%, var(--cd, #182334)), var(--cd, #182334));
        margin-bottom: 18px;
      }
      #s-academy .admin-upload-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 10px;
      }
      #s-academy .course-detail-box { border: 2px solid var(--bl, #38bdf8); margin-bottom: 18px; }
      #s-academy .course-video-frame {
        width: 100%; border-radius: 14px; overflow: hidden; background: #050811; margin: 12px 0;
        border: 1px solid var(--ln, #334155);
      }
      #s-academy .course-video-frame video,
      #s-academy .course-video-frame iframe { width: 100%; max-height: 420px; display: block; border: 0; }
      #s-academy .locked-video-wall {
        background: linear-gradient(135deg, #0f172a, #1e293b);
        border: 2px solid #e09f24; border-radius: 16px; padding: 22px 16px;
        text-align: center; margin: 12px 0; color: #f8fafc;
      }
      #s-academy .course-attachments-bar { display: flex; flex-wrap: wrap; gap: 9px; margin: 12px 0; }
      #s-academy .comments-section { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--ln, #334155); }
      #s-academy .comment-item {
        padding: 11px 13px; border-radius: 13px; background: var(--bg, #101827);
        border: 1px solid var(--ln, #334155); margin-bottom: 9px;
      }
      #s-academy .comment-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 5px; font-size: 12.5px; }
      #s-academy .academy-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 7px;
        border: 1px solid color-mix(in srgb, var(--bl, #38bdf8) 25%, var(--ln, #334155));
        border-radius: 12px; padding: 10px 15px; background: var(--bl, #167b9c);
        color: #fff; font-weight: 800; font-family: inherit; cursor: pointer; text-decoration: none;
      }
      #s-academy .academy-btn.gold { background: #e09f24; color: #0f172a; border-color: #e09f24; }
      #s-academy .academy-btn.success { background: #16a34a; color: #fff; border-color: #16a34a; }
      #s-academy .academy-btn.pdf-btn { background: #dc2626; color: #fff; border-color: #dc2626; }
      #s-academy .academy-btn.drive-btn { background: #15803d; color: #fff; border-color: #15803d; }
      #s-academy .academy-btn.secondary {
        background: color-mix(in srgb, var(--cd, #182334) 80%, var(--bl, #38bdf8));
        color: var(--tx, #e8edf7); border-color: var(--ln, #334155);
      }
      #s-academy .academy-btn.danger { background: #991b1b; color: #fff; border-color: #991b1b; }
      #s-academy .academy-input,
      #s-academy .academy-textarea,
      #s-academy select {
        width: 100%; box-sizing: border-box; padding: 11px 12px; border-radius: 12px;
        border: 1px solid var(--ln, #334155); background: var(--bg, #101827);
        color: var(--tx, #e8edf7); margin: 6px 0 11px; font: inherit;
      }
      #s-academy .academy-textarea { min-height: 90px; resize: vertical; }
      #s-academy .academy-muted { opacity: .78; font-size: 12.5px; }
      #s-academy .academy-progress {
        height: 10px; background: var(--ln, #344256); border-radius: 20px; overflow: hidden; margin: 12px 0;
      }
      #s-academy .academy-progress > span {
        display: block; height: 100%; background: linear-gradient(90deg, #e09f24, #22c55e); transition: width .35s ease;
      }
      #s-academy .academy-empty { text-align: center; padding: 22px 12px; opacity: .75; }
      #s-academy .academy-status {
        padding: 10px 14px; border-radius: 12px;
        background: color-mix(in srgb, var(--cd, #182334) 92%, var(--bl, #38bdf8));
        border: 1px solid var(--ln, #334155); margin-bottom: 14px; font-size: 13px;
      }
      #s-academy .academy-teacher { display: flex; flex-direction: column; gap: 14px; }
      #s-academy .teacher-header { display: flex; align-items: center; gap: 13px; padding: 16px; }
      #s-academy .teacher-avatar {
        width: 48px; height: 48px; flex: 0 0 48px; display: grid; place-items: center;
        border-radius: 50%; background: color-mix(in srgb, var(--bl, #38bdf8) 20%, var(--cd, #182334));
        border: 1px solid color-mix(in srgb, var(--bl, #38bdf8) 35%, var(--ln, #334155)); font-size: 24px;
      }
      #s-academy .teacher-online { color: #4ade80; font-size: 12px; }
      #s-academy .teacher-subject { padding: 12px; border: 1px solid var(--ln, #334155); border-radius: 14px; background: var(--cd, #182334); }
      #s-academy .academy-teacher-messages {
        display: flex; flex-direction: column; gap: 14px; min-height: 240px; max-height: 62vh;
        overflow-y: auto; padding: 14px; border: 1px solid var(--ln, #334155);
        border-radius: 16px; background: var(--bg, #101827);
      }
      #s-academy .teacher-welcome,
      #s-academy .teacher-message { display: flex; align-items: flex-start; gap: 9px; }
      #s-academy .teacher-bubble {
        width: 100%; padding: 14px; border: 1px solid var(--ln, #1e293b);
        border-radius: 16px; background: var(--cd, #0f172a); line-height: 1.9; overflow-wrap: anywhere;
      }
      #s-academy .teacher-composer { padding: 12px; border: 1px solid var(--ln, #334155); border-radius: 16px; background: var(--cd, #182334); }
      #s-academy .academy-search-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; margin: 12px 0; }
      #s-academy .academy-course-platform { display: flex; align-items: center; gap: 10px; }
      #s-academy .academy-platform-icon,
      #s-academy .academy-platform-fallback { width: 40px; height: 40px; flex: 0 0 40px; border-radius: 10px; }
      #s-academy .academy-platform-icon { object-fit: contain; background: #fff; padding: 4px; }
      #s-academy .academy-platform-fallback { display: grid; place-items: center; background: #26384d; font-size: 20px; }
      #academyToast {
        position: fixed; z-index: 99999; bottom: 20px; right: 50%; transform: translate(50%, 20px);
        background: #26384d; color: white; padding: 12px 18px; border-radius: 12px;
        opacity: 0; pointer-events: none; transition: .2s; max-width: 88%; text-align: center;
      }
      #academyToast.show { opacity: 1; transform: translate(50%, 0); }
      #academyToast[data-type="error"] { background: #9b3434; }
      #academyToast[data-type="success"] { background: #176b50; }
      @media (max-width: 640px) {
        #s-academy { padding: 10px 7px; }
        #s-academy .academy-hub-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
        #s-academy .academy-hub-card { padding: 12px; }
        #s-academy .hub-card-title { font-size: 13.5px; }
        #s-academy .hub-card-desc { font-size: 11.5px; }
      }
    `;
    document.head.appendChild(style);
  }

  function injectInterface() {
    const nav = document.querySelector("nav") || document.querySelector(".nav, .bottom-nav, header nav");
    const main = document.querySelector("main") || document.querySelector("#main, .main, .content");
    if (!nav || !main) return false;

    if (!document.querySelector('[data-t="academy"]')) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.t = "academy";
      button.innerHTML = `<span class="nav-icon"><i data-lucide="graduation-cap"></i></span>الأكاديمية`;
      button.addEventListener("click", () => {
        if (typeof window.go === "function") {
          window.go("academy");
        } else {
          document.querySelectorAll(".sec").forEach(section => {
            section.classList.toggle("on", section.id === "s-academy");
          });
        }
      });
      nav.appendChild(button);
    }

    if (!$("s-academy")) {
      const section = document.createElement("section");
      section.id = "s-academy";
      section.className = "sec";

      section.innerHTML = `
        <div id="gdSmartVideoAlertWrap"></div>

        <div class="academy-header">
          <h2><i data-lucide="graduation-cap"></i> الأكاديمية الجغرافية</h2>
          <p>منظومة تعليمية متكاملة تجمع دورات المنصة التفاعلية، المحاضرين، الكورسات الرسمية، الباحث الذكي، والمدرس الذكي.</p>
        </div>

        <div id="academyStatus" class="academy-status">
          جاري التحقق من تسجيل الدخول...
        </div>

        <div id="academyHubGrid" class="academy-hub-grid">
          ${academySections.map(sec => `
            <button type="button"
              class="academy-hub-card ${sec.id === activeTab ? "active" : ""}"
              data-academy-tab="${sec.id}">
              <div class="hub-card-top">
                <div class="academy-icon"><i data-lucide="${sec.icon}"></i></div>
                <span class="hub-card-badge">${sec.badge}</span>
              </div>
              <h3 class="hub-card-title">${sec.title}</h3>
              <p class="hub-card-desc">${sec.desc}</p>
            </button>
          `).join("")}
        </div>

        <div id="academyContent" class="academy-active-stage"></div>
      `;

      main.appendChild(section);
    }

    injectStyles();
    refreshAcademyIcons($("s-academy"));
    return true;
  }

  function setStatus(message) {
    const element = $("academyStatus");
    if (element) element.textContent = message;
  }

  function getDb() {
    try {
      if (window.firebase && typeof firebase.firestore === "function") {
        return firebase.firestore();
      }
    } catch (_) {}
    return null;
  }

  async function checkCodeSubscriptionStatus(user) {
    if (!user) {
      isAdminUser = false;
      isCodeSubscriber = false;
      return false;
    }

    isAdminUser = !!(user.email && user.email.toLowerCase() === ADMIN_EMAIL);
    if (isAdminUser) {
      isCodeSubscriber = true;
      return true;
    }

    // 1. فحص شارة الـ PRO الظاهرة في الهيدر مباشرة (مثلاً 357d 8h PRO)
    const pageText = document.body.innerText || "";
    const proBadgeMatch = pageText.match(/(\d+)\s*d\s+\d+\s*h\s*(?:\d+\s*m\s*)?PRO/i);
    if (proBadgeMatch && Number(proBadgeMatch[1]) >= 4) {
      isCodeSubscriber = true;
      return true;
    }

    // 2. فحص دوال ومتغيرات المنصة العامة و localStorage
    try {
      const globalUser = window.U || window.userData || window.currentUserData || {};
      const localPlan = String(
        localStorage.getItem("gd_user_plan") ||
        localStorage.getItem("plan") ||
        globalUser.plan ||
        ""
      ).toLowerCase();

      if (
        localPlan.includes("pro") ||
        localPlan.includes("plus") ||
        globalUser.isPro === true ||
        globalUser.pro === true ||
        globalUser.activated === true ||
        Boolean(globalUser.code)
      ) {
        isCodeSubscriber = true;
        return true;
      }
    } catch (_) {}

    // 3. فحص مستند المستخدم في Firestore
    const db = getDb();
    if (db) {
      try {
        const snap = await db.collection("users").doc(user.uid).get();
        const data = snap.exists ? snap.data() : {};
        const now = Date.now();

        const plan = String(data.plan || data.tier || data.subscription || data.status || "").toLowerCase();
        const isProFlag =
          data.isPro === true ||
          data.pro === true ||
          data.activated === true ||
          Boolean(data.activationCode || data.code);

        const rawExpiry =
          data.pro_until ||
          data.proUntil ||
          data.pro_end ||
          data.proEnd ||
          data.expiresAt ||
          data.expiry ||
          data.trial_end ||
          data.trialEnd ||
          0;

        let expiryMs = 0;
        if (rawExpiry && typeof rawExpiry.toMillis === "function") {
          expiryMs = rawExpiry.toMillis();
        } else if (typeof rawExpiry === "number") {
          expiryMs = rawExpiry < 1e12 ? rawExpiry * 1000 : rawExpiry;
        } else if (typeof rawExpiry === "string" && rawExpiry) {
          expiryMs = new Date(rawExpiry).getTime() || 0;
        }

        if (
          isProFlag ||
          plan.includes("pro") ||
          plan.includes("plus") ||
          plan.includes("active") ||
          (expiryMs - now) > FOUR_DAYS_MS
        ) {
          isCodeSubscriber = true;
          return true;
        }
      } catch (_) {}
    }

    isCodeSubscriber = false;
    return false;
  }

  async function loadInstructors() {
    const db = getDb();
    if (!db) {
      instructorsList = JSON.parse(localStorage.getItem("gd_academy_instructors") || "null") || defaultInstructors.slice();
      return;
    }
    try {
      const snap = await db.collection("geodev_academy_instructors").orderBy("createdAt", "asc").get();
      if (snap.empty) {
        instructorsList = defaultInstructors.slice();
      } else {
        instructorsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } catch (_) {
      instructorsList = JSON.parse(localStorage.getItem("gd_academy_instructors") || "null") || defaultInstructors.slice();
    }
  }

  async function loadUploadedCourses() {
    const db = getDb();
    if (!db) {
      uploadedCourses = JSON.parse(localStorage.getItem("gd_academy_uploaded_courses") || "[]");
      return;
    }
    try {
      const snap = await db.collection("geodev_academy_courses").orderBy("createdAt", "asc").get();
      uploadedCourses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderSmartNotificationBanner();
    } catch (_) {
      uploadedCourses = JSON.parse(localStorage.getItem("gd_academy_uploaded_courses") || "[]");
    }
  }

  function renderSmartNotificationBanner() {
    const wrap = $("gdSmartVideoAlertWrap");
    if (!wrap || !uploadedCourses.length) return;

    const latest = uploadedCourses[uploadedCourses.length - 1];
    const dismissedId = localStorage.getItem("gd_dismissed_video_alert");
    if (dismissedId === latest.id) {
      wrap.innerHTML = "";
      return;
    }

    wrap.innerHTML = `
      <div id="gdSmartVideoAlert" data-jump-to-video="${escapeHTML(latest.id)}">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:22px;">🔔</span>
          <div>
            <div style="font-size:11.5px;color:#fbbf24;font-weight:900;">محاضرة جديدة أُضيفت الآن في (${escapeHTML(latest.category || "الأكاديمية")})</div>
            <div style="font-size:13.5px;font-weight:800;">${escapeHTML(latest.title)} ${latest.instructorName ? `— تقديم: ${escapeHTML(latest.instructorName)}` : ""} ↗</div>
          </div>
        </div>
        <button type="button" id="gdDismissVideoAlert" style="background:rgba(255,255,255,0.15);color:#fff;border:0;border-radius:8px;padding:4px 9px;cursor:pointer;">✕</button>
      </div>
    `;
  }

  async function loadUserCompletedLectures() {
    if (!currentUser) {
      completedLectures = [];
      return;
    }
    const localKey = `gd_completed_lectures_${currentUser.uid}`;
    completedLectures = JSON.parse(localStorage.getItem(localKey) || "[]");

    const db = getDb();
    if (!db) return;
    try {
      const snap = await db.collection("users").doc(currentUser.uid).collection("academy_completed_lectures").get();
      if (!snap.empty) {
        completedLectures = snap.docs.map(d => d.id);
        localStorage.setItem(localKey, JSON.stringify(completedLectures));
      }
    } catch (_) {}
  }

  async function markLectureCompleted(lectureId) {
    if (!currentUser || !lectureId) return;
    if (!completedLectures.includes(lectureId)) {
      completedLectures.push(lectureId);
      localStorage.setItem(`gd_completed_lectures_${currentUser.uid}`, JSON.stringify(completedLectures));
    }

    const db = getDb();
    if (db) {
      try {
        await db.collection("users").doc(currentUser.uid).collection("academy_completed_lectures").doc(lectureId).set({
          lectureId,
          completedAt: Date.now()
        });
      } catch (_) {}
    }

    const lecture = uploadedCourses.find(c => c.id === lectureId);
    if (lecture) {
      const trackLectures = uploadedCourses.filter(c => c.category === lecture.category);
      const doneInTrack = trackLectures.filter(c => completedLectures.includes(c.id)).length;
      const pct = trackLectures.length ? Math.round((doneInTrack / trackLectures.length) * 100) : 100;
      notify(`🎉 أحسنت! أكملت المحاضرة، وتقدمك في (${lecture.category}) أصبح ${pct}% (${doneInTrack}/${trackLectures.length})`, "success");
    }
  }

  function isLectureUnlocked(lectureItem) {
    if (isAdminUser) return true;
    const sameTrack = uploadedCourses.filter(c => c.category === lectureItem.category);
    const idx = sameTrack.findIndex(c => c.id === lectureItem.id);
    if (idx <= 0) return true;
    const prevLecture = sameTrack[idx - 1];
    return completedLectures.includes(prevLecture.id);
  }

  async function loadCommentsForCourse(courseId) {
    courseComments = [];
    const db = getDb();
    if (!db || !courseId) return;
    try {
      const snap = await db.collection("geodev_academy_courses").doc(courseId).collection("comments").orderBy("createdAt", "desc").get();
      courseComments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (_) {}
  }

  function buildVideoPlayerHTML(item) {
    if (!isCodeSubscriber && !isAdminUser) {
      const msg = encodeURIComponent(`مرحبا، أريد الاشتراك بالكود في منصة GeoDev Studio Pro لفتح فيديوهات الأكاديمية (${item.title}).`);
      return `
        <div class="locked-video-wall">
          <div style="font-size:34px;margin-bottom:8px;">🔒</div>
          <h4 style="margin:0 0 8px;color:#fbbf24;font-size:17px;">تشغيل الفيديوهات متاح للمشتركين بالكود فقط</h4>
          <p style="margin:0 0 14px;font-size:13px;color:#cbd5e1;line-height:1.7;">
            يمكنك تصفح تفاصيل الدورة والتعليقات بحرية، ولكن تشغيل المحاضرات ومشاهدة الشروحات التطبيقية حصري للمشتركين المفعّلين بكود المنصة (غير متاح للحسابات التجريبية).
          </p>
          <a href="https://wa.me/${ADMIN_WHATSAPP}?text=${msg}" target="_blank" rel="noopener noreferrer" class="academy-btn gold">
            💬 تواصل مع إدارة المنصة للحصول على كود التفعيل
          </a>
        </div>
      `;
    }

    const clean = safeURL(item.videoUrl);
    if (!clean) return "";
    const ytMatch = clean.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
    if (ytMatch) {
      return `<div class="course-video-frame"><iframe id="academyYtIframe" src="https://www.youtube.com/embed/${ytMatch[1]}" allowfullscreen></iframe></div>`;
    }
    return `<div class="course-video-frame"><video id="academyHtml5Video" src="${clean}" controls preload="metadata"></video></div>`;
  }

  function renderAdminUploadCardHTML() {
    if (!isAdminUser) return "";
    return `
      <div class="academy-card admin-upload-card">
        <h3><i data-lucide="upload-cloud"></i> رفع محاضرة أو فيديو جديد في دوراتنا (لوحة الأدمن)</h3>
        <p class="academy-muted">اكتب اسم المحاضر (مثل: المهندس أحمد سمير أو المهندس عمرو أشرف) وسيظهر على بطاقة المحاضرة ويرتبط بملف المحاضر تلقائياً.</p>

        <form id="academyAdminCourseForm">
          <div class="admin-upload-grid">
            <div>
              <label class="academy-muted">عنوان المحاضرة أو الفيديو *</label>
              <input type="text" id="acUpTitle" class="academy-input" placeholder="مثال: المحاضرة 1 - أساسيات ربط AutoCAD بالـ AI" required>
            </div>
            <div>
              <label class="academy-muted">اسم المحاضر *</label>
              <input type="text" id="acUpInstructor" list="gdInstructorsDatalist" class="academy-input" placeholder="مثال: المهندس أحمد سمير" required>
              <datalist id="gdInstructorsDatalist">
                ${instructorsList.map(inst => `<option value="${escapeHTML(inst.name)}"></option>`).join("")}
              </datalist>
            </div>
            <div>
              <label class="academy-muted">التخصص (من المسارات الستة) *</label>
              <select id="acUpCategory" class="academy-input">
                ${ourTracks.map(t => `<option value="${t.id}">${t.title}</option>`).join("")}
              </select>
            </div>
          </div>

          <label class="academy-muted">وصف وتفاصيل المحاضرة *</label>
          <textarea id="acUpDesc" class="academy-textarea" placeholder="اكتب شرح المحاضرة والمحاور التي تغطيها..." required></textarea>

          <div class="admin-upload-grid">
            <div>
              <label class="academy-muted">رفع ملف الفيديو من جهازك (حتى 500MB)</label>
              <input type="file" id="acUpVideoFile" class="academy-input" accept="video/*">
            </div>
            <div>
              <label class="academy-muted">أو رابط الفيديو (YouTube / MP4)</label>
              <input type="url" id="acUpVideoUrl" class="academy-input" placeholder="https://youtube.com/...">
            </div>
          </div>

          <div class="admin-upload-grid">
            <div>
              <label class="academy-muted">رفع ملف PDF مرفق</label>
              <input type="file" id="acUpPdfFile" class="academy-input" accept=".pdf,application/pdf">
            </div>
            <div>
              <label class="academy-muted">رابط ملفات (Google Drive أو MediaFire)</label>
              <input type="url" id="acUpDriveUrl" class="academy-input" placeholder="https://drive.google.com/... أو mediafire.com/...">
            </div>
          </div>

          <button type="submit" id="acUpSubmitBtn" class="academy-btn gold" style="width:100%;margin-top:6px;">
            <i data-lucide="plus-circle"></i> نشر المحاضرة وإرسال إشعار للمستخدمين
          </button>
        </form>
      </div>
    `;
  }

  function renderSelectedCourseDetailHTML() {
    if (!selectedCourseDetailId) return "";
    const item = uploadedCourses.find(c => c.id === selectedCourseDetailId);
    if (!item) return "";

    const isCompleted = completedLectures.includes(item.id);
    const canShowCompleteBtn = isCompleted || videoFinishedWatching || isAdminUser;

    return `
      <div class="academy-card course-detail-box" id="academyCourseDetailBox">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <span class="hub-card-badge">${escapeHTML(item.category || "دورة تطبيقية")}</span>
          <button type="button" class="academy-btn secondary" id="academyCloseCourseDetail">✕ إغلاق المحاضرة</button>
        </div>

        <h3 style="font-size:19px;margin-top:10px;">🎬 ${escapeHTML(item.title)}</h3>
        ${item.instructorName ? `<div class="lecturer-tag">👨‍🏫 المحاضر: ${escapeHTML(item.instructorName)}</div>` : ""}
        <p style="white-space:pre-line;margin-top:8px;">${escapeHTML(item.desc || "")}</p>

        ${buildVideoPlayerHTML(item)}

        ${isCodeSubscriber || isAdminUser ? `
          <div style="margin:12px 0;padding:12px;border-radius:14px;background:var(--bg,#101827);border:1px solid var(--ln,#334155);">
            ${isCompleted ? `
              <div style="color:#4ade80;font-weight:900;font-size:14px;">✅ تم إكمال هذه المحاضرة بنجاح وفتح المحاضرة التالية!</div>
            ` : canShowCompleteBtn ? `
              <button type="button" class="academy-btn success" style="width:100%;" data-complete-lecture="${escapeHTML(item.id)}">
                ✓ إكمال المحاضرة وفتح المحاضرة التالية
              </button>
            ` : `
              <div class="academy-muted" style="text-align:center;">
                ⏳ شاهد المحاضرة كاملة حتى النهاية ليظهر لك زر <b>«إكمال المحاضرة»</b> وتُفتح المحاضرة التالية.
              </div>
            `}
          </div>
        ` : ""}

        <div class="course-attachments-bar">
          ${safeURL(item.pdfUrl) && (isCodeSubscriber || isAdminUser) ? `
            <a href="${safeURL(item.pdfUrl)}" target="_blank" rel="noopener noreferrer" download="${escapeHTML(item.pdfName || item.title + ".pdf")}" class="academy-btn pdf-btn">
              <i data-lucide="file-text"></i> تحميل ملف PDF المرفق
            </a>
          ` : ""}
          ${safeURL(item.driveUrl) && (isCodeSubscriber || isAdminUser) ? `
            <a href="${safeURL(item.driveUrl)}" target="_blank" rel="noopener noreferrer" class="academy-btn drive-btn">
              <i data-lucide="folder-down"></i> تحميل الملفات (Google Drive / MediaFire)
            </a>
          ` : ""}
          ${isAdminUser ? `
            <button type="button" class="academy-btn danger" data-delete-uploaded-course="${escapeHTML(item.id)}">
              <i data-lucide="trash-2"></i> حذف المحاضرة (أدمن)
            </button>
          ` : ""}
        </div>

        <div class="comments-section">
          <h4>💬 التعليقات والمناقشات (${courseComments.length})</h4>
          <div style="margin:10px 0 14px;">
            <textarea id="academyNewCommentText" class="academy-textarea" style="min-height:72px;" placeholder="اكتب تعليقك أو سؤالك حول هذه المحاضرة..."></textarea>
            <button type="button" class="academy-btn" id="academyPostCommentBtn" data-course-id="${escapeHTML(item.id)}">
              <i data-lucide="send"></i> نشر التعليق
            </button>
          </div>
          <div id="academyCommentsList">
            ${courseComments.length ? courseComments.map(cm => `
              <div class="comment-item">
                <div class="comment-head">
                  <strong>👤 ${escapeHTML(cm.userName || "مستخدم")}</strong>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span class="academy-muted">${escapeHTML(cm.dateText || "")}</span>
                    ${(isAdminUser || (currentUser && cm.uid === currentUser.uid)) ? `
                      <button type="button" class="academy-btn danger" style="padding:3px 8px;font-size:11px;"
                        data-delete-comment="${escapeHTML(cm.id)}" data-course-id="${escapeHTML(item.id)}">حذف</button>
                    ` : ""}
                  </div>
                </div>
                <div style="line-height:1.75;white-space:pre-line;">${escapeHTML(cm.text || "")}</div>
              </div>
            `).join("") : `<div class="academy-muted">لا توجد تعليقات حتى الآن. كن أول من يكتب تعليقاً!</div>`}
          </div>
        </div>
      </div>
    `;
  }

  function renderInstructorsSubView() {
    const adminAddInstructorHTML = isAdminUser ? `
      <div class="academy-card admin-upload-card">
        <h3><i data-lucide="user-plus"></i> إضافة بطاقة محاضر جديد (لوحة الأدمن)</h3>
        <form id="academyAddInstructorForm">
          <div class="admin-upload-grid">
            <div>
              <label class="academy-muted">اسم المحاضر واللقب *</label>
              <input type="text" id="instName" class="academy-input" placeholder="مثال: المهندس أحمد سمير" required>
            </div>
            <div>
              <label class="academy-muted">المسمى الوظيفي / الصفة *</label>
              <input type="text" id="instRole" class="academy-input" placeholder="مثال: مهندس مساحة وخرائط و GIS" required>
            </div>
          </div>

          <div class="admin-upload-grid">
            <div>
              <label class="academy-muted">العمر (كم سنة)</label>
              <input type="text" id="instAge" class="academy-input" placeholder="مثال: 23 سنة">
            </div>
            <div>
              <label class="academy-muted">رقم الهاتف / واتساب</label>
              <input type="text" id="instPhone" class="academy-input" placeholder="مثال: 01015912371">
            </div>
            <div>
              <label class="academy-muted">يحاضر منذ عام</label>
              <input type="text" id="instSince" class="academy-input" placeholder="مثال: 2024">
            </div>
          </div>

          <label class="academy-muted">التخصصات والبرامج التي يدرسها *</label>
          <input type="text" id="instSpecialties" class="academy-input" placeholder="مثال: AutoCAD + AI، GIS، المساحة، Civil 3D" required>

          <label class="academy-muted">نبذة عن الخبرات والمشاريع</label>
          <textarea id="instBio" class="academy-textarea" placeholder="اكتب تفاصيل خبرات المحاضر ومسيرته العلمية والعملية..."></textarea>

          <button type="submit" id="instSaveBtn" class="academy-btn gold" style="width:100%;">
            <i data-lucide="save"></i> حفظ ونشر بطاقة المحاضر
          </button>
        </form>
      </div>
    ` : "";

    return `
      ${adminAddInstructorHTML}

      <div class="academy-card" style="margin-bottom:15px;">
        <h3>👨‍🏫 نخبة المحاضرين والمدربين في المنصة (${instructorsList.length})</h3>
        <p class="academy-muted">تعرف على بيانات وخبرات وتخصصات المحاضرين القائمين على إعداد الدورات والشروحات التطبيقية.</p>

        <div class="academy-grid" style="margin-top:12px;">
          ${instructorsList.map(inst => {
            const lecturesCount = uploadedCourses.filter(c =>
              String(c.instructorName || "").trim() === String(inst.name || "").trim()
            ).length;
            const cleanPhone = String(inst.phone || "").replace(/[^0-9]/g, "");
            const waPhone = cleanPhone.startsWith("01") ? "2" + cleanPhone : cleanPhone;

            return `
              <div class="academy-card instructor-card">
                <div>
                  <div class="inst-header">
                    <div class="inst-avatar">👨‍🏫</div>
                    <div>
                      <h3 style="margin:0 0 3px;font-size:17px;">${escapeHTML(inst.name)}</h3>
                      <div style="font-size:12px;color:#fbbf24;font-weight:800;">${escapeHTML(inst.role || "محاضر معتمد")}</div>
                    </div>
                  </div>

                  <div class="inst-meta-grid" style="margin-top:11px;">
                    <div class="inst-meta-item">
                      <b>🎂 السن:</b>
                      <span>${escapeHTML(inst.age || "غير محدد")}</span>
                    </div>
                    <div class="inst-meta-item">
                      <b>📅 يحاضر منذ:</b>
                      <span>${escapeHTML(inst.teachingSince || "2024")}</span>
                    </div>
                    <div class="inst-meta-item">
                      <b>📞 رقم التواصل:</b>
                      <span style="direction:ltr;display:inline-block;">${escapeHTML(inst.phone || "عبر المنصة")}</span>
                    </div>
                    <div class="inst-meta-item">
                      <b>🎬 المحاضرات:</b>
                      <span>${lecturesCount} محاضرة مرفوعة</span>
                    </div>
                  </div>

                  <div style="margin-top:10px;font-size:12.5px;">
                    <strong style="color:#38bdf8;">🎯 التخصصات:</strong>
                    <div style="margin-top:3px;line-height:1.6;">${escapeHTML(inst.specialties || "")}</div>
                  </div>

                  ${inst.bio ? `
                    <div style="margin-top:8px;font-size:12.5px;">
                      <strong style="color:#38bdf8;">💼 الخبرات:</strong>
                      <p style="margin:3px 0 0;line-height:1.7;">${escapeHTML(inst.bio)}</p>
                    </div>
                  ` : ""}
                </div>

                <div style="display:flex;flex-direction:column;gap:7px;margin-top:8px;">
                  <button type="button" class="academy-btn gold" style="width:100%;" data-view-instructor-courses="${escapeHTML(inst.name)}">
                    🎬 عرض محاضرات ${escapeHTML(inst.name)} (${lecturesCount})
                  </button>
                  ${waPhone ? `
                    <a href="https://wa.me/${waPhone}" target="_blank" rel="noopener noreferrer" class="academy-btn drive-btn" style="width:100%;">
                      💬 تواصل واتساب مع المحاضر
                    </a>
                  ` : ""}
                  ${isAdminUser && !String(inst.id).startsWith("inst_") ? `
                    <button type="button" class="academy-btn danger" style="width:100%;" data-delete-instructor="${escapeHTML(inst.id)}">
                      🗑 حذف بطاقة المحاضر
                    </button>
                  ` : ""}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function renderCourses() {
    const content = $("academyContent");
    if (!content) return;

    const subSwitcherHTML = `
      <div class="courses-sub-switcher">
        <button type="button" class="sub-switch-btn ${coursesSubView === "lectures" ? "active" : ""}" data-courses-subview="lectures">
          🎬 الكورسات والمحاضرات (${uploadedCourses.length})
        </button>
        <button type="button" class="sub-switch-btn ${coursesSubView === "instructors" ? "active" : ""}" data-courses-subview="instructors">
          👨‍🏫 المحاضرون والمدربون (${instructorsList.length})
        </button>
      </div>
    `;

    if (coursesSubView === "instructors") {
      content.innerHTML = subSwitcherHTML + renderInstructorsSubView();
      bindAddInstructorForm();
      refreshAcademyIcons(content);
      return;
    }

    const filteredLectures = uploadedCourses.filter(c => {
      const matchTrack = selectedTrackFilter === "all" || c.category === selectedTrackFilter;
      const matchInst = selectedInstructorFilter === "all" || String(c.instructorName || "").trim() === selectedInstructorFilter;
      return matchTrack && matchInst;
    });

    content.innerHTML = `
      ${subSwitcherHTML}
      ${renderAdminUploadCardHTML()}

      <div class="tracks-banner">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <h3 style="margin:0;font-size:16px;font-weight:900;">🎯 مسارات وتخصصات المنصة (6 تخصصات تطبيقية)</h3>
          <span class="hub-card-badge">${uploadedCourses.length} محاضرة مرفوعة</span>
        </div>
        <p class="academy-muted" style="margin:6px 0 0;">اختر التخصص لعرض محاضراته مرتبة بالتسلسل (يجب إكمال كل محاضرة لفتح المحاضرة التي تليها):</p>

        <div class="tracks-pills">
          <button type="button" class="track-pill-btn ${selectedTrackFilter === "all" && selectedInstructorFilter === "all" ? "active" : ""}" data-filter-track="all">
            📚 جميع التخصصات (${uploadedCourses.length})
          </button>
          ${ourTracks.map(tr => {
            const count = uploadedCourses.filter(c => c.category === tr.id).length;
            return `
              <button type="button" class="track-pill-btn ${selectedTrackFilter === tr.id ? "active" : ""}" data-filter-track="${tr.id}">
                <i data-lucide="${tr.icon}" style="width:15px;height:15px;"></i>
                ${tr.id} (${count})
              </button>
            `;
          }).join("")}
        </div>

        ${selectedInstructorFilter !== "all" ? `
          <div style="margin-top:10px;display:flex;align-items:center;justify-content:space-between;background:var(--bg,#101827);padding:8px 12px;border-radius:10px;">
            <span style="font-size:12.5px;font-weight:800;color:#fbbf24;">👨‍🏫 تصفية حسب المحاضر: ${escapeHTML(selectedInstructorFilter)}</span>
            <button type="button" class="academy-btn secondary" style="padding:4px 10px;font-size:11.5px;" data-clear-instructor-filter>عرض كل المحاضرين ✕</button>
          </div>
        ` : ""}
      </div>

      ${renderSelectedCourseDetailHTML()}

      <div class="academy-card">
        <h3>🎬 محاضرات ودروس المنصة (${filteredLectures.length})</h3>
        <p class="academy-muted">التصفح متاح للجميع، وتشغيل الفيديوهات متاح للمشتركين بالكود فقط.</p>

        <div class="academy-grid">
          ${filteredLectures.length ? filteredLectures.map(item => {
            const unlocked = isLectureUnlocked(item);
            const done = completedLectures.includes(item.id);
            const trackList = uploadedCourses.filter(c => c.category === item.category);
            const lectureNum = trackList.findIndex(c => c.id === item.id) + 1;

            return `
              <div class="academy-card ${unlocked ? "" : "lecture-locked"}">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
                  <span class="hub-card-badge">${escapeHTML(item.category)} • محاضرة ${lectureNum}</span>
                  ${done ? `<span style="color:#4ade80;font-size:12px;font-weight:900;">✅ مكتملة</span>` : unlocked ? `<span style="color:#38bdf8;font-size:12px;font-weight:800;">🔓 مفتوحة</span>` : `<span style="color:#f87171;font-size:12px;font-weight:800;">🔒 مقفولة</span>`}
                </div>
                <h3>${escapeHTML(item.title)}</h3>
                ${item.instructorName ? `<div class="lecturer-tag">👨‍🏫 ${escapeHTML(item.instructorName)}</div>` : ""}
                <p>${escapeHTML(String(item.desc || "").slice(0, 110))}${String(item.desc || "").length > 110 ? "..." : ""}</p>

                ${unlocked ? `
                  <button type="button" class="academy-btn gold" style="width:100%;" data-open-uploaded-course="${escapeHTML(item.id)}">
                    <i data-lucide="play-circle"></i> فتح المحاضرة والتفاصيل
                  </button>
                ` : `
                  <button type="button" class="academy-btn secondary" style="width:100%;" disabled>
                    🔒 أكمل المحاضرة رقم ${lectureNum - 1} أولاً لفتحها
                  </button>
                `}
              </div>
            `;
          }).join("") : `
            <div class="academy-empty">لا توجد محاضرات مرفوعة مطابقة للاختيار الحالي.</div>
          `}
        </div>
      </div>
    `;

    bindCourseUploadForm();
    setupVideoWatchCompletionWatcher();
    refreshAcademyIcons(content);
  }

  function setupVideoWatchCompletionWatcher() {
    clearTimeout(ytWatchTimer);
    if (!selectedCourseDetailId || videoFinishedWatching) return;

    const html5Vid = $("academyHtml5Video");
    if (html5Vid) {
      html5Vid.addEventListener("ended", () => {
        videoFinishedWatching = true;
        renderCourses();
        notify("✔ أتممت مشاهدة المحاضرة! يمكنك الآن الضغط على زر «إكمال المحاضرة».", "success");
      });
      return;
    }

    const ytFrame = $("academyYtIframe");
    if (ytFrame) {
      ytWatchTimer = setTimeout(() => {
        videoFinishedWatching = true;
        if (activeTab === "courses" && selectedCourseDetailId) {
          renderCourses();
        }
      }, 45000);
    }
  }

  function renderOfficialCourses(query = "") {
    const content = $("academyContent");
    if (!content) return;
    const catalog = window.GEOAcademyContent;
    if (!catalog) {
      content.innerHTML = `<div class="academy-empty">تعذر تحميل دليل الكورسات الرسمية.</div>`;
      return;
    }

    const search = String(query || "").trim().toLowerCase();
    const categories = catalog.getAllCategories().filter(category =>
      category.name.toLowerCase().includes(search) ||
      category.topics.some(topic => topic.toLowerCase().includes(search))
    );
    const realCourses = catalog.getCourses().filter(course =>
      !search ||
      course.title.toLowerCase().includes(search) ||
      course.provider.toLowerCase().includes(search) ||
      course.category.toLowerCase().includes(search)
    );

    content.innerHTML = `
      <div class="academy-card">
        <h3>🌐 مكتبة الكورسات الرسمية العالمية</h3>
        <p>روابط مباشرة للدورات التدريبية المعتمدة من الجهات الرسمية (Esri, Autodesk, NARSS, Spatial Thoughts).</p>
        <input id="academyCatalogSearch" class="academy-input" placeholder="ابحث عن ArcGIS أو AutoCAD أو Civil 3D..."
          value="${escapeHTML(query)}" oninput="window.GEOAcademyUI.search(this.value)">
        <div class="academy-muted">${realCourses.length} كورس رسمي متاح</div>
      </div>

      <div class="academy-grid" style="margin-top:14px;">
        ${realCourses.length ? realCourses.map(course => `
          <div class="academy-card">
            <h3>${escapeHTML(course.title)}</h3>
            <p>🏫 ${escapeHTML(course.provider)}</p>
            <p class="academy-muted">المستوى: ${escapeHTML(course.level)}<br>اللغة: ${escapeHTML(course.language)}<br>السعر: ${escapeHTML(course.price)}</p>
            <a class="academy-btn" href="${safeURL(course.url)}" target="_blank" rel="noopener noreferrer" style="width:100%;">فتح الكورس الأصلي ↗</a>
          </div>
        `).join("") : `<div class="academy-empty">لا توجد كورسات رسمية مطابقة للبحث.</div>`}
      </div>

      <div class="academy-grid" style="margin-top:15px;">
        ${categories.map(category => {
          const sources = catalog.getSources(category.id);
          return `
            <div class="academy-card">
              <div class="academy-icon"><i data-lucide="book-open"></i></div>
              <h3>${escapeHTML(category.name)}</h3>
              <p class="academy-muted">${category.topics.length} موضوعًا تعليميًا</p>
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
                ${category.topics.map(topic => `
                  <a class="academy-btn secondary" style="font-size:11px" target="_blank" rel="noopener noreferrer"
                    href="${safeURL(catalog.searchUrl("youtube", topic))}">${escapeHTML(topic)} 🔎</a>
                `).join("")}
              </div>
              <h4>المصادر الرسمية</h4>
              ${sources.map(source => `
                <div style="margin:8px 0;padding:9px;background:var(--bg,#101827);border-radius:9px">
                  <b>${escapeHTML(source.name)}</b>
                  <div class="academy-muted">${escapeHTML(source.platform)} • ${escapeHTML(source.language || "لغات متعددة")}</div>
                  <a href="${safeURL(source.url)}" target="_blank" rel="noopener noreferrer" class="academy-btn" style="margin-top:6px">زيارة المصدر ↗</a>
                </div>
              `).join("")}
            </div>
          `;
        }).join("")}
      </div>
    `;
    refreshAcademyIcons(content);
  }

  function renderBooks() {
    const content = $("academyContent");
    if (!content) return;
    const referenceLibrary = [
      { title: "دليل نظم المعلومات الجغرافية المتكامل (ArcGIS Pro)", category: "GIS", desc: "مرجع شامل لإنشاء قواعد البيانات الجغرافية، التحليل المكاني، وإخراج الخرائط الاحترافية.", url: "https://pro.arcgis.com/en/pro-app/latest/get-started/get-started.htm" },
      { title: "المرجع الرسمي لبرنامج QGIS التدريبي", category: "GIS مفتوح المصدر", desc: "دليل عملي خطوة بخطوة للتعامل مع الطبقات المتجهة والشبكية والتحليل الهيدرولوجي.", url: "https://docs.qgis.org/latest/en/docs/training_manual/" },
      { title: "أساسيات المساحة المستوية والجيوديسية والتوقيع", category: "المساحة", desc: "مرجع حسابات الترافيرس، الميزانية، أرصاد GNSS، ومعادلات التحويل بين المراجع.", url: "https://www.esa.gov.eg/" },
      { title: "دليل الاستشعار عن بعد ومعالجة المرئيات الفضائية", category: "Remote Sensing", desc: "شرح التصنيف المراقب وغير المراقب، المؤشرات الطيفية NDVI/NDWI، وتحليل بيانات Sentinel.", url: "https://training.narss.sci.eg/" },
      { title: "مرجع أوامر AutoCAD و AutoLISP للمكاتب الفنية", category: "CAD & Automation", desc: "دليل اختصارات الأوتوكاد وأساسيات كتابة الليسبات لأتمتة اللوحات المساحية.", url: "https://www.autodesk.com/learn" },
      { title: "دليل بايثون للتحليل المكاني (GeoPandas & ArcPy)", category: "برمجة GIS", desc: "مرجع أتمتة المعالجة المكانية وتحليل البيانات الجغرافية بلغة Python.", url: "https://courses.spatialthoughts.com/" }
    ];
    content.innerHTML = `
      <div class="academy-card" style="margin-bottom:15px;">
        <h3>📚 مكتبة الكتب والمراجع الهندسية</h3>
        <p>مجموعة مختارة من الأدلة الرسمية والمراجع العلمية في المساحة ونظم المعلومات الجغرافية والاستشعار عن بعد.</p>
      </div>
      <div class="academy-grid">
        ${referenceLibrary.map(book => `
          <div class="academy-card">
            <span class="hub-card-badge">${escapeHTML(book.category)}</span>
            <h3>📖 ${escapeHTML(book.title)}</h3>
            <p>${escapeHTML(book.desc)}</p>
            <a href="${safeURL(book.url)}" target="_blank" rel="noopener noreferrer" class="academy-btn" style="width:100%;">فتح المرجع الرسمي ↗</a>
          </div>
        `).join("")}
      </div>
    `;
    refreshAcademyIcons(content);
  }

  function renderProgress() {
    const content = $("academyContent");
    if (!content) return;

    const dynamicTracks = ourTracks.map(track => {
      const trackLectures = uploadedCourses.filter(c => c.category === track.id);
      const total = trackLectures.length;
      const done = trackLectures.filter(c => completedLectures.includes(c.id)).length;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;
      return { ...track, total, done, percent };
    });

    const totalAllLectures = uploadedCourses.length;
    const totalAllCompleted = uploadedCourses.filter(c => completedLectures.includes(c.id)).length;
    const overallPct = totalAllLectures > 0 ? Math.round((totalAllCompleted / totalAllLectures) * 100) : 0;

    content.innerHTML = `
      <div class="academy-card" style="margin-bottom:15px;border-color:#e09f24;">
        <h3>📊 تقدمك التعليمي العام في المنصة (${overallPct}%)</h3>
        <p>يتم تحديث بطاقات التقدم تلقائياً مع كل محاضرة جديدة تُرفع في الأكاديمية أو تُكمل مشاهدتها.</p>
        <div class="academy-progress"><span style="width:${overallPct}%"></span></div>
        <div class="academy-muted">أتممت <b>${totalAllCompleted}</b> من أصل <b>${totalAllLectures}</b> محاضرة مرفوعة على المنصة.</div>
      </div>

      <div class="academy-grid">
        ${dynamicTracks.map(tr => `
          <div class="academy-card">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span class="hub-card-badge">${tr.done} / ${tr.total} محاضرة</span>
              <strong style="color:#e09f24;font-size:15px;">${tr.percent}%</strong>
            </div>
            <h3><i data-lucide="${tr.icon}"></i> ${escapeHTML(tr.title)}</h3>
            <div class="academy-progress"><span style="width:${tr.percent}%"></span></div>
            <p class="academy-muted">
              ${tr.total === 0 ? "لم تُرفع محاضرات في هذا الكورس بعد." : tr.percent === 100 ? "🎉 أتممت جميع محاضرات هذا الكورس بنجاح!" : `متبقي لك ${tr.total - tr.done} محاضرة لإتمام الكورس بالكامل.`}
            </p>
            ${tr.total > 0 ? `<button type="button" class="academy-btn secondary" style="width:100%;" data-jump-track="${escapeHTML(tr.id)}">الذهاب لمحاضرات الكورس ↗</button>` : ""}
          </div>
        `).join("")}
      </div>
    `;
    refreshAcademyIcons(content);
  }

  function renderNotes() {
    const content = $("academyContent");
    content.innerHTML = `
      <div class="academy-card">
        <h3>📝 إضافة ملاحظة دراسية</h3>
        <input id="academyNoteTitle" class="academy-input" maxlength="120" placeholder="عنوان الملاحظة">
        <textarea id="academyNoteContent" class="academy-textarea" maxlength="10000" placeholder="اكتب ملاحظتك هنا..."></textarea>
        <button class="academy-btn" id="academySaveNote">حفظ الملاحظة</button>
      </div>
      <h3 style="margin-top:16px;">ملاحظاتي المحفوظة</h3>
      <div class="academy-grid">
        ${notes.length ? notes.map(note => `
          <div class="academy-card">
            <h3>${escapeHTML(note.title || "ملاحظة بدون عنوان")}</h3>
            <p style="white-space:pre-wrap">${escapeHTML(note.content || "")}</p>
            <button class="academy-btn danger" data-delete-note="${escapeHTML(note.id)}">حذف</button>
          </div>
        `).join("") : '<div class="academy-empty">لا توجد ملاحظات محفوظة حتى الآن.</div>'}
      </div>
    `;
    $("academySaveNote").addEventListener("click", saveNote);
  }

  function renderMemory() {
    const content = $("academyContent");
    content.innerHTML = `
      <div class="academy-card">
        <h3>🧠 الذاكرة التعليمية الشخصية</h3>
        <p class="academy-muted">احفظ معلومات أو نقاطًا تريد الرجوع إليها لاحقًا. هذه الذاكرة خاصة بحسابك.</p>
        <textarea id="academyMemoryContent" class="academy-textarea" maxlength="10000" placeholder="اكتب المعلومة التي تريد حفظها..."></textarea>
        <select id="academyMemoryCategory" class="academy-input">
          <option value="general">معلومات عامة</option>
          <option value="gis">GIS</option>
          <option value="surveying">المساحة</option>
          <option value="remote-sensing">الاستشعار عن بعد</option>
          <option value="programming">البرمجة</option>
          <option value="study">ملاحظات دراسية</option>
        </select>
        <button class="academy-btn" id="academySaveMemory">حفظ في الذاكرة</button>
      </div>
      <h3 style="margin-top:16px;">المعلومات المحفوظة</h3>
      <div class="academy-grid">
        ${memories.length ? memories.map(item => `
          <div class="academy-card">
            <div class="academy-muted">${escapeHTML(item.category || "general")}</div>
            <p style="white-space:pre-wrap">${escapeHTML(item.content || "")}</p>
            <button class="academy-btn danger" data-delete-memory="${escapeHTML(item.id)}">حذف</button>
          </div>
        `).join("") : '<div class="academy-empty">ذاكرتك التعليمية فارغة حاليًا.</div>'}
      </div>
    `;
    $("academySaveMemory").addEventListener("click", saveMemory);
  }

  function renderTeacher() {
    const content = $("academyContent");
    if (!content) return;
    content.innerHTML = `
      <section class="academy-teacher">
        <header class="teacher-header">
          <div class="teacher-avatar">👨‍🏫</div>
          <div>
            <h3>GEO Teacher</h3>
            <p>مدرسك الذكي في الجغرافيا والجيوماتكس</p>
            <span class="teacher-online">● متصل بالمحرك الذكي</span>
          </div>
        </header>
        <div class="teacher-subject">
          <label for="academyTeacherSubject">التخصص الدراسي</label>
          <select id="academyTeacherSubject" class="academy-input">
            <option value="الجغرافيا العامة">الجغرافيا العامة</option>
            <option value="نظم المعلومات الجغرافية GIS">GIS</option>
            <option value="المساحة والرفع المساحي">المساحة</option>
            <option value="الاستشعار عن بعد ERDAS">الاستشعار عن بعد</option>
            <option value="AutoCAD و Civil 3D">AutoCAD و Civil 3D</option>
            <option value="Python و GIS Programming">برمجة GIS</option>
            <option value="الخرائط والكارتوجرافيا">الخرائط والكارتوجرافيا</option>
            <option value="موضوع عام">موضوع آخر</option>
          </select>
        </div>
        <div id="academyTeacherMessages" class="academy-teacher-messages" aria-live="polite">
          <div class="teacher-welcome">
            <div class="teacher-avatar">👨‍🏫</div>
            <div class="teacher-bubble">
              <strong>أهلاً بك في GEO Teacher!</strong>
              <p>أنا مدرسك الذكي. اسألني عن أي درس وسأشرحه لك خطوة بخطوة مع الأمثلة والتطبيقات.</p>
            </div>
          </div>
        </div>
        <div class="teacher-composer">
          <textarea id="academyTeacherQuestion" class="academy-textarea" rows="3" placeholder="اكتب سؤالك أو اسم الدرس هنا..."></textarea>
          <button type="button" class="academy-btn" id="academyTeacherSend" style="width:100%;">إرسال السؤال ➤</button>
        </div>
      </section>
    `;
  }

  function renderSmartSearch() {
    const content = $("academyContent");
    if (!content) return;
    content.innerHTML = `
      <div class="academy-card academy-search-box">
        <h3>🔎 الباحث الذكي عن الكورسات</h3>
        <p class="academy-muted">ابحث عن كورسات حقيقية من YouTube والمنصات التعليمية والمواقع الرسمية.</p>
        <textarea id="academySmartQuery" class="academy-textarea" rows="4"
          placeholder="مثال: ابحث عن أفضل كورسات AutoCAD من الصفر باللغة العربية، المجانية والمدفوعة..."></textarea>
        <button type="button" class="academy-btn" id="academySmartSearchBtn" style="margin-top:12px;width:100%">🔍 ابدأ البحث الذكي</button>
      </div>
      <div id="academySmartResults" class="academy-results-box" style="margin-top:16px;width:100%"></div>
    `;
  }

  function renderTab() {
    const content = $("academyContent");
    if (!content) return;

    document.querySelectorAll("[data-academy-tab]").forEach(button => {
      button.classList.toggle("active", button.dataset.academyTab === activeTab);
    });

    if (!currentUser) {
      content.innerHTML = `<div class="academy-empty">يجب تسجيل الدخول أولًا لاستخدام الأكاديمية وحفظ بياناتك.</div>`;
      refreshAcademyIcons($("s-academy"));
      return;
    }

    if (activeTab === "courses") renderCourses();
    if (activeTab === "official-courses") renderOfficialCourses();
    if (activeTab === "smart-search") renderSmartSearch();
    if (activeTab === "books") renderBooks();
    if (activeTab === "teacher") renderTeacher();
    if (activeTab === "notes") renderNotes();
    if (activeTab === "memory") renderMemory();
    if (activeTab === "progress") renderProgress();

    refreshAcademyIcons($("s-academy"));
  }

  async function refreshData() {
    if (!currentUser) return;
    const api = window.GEOAcademy;

    await Promise.all([
      loadInstructors(),
      loadUploadedCourses(),
      loadUserCompletedLectures()
    ]);

    if (api && api.ready) {
      try {
        await api.getProfile() || await api.createProfile();
        const [n, m] = await Promise.all([api.getNotes(), api.getMemory(100)]);
        notes = Array.isArray(n) ? n : [];
        memories = Array.isArray(m) ? m : [];
      } catch (_) {}
    }

    setStatus("تم الاتصال بقاعدة بيانات الأكاديمية.");
    renderTab();
  }

  function bindAddInstructorForm() {
    const form = $("academyAddInstructorForm");
    if (!form || form.dataset.bound) return;
    form.dataset.bound = "1";

    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (!isAdminUser) return;

      const btn = $("instSaveBtn");
      const name = $("instName")?.value.trim();
      const role = $("instRole")?.value.trim();
      const age = $("instAge")?.value.trim();
      const phone = $("instPhone")?.value.trim();
      const teachingSince = $("instSince")?.value.trim();
      const specialties = $("instSpecialties")?.value.trim();
      const bio = $("instBio")?.value.trim();

      if (!name || !role || !specialties) {
        return notify("أدخل اسم المحاضر والصفة والتخصصات.", "error");
      }

      btn.disabled = true;
      btn.textContent = "⏳ جاري حفظ بطاقة المحاضر...";

      try {
        const instObj = {
          name,
          role,
          age: age || "",
          phone: phone || "",
          teachingSince: teachingSince || "2024",
          specialties,
          bio: bio || "",
          createdAt: Date.now()
        };

        const db = getDb();
        if (db) {
          const added = await db.collection("geodev_academy_instructors").add(instObj);
          instructorsList.push({ id: added.id, ...instObj });
        } else {
          instructorsList.push({ id: "custom_" + Date.now(), ...instObj });
        }

        localStorage.setItem("gd_academy_instructors", JSON.stringify(instructorsList));
        notify("✔ تم إضافة بطاقة المحاضر بنجاح!", "success");
        renderCourses();
      } catch (err) {
        notify("خطأ أثناء حفظ المحاضر: " + (err.message || ""), "error");
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="save"></i> حفظ ونشر بطاقة المحاضر`;
      }
    });
  }

  function bindCourseUploadForm() {
    const form = $("academyAdminCourseForm");
    if (!form || form.dataset.bound) return;
    form.dataset.bound = "1";

    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (!isAdminUser) return;

      const btn = $("acUpSubmitBtn");
      const title = $("acUpTitle")?.value.trim();
      const instructorName = $("acUpInstructor")?.value.trim();
      const category = $("acUpCategory")?.value || "AutoCAD + AI";
      const desc = $("acUpDesc")?.value.trim();
      const videoFile = $("acUpVideoFile")?.files?.[0];
      let videoUrl = $("acUpVideoUrl")?.value.trim();
      const pdfFile = $("acUpPdfFile")?.files?.[0];
      const driveUrl = $("acUpDriveUrl")?.value.trim();

      if (!title || !desc || !instructorName) {
        notify("اكتب عنوان المحاضرة واسم المحاضر والوصف أولاً.", "error");
        return;
      }

      btn.disabled = true;
      btn.textContent = "⏳ جاري النشر وإرسال الإشعار للمستخدمين...";

      try {
        const hasBucket = !!(window.firebase && firebase.app && firebase.app().options && firebase.app().options.storageBucket);

        if (videoFile) {
          if (videoFile.size > 500 * 1024 * 1024) throw new Error("حجم الفيديو يتجاوز 500 ميجابايت.");
          if (!hasBucket) throw new Error("رفع الملفات المباشر غير مفعّل؛ ضع رابط الفيديو في خانة الرابط واترك اختيار الملف فارغاً.");
          const ref = firebase.storage().ref(`academy_courses_videos/${Date.now()}_${videoFile.name}`);
          await ref.put(videoFile);
          videoUrl = await ref.getDownloadURL();
        }

        let pdfUrl = "";
        let pdfName = "";
        if (pdfFile) {
          if (!hasBucket) throw new Error("رفع PDF المباشر غير مفعّل؛ ارفع الملف على Google Drive وضع رابطه في خانة الروابط.");
          pdfName = pdfFile.name;
          const pdfRef = firebase.storage().ref(`academy_courses_pdfs/${Date.now()}_${pdfFile.name}`);
          await pdfRef.put(pdfFile);
          pdfUrl = await pdfRef.getDownloadURL();
        }

        const courseDoc = {
          title,
          instructorName,
          category,
          desc,
          videoUrl: videoUrl || "",
          pdfUrl,
          pdfName,
          driveUrl: driveUrl || "",
          authorEmail: currentUser.email || ADMIN_EMAIL,
          createdAt: Date.now()
        };

        const db = getDb();
        if (db) {
          const added = await db.collection("geodev_academy_courses").add(courseDoc);
          uploadedCourses.push({ id: added.id, ...courseDoc });
        } else {
          uploadedCourses.push({ id: "local_" + Date.now(), ...courseDoc });
        }

        localStorage.setItem("gd_academy_uploaded_courses", JSON.stringify(uploadedCourses));
        renderSmartNotificationBanner();
        notify("✔ تم نشر المحاضرة باسم المحاضر وإرسال إشعار ذكي للجميع!", "success");
        renderCourses();
      } catch (err) {
        notify("حدث خطأ أثناء النشر: " + (err.message || ""), "error");
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="plus-circle"></i> نشر المحاضرة وإرسال إشعار للمستخدمين`;
        refreshAcademyIcons(form);
      }
    });
  }

  async function saveNote() {
    const title = $("academyNoteTitle").value.trim();
    const content = $("academyNoteContent").value.trim();
    if (!title || !content) return notify("اكتب عنوان الملاحظة ومحتواها أولًا.", "error");
    try {
      await window.GEOAcademy.saveNote(title, content);
      notify("تم حفظ الملاحظة بنجاح.", "success");
      await refreshData();
    } catch (error) {
      notify("لم يتم حفظ الملاحظة: " + (error.message || ""), "error");
    }
  }

  async function saveMemory() {
    const content = $("academyMemoryContent").value.trim();
    const category = $("academyMemoryCategory").value;
    if (!content) return notify("اكتب المعلومة التي تريد حفظها.", "error");
    try {
      await window.GEOAcademy.saveMemory(content, category);
      notify("تم حفظ المعلومة في ذاكرتك.", "success");
      await refreshData();
    } catch (error) {
      notify("لم يتم حفظ المعلومة: " + (error.message || ""), "error");
    }
  }

  async function deleteNote(id) {
    if (!confirm("هل تريد حذف هذه الملاحظة؟")) return;
    try {
      await window.GEOAcademy.deleteNote(id);
      notify("تم حذف الملاحظة.", "success");
      await refreshData();
    } catch (error) {
      notify("تعذر حذف الملاحظة.", "error");
    }
  }

  async function deleteMemory(id) {
    if (!confirm("هل تريد حذف هذه المعلومة من الذاكرة؟")) return;
    try {
      await window.GEOAcademy.deleteMemory(id);
      notify("تم حذف المعلومة.", "success");
      await refreshData();
    } catch (error) {
      notify("تعذر حذف المعلومة.", "error");
    }
  }

  function getPlatformInfo(rawUrl) {
    let host = "";
    try {
      const parsed = new URL(String(rawUrl || ""));
      if (!["https:", "http:"].includes(parsed.protocol)) throw new Error("Invalid URL");
      host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    } catch (_) {
      return { name: "مصدر تعليمي", emoji: "🌐", icon: "" };
    }
    const platforms = [
      { match: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/, name: "YouTube", emoji: "▶️" },
      { match: /(^|\.)coursera\.org$/, name: "Coursera", emoji: "🎓" },
      { match: /(^|\.)udemy\.com$/, name: "Udemy", emoji: "🟣" },
      { match: /(^|\.)autodesk\.com$/, name: "Autodesk", emoji: "🅰️" },
      { match: /(^|\.)edx\.org$/, name: "edX", emoji: "🎓" },
      { match: /(^|\.)esri\.com$/, name: "Esri", emoji: "🌍" }
    ];
    const found = platforms.find(p => p.match.test(host));
    return {
      name: found ? found.name : host,
      emoji: found ? found.emoji : "🌐",
      icon: "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(host) + "&sz=64"
    };
  }

  function renderAnalysisMarkdown(markdown) {
    const source = String(markdown || "");
    if (!source) return "";
    if (window.marked && typeof window.marked.parse === "function" && window.DOMPurify && typeof window.DOMPurify.sanitize === "function") {
      return window.DOMPurify.sanitize(window.marked.parse(source));
    }
    return `<p>${escapeHTML(source).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>")}</p>`;
  }

  function renderSearchResults(data) {
    const results = Array.isArray(data.results) ? data.results : [];
    const analysis = data.analysis
      ? `<div class="academy-card" style="margin-bottom:14px"><h3>🤖 تحليل GEO AI</h3><div class="academy-analysis">${renderAnalysisMarkdown(data.analysis)}</div></div>`
      : "";
    const summary = data.answer
      ? `<div class="academy-card" style="margin-bottom:14px"><h3>📝 ملخص البحث</h3><p>${escapeHTML(data.answer)}</p></div>`
      : "";

    const cards = results.map((item, index) => {
      const platform = getPlatformInfo(item.url);
      const title = escapeHTML(item.title || "مصدر تعليمي " + (index + 1));
      const description = escapeHTML(item.content || "لا يوجد وصف متاح.");
      const url = safeURL(item.url);
      const icon = platform.icon
        ? `<img class="academy-platform-icon" src="${platform.icon}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">`
        : "";
      const fallback = `<span class="academy-platform-fallback" style="${platform.icon ? "display:none" : ""}">${escapeHTML(platform.emoji)}</span>`;

      return `
        <article class="academy-course-result">
          <div class="academy-course-platform">
            ${icon}
            ${fallback}
            <div>
              <div class="academy-muted">المنصة التعليمية</div>
              <strong>${escapeHTML(platform.name)}</strong>
            </div>
          </div>
          <h4>${index + 1}. ${title}</h4>
          <p>${description}</p>
          ${url ? `<a href="${url}" target="_blank" rel="noopener noreferrer" class="academy-btn" style="width:100%;margin-top:auto">فتح المصدر على ${escapeHTML(platform.name)} ↗</a>` : `<span class="academy-muted">الرابط غير متاح</span>`}
        </article>
      `;
    }).join("");

    return `<h3>🎓 نتائج البحث (${results.length})</h3><div class="academy-search-grid">${cards || '<div class="academy-empty">لم يتم العثور على نتائج.</div>'}</div>${summary}${analysis}`;
  }

  function bindEvents() {
    if (eventsBound) return;
    eventsBound = true;

    document.addEventListener("click", async event => {
      if (event.target.closest("#gdDismissVideoAlert")) {
        event.stopPropagation();
        if (uploadedCourses.length) {
          localStorage.setItem("gd_dismissed_video_alert", uploadedCourses[uploadedCourses.length - 1].id);
        }
        const wrap = $("gdSmartVideoAlertWrap");
        if (wrap) wrap.innerHTML = "";
        return;
      }

      const jumpAlert = event.target.closest("[data-jump-to-video]");
      if (jumpAlert) {
        const targetId = jumpAlert.dataset.jumpToVideo;
        const targetLecture = uploadedCourses.find(c => c.id === targetId);
        if (targetLecture) {
          activeTab = "courses";
          coursesSubView = "lectures";
          selectedTrackFilter = targetLecture.category || "all";
          selectedInstructorFilter = "all";
          if (isLectureUnlocked(targetLecture)) {
            await checkCodeSubscriptionStatus(currentUser);
            selectedCourseDetailId = targetLecture.id;
            videoFinishedWatching = false;
            await loadCommentsForCourse(selectedCourseDetailId);
          } else {
            notify("🔒 هذه المحاضرة مقفولة حالياً؛ أكمل المحاضرات السابقة في نفس التخصص لفتحها.", "warn");
          }
          renderTab();
        }
        return;
      }

      const tab = event.target.closest("[data-academy-tab]");
      if (tab) {
        activeTab = tab.dataset.academyTab;
        renderTab();
        const stage = $("academyContent");
        if (stage) stage.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }

      const subSwitch = event.target.closest("[data-courses-subview]");
      if (subSwitch) {
        coursesSubView = subSwitch.dataset.coursesSubview;
        renderCourses();
        return;
      }

      const viewInstCourses = event.target.closest("[data-view-instructor-courses]");
      if (viewInstCourses) {
        selectedInstructorFilter = viewInstCourses.dataset.viewInstructorCourses;
        selectedTrackFilter = "all";
        coursesSubView = "lectures";
        renderCourses();
        return;
      }

      if (event.target.closest("[data-clear-instructor-filter]")) {
        selectedInstructorFilter = "all";
        renderCourses();
        return;
      }

      const delInstBtn = event.target.closest("[data-delete-instructor]");
      if (delInstBtn && isAdminUser) {
        if (!confirm("هل تريد حذف بطاقة المحاضر؟")) return;
        const instId = delInstBtn.dataset.deleteInstructor;
        const db = getDb();
        if (db) {
          await db.collection("geodev_academy_instructors").doc(instId).delete();
        }
        instructorsList = instructorsList.filter(i => i.id !== instId);
        localStorage.setItem("gd_academy_instructors", JSON.stringify(instructorsList));
        notify("تم حذف بطاقة المحاضر.", "success");
        renderCourses();
        return;
      }

      const trackBtn = event.target.closest("[data-filter-track]");
      if (trackBtn) {
        selectedTrackFilter = trackBtn.dataset.filterTrack;
        selectedCourseDetailId = null;
        renderCourses();
        return;
      }

      const jumpTrackBtn = event.target.closest("[data-jump-track]");
      if (jumpTrackBtn) {
        activeTab = "courses";
        coursesSubView = "lectures";
        selectedTrackFilter = jumpTrackBtn.dataset.jumpTrack;
        selectedCourseDetailId = null;
        renderTab();
        return;
      }

      const openCourseBtn = event.target.closest("[data-open-uploaded-course]");
      if (openCourseBtn) {
        const lectureId = openCourseBtn.dataset.openUploadedCourse;
        const lectureObj = uploadedCourses.find(c => c.id === lectureId);
        if (!lectureObj || !isLectureUnlocked(lectureObj)) {
          notify("🔒 يجب إكمال المحاضرة السابقة أولاً لفتح هذه المحاضرة.", "warn");
          return;
        }
        await checkCodeSubscriptionStatus(currentUser);
        selectedCourseDetailId = lectureId;
        videoFinishedWatching = false;
        await loadCommentsForCourse(selectedCourseDetailId);
        renderCourses();
        const detailBox = $("academyCourseDetailBox");
        if (detailBox) detailBox.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      const completeLecBtn = event.target.closest("[data-complete-lecture]");
      if (completeLecBtn) {
        const lecId = completeLecBtn.dataset.completeLecture;
        await markLectureCompleted(lecId);
        renderCourses();
        return;
      }

      if (event.target.closest("#academyCloseCourseDetail")) {
        selectedCourseDetailId = null;
        clearTimeout(ytWatchTimer);
        renderCourses();
        return;
      }

      const postCommentBtn = event.target.closest("#academyPostCommentBtn");
      if (postCommentBtn) {
        const courseId = postCommentBtn.dataset.courseId;
        const text = $("academyNewCommentText")?.value.trim();
        if (!text) return notify("اكتب تعليقك أولاً قبل النشر.", "error");
        if (!currentUser) return notify("يجب تسجيل الدخول لكتابة تعليق.", "error");

        postCommentBtn.disabled = true;
        try {
          const commentObj = {
            uid: currentUser.uid,
            userName: currentUser.displayName || currentUser.email?.split("@")[0] || "مستخدم",
            text,
            dateText: new Date().toLocaleDateString("ar-EG"),
            createdAt: Date.now()
          };
          const db = getDb();
          if (db) {
            await db.collection("geodev_academy_courses").doc(courseId).collection("comments").add(commentObj);
          }
          await loadCommentsForCourse(courseId);
          notify("تم نشر تعليقك بنجاح!", "success");
          renderCourses();
        } catch (err) {
          notify("تعذر نشر التعليق: " + (err.message || ""), "error");
        } finally {
          postCommentBtn.disabled = false;
        }
        return;
      }

      const delCommentBtn = event.target.closest("[data-delete-comment]");
      if (delCommentBtn) {
        if (!confirm("هل تريد حذف هذا التعليق؟")) return;
        const commentId = delCommentBtn.dataset.deleteComment;
        const courseId = delCommentBtn.dataset.courseId;
        const db = getDb();
        if (db) {
          await db.collection("geodev_academy_courses").doc(courseId).collection("comments").doc(commentId).delete();
          await loadCommentsForCourse(courseId);
          notify("تم حذف التعليق.", "success");
          renderCourses();
        }
        return;
      }

      const delCourseBtn = event.target.closest("[data-delete-uploaded-course]");
      if (delCourseBtn && isAdminUser) {
        if (!confirm("هل تريد حذف هذه المحاضرة نهائياً؟")) return;
        const courseId = delCourseBtn.dataset.deleteUploadedCourse;
        const db = getDb();
        if (db) {
          await db.collection("geodev_academy_courses").doc(courseId).delete();
        }
        uploadedCourses = uploadedCourses.filter(c => c.id !== courseId);
        localStorage.setItem("gd_academy_uploaded_courses", JSON.stringify(uploadedCourses));
        if (selectedCourseDetailId === courseId) selectedCourseDetailId = null;
        notify("تم حذف المحاضرة بنجاح.", "success");
        renderCourses();
        return;
      }

      const smartBtn = event.target.closest("#academySmartSearchBtn");
      if (smartBtn) {
        const query = $("academySmartQuery")?.value.trim();
        const output = $("academySmartResults");
        if (!query) {
          output.textContent = "اكتب موضوع الكورس الذي تريد البحث عنه أولاً.";
          return;
        }
        smartBtn.disabled = true;
        smartBtn.textContent = "⏳ جاري البحث والتحليل...";
        output.textContent = "يبحث GEO 5.2 ULTRA على الويب، ثم يحلل GEO 3.8 FLASH النتائج...";
        try {
          const data = await window.GEOAcademyEngines.search(query);
          if (!data || data.success === false) throw new Error(data?.message || "لم يتم إرجاع نتائج البحث.");
          output.innerHTML = renderSearchResults(data);
        } catch (error) {
          output.textContent = "حدث خطأ: " + (error.message || "تعذر البحث.");
        } finally {
          smartBtn.disabled = false;
          smartBtn.textContent = "🔍 ابدأ البحث الذكي";
        }
        return;
      }

      const teacherBtn = event.target.closest("#academyTeacherSend");
      if (teacherBtn) {
        const questionInput = $("academyTeacherQuestion");
        const subjectInput = $("academyTeacherSubject");
        const messagesBox = $("academyTeacherMessages");

        const question = questionInput?.value.trim();
        const subject = subjectInput?.value || "الجغرافيا العامة";

        if (!question) return notify("اكتب سؤالك للمدرس أولاً.", "warning");
        if (!messagesBox || !window.GEOAcademyEngines?.teacherChat) return notify("محرك المدرس الذكي غير متصل.", "error");

        teacherBtn.disabled = true;
        teacherBtn.textContent = "⏳ جاري إعداد الإجابة...";

        const userRow = document.createElement("div");
        userRow.className = "teacher-message teacher-user";
        const userBubble = document.createElement("div");
        userBubble.className = "teacher-bubble";
        userBubble.textContent = question;
        userRow.appendChild(userBubble);
        messagesBox.appendChild(userRow);

        teacherMessages.push({ role: "user", content: question });

        const loading = document.createElement("div");
        loading.className = "teacher-message teacher-assistant";
        const loadingBubble = document.createElement("div");
        loadingBubble.className = "teacher-bubble";
        loadingBubble.textContent = "⏳ المدرس يجهز الشرح...";
        loading.appendChild(loadingBubble);
        messagesBox.appendChild(loading);
        messagesBox.scrollTop = messagesBox.scrollHeight;

        try {
          const answer = await window.GEOAcademyEngines.teacherChat(teacherMessages, subject);
          loading.remove();
          teacherMessages.push({ role: "assistant", content: answer });

          const assistantRow = document.createElement("div");
          assistantRow.className = "teacher-message teacher-assistant";
          const avatar = document.createElement("div");
          avatar.className = "teacher-avatar";
          avatar.textContent = "👨‍🏫";
          const assistantBubble = document.createElement("div");
          assistantBubble.className = "teacher-bubble";
          const teacherName = document.createElement("strong");
          teacherName.textContent = "GEO Teacher";
          const answerContent = document.createElement("div");
          answerContent.className = "teacher-answer-content";
          answerContent.innerHTML = renderAnalysisMarkdown(answer);

          assistantBubble.appendChild(teacherName);
          assistantBubble.appendChild(answerContent);
          assistantRow.appendChild(avatar);
          assistantRow.appendChild(assistantBubble);
          messagesBox.appendChild(assistantRow);

          questionInput.value = "";
          messagesBox.scrollTop = messagesBox.scrollHeight;
        } catch (error) {
          loading.remove();
          teacherMessages.pop();
          notify(error.message || "حدث خطأ أثناء سؤال المدرس.", "error");
        } finally {
          teacherBtn.disabled = false;
          teacherBtn.textContent = "إرسال السؤال ➤";
        }
        return;
      }

      const note = event.target.closest("[data-delete-note]");
      if (note) return deleteNote(note.dataset.deleteNote);

      const memory = event.target.closest("[data-delete-memory]");
      if (memory) return deleteMemory(memory.dataset.deleteMemory);
    });
  }

  function startAuthListener() {
    const check = () => {
      if (window.firebase && firebase.apps && firebase.apps.length) {
        const api = window.GEOAcademy;
        if (api && typeof api.init === "function") api.init();

        firebase.auth().onAuthStateChanged(async user => {
          currentUser = user || null;
          await checkCodeSubscriptionStatus(currentUser);

          if (!user) {
            notes = [];
            memories = [];
            completedLectures = [];
            setStatus("سجل الدخول لاستخدام الأكاديمية.");
            renderTab();
            return;
          }

          setStatus(
            isAdminUser
              ? "مرحباً بك (مدير المنصة) — جميع الصلاحيات مفعّلة."
              : isCodeSubscriber
              ? "مرحباً بك (اشتراك PRO مفعّل بالكود) — جميع المحاضرات متاحة لك."
              : "مرحباً بك — تصفح تفاصيل الدورات متاح لك، وتشغيل الفيديوهات متاح للمشتركين بالكود فقط."
          );
          await refreshData();
        });
        return true;
      }
      return false;
    };

    if (!check()) {
      const iv = setInterval(() => {
        if (check()) clearInterval(iv);
      }, 350);
      setTimeout(() => clearInterval(iv), 12000);
    }
  }

  function bootAcademy() {
    bindEvents();
    renderTab();
    startAuthListener();
    if (window.GEOAcademyUI) window.GEOAcademyUI.ready = true;
  }

  function init() {
    if (injectInterface()) {
      bootAcademy();
      return;
    }
    let tries = 0;
    const retryTimer = setInterval(() => {
      tries++;
      if (injectInterface()) {
        clearInterval(retryTimer);
        bootAcademy();
      } else if (tries >= 35) {
        clearInterval(retryTimer);
      }
    }, 300);
  }

  window.GEOAcademyUI = {
    init,
    refresh: refreshData,
    search(query) {
      const input = $("academyCatalogSearch");
      const position = input?.selectionStart ?? String(query).length;
      renderOfficialCourses(query);
      const nextInput = $("academyCatalogSearch");
      if (nextInput) {
        nextInput.focus();
        nextInput.setSelectionRange(position, position);
      }
    },
    ready: false
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
