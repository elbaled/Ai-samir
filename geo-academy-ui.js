/* ============================================================================
   GEO Academy UI - النسخة الكاملة والمستقرة
   - البطاقات السبع الرئيسية (الكورسات، البحث الذكي، الكتب، المدرس، ملاحظاتي، ذاكرتي، تقدمي)
   - رفع الفيديوهات والدورات + PDF + Google Drive / MediaFire (حصري للأدمن)
   - نظام التعليقات التفاعلي أسفل تفاصيل كل فيديو
   ============================================================================ */
(function () {
  "use strict";

  const ADMIN_EMAIL = "eng.ahmedsamir.gis@gmail.com";

  const courses = [
    { id: "gis", title: "نظم المعلومات الجغرافية GIS", icon: "globe", desc: "تعلم GIS والخرائط والتحليل المكاني." },
    { id: "surveying", title: "المساحة والرفع المساحي", icon: "ruler", desc: "أساسيات المساحة والأجهزة والحسابات." },
    { id: "remote-sensing", title: "الاستشعار عن بعد", icon: "satellite", desc: "الأقمار الصناعية والصور الفضائية وتحليلها." },
    { id: "civil3d", title: "Civil 3D", icon: "drafting-compass", desc: "تصميم الطرق والأعمال المساحية." },
    { id: "python-gis", title: "Python for GIS", icon: "code", desc: "برمجة وتحليل البيانات الجغرافية." },
    { id: "gis-programming", title: "GIS Programming", icon: "terminal", desc: "برمجة نظم المعلومات باستخدام Python وArcPy وPyQGIS." },
    { id: "autocad", title: "AutoCAD", icon: "pencil-ruler", desc: "الرسم الهندسي ثنائي وثلاثي الأبعاد." },
    { id: "autocad-ai", title: "AutoCAD + AI", icon: "bot", desc: "تطبيق الذكاء الاصطناعي في الرسم والأتمتة الهندسية." }
  ];

  const academySections = [
    {
      id: "courses",
      title: "الكورسات والدورات",
      icon: "graduation-cap",
      badge: "الأساسي",
      desc: "الدورات المرفوعة، الشروحات التطبيقية، ومكتبة الكورسات العالمية."
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
      badge: "إحصائيات",
      desc: "تابع نسبة إنجازك في مسارات الجيوماتكس والبرمجة الهندسية."
    }
  ];

  let currentUser = null;
  let isAdminUser = false;
  let notes = [];
  let memories = [];
  let progress = [];
  let teacherMessages = [];
  let uploadedCourses = [];
  let selectedCourseDetailId = null;
  let courseComments = [];
  let activeTab = "courses";
  let eventsBound = false;

  const $ = id => document.getElementById(id);

  function refreshAcademyIcons(root = document) {
    try {
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons({
          root,
          attrs: { "stroke-width": 1.8 }
        });
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
    box._timer = setTimeout(() => box.classList.remove("show"), 3500);
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
      #s-academy .academy-header h2 svg {
        width: 27px;
        height: 27px;
        color: var(--bl, #38bdf8);
        flex-shrink: 0;
      }
      #s-academy .academy-header p {
        margin: 0;
        color: var(--mt, #94a3b8);
        line-height: 1.85;
      }
      #s-academy .academy-hub-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr));
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
        padding: 15px;
        color: inherit;
        font-family: inherit;
        display: flex;
        flex-direction: column;
        gap: 8px;
        transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
      }
      #s-academy .academy-hub-card:hover {
        transform: translateY(-2px);
        border-color: var(--bl, #38bdf8);
      }
      #s-academy .academy-hub-card.active {
        border: 2px solid #e09f24;
        background: linear-gradient(145deg, color-mix(in srgb, #e09f24 14%, var(--cd, #182334)), var(--cd, #182334));
        box-shadow: 0 10px 26px rgba(224, 159, 36, 0.18);
      }
      #s-academy .hub-card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      #s-academy .hub-card-badge {
        font-size: 11px;
        font-weight: 800;
        padding: 3px 9px;
        border-radius: 99px;
        background: color-mix(in srgb, var(--bl, #38bdf8) 15%, var(--cd, #182334));
        color: var(--bl, #38bdf8);
        border: 1px solid color-mix(in srgb, var(--bl, #38bdf8) 30%, var(--ln, #334155));
      }
      #s-academy .academy-hub-card.active .hub-card-badge {
        background: #e09f24;
        color: #0f172a;
        border-color: #e09f24;
      }
      #s-academy .hub-card-title {
        margin: 0;
        font-size: 16px;
        font-weight: 900;
        color: var(--tx, #f8fafc);
      }
      #s-academy .hub-card-desc {
        margin: 0;
        font-size: 12.5px;
        line-height: 1.7;
        color: var(--mt, #94a3b8);
      }
      #s-academy .academy-active-stage {
        border-top: 2px dashed color-mix(in srgb, var(--ln, #334155) 85%, #e09f24);
        padding-top: 16px;
        margin-top: 6px;
      }
      #s-academy .academy-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 255px), 1fr));
        gap: 13px;
      }
      #s-academy .academy-card,
      #s-academy .academy-course-result {
        position: relative;
        overflow: hidden;
        background: linear-gradient(145deg, color-mix(in srgb, var(--cd, #182334) 96%, var(--bl, #38bdf8)), var(--cd, #182334));
        border: 1px solid color-mix(in srgb, var(--ln, #334155) 85%, var(--bl, #38bdf8));
        border-radius: 18px;
        padding: 16px;
        min-width: 0;
        overflow-wrap: anywhere;
        box-shadow: 0 8px 24px rgba(0,0,0,.09);
      }
      #s-academy .academy-card h3,
      #s-academy .academy-course-result h4 {
        font-size: 16.5px;
        margin: 6px 0 8px;
        color: var(--tx, #f8fafc);
        font-weight: 900;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #s-academy .academy-card p,
      #s-academy .academy-course-result p {
        line-height: 1.85;
        color: var(--mt, #cbd5e1);
      }
      #s-academy .academy-icon {
        width: 46px;
        height: 46px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
        color: var(--bl, #38bdf8);
        background: color-mix(in srgb, var(--bl, #38bdf8) 14%, var(--cd, #182334));
        border: 1px solid color-mix(in srgb, var(--bl, #38bdf8) 28%, var(--ln, #334155));
      }
      #s-academy .academy-icon svg {
        width: 23px;
        height: 23px;
      }
      #s-academy .admin-upload-card {
        border: 2px solid #e09f24;
        background: linear-gradient(145deg, color-mix(in srgb, #e09f24 10%, var(--cd, #182334)), var(--cd, #182334));
        margin-bottom: 18px;
      }
      #s-academy .admin-upload-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
        gap: 10px;
      }
      #s-academy .course-detail-box {
        border: 2px solid var(--bl, #38bdf8);
        margin-bottom: 18px;
      }
      #s-academy .course-video-frame {
        width: 100%;
        border-radius: 14px;
        overflow: hidden;
        background: #050811;
        margin: 12px 0;
        border: 1px solid var(--ln, #334155);
      }
      #s-academy .course-video-frame video,
      #s-academy .course-video-frame iframe {
        width: 100%;
        max-height: 420px;
        display: block;
        border: 0;
      }
      #s-academy .course-attachments-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 9px;
        margin: 12px 0;
      }
      #s-academy .comments-section {
        margin-top: 16px;
        padding-top: 14px;
        border-top: 1px solid var(--ln, #334155);
      }
      #s-academy .comment-item {
        padding: 11px 13px;
        border-radius: 13px;
        background: var(--bg, #101827);
        border: 1px solid var(--ln, #334155);
        margin-bottom: 9px;
      }
      #s-academy .comment-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 5px;
        font-size: 12.5px;
      }
      #s-academy .academy-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        border: 1px solid color-mix(in srgb, var(--bl, #38bdf8) 25%, var(--ln, #334155));
        border-radius: 12px;
        padding: 10px 15px;
        background: var(--bl, #167b9c);
        color: #fff;
        font-weight: 800;
        font-family: inherit;
        cursor: pointer;
        text-decoration: none;
      }
      #s-academy .academy-btn.gold { background: #e09f24; color: #0f172a; border-color: #e09f24; }
      #s-academy .academy-btn.pdf-btn { background: #dc2626; color: #fff; border-color: #dc2626; }
      #s-academy .academy-btn.drive-btn { background: #16a34a; color: #fff; border-color: #16a34a; }
      #s-academy .academy-btn.secondary {
        background: color-mix(in srgb, var(--cd, #182334) 80%, var(--bl, #38bdf8));
        color: var(--tx, #e8edf7);
        border-color: var(--ln, #334155);
      }
      #s-academy .academy-btn.danger { background: #991b1b; color: #fff; border-color: #991b1b; }
      #s-academy .academy-input,
      #s-academy .academy-textarea,
      #s-academy select {
        width: 100%;
        box-sizing: border-box;
        padding: 11px 12px;
        border-radius: 12px;
        border: 1px solid var(--ln, #334155);
        background: var(--bg, #101827);
        color: var(--tx, #e8edf7);
        margin: 6px 0 11px;
        font: inherit;
      }
      #s-academy .academy-textarea { min-height: 95px; resize: vertical; }
      #s-academy .academy-muted { opacity: .75; font-size: 12.5px; }
      #s-academy .academy-progress {
        height: 9px;
        background: var(--ln, #344256);
        border-radius: 20px;
        overflow: hidden;
        margin: 12px 0;
      }
      #s-academy .academy-progress > span {
        display: block;
        height: 100%;
        background: linear-gradient(90deg, var(--bl, #38bdf8), var(--gr, #27b58b));
      }
      #s-academy .academy-empty { text-align: center; padding: 22px 12px; opacity: .75; }
      #s-academy .academy-status {
        padding: 10px 14px;
        border-radius: 12px;
        background: color-mix(in srgb, var(--cd, #182334) 92%, var(--bl, #38bdf8));
        border: 1px solid var(--ln, #334155);
        margin-bottom: 14px;
        font-size: 13px;
      }
      #s-academy .academy-teacher { display: flex; flex-direction: column; gap: 14px; }
      #s-academy .teacher-header { display: flex; align-items: center; gap: 13px; padding: 16px; }
      #s-academy .teacher-avatar {
        width: 48px; height: 48px; flex: 0 0 48px; display: grid; place-items: center;
        border-radius: 50%; background: color-mix(in srgb, var(--bl, #38bdf8) 20%, var(--cd, #182334));
        border: 1px solid color-mix(in srgb, var(--bl, #38bdf8) 35%, var(--ln, #334155)); font-size: 24px;
      }
      #s-academy .teacher-online { color: #4ade80; font-size: 12px; }
      #s-academy .teacher-subject {
        padding: 12px; border: 1px solid var(--ln, #334155); border-radius: 14px; background: var(--cd, #182334);
      }
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
      #s-academy .teacher-composer {
        padding: 12px; border: 1px solid var(--ln, #334155); border-radius: 16px; background: var(--cd, #182334);
      }
      #s-academy .academy-search-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; margin: 12px 0; }
      #s-academy .academy-course-platform { display: flex; align-items: center; gap: 10px; }
      #s-academy .academy-platform-icon,
      #s-academy .academy-platform-fallback { width: 40px; height: 40px; flex: 0 0 40px; border-radius: 10px; }
      #s-academy .academy-platform-icon { object-fit: contain; background: #fff; padding: 4px; }
      #s-academy .academy-platform-fallback { display: grid; place-items: center; background: #26384d; font-size: 20px; }
      #academyToast {
        position: fixed; z-index: 99999; bottom: 20px; right: 50%; transform: translate(50%, 20px);
        background: #26384d; color: white; padding: 12px 18px; border-radius: 12px;
        opacity: 0; pointer-events: none; transition: .2s; max-width: 85%; text-align: center;
      }
      #academyToast.show { opacity: 1; transform: translate(50%, 0); }
      #academyToast[data-type="error"] { background: #9b3434; }
      #academyToast[data-type="success"] { background: #176b50; }
      @media (max-width: 640px) {
        #s-academy { padding: 10px 7px; }
        #s-academy .academy-hub-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
        #s-academy .academy-hub-card { padding: 12px; }
        #s-academy .hub-card-title { font-size: 14px; }
        #s-academy .hub-card-desc { font-size: 11.5px; }
      }
    `;
    document.head.appendChild(style);
  }

  function injectInterface() {
    const nav = document.querySelector("nav") || document.querySelector(".nav, .bottom-nav, header nav");
    const main = document.querySelector("main") || document.querySelector("#main, .main, .content");

    if (!nav || !main) {
      return false;
    }

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
        <div class="academy-header">
          <h2><i data-lucide="graduation-cap"></i> الأكاديمية الجغرافية</h2>
          <p>اختر القسم المناسب من البطاقات السبع بالأسفل لبدء التعلم، البحث الذكي، أو متابعة الدورات والشروحات التطبيقية.</p>
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

  async function loadUploadedCourses() {
    const db = getDb();
    if (!db) {
      uploadedCourses = JSON.parse(localStorage.getItem("gd_academy_uploaded_courses") || "[]");
      return;
    }
    try {
      const snap = await db.collection("geodev_academy_courses")
        .orderBy("createdAt", "desc")
        .get();
      uploadedCourses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (_) {
      uploadedCourses = JSON.parse(localStorage.getItem("gd_academy_uploaded_courses") || "[]");
    }
  }

  async function loadCommentsForCourse(courseId) {
    courseComments = [];
    const db = getDb();
    if (!db || !courseId) return;
    try {
      const snap = await db.collection("geodev_academy_courses")
        .doc(courseId)
        .collection("comments")
        .orderBy("createdAt", "desc")
        .get();
      courseComments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (_) {}
  }

  function buildVideoEmbedHTML(url) {
    const clean = safeURL(url);
    if (!clean) return "";
    const ytMatch = clean.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
    if (ytMatch) {
      return `<div class="course-video-frame"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" allowfullscreen></iframe></div>`;
    }
    return `<div class="course-video-frame"><video src="${clean}" controls preload="metadata"></video></div>`;
  }

  function renderAdminUploadCardHTML() {
    if (!isAdminUser) return "";
    return `
      <div class="academy-card admin-upload-card">
        <h3><i data-lucide="upload-cloud"></i> رفع فيديو أو دورة جديدة (لوحة الأدمن)</h3>
        <p class="academy-muted">ارفع فيديو تعليمي مباشرة من جهازك أو عبر رابط، وأرفق معه ملف PDF ورابط ملفات Google Drive أو MediaFire.</p>

        <form id="academyAdminCourseForm">
          <div class="admin-upload-grid">
            <div>
              <label class="academy-muted">عنوان الفيديو أو الدورة *</label>
              <input type="text" id="acUpTitle" class="academy-input" placeholder="مثال: شرح أتمتة AutoCAD بالذكاء الاصطناعي" required>
            </div>
            <div>
              <label class="academy-muted">التخصص *</label>
              <select id="acUpCategory" class="academy-input">
                <option value="AutoCAD + AI">AutoCAD + AI</option>
                <option value="AutoCAD">AutoCAD</option>
                <option value="Civil 3D">Civil 3D</option>
                <option value="GIS">نظم المعلومات الجغرافية GIS</option>
                <option value="Surveying">المساحة والرفع المساحي</option>
                <option value="Remote Sensing">الاستشعار عن بعد</option>
                <option value="Programming">برمجة GIS و Python</option>
              </select>
            </div>
          </div>

          <label class="academy-muted">وصف وتفاصيل الدرس *</label>
          <textarea id="acUpDesc" class="academy-textarea" placeholder="اكتب تفاصيل ومحتوى الفيديو والمحاور التي يشرحها..." required></textarea>

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
              <label class="academy-muted">رفع ملف PDF مرفق مع الفيديو</label>
              <input type="file" id="acUpPdfFile" class="academy-input" accept=".pdf,application/pdf">
            </div>
            <div>
              <label class="academy-muted">رابط ملفات (Google Drive أو MediaFire)</label>
              <input type="url" id="acUpDriveUrl" class="academy-input" placeholder="https://drive.google.com/... أو mediafire.com/...">
            </div>
          </div>

          <button type="submit" id="acUpSubmitBtn" class="academy-btn gold" style="width:100%;margin-top:6px;">
            <i data-lucide="plus-circle"></i> نشر الدورة والفيديو في الأكاديمية الآن
          </button>
        </form>
      </div>
    `;
  }

  function renderSelectedCourseDetailHTML() {
    if (!selectedCourseDetailId) return "";
    const item = uploadedCourses.find(c => c.id === selectedCourseDetailId);
    if (!item) return "";

    return `
      <div class="academy-card course-detail-box" id="academyCourseDetailBox">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <span class="hub-card-badge">${escapeHTML(item.category || "دورة تطبيقية")}</span>
          <button type="button" class="academy-btn secondary" id="academyCloseCourseDetail">
            ✕ إغلاق تفاصيل الفيديو
          </button>
        </div>

        <h3 style="font-size:19px;margin-top:10px;">🎬 ${escapeHTML(item.title)}</h3>
        <p style="white-space:pre-line;">${escapeHTML(item.desc || "")}</p>

        ${buildVideoEmbedHTML(item.videoUrl)}

        <div class="course-attachments-bar">
          ${safeURL(item.pdfUrl) ? `
            <a href="${safeURL(item.pdfUrl)}" target="_blank" rel="noopener noreferrer" download="${escapeHTML(item.pdfName || item.title + ".pdf")}" class="academy-btn pdf-btn">
              <i data-lucide="file-text"></i> تحميل ملف PDF المرفق
            </a>
          ` : ""}
          ${safeURL(item.driveUrl) ? `
            <a href="${safeURL(item.driveUrl)}" target="_blank" rel="noopener noreferrer" class="academy-btn drive-btn">
              <i data-lucide="folder-down"></i> تحميل الملفات (Google Drive / MediaFire)
            </a>
          ` : ""}
          ${isAdminUser ? `
            <button type="button" class="academy-btn danger" data-delete-uploaded-course="${escapeHTML(item.id)}">
              <i data-lucide="trash-2"></i> حذف الدورة (أدمن)
            </button>
          ` : ""}
        </div>

        <div class="comments-section">
          <h4>💬 التعليقات والمناقشات (${courseComments.length})</h4>

          <div style="margin:10px 0 14px;">
            <textarea id="academyNewCommentText" class="academy-textarea" style="min-height:72px;" placeholder="اكتب تعليقك أو سؤالك حول هذا الفيديو..."></textarea>
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
                        data-delete-comment="${escapeHTML(cm.id)}" data-course-id="${escapeHTML(item.id)}">
                        حذف
                      </button>
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

  function renderCourses(query = "") {
    const content = $("academyContent");
    if (!content) return;

    const catalog = window.GEOAcademyContent;
    const search = String(query || "").trim().toLowerCase();

    const filteredUploaded = uploadedCourses.filter(c =>
      !search ||
      String(c.title || "").toLowerCase().includes(search) ||
      String(c.desc || "").toLowerCase().includes(search) ||
      String(c.category || "").toLowerCase().includes(search)
    );

    const categories = catalog ? catalog.getAllCategories() : [];
    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(search) ||
      category.topics.some(topic => topic.toLowerCase().includes(search))
    );

    const realCourses = catalog ? catalog.getCourses() : [];
    const filteredCourses = realCourses.filter(course =>
      !search ||
      course.title.toLowerCase().includes(search) ||
      course.provider.toLowerCase().includes(search) ||
      course.category.toLowerCase().includes(search)
    );

    content.innerHTML = `
      ${renderAdminUploadCardHTML()}
      ${renderSelectedCourseDetailHTML()}

      <div class="academy-card" style="margin-bottom:15px;">
        <h3>🎬 الكورسات والفيديوهات المرفوعة في المنصة (${filteredUploaded.length})</h3>
        <p class="academy-muted">اضغط على أي دورة لفتح الفيديو، تحميل ملفات PDF وروابط Drive / MediaFire، والمشاركة في التعليقات.</p>

        <div class="academy-grid">
          ${filteredUploaded.length ? filteredUploaded.map(item => `
            <div class="academy-card">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
                <span class="hub-card-badge">${escapeHTML(item.category || "دورة")}</span>
                ${safeURL(item.pdfUrl) ? `<span class="academy-muted">📄 PDF</span>` : ""}
              </div>
              <h3>${escapeHTML(item.title)}</h3>
              <p>${escapeHTML(String(item.desc || "").slice(0, 120))}${String(item.desc || "").length > 120 ? "..." : ""}</p>
              <button type="button" class="academy-btn gold" style="width:100%;" data-open-uploaded-course="${escapeHTML(item.id)}">
                <i data-lucide="play-circle"></i> مشاهدة التفاصيل والتعليقات
              </button>
            </div>
          `).join("") : `
            <div class="academy-empty">لم يتم رفع دورات فيديو خاصة بعد.</div>
          `}
        </div>
      </div>

      <div class="academy-card">
        <h3>🌐 مكتبة الكورسات العالمية ودليل التخصصات</h3>
        <p>ابحث عن الدورات التعليمية في GIS والمساحة والاستشعار عن بعد والبرمجة والتصميم الهندسي.</p>

        <input
          id="academyCatalogSearch"
          class="academy-input"
          placeholder="ابحث عن ArcGIS أو AutoCAD أو Python..."
          value="${escapeHTML(query)}"
          oninput="window.GEOAcademyUI.search(this.value)"
        >

        <div class="academy-muted">${filtered.length} تخصص متاح في الدليل</div>
      </div>

      <div class="academy-card" style="margin-top:15px">
        <h3>🎓 الكورسات الفعلية</h3>
        <p class="academy-muted">${filteredCourses.length} كورس متاح حاليًا في الفهرس</p>

        <div class="academy-grid">
          ${filteredCourses.length ? filteredCourses.map(course => `
            <div class="academy-card">
              <h3>${escapeHTML(course.title)}</h3>
              <p>🏫 ${escapeHTML(course.provider)}</p>
              <p class="academy-muted">
                المستوى: ${escapeHTML(course.level)}
                <br>اللغة: ${escapeHTML(course.language)}
                <br>السعر: ${escapeHTML(course.price)}
              </p>
              <a class="academy-btn"
                href="${safeURL(course.url)}"
                target="_blank"
                rel="noopener noreferrer">
                فتح الكورس الأصلي ↗
              </a>
            </div>
          `).join("") : `
            <div class="academy-empty">لا توجد كورسات مطابقة للبحث.</div>
          `}
        </div>
      </div>

      <div class="academy-grid" style="margin-top:15px;">
        ${filtered.length ? filtered.map(category => {
          const sources = catalog ? catalog.getSources(category.id) : [];
          return `
            <div class="academy-card">
              <div class="academy-icon"><i data-lucide="book-open"></i></div>
              <h3>${escapeHTML(category.name)}</h3>
              <p class="academy-muted">${category.topics.length} موضوعًا تعليميًا</p>
              <h4>الموضوعات</h4>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${category.topics.map(topic => `
                  <a class="academy-btn secondary" style="font-size:11px" target="_blank" rel="noopener noreferrer"
                    href="${safeURL(catalog.searchUrl("youtube", topic))}">
                    ${escapeHTML(topic)} 🔎
                  </a>
                `).join("")}
              </div>
              <hr style="border-color:var(--ln,#334155);margin:15px 0">
              <h4>المصادر والمنصات</h4>
              ${sources.map(source => `
                <div style="margin:9px 0;padding:9px;background:var(--bg,#101827);border-radius:9px">
                  <b>${escapeHTML(source.name)}</b>
                  <div class="academy-muted">${escapeHTML(source.platform)} • ${escapeHTML(source.language || "لغات متعددة")}${source.price === "free" ? " • مجاني" : ""}</div>
                  <a href="${safeURL(source.url)}" target="_blank" rel="noopener noreferrer" class="academy-btn" style="margin-top:7px">زيارة المصدر ↗</a>
                </div>
              `).join("")}
              <h4>ابحث في المنصات التعليمية</h4>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${["youtube", "coursera", "udemy", "edx"].map(platform => `
                  <a class="academy-btn secondary" target="_blank" rel="noopener noreferrer"
                    href="${safeURL(catalog.searchUrl(platform, category.name))}">
                    ${platform === "youtube" ? "YouTube" : platform === "coursera" ? "Coursera" : platform === "udemy" ? "Udemy" : "edX"}
                  </a>
                `).join("")}
              </div>
            </div>
          `;
        }).join("") : `<div class="academy-empty">لا توجد تخصصات مطابقة للبحث.</div>`}
      </div>
    `;

    bindCourseUploadForm();
    refreshAcademyIcons(content);
  }

  function renderBooks() {
    const content = $("academyContent");
    if (!content) return;

    const referenceLibrary = [
      {
        title: "دليل نظم المعلومات الجغرافية المتكامل (ArcGIS Pro)",
        category: "GIS",
        desc: "مرجع شامل لإنشاء قواعد البيانات الجغرافية، التحليل المكاني، وإخراج الخرائط الاحترافية.",
        url: "https://pro.arcgis.com/en/pro-app/latest/get-started/get-started.htm"
      },
      {
        title: "المرجع الرسمي لبرنامج QGIS التدريبي",
        category: "GIS مفتوح المصدر",
        desc: "دليل عملي خطوة بخطوة للتعامل مع الطبقات المتجهة والشبكية والتحليل الهيدرولوجي.",
        url: "https://docs.qgis.org/latest/en/docs/training_manual/"
      },
      {
        title: "أساسيات المساحة المستوية والجيوديسية والتوقيع",
        category: "المساحة",
        desc: "مرجع حسابات الترافيرس، الميزانية، أرصاد GNSS، ومعادلات التحويل بين المراجع.",
        url: "https://www.esa.gov.eg/"
      },
      {
        title: "دليل الاستشعار عن بعد ومعالجة المرئيات الفضائية",
        category: "Remote Sensing",
        desc: "شرح التصنيف المراقب وغير المراقب، المؤشرات الطيفية NDVI/NDWI، وتحليل بيانات Sentinel.",
        url: "https://training.narss.sci.eg/"
      },
      {
        title: "مرجع أوامر AutoCAD و AutoLISP للمكاتب الفنية",
        category: "CAD & Automation",
        desc: "دليل اختصارات الأوتوكاد وأساسيات كتابة الليسبات لأتمتة اللوحات المساحية.",
        url: "https://www.autodesk.com/learn"
      },
      {
        title: "دليل بايثون للتحليل المكاني (GeoPandas & ArcPy)",
        category: "برمجة GIS",
        desc: "مرجع أتمتة المعالجة المكانية وتحليل البيانات الجغرافية بلغة Python.",
        url: "https://courses.spatialthoughts.com/"
      }
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
            <a href="${safeURL(book.url)}" target="_blank" rel="noopener noreferrer" class="academy-btn" style="width:100%;">
              فتح المرجع الرسمي ↗
            </a>
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

  function renderProgress() {
    const content = $("academyContent");
    content.innerHTML = `
      <div class="academy-card" style="margin-bottom:14px;">
        <h3>📊 تقدمك التعليمي</h3>
        <p>هنا ستجد المسارات التي سجلت إتمامها.</p>
      </div>
      <div class="academy-grid">
        ${courses.map(course => {
          const item = progress.find(p => p.id === course.id);
          const percent = Math.max(0, Math.min(100, Number(item?.progress ?? 0)));
          return `
            <div class="academy-card">
              <h3><i data-lucide="${course.icon}"></i> ${escapeHTML(course.title)}</h3>
              <div class="academy-progress"><span style="width:${percent}%"></span></div>
              <p>${percent}% مكتمل</p>
              <div class="academy-muted">${percent >= 100 ? "تم تسجيل إتمام هذا المسار." : "لم يتم تسجيل إتمام هذا المسار بعد."}</div>
              <button type="button" class="academy-btn secondary" style="margin-top:8px;" data-course="${escapeHTML(course.id)}">
                تسجيل إتمام المسار ✓
              </button>
            </div>
          `;
        }).join("")}
      </div>
    `;
    refreshAcademyIcons(content);
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
    if (!api || !api.ready) {
      await loadUploadedCourses();
      setStatus("تم تحميل الدورات المرفوعة في الأكاديمية.");
      renderTab();
      return;
    }

    try {
      await api.getProfile() || await api.createProfile();
      const results = await Promise.all([
        api.getNotes(),
        api.getMemory(100),
        api.getProgress(),
        loadUploadedCourses()
      ]);
      notes = Array.isArray(results[0]) ? results[0] : [];
      memories = Array.isArray(results[1]) ? results[1] : [];
      progress = Array.isArray(results[2]) ? results[2] : [];
      setStatus("تم الاتصال بقاعدة بيانات الأكاديمية.");
      renderTab();
    } catch (error) {
      console.error("Academy loading error:", error);
      setStatus("حدث خطأ أثناء تحميل بيانات الأكاديمية.");
      renderTab();
    }
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
      const category = $("acUpCategory")?.value || "AutoCAD + AI";
      const desc = $("acUpDesc")?.value.trim();
      const videoFile = $("acUpVideoFile")?.files?.[0];
      let videoUrl = $("acUpVideoUrl")?.value.trim();
      const pdfFile = $("acUpPdfFile")?.files?.[0];
      const driveUrl = $("acUpDriveUrl")?.value.trim();

      if (!title || !desc) {
        notify("اكتب عنوان الدورة ووصفها أولاً.", "error");
        return;
      }

      btn.disabled = true;
      btn.textContent = "⏳ جاري رفع ونشر الدورة...";

      try {
        if (videoFile) {
          if (videoFile.size > 500 * 1024 * 1024) {
            throw new Error("حجم الفيديو يتجاوز 500 ميجابايت.");
          }
          if (window.firebase && typeof firebase.storage === "function") {
            const ref = firebase.storage().ref(`academy_courses_videos/${Date.now()}_${videoFile.name}`);
            await ref.put(videoFile);
            videoUrl = await ref.getDownloadURL();
          } else {
            videoUrl = URL.createObjectURL(videoFile);
          }
        }

        let pdfUrl = "";
        let pdfName = "";
        if (pdfFile) {
          pdfName = pdfFile.name;
          if (window.firebase && typeof firebase.storage === "function") {
            const pdfRef = firebase.storage().ref(`academy_courses_pdfs/${Date.now()}_${pdfFile.name}`);
            await pdfRef.put(pdfFile);
            pdfUrl = await pdfRef.getDownloadURL();
          }
        }

        const courseDoc = {
          title,
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
          uploadedCourses.unshift({ id: added.id, ...courseDoc });
        } else {
          uploadedCourses.unshift({ id: "local_" + Date.now(), ...courseDoc });
        }

        localStorage.setItem("gd_academy_uploaded_courses", JSON.stringify(uploadedCourses));
        notify("تم نشر الدورة والفيديو والملفات بنجاح!", "success");
        renderCourses();
      } catch (err) {
        notify("حدث خطأ أثناء النشر: " + (err.message || ""), "error");
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="plus-circle"></i> نشر الدورة والفيديو في الأكاديمية الآن`;
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

  async function completeCourse(courseId) {
    if (!courses.find(item => item.id === courseId)) return;
    try {
      await window.GEOAcademy.saveProgress(courseId, 100);
      notify("تم تسجيل إتمام المسار بنجاح.", "success");
      await refreshData();
    } catch (error) {
      notify("تعذر حفظ التقدم: " + (error.message || ""), "error");
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
      { match: /(^|\.)linkedin\.com$/, name: "LinkedIn Learning", emoji: "in" },
      { match: /(^|\.)m3aarf\.com$/, name: "معارف", emoji: "📚" },
      { match: /(^|\.)teracourses\.com$/, name: "Teracourses", emoji: "📖" },
      { match: /(^|\.)skillshare\.com$/, name: "Skillshare", emoji: "✏️" },
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
      const tab = event.target.closest("[data-academy-tab]");
      if (tab) {
        activeTab = tab.dataset.academyTab;
        renderTab();
        const stage = $("academyContent");
        if (stage) stage.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }

      const openCourseBtn = event.target.closest("[data-open-uploaded-course]");
      if (openCourseBtn) {
        selectedCourseDetailId = openCourseBtn.dataset.openUploadedCourse;
        await loadCommentsForCourse(selectedCourseDetailId);
        renderCourses($("academyCatalogSearch")?.value || "");
        const detailBox = $("academyCourseDetailBox");
        if (detailBox) detailBox.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (event.target.closest("#academyCloseCourseDetail")) {
        selectedCourseDetailId = null;
        renderCourses($("academyCatalogSearch")?.value || "");
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
          renderCourses($("academyCatalogSearch")?.value || "");
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
          renderCourses($("academyCatalogSearch")?.value || "");
        }
        return;
      }

      const delCourseBtn = event.target.closest("[data-delete-uploaded-course]");
      if (delCourseBtn && isAdminUser) {
        if (!confirm("هل تريد حذف هذه الدورة نهائياً من الأكاديمية؟")) return;
        const courseId = delCourseBtn.dataset.deleteUploadedCourse;
        const db = getDb();
        if (db) {
          await db.collection("geodev_academy_courses").doc(courseId).delete();
        }
        uploadedCourses = uploadedCourses.filter(c => c.id !== courseId);
        localStorage.setItem("gd_academy_uploaded_courses", JSON.stringify(uploadedCourses));
        if (selectedCourseDetailId === courseId) selectedCourseDetailId = null;
        notify("تم حذف الدورة بنجاح.", "success");
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

      const course = event.target.closest("[data-course]");
      if (course) return completeCourse(course.dataset.course);

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
          isAdminUser = !!(user && user.email && user.email.toLowerCase() === ADMIN_EMAIL);

          if (!user) {
            notes = [];
            memories = [];
            progress = [];
            setStatus("سجل الدخول لاستخدام الأكاديمية.");
            renderTab();
            return;
          }

          setStatus("مرحبًا بك في الأكاديمية. جاري تحميل بياناتك...");
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
      renderCourses(query);
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
