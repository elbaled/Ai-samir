
(function () {
  "use strict";

  if (window.GEOAcademyUI) return;

  const courses = [
    { id: "gis", title: "نظم المعلومات الجغرافية GIS", icon: "🌍", desc: "تعلم GIS والخرائط والتحليل المكاني." },
    { id: "surveying", title: "المساحة والرفع المساحي", icon: "📐", desc: "أساسيات المساحة والأجهزة والحسابات." },
    { id: "remote-sensing", title: "الاستشعار عن بعد", icon: "🛰️", desc: "الأقمار الصناعية والصور الفضائية وتحليلها." },
    { id: "civil3d", title: "Civil 3D", icon: "🏗️", desc: "تعلم تصميم الطرق والأعمال المساحية." },
    { id: "python-gis", title: "Python for GIS", icon: "🐍", desc: "استخدام Python في معالجة البيانات الجغرافية." }
  ];

  let currentUser = null;
  let notes = [];
  let memories = [];
  let progress = [];
  let activeTab = "courses";

  const $ = (id) => document.getElementById(id);

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
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
        padding: 14px;
        direction: rtl;
        color: var(--text, #e8edf7);
      }

      #s-academy .academy-header {
        padding: 22px;
        border-radius: 18px;
        background: linear-gradient(135deg,#142b48,#174b68);
        margin-bottom: 18px;
      }

      #s-academy .academy-header h2 {
        margin: 0 0 9px;
        font-size: 23px;
      }

      #s-academy .academy-header p {
        margin: 0;
        line-height: 1.8;
        opacity: .9;
      }

      #s-academy .academy-tabs {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding: 5px 0 13px;
        margin-bottom: 12px;
      }

      #s-academy .academy-tab {
        flex: 0 0 auto;
        border: 1px solid var(--border,#334155);
        border-radius: 12px;
        padding: 10px 14px;
        background: var(--card,#182334);
        color: inherit;
        cursor: pointer;
      }

      #s-academy .academy-tab.active {
        background: #176b87;
        color: white;
        border-color: #176b87;
      }

      #s-academy .academy-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit,minmax(min(100%,230px),1fr));
        gap: 13px;
      }

      #s-academy .academy-card {
        background: var(--card,#182334);
        border: 1px solid var(--border,#334155);
        border-radius: 15px;
        padding: 16px;
        min-width: 0;
      }

      #s-academy .academy-card h3 {
        font-size: 17px;
        margin: 8px 0;
      }

      #s-academy .academy-card p {
        line-height: 1.8;
        opacity: .8;
      }

      #s-academy .academy-icon {
        font-size: 28px;
      }

      #s-academy .academy-btn {
        border: 0;
        border-radius: 10px;
        padding: 10px 14px;
        background: #167b9c;
        color: white;
        cursor: pointer;
        margin: 4px 0;
      }

      #s-academy .academy-btn.secondary {
        background: #455468;
      }

      #s-academy .academy-btn.danger {
        background: #9b3434;
      }

      #s-academy .academy-input,
      #s-academy .academy-textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 12px;
        border-radius: 10px;
        border: 1px solid var(--border,#334155);
        background: var(--bg,#101827);
        color: inherit;
        margin: 7px 0 12px;
        font: inherit;
      }

      #s-academy .academy-textarea {
        min-height: 110px;
        resize: vertical;
      }

      #s-academy .academy-muted {
        opacity: .7;
        font-size: 13px;
      }

      #s-academy .academy-progress {
        height: 9px;
        background: #344256;
        border-radius: 20px;
        overflow: hidden;
        margin: 12px 0;
      }

      #s-academy .academy-progress > span {
        display: block;
        height: 100%;
        background: #27b58b;
      }

      #s-academy .academy-empty {
        text-align: center;
        padding: 25px 12px;
        opacity: .7;
      }

      #s-academy .academy-status {
        padding: 12px;
        border-radius: 10px;
        background: var(--card,#182334);
        margin-bottom: 14px;
      }

      #academyToast {
        position: fixed;
        z-index: 99999;
        bottom: 20px;
        right: 50%;
        transform: translate(50%,20px);
        background: #26384d;
        color: white;
        padding: 12px 18px;
        border-radius: 12px;
        opacity: 0;
        pointer-events: none;
        transition: .2s;
        max-width: 85%;
        text-align: center;
      }

      #academyToast.show {
        opacity: 1;
        transform: translate(50%,0);
      }

      #academyToast[data-type="error"] {
        background: #9b3434;
      }

      #academyToast[data-type="success"] {
        background: #176b50;
      }

      @media(max-width:600px) {
        #s-academy { padding: 9px; }
        #s-academy .academy-header { padding: 17px; }
      }
    `;

    document.head.appendChild(style);
  }

  function injectInterface() {
    const nav = document.querySelector("nav");
    const main = document.querySelector("main");

    if (!nav || !main) {
      console.error("GEO Academy: لم يتم العثور على nav أو main.");
      return false;
    }

    if (!document.querySelector('[data-t="academy"]')) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.t = "academy";
      button.innerHTML = "<span>🎓</span> الأكاديمية";
      button.addEventListener("click", () => {
        if (typeof window.go === "function") {
          window.go("academy");
        } else {
          document.querySelectorAll(".sec").forEach(section =>
            section.classList.toggle("on", section.id === "s-academy")
          );
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
          <h2>🎓 الأكاديمية الجغرافية</h2>
          <p>منصة تعليمية لتنظيم دراستك وملاحظاتك وتقدمك في الجغرافيا والجيوماتكس.</p>
        </div>

        <div id="academyStatus" class="academy-status">
          جاري التحقق من تسجيل الدخول...
        </div>

        <div class="academy-tabs">
          <button class="academy-tab active" data-academy-tab="courses">📚 الكورسات</button>
          <button class="academy-tab" data-academy-tab="notes">📝 ملاحظاتي</button>
          <button class="academy-tab" data-academy-tab="memory">🧠 ذاكرتي</button>
          <button class="academy-tab" data-academy-tab="progress">📊 تقدمي</button>
          <button class="academy-tab" data-academy-tab="teacher">👨‍🏫 المدرس الذكي</button>
        </div>

        <div id="academyContent"></div>
      `;

      main.appendChild(section);
    }

    injectStyles();
    return true;
  }

  function setStatus(message) {
    const element = $("academyStatus");
    if (element) element.textContent = message;
  }

  function renderCourses() {
    const content = $("academyContent");
    if (!content) return;

    content.innerHTML = `
      <div class="academy-grid">
        ${courses.map(course => {
          const item = progress.find(p => p.id === course.id);
          const percent = Math.max(0, Math.min(100, Number(item?.progress?.percent ?? 0)));

          return `
            <div class="academy-card">
              <div class="academy-icon">${course.icon}</div>
              <h3>${escapeHTML(course.title)}</h3>
              <p>${escapeHTML(course.desc)}</p>
              <div class="academy-progress">
                <span style="width:${percent}%"></span>
              </div>
              <div class="academy-muted">التقدم: ${percent}%</div>
              <button class="academy-btn" data-course="${course.id}">
                ${item?.progress?.completed ? "مكتمل ✓" : "تسجيل إتمام الكورس"}
              </button>
            </div>
          `;
        }).join("")}
      </div>
      <p class="academy-muted" style="margin-top:15px">
        ملاحظة: هذه قائمة المسارات التعليمية. محتوى الدروس التفصيلي سيُضاف في مرحلة بناء الكورسات.
      </p>
    `;
  }

  function renderNotes() {
    const content = $("academyContent");

    content.innerHTML = `
      <div class="academy-card">
        <h3>📝 إضافة ملاحظة دراسية</h3>
        <input id="academyNoteTitle" class="academy-input" maxlength="120"
          placeholder="عنوان الملاحظة">
        <textarea id="academyNoteContent" class="academy-textarea"
          maxlength="10000" placeholder="اكتب ملاحظتك هنا..."></textarea>
        <button class="academy-btn" id="academySaveNote">حفظ الملاحظة</button>
      </div>

      <h3>ملاحظاتي المحفوظة</h3>
      <div class="academy-grid">
        ${notes.length ? notes.map(note => `
          <div class="academy-card">
            <h3>${escapeHTML(note.title || "ملاحظة بدون عنوان")}</h3>
            <p style="white-space:pre-wrap">${escapeHTML(note.content || "")}</p>
            <button class="academy-btn danger" data-delete-note="${escapeHTML(note.id)}">
              حذف
            </button>
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
        <p class="academy-muted">
          احفظ معلومات أو نقاطًا تريد الرجوع إليها لاحقًا. هذه الذاكرة خاصة بحسابك.
        </p>
        <textarea id="academyMemoryContent" class="academy-textarea"
          maxlength="10000" placeholder="اكتب المعلومة التي تريد حفظها..."></textarea>
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

      <h3>المعلومات المحفوظة</h3>
      <div class="academy-grid">
        ${memories.length ? memories.map(item => `
          <div class="academy-card">
            <div class="academy-muted">${escapeHTML(item.category || "general")}</div>
            <p style="white-space:pre-wrap">${escapeHTML(item.content || "")}</p>
            <button class="academy-btn danger" data-delete-memory="${escapeHTML(item.id)}">
              حذف
            </button>
          </div>
        `).join("") : '<div class="academy-empty">ذاكرتك التعليمية فارغة حاليًا.</div>'}
      </div>
    `;

    $("academySaveMemory").addEventListener("click", saveMemory);
  }

  function renderProgress() {
    const content = $("academyContent");

    content.innerHTML = `
      <div class="academy-card">
        <h3>📊 تقدمك التعليمي</h3>
        <p>هنا ستجد المسارات التي سجلت إتمامها.</p>
      </div>
      <div class="academy-grid">
        ${courses.map(course => {
          const item = progress.find(p => p.id === course.id);
          const percent = Math.max(0, Math.min(100, Number(item?.progress?.percent ?? 0)));

          return `
            <div class="academy-card">
              <h3>${course.icon} ${escapeHTML(course.title)}</h3>
              <div class="academy-progress"><span style="width:${percent}%"></span></div>
              <p>${percent}% مكتمل</p>
              <div class="academy-muted">
                ${item?.progress?.completed ? "تم تسجيل إتمام هذا المسار." : "لم يتم تسجيل إتمام هذا المسار بعد."}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderTeacher() {
    $("academyContent").innerHTML = `
      <div class="academy-card">
        <div class="academy-icon">👨‍🏫</div>
        <h3>المدرس الذكي</h3>
        <p>
          مساحة مخصصة لشرح الدروس والإجابة عن الأسئلة ومساعدتك في حل التدريبات.
        </p>
        <div class="academy-status">
          سيتم ربط المدرس الذكي بمحرك الذكاء الاصطناعي الحالي في خطوة مستقلة،
          مع الحفاظ على المحرك وإعداداته كما هي.
        </div>
        <p class="academy-muted">
          لم يتم تفعيل محادثة مدرس الأكاديمية بعد.
        </p>
      </div>
    `;
  }

  function renderTab() {
    document.querySelectorAll("[data-academy-tab]").forEach(button => {
      button.classList.toggle("active", button.dataset.academyTab === activeTab);
    });

    if (!currentUser) {
      $("academyContent").innerHTML = `
        <div class="academy-empty">
          يجب تسجيل الدخول أولًا لاستخدام الأكاديمية وحفظ بياناتك.
        </div>
      `;
      return;
    }

    if (activeTab === "courses") renderCourses();
    if (activeTab === "notes") renderNotes();
    if (activeTab === "memory") renderMemory();
    if (activeTab === "progress") renderProgress();
    if (activeTab === "teacher") renderTeacher();
  }

  async function refreshData() {
    if (!currentUser) return;

    const api = window.GEOAcademy;

    if (!api || !api.ready) {
      setStatus("تعذر تشغيل خدمة الأكاديمية. تأكد من تحميل ملف geo-academy.js.");
      return;
    }

    try {
      await api.getProfile() || await api.createProfile();

      const results = await Promise.all([
        api.getNotes(),
        api.getMemory(100),
        api.getProgress()
      ]);

      notes = Array.isArray(results[0]) ? results[0] : [];
      memories = Array.isArray(results[1]) ? results[1] : [];
      progress = Array.isArray(results[2]) ? results[2] : [];

      setStatus("تم الاتصال بقاعدة بيانات الأكاديمية.");
      renderTab();
    } catch (error) {
      console.error("Academy loading error:", error);
      setStatus("حدث خطأ أثناء تحميل بيانات الأكاديمية: " + (error.message || "خطأ غير معروف"));
      notify("تعذر تحميل بيانات الأكاديمية.", "error");
    }
  }

  async function saveNote() {
    const title = $("academyNoteTitle").value.trim();
    const content = $("academyNoteContent").value.trim();

    if (!title || !content) {
      notify("اكتب عنوان الملاحظة ومحتواها أولًا.", "error");
      return;
    }

    try {
      await window.GEOAcademy.saveNote(title, content);
      notify("تم حفظ الملاحظة بنجاح.", "success");
      await refreshData();
    } catch (error) {
      console.error(error);
      notify("لم يتم حفظ الملاحظة: " + (error.message || ""), "error");
    }
  }

  async function saveMemory() {
    const content = $("academyMemoryContent").value.trim();
    const category = $("academyMemoryCategory").value;

    if (!content) {
      notify("اكتب المعلومة التي تريد حفظها.", "error");
      return;
    }

    try {
      await window.GEOAcademy.saveMemory(content, category);
      notify("تم حفظ المعلومة في ذاكرتك.", "success");
      await refreshData();
    } catch (error) {
      console.error(error);
      notify("لم يتم حفظ المعلومة: " + (error.message || ""), "error");
    }
  }
async function completeCourse(courseId) {
  const course = courses.find(item => item.id === courseId);
  if (!course) return;

  try {
    await window.GEOAcademy.saveProgress(courseId, 100);

    notify("تم تسجيل إتمام المسار بنجاح.", "success");
    await refreshData();
  } catch (error) {
    console.error(error);
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
      console.error(error);
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
      console.error(error);
      notify("تعذر حذف المعلومة.", "error");
    }
  }

  function bindEvents() {
    document.addEventListener("click", event => {
      const tab = event.target.closest("[data-academy-tab]");
      if (tab) {
        activeTab = tab.dataset.academyTab;
        renderTab();
        return;
      }

      const course = event.target.closest("[data-course]");
      if (course) {
        completeCourse(course.dataset.course);
        return;
      }

      const note = event.target.closest("[data-delete-note]");
      if (note) {
        deleteNote(note.dataset.deleteNote);
        return;
      }

      const memory = event.target.closest("[data-delete-memory]");
      if (memory) {
        deleteMemory(memory.dataset.deleteMemory);
      }
    });
  }

  function startAuthListener() {
    if (!window.firebase || !firebase.apps.length) {
      setStatus("Firebase لم يتم تحميله. راجع ترتيب ملفات JavaScript.");
      return;
    }

    const api = window.GEOAcademy;

    if (!api || !api.init()) {
      setStatus("تعذر تهيئة خدمة الأكاديمية.");
      return;
    }

    firebase.auth().onAuthStateChanged(async user => {
      currentUser = user || null;

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
  }

  function init() {
    if (!injectInterface()) return;

    bindEvents();
    renderTab();
    startAuthListener();

    window.GEOAcademyUI.ready = true;
  }

  window.GEOAcademyUI = {
    init,
    refresh: refreshData,
    ready: false
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
