/* ============================================================================
   قسم "ربط التطبيقات بالـ AI" في الأكاديمية (الافتراضي الأول + رفع 500MB للأدمن)
   + توزيع الأدوات المتطورة وأدوات الـ AI المستقبلية في المساحة والجيوماتكس فقط
   ============================================================================ */
(function () {
  "use strict";
  if (window.GEOAcademyProPlusV2Init) return;
  window.GEOAcademyProPlusV2Init = true;

  const ADMIN_EMAIL = "eng.ahmedsamir.gis@gmail.com";
  const ADMIN_WHATSAPP = "201015912371";
  const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 ميجابايت (نصف جيجا)

  let isAdminUser = false;
  let isProPlusUser = false;
  let selectedSoftware = "all";
  let showToolsDownloadBtn = localStorage.getItem("gd_ai_show_tools_btn") === "1"; // معطل افتراضياً ولا يظهر للمستخدمين إلا إذا فعّله الأدمن

  // قائمة الدروس والحالات المرفوعة
  let aiBridgeCourses = JSON.parse(localStorage.getItem("gd_ai_bridge_courses_v2") || "null") || [
    {
      id: "ai_cad_1",
      software: "AutoCAD",
      title: "ربط AutoCAD بالذكاء الاصطناعي وتوليد الليسبات التلقائية",
      desc: "شرح عملي لربط أوتوكاد بأوامر الذكاء الاصطناعي لتسريع التفريد، الترقيم، واستخراج الجداول بضغطة زر.",
      videoUrl: "https://www.youtube.com/results?search_query=AutoCAD+AI+AutoLISP+automation",
      pdfUrl: "",
      pdfName: "",
      toolsUrl: "",
      createdAt: Date.now()
    }
  ];

  // إزالة أي بقايا للبانر/الصندوق العام القديم
  function cleanupOldGlobalBox() {
    const oldBox = document.getElementById("gdAdvancedEngToolsBox");
    if (oldBox) oldBox.remove();
  }

  function injectStyles() {
    if (document.getElementById("gdAcademyProPlusV2Styles")) return;
    const style = document.createElement("style");
    style.id = "gdAcademyProPlusV2Styles";
    style.textContent = `
      /* قسم ربط التطبيقات بالـ AI داخل الأكاديمية */
      .gd-ai-academy-box {
        background: #ffffff;
        border: 2px solid #e09f24;
        border-radius: 18px;
        padding: 16px;
        margin: 10px 0 18px;
        direction: rtl;
        text-align: right;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
      }
      .gd-ai-academy-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid #e2e8f0;
      }
      .gd-ai-academy-title {
        margin: 0;
        font-size: 16.5px;
        font-weight: 900;
        color: #0f172a;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .gd-proplus-pill {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: #ffffff;
        padding: 3px 10px;
        border-radius: 99px;
        font-size: 11px;
        font-weight: 900;
      }

      /* شريط اختيار التطبيق + زر البحث */
      .gd-sw-search-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 14px;
        background: #f8fafc;
        padding: 10px;
        border-radius: 12px;
        border: 1px solid #cbd5e1;
      }
      .gd-sw-select {
        flex: 1;
        min-width: 190px;
        padding: 9px 12px;
        border-radius: 10px;
        border: 1.5px solid #cbd5e1;
        background: #ffffff;
        color: #0f172a;
        font-size: 13px;
        font-weight: 800;
        font-family: inherit;
      }
      .gd-sw-search-btn {
        background: #0f172a;
        color: #e09f24;
        border: none;
        border-radius: 10px;
        padding: 9px 18px;
        font-size: 13px;
        font-weight: 900;
        cursor: pointer;
        font-family: inherit;
      }

      /* كروت الفيديوهات */
      .gd-ai-videos-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(275px, 1fr));
        gap: 14px;
      }
      .gd-ai-video-card {
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        border-radius: 15px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 10px;
      }
      .gd-ai-video-card h4 {
        margin: 0;
        font-size: 14.5px;
        font-weight: 900;
        color: #0f172a;
        line-height: 1.45;
      }
      .gd-ai-video-card p {
        margin: 0;
        font-size: 12.5px;
        color: #475569;
        line-height: 1.65;
        white-space: pre-line;
      }
      .gd-ai-card-actions {
        display: flex;
        flex-direction: column;
        gap: 7px;
        margin-top: 4px;
      }
      .gd-ai-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 9px 12px;
        border-radius: 10px;
        font-size: 12.5px;
        font-weight: 900;
        text-decoration: none;
        border: none;
        cursor: pointer;
        font-family: inherit;
        width: 100%;
        box-sizing: border-box;
      }
      .gd-ai-btn.watch {
        background: #16a34a;
        color: #ffffff;
      }
      .gd-ai-btn.pdf {
        background: #dc2626;
        color: #ffffff;
      }
      .gd-ai-btn.tools {
        background: #2563eb;
        color: #ffffff;
      }
      .gd-ai-btn.locked {
        background: #0f172a;
        color: #e09f24;
      }

      /* لوحة تحكم الأدمن داخل الأكاديمية */
      .gd-ai-admin-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
        background: #fffbeb;
        border: 1.5px dashed #f59e0b;
        border-radius: 12px;
        padding: 10px 12px;
        margin-bottom: 12px;
      }

      /* نافذة رفع الفيديو والملفات للأدمن */
      #gdAiUploadModal {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.82);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 10040;
        direction: rtl;
      }
      .gd-ai-modal-box {
        background: #ffffff;
        border: 2px solid #e09f24;
        border-radius: 18px;
        width: 100%;
        max-width: 480px;
        max-height: 90vh;
        overflow-y: auto;
        padding: 18px;
        color: #0f172a;
      }
      .gd-ai-field {
        margin-bottom: 11px;
      }
      .gd-ai-field label {
        display: block;
        font-size: 12px;
        font-weight: 800;
        margin-bottom: 4px;
        color: #334155;
      }
      .gd-ai-field input,
      .gd-ai-field select,
      .gd-ai-field textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 9px 11px;
        border-radius: 10px;
        border: 1.5px solid #cbd5e1;
        font-size: 13px;
        font-family: inherit;
        background: #f8fafc;
        color: #0f172a;
      }

      /* قسم الأدوات المتطورة المخصص للمساحة والجيوماتكس */
      .gd-section-tools-box {
        background: #ffffff;
        border: 1.5px solid #e09f24;
        border-radius: 16px;
        padding: 14px;
        margin: 14px 0;
        direction: rtl;
        text-align: right;
      }
      .gd-section-tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(235px, 1fr));
        gap: 10px;
        margin-top: 10px;
      }
      .gd-adv-tool-card {
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        border-radius: 13px;
        padding: 12px;
        cursor: pointer;
        transition: transform 0.15s ease, border-color 0.15s ease;
      }
      .gd-adv-tool-card:hover {
        transform: translateY(-2px);
        border-color: #e09f24;
      }
      .gd-adv-tool-card h5 {
        margin: 0 0 5px;
        font-size: 13px;
        font-weight: 900;
        color: #0f172a;
      }
      .gd-adv-tool-card p {
        margin: 0;
        font-size: 11.5px;
        color: #475569;
        line-height: 1.5;
      }
      .gd-ai-new-badge {
        display: inline-block;
        background: #0f172a;
        color: #e09f24;
        font-size: 10px;
        font-weight: 900;
        padding: 1px 7px;
        border-radius: 6px;
        margin-bottom: 5px;
      }

      /* نافذة تشغيل الأدوات */
      #gdAdvToolModal {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.8);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 10035;
        direction: rtl;
      }
      .gd-adv-modal-box {
        background: #ffffff;
        border: 2px solid #e09f24;
        border-radius: 18px;
        width: 100%;
        max-width: 480px;
        max-height: 88vh;
        overflow-y: auto;
        padding: 18px;
        color: #0f172a;
      }
      .gd-adv-input {
        width: 100%;
        box-sizing: border-box;
        padding: 9px 11px;
        border-radius: 10px;
        border: 1.5px solid #cbd5e1;
        margin-top: 4px;
        margin-bottom: 10px;
        font-size: 13px;
        font-family: inherit;
      }
      .gd-adv-result {
        background: #fffbeb;
        border: 1.5px solid #f59e0b;
        border-radius: 12px;
        padding: 12px;
        margin-top: 12px;
        font-size: 13px;
        line-height: 1.7;
        color: #1e293b;
      }

      /* التوافق مع الوضع الداكن */
      body.dark-mode .gd-ai-academy-box,
      body.dark-mode .gd-section-tools-box,
      [data-theme="dark"] .gd-ai-academy-box,
      [data-theme="dark"] .gd-section-tools-box {
        background: #171c26;
        border-color: #2a3242;
      }
      body.dark-mode .gd-ai-academy-title,
      body.dark-mode .gd-ai-video-card h4,
      body.dark-mode .gd-adv-tool-card h5,
      [data-theme="dark"] .gd-ai-academy-title,
      [data-theme="dark"] .gd-ai-video-card h4,
      [data-theme="dark"] .gd-adv-tool-card h5 {
        color: #ffffff;
      }
      body.dark-mode .gd-ai-video-card,
      body.dark-mode .gd-adv-tool-card,
      [data-theme="dark"] .gd-ai-video-card,
      [data-theme="dark"] .gd-adv-tool-card {
        background: #10141c;
        border-color: #2a3242;
      }
      body.dark-mode .gd-ai-video-card p,
      body.dark-mode .gd-adv-tool-card p,
      [data-theme="dark"] .gd-ai-video-card p,
      [data-theme="dark"] .gd-adv-tool-card p {
        color: #cbd5e1;
      }
    `;
    document.head.appendChild(style);
  }

  function checkUserProPlusAccess() {
    if (isAdminUser) return true;
    const plan = (localStorage.getItem("gd_user_plan") || localStorage.getItem("plan") || "").toLowerCase();
    return isProPlusUser || plan.includes("plus") || plan.includes("pro_plus");
  }

  // 1. العثور على حاوية الأكاديمية وجعل قسم "ربط التطبيقات بالـ AI" هو الأول تلقائياً
  function findAcademyContainer() {
    return (
      document.getElementById("academy") ||
      document.getElementById("academyView") ||
      document.getElementById("sec-academy") ||
      document.querySelector('[data-section="academy"], [data-tab-content="academy"], [id*="academy"]')
    );
  }

  function renderAiAcademySection() {
    const container = findAcademyContainer();
    if (!container) return;

    let box = document.getElementById("gdAcademyAiBridgeBox");
    if (!box) {
      box = document.createElement("div");
      box.id = "gdAcademyAiBridgeBox";
      box.className = "gd-ai-academy-box";
    }
    // ضمان وضعه دائماً كأول عنصر في أعلى الأكاديمية
    if (container.firstElementChild !== box) {
      container.prepend(box);
    }

    const hasAccess = checkUserProPlusAccess();
    const filtered = aiBridgeCourses.filter(c => selectedSoftware === "all" || c.software === selectedSoftware);

    const cardsHtml = filtered.length
      ? filtered
          .map(
            c => `
        <div class="gd-ai-video-card">
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <span style="background:#0f172a;color:#e09f24;padding:3px 10px;border-radius:7px;font-size:11.5px;font-weight:900;">
                💻 ${c.software}
              </span>
              <span style="font-size:11px;color:#64748b;font-weight:700;">PRO Plus</span>
            </div>
            <h4>${c.title}</h4>
            <p style="margin-top:6px;">${c.desc}</p>
          </div>

          <div class="gd-ai-card-actions">
            ${
              hasAccess
                ? `
                <button type="button" class="gd-ai-btn watch" onclick="window.GEOAcademyBridgeActions.playVideo('${c.id}')">
                  ▶ مشاهدة الفيديو التطبيقي
                </button>
                ${
                  c.pdfUrl
                    ? `<a href="${c.pdfUrl}" download="${c.pdfName || c.title + ".pdf"}" target="_blank" rel="noopener" class="gd-ai-btn pdf">
                        📄 تحميل ملف PDF الخاص بالفيديو
                      </a>`
                    : ""
                }
                ${
                  showToolsDownloadBtn && c.toolsUrl
                    ? `<a href="${c.toolsUrl}" target="_blank" rel="noopener" class="gd-ai-btn tools">
                        🧰 تحميل الأدوات المرفقة
                      </a>`
                    : ""
                }
              `
                : `
                <button type="button" class="gd-ai-btn locked" onclick="window.GEOAcademyBridgeActions.requestUpgrade('${c.title.replace(/'/g, "")}')">
                  🔒 حصري لمشتركي PRO Plus — اشترك للمشاهدة والتحميل
                </button>
              `
            }
            ${
              isAdminUser
                ? `<button type="button" onclick="window.GEOAcademyBridgeActions.deleteCourse('${c.id}')"
                    style="background:#334155;color:#fff;border:none;border-radius:8px;padding:6px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;">
                    🗑 حذف الدرس (أدمن)
                  </button>`
                : ""
            }
          </div>
        </div>
      `
          )
          .join("")
      : `<p style="text-align:center;color:#64748b;padding:18px;font-weight:700;">لا توجد فيديوهات مرفوعة لهذا التطبيق حالياً.</p>`;

    box.innerHTML = `
      <div class="gd-ai-academy-header">
        <h3 class="gd-ai-academy-title">
          🤖 ربط التطبيقات الهندسية بالـ AI
          <span class="gd-proplus-pill">PRO Plus</span>
        </h3>
      </div>

      ${
        isAdminUser
          ? `
        <div class="gd-ai-admin-bar">
          <button type="button" onclick="window.GEOAcademyBridgeActions.openUploadModal()"
            style="background:#e0531f;color:#fff;border:none;border-radius:9px;padding:8px 14px;font-size:12.5px;font-weight:900;cursor:pointer;font-family:inherit;">
            ➕ رفع فيديو جديد (حتى 500MB) + PDF
          </button>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:800;color:#78350f;cursor:pointer;">
            <input type="checkbox" ${showToolsDownloadBtn ? "checked" : ""}
              onchange="window.GEOAcademyBridgeActions.toggleToolsBtn(this.checked)">
            إظهار زر «تحميل الأدوات» في الكروت
          </label>
        </div>
      `
          : ""
      }

      <div class="gd-sw-search-bar">
        <select id="gdAcademySwSelect" class="gd-sw-select">
          <option value="all" ${selectedSoftware === "all" ? "selected" : ""}>جميع التطبيقات (AutoCAD / Civil 3D / ArcGIS Pro / ERDAS)</option>
          <option value="AutoCAD" ${selectedSoftware === "AutoCAD" ? "selected" : ""}>AutoCAD (أوتوكاد)</option>
          <option value="Civil 3D" ${selectedSoftware === "Civil 3D" ? "selected" : ""}>Civil 3D (سيفيل ثري دي)</option>
          <option value="ArcGIS Pro" ${selectedSoftware === "ArcGIS Pro" ? "selected" : ""}>ArcGIS Pro (أرك جي آي إس برو)</option>
          <option value="ERDAS" ${selectedSoftware === "ERDAS" ? "selected" : ""}>ERDAS Imagine (إيرداس)</option>
          <option value="QGIS" ${selectedSoftware === "QGIS" ? "selected" : ""}>QGIS</option>
        </select>
        <button type="button" class="gd-sw-search-btn" onclick="window.GEOAcademyBridgeActions.searchByApp()">
          🔍 بحث
        </button>
      </div>

      <div class="gd-ai-videos-grid">${cardsHtml}</div>
    `;
  }

  // نافذة رفع الفيديو (حتى نصف جيجا) + PDF للأدمن فقط
  function openAdminUploadModal() {
    if (!isAdminUser) return;
    let modal = document.getElementById("gdAiUploadModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "gdAiUploadModal";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="gd-ai-modal-box">
        <h3 style="margin:0 0 12px;color:#b45309;font-size:16px;">➕ رفع درس فيديو ربط التطبيقات بالـ AI</h3>
        <form id="gdAiUploadForm">
          <div class="gd-ai-field">
            <label>اختر التطبيق *</label>
            <select name="software" required>
              <option value="AutoCAD">AutoCAD (أوتوكاد)</option>
              <option value="Civil 3D">Civil 3D (سيفيل ثري دي)</option>
              <option value="ArcGIS Pro">ArcGIS Pro (أرك جي آي إس برو)</option>
              <option value="ERDAS">ERDAS Imagine (إيرداس)</option>
              <option value="QGIS">QGIS</option>
            </select>
          </div>
          <div class="gd-ai-field">
            <label>عنوان الفيديو *</label>
            <input type="text" name="title" placeholder="مثال: ربط AutoCAD بالذكاء الاصطناعي لاستخراج الجداول" required>
          </div>
          <div class="gd-ai-field">
            <label>وصف الفيديو *</label>
            <textarea name="desc" rows="3" placeholder="اكتب شرحاً تفصيلياً لما سيتعلمه المشترك في هذا الفيديو..." required></textarea>
          </div>
          <div class="gd-ai-field">
            <label>رفع الفيديو من الهاتف (يدعم حتى 500 ميجابايت / نصف جيجا) أو ضع رابط الفيديو</label>
            <input type="file" id="gdAiVideoFileInput" accept="video/*" style="margin-bottom:6px;">
            <input type="url" name="videoUrl" placeholder="أو الصق رابط الفيديو المباشر (YouTube / Google Drive / MP4)">
            <small id="gdAiVideoSizeInfo" style="display:block;color:#64748b;font-size:11px;margin-top:3px;">الحد الأقصى لحجم ملف الفيديو: 500 ميجابايت (0.5 GB).</small>
          </div>
          <div class="gd-ai-field">
            <label>رفع ملف PDF الخاص بالفيديو (ملخص / أوامر / أكواد)</label>
            <input type="file" id="gdAiPdfFileInput" accept=".pdf,application/pdf">
          </div>
          <div class="gd-ai-field" style="${showToolsDownloadBtn ? "" : "display:none;"}">
            <label>رابط تحميل الأدوات (يظهر فقط عند تفعيل زر تحميل الأدوات)</label>
            <input type="url" name="toolsUrl" placeholder="https://...">
          </div>
          <div style="display:flex;gap:8px;margin-top:14px;">
            <button type="submit" id="gdAiPublishBtn" style="flex:1;background:#e09f24;color:#0f172a;border:none;padding:10px;border-radius:10px;font-weight:900;cursor:pointer;font-family:inherit;">
              نشر الفيديو والملفات الآن
            </button>
            <button type="button" onclick="document.getElementById('gdAiUploadModal').style.display='none'"
              style="background:#e2e8f0;color:#334155;border:none;padding:10px 14px;border-radius:10px;font-weight:800;cursor:pointer;font-family:inherit;">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    `;

    const videoInput = document.getElementById("gdAiVideoFileInput");
    const sizeInfo = document.getElementById("gdAiVideoSizeInfo");
    videoInput.onchange = () => {
      const f = videoInput.files && videoInput.files[0];
      if (!f) return;
      const mb = (f.size / (1024 * 1024)).toFixed(1);
      if (f.size > MAX_VIDEO_BYTES) {
        alert(`حجم الفيديو (${mb} MB) يتجاوز الحد الأقصى المسموح به وهو 500 ميجابايت (نصف جيجا).`);
        videoInput.value = "";
        sizeInfo.textContent = "الحد الأقصى لحجم ملف الفيديو: 500 ميجابايت (0.5 GB).";
      } else {
        sizeInfo.innerHTML = `<span style="color:#16a34a;font-weight:800;">✔ تم اختيار الفيديو: ${f.name} (${mb} MB / 500 MB)</span>`;
      }
    };

    document.getElementById("gdAiUploadForm").onsubmit = async e => {
      e.preventDefault();
      const form = e.target;
      const fd = new FormData(form);
      const publishBtn = document.getElementById("gdAiPublishBtn");
      publishBtn.disabled = true;
      publishBtn.textContent = "جاري الرفع والنشر...";

      try {
        let finalVideoUrl = (fd.get("videoUrl") || "").trim();
        const vFile = videoInput.files && videoInput.files[0];

        if (vFile) {
          // محاولة الرفع السحابي عبر Firebase Storage إن كان مفعلاً، وإلا إنشاء رابط تشغيل محلي فوري
          if (window.firebase && typeof firebase.storage === "function") {
            const ref = firebase.storage().ref(`ai_bridge_videos/${Date.now()}_${vFile.name}`);
            await ref.put(vFile);
            finalVideoUrl = await ref.getDownloadURL();
          } else {
            finalVideoUrl = URL.createObjectURL(vFile);
          }
        }

        if (!finalVideoUrl) {
          alert("من فضلك اختر ملف فيديو من هاتفك أو ضع رابط الفيديو.");
          publishBtn.disabled = false;
          publishBtn.textContent = "نشر الفيديو والملفات الآن";
          return;
        }

        let finalPdfUrl = "";
        let finalPdfName = "";
        const pdfInput = document.getElementById("gdAiPdfFileInput");
        const pFile = pdfInput.files && pdfInput.files[0];
        if (pFile) {
          finalPdfName = pFile.name;
          if (window.firebase && typeof firebase.storage === "function") {
            const pdfRef = firebase.storage().ref(`ai_bridge_pdfs/${Date.now()}_${pFile.name}`);
            await pdfRef.put(pFile);
            finalPdfUrl = await pdfRef.getDownloadURL();
          } else {
            finalPdfUrl = await fileToDataUrl(pFile);
          }
        }

        const newItem = {
          id: "ai_c_" + Date.now(),
          software: fd.get("software"),
          title: (fd.get("title") || "").trim(),
          desc: (fd.get("desc") || "").trim(),
          videoUrl: finalVideoUrl,
          pdfUrl: finalPdfUrl,
          pdfName: finalPdfName,
          toolsUrl: (fd.get("toolsUrl") || "").trim(),
          createdAt: Date.now()
        };

        aiBridgeCourses.unshift(newItem);
        localStorage.setItem("gd_ai_bridge_courses_v2", JSON.stringify(aiBridgeCourses));

        if (window.firebase && typeof firebase.firestore === "function") {
          try {
            await firebase.firestore().collection("geodev_ai_courses").add(newItem);
          } catch (_) {}
        }

        modal.style.display = "none";
        renderAiAcademySection();
        if (typeof window.toast === "function") window.toast("تم نشر الفيديو وملف الـ PDF بنجاح!", "success");
      } catch (err) {
        alert("حدث خطأ أثناء الرفع: " + (err && err.message ? err.message : err));
      } finally {
        publishBtn.disabled = false;
        publishBtn.textContent = "نشر الفيديو والملفات الآن";
      }
    };

    modal.style.display = "flex";
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  // 2. توزيع الأدوات في قسمي "الجيوماتكس" و "المساحة" فقط (وحذف الأدوات المكررة والبنر السفلي)
  function injectToolsIntoSurveyAndGeomatics() {
    cleanupOldGlobalBox();

    // أ) قسم الجيوماتكس: حاسبة المؤشرات الطيفية + نطاق UTM/ETM + أدوات AI للاستشعار والـ GIS
    const geomaticsContainer =
      document.getElementById("geomatics") ||
      document.getElementById("gis") ||
      document.querySelector('[data-section="geomatics"], [data-section="gis"], [id*="geomatics"], [id*="gis"]');

    if (geomaticsContainer && !document.getElementById("gdGeomaticsAdvTools")) {
      const geoBox = document.createElement("div");
      geoBox.id = "gdGeomaticsAdvTools";
      geoBox.className = "gd-section-tools-box";
      geoBox.innerHTML = `
        <h4 style="margin:0;font-size:15px;font-weight:900;color:#b45309;">
          🛰️ أدوات الجيوماتكس والاستشعار عن بُعد المتطورة (AI & Remote Sensing)
        </h4>
        <div class="gd-section-tools-grid">
          <div class="gd-adv-tool-card" onclick="window.GEOAdvancedTools.open('ndvi')">
            <span class="gd-ai-new-badge">استشعار عن بُعد</span>
            <h5>🛰️ حاسبة المؤشرات الطيفية (NDVI / NDWI / NDBI)</h5>
            <p>حساب مؤشرات الغطاء النباتي والمياه والمباني من الباندات وتوليد معادلة Raster Calculator.</p>
          </div>

          <div class="gd-adv-tool-card" onclick="window.GEOAdvancedTools.open('utm')">
            <span class="gd-ai-new-badge">جيوديسيا وإسقاط</span>
            <h5>🗺️ تحديد نطاق UTM & ETM ومعامل القياس</h5>
            <p>استخراج نطاق UTM Zone وحزام مصر ETM مباشرة من خط الطول ودائرة العرض.</p>
          </div>

          <div class="gd-adv-tool-card" onclick="window.GEOAdvancedTools.open('ai_change')">
            <span class="gd-ai-new-badge">أداة AI مستقبلية ✨</span>
            <h5>🧠 محلل كشف التغيرات الطيفية الزمني بالـ AI</h5>
            <p>التنبؤ بمناطق الزحف العمراني أو تغير الغطاء النباتي بين فترتين زمنيتين (T1 / T2) آلياً.</p>
          </div>

          <div class="gd-adv-tool-card" onclick="window.GEOAdvancedTools.open('ai_drone')">
            <span class="gd-ai-new-badge">أداة AI مستقبلية ✨</span>
            <h5>🚁 مخطط مسارات الدرون والتصوير الجوي بالـ AI</h5>
            <p>حساب ارتفاع الطيران (GSD)، التداخل، وعدد الصور والبطاريات المطلوبة للمسح الجوي.</p>
          </div>
        </div>
      `;
      geomaticsContainer.appendChild(geoBox);
    }

    // ب) قسم المساحة: نسخة من حاسبة المؤشرات الطيفية + أدوات AI للمساحة والكميات
    const surveyContainer =
      document.getElementById("survey") ||
      document.getElementById("surveying") ||
      document.querySelector('[data-section="survey"], [id*="survey"]');

    if (surveyContainer && !document.getElementById("gdSurveyAdvTools")) {
      const srvBox = document.createElement("div");
      srvBox.id = "gdSurveyAdvTools";
      srvBox.className = "gd-section-tools-box";
      srvBox.innerHTML = `
        <h4 style="margin:0;font-size:15px;font-weight:900;color:#b45309;">
          📐 أدوات المساحة المتطورة والذكاء الاصطناعي (AI Surveying Suite)
        </h4>
        <div class="gd-section-tools-grid">
          <div class="gd-adv-tool-card" onclick="window.GEOAdvancedTools.open('ndvi')">
            <span class="gd-ai-new-badge">دمج المرئيات والمساحة</span>
            <h5>🛰️ حاسبة المؤشرات الطيفية (NDVI / NDWI / NDBI)</h5>
            <p>تحليل الغطاء الأرضي والمسطحات المائية للمناطق المرفوعة مساحياً وتوليد معادلة الاستخراج.</p>
          </div>

          <div class="gd-adv-tool-card" onclick="window.GEOAdvancedTools.open('ai_earthwork')">
            <span class="gd-ai-new-badge">أداة AI مستقبلية ✨</span>
            <h5>🛣️ مُقدّر كميات الحفر والردم والتكلفة بالـ AI</h5>
            <p>حساب حجم الحفر والردم ومعامل الانتفاش وتقدير عدد النقلات والتكلفة الهندسية فوراً.</p>
          </div>

          <div class="gd-adv-tool-card" onclick="window.GEOAdvancedTools.open('ai_qaqc')">
            <span class="gd-ai-new-badge">أداة AI مستقبلية ✨</span>
            <h5>🔎 مدقق أخطاء الترافيرس وأرصاد GNSS بالـ AI</h5>
            <p>فحص دقة الأرصاد الحقلية واكتشاف مصدر الخطأ (الزاوي أو الطولي أو Multipath) واقتراح الحل.</p>
          </div>
        </div>
      `;
      surveyContainer.appendChild(srvBox);
    }
  }

  // 3. تشغيل نوافذ الأدوات التفاعلية
  function openAdvancedToolModal(toolKey) {
    let modal = document.getElementById("gdAdvToolModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "gdAdvToolModal";
      document.body.appendChild(modal);
    }

    let bodyHtml = "";
    if (toolKey === "ndvi") {
      bodyHtml = `
        <h3 style="margin:0 0 10px;color:#b45309;">🛰️ حاسبة المؤشرات الطيفية (NDVI / NDWI / NDBI)</h3>
        <label style="font-size:12px;font-weight:800;">اختر المؤشر الطيفي:</label>
        <select id="gdRsType" class="gd-adv-input">
          <option value="NDVI">NDVI (مؤشر الغطاء النباتي: NIR & Red)</option>
          <option value="NDWI">NDWI (مؤشر المسطحات المائية: Green & NIR)</option>
          <option value="NDBI">NDBI (مؤشر المناطق العمرانية: SWIR & NIR)</option>
        </select>
        <label style="font-size:12px;font-weight:800;">قيمة الباند الأول (NIR أو Green أو SWIR):</label>
        <input type="number" step="any" id="gdRsB1" class="gd-adv-input" placeholder="مثال: 0.65">
        <label style="font-size:12px;font-weight:800;">قيمة الباند الثاني (Red أو NIR):</label>
        <input type="number" step="any" id="gdRsB2" class="gd-adv-input" placeholder="مثال: 0.18">
        <button type="button" onclick="window.GEOAdvancedTools.calcRs()"
          style="width:100%;background:#e09f24;color:#0f172a;border:none;padding:10px;border-radius:10px;font-weight:900;cursor:pointer;">
          احسب المؤشر واستخرج المعادلة
        </button>
        <div id="gdAdvToolOut" class="gd-adv-result" style="display:none;"></div>
      `;
    } else if (toolKey === "utm") {
      bodyHtml = `
        <h3 style="margin:0 0 10px;color:#b45309;">🗺️ مستكشف نطاقات UTM & ETM الجيوديسي</h3>
        <label style="font-size:12px;font-weight:800;">خط الطول (Longitude) بالدرجات العشرية:</label>
        <input type="number" step="any" id="gdUtmLon" class="gd-adv-input" placeholder="مثال: 30.75">
        <label style="font-size:12px;font-weight:800;">دائرة العرض (Latitude) بالدرجات العشرية:</label>
        <input type="number" step="any" id="gdUtmLat" class="gd-adv-input" placeholder="مثال: 28.10">
        <button type="button" onclick="window.GEOAdvancedTools.calcUtm()"
          style="width:100%;background:#e09f24;color:#0f172a;border:none;padding:10px;border-radius:10px;font-weight:900;cursor:pointer;">
          تحديد النطاق ونظام الإسقاط
        </button>
        <div id="gdAdvToolOut" class="gd-adv-result" style="display:none;"></div>
      `;
    } else if (toolKey === "ai_change") {
      bodyHtml = `
        <h3 style="margin:0 0 10px;color:#b45309;">🧠 محلل كشف التغيرات الطيفية الزمني بالـ AI</h3>
        <label style="font-size:12px;font-weight:800;">قيمة المؤشر في الفترة الأقدم (T1):</label>
        <input type="number" step="any" id="gdChT1" class="gd-adv-input" placeholder="مثال: 0.62">
        <label style="font-size:12px;font-weight:800;">قيمة المؤشر في الفترة الأحدث (T2):</label>
        <input type="number" step="any" id="gdChT2" class="gd-adv-input" placeholder="مثال: 0.21">
        <button type="button" onclick="window.GEOAdvancedTools.calcAiChange()"
          style="width:100%;background:#e09f24;color:#0f172a;border:none;padding:10px;border-radius:10px;font-weight:900;cursor:pointer;">
          تحليل التغير والتنبؤ بالظاهرة
        </button>
        <div id="gdAdvToolOut" class="gd-adv-result" style="display:none;"></div>
      `;
    } else if (toolKey === "ai_drone") {
      bodyHtml = `
        <h3 style="margin:0 0 10px;color:#b45309;">🚁 مخطط مسارات الدرون والتصوير الجوي بالـ AI</h3>
        <label style="font-size:12px;font-weight:800;">مساحة منطقة الرفع بالفدان:</label>
        <input type="number" step="any" id="gdDrArea" class="gd-adv-input" placeholder="مثال: 50">
        <label style="font-size:12px;font-weight:800;">ارتفاع الطيران المطلوب (بالمتر):</label>
        <input type="number" step="any" id="gdDrAlt" class="gd-adv-input" value="80">
        <button type="button" onclick="window.GEOAdvancedTools.calcAiDrone()"
          style="width:100%;background:#e09f24;color:#0f172a;border:none;padding:10px;border-radius:10px;font-weight:900;cursor:pointer;">
          توليد خطة الطيران وعدد الصور
        </button>
        <div id="gdAdvToolOut" class="gd-adv-result" style="display:none;"></div>
      `;
    } else if (toolKey === "ai_earthwork") {
      bodyHtml = `
        <h3 style="margin:0 0 10px;color:#b45309;">🛣️ مُقدّر كميات الحفر والردم والتكلفة بالـ AI</h3>
        <label style="font-size:12px;font-weight:800;">مساحة المسطح (م²):</label>
        <input type="number" step="any" id="gdEwArea" class="gd-adv-input" placeholder="مثال: 1200">
        <label style="font-size:12px;font-weight:800;">متوسط فرق المنسوب (متر):</label>
        <input type="number" step="any" id="gdEwDepth" class="gd-adv-input" placeholder="مثال: 1.4">
        <label style="font-size:12px;font-weight:800;">نوع التربة:</label>
        <select id="gdEwSoil" class="gd-adv-input">
          <option value="1.15">تربة رملية (معامل انتفاش 15%)</option>
          <option value="1.25">تربة طينية (معامل انتفاش 25%)</option>
          <option value="1.40">تربة صخرية (معامل انتفاش 40%)</option>
        </select>
        <button type="button" onclick="window.GEOAdvancedTools.calcAiEarthwork()"
          style="width:100%;background:#e09f24;color:#0f172a;border:none;padding:10px;border-radius:10px;font-weight:900;cursor:pointer;">
          حساب الكميات وعدد النقلات
        </button>
        <div id="gdAdvToolOut" class="gd-adv-result" style="display:none;"></div>
      `;
    } else if (toolKey === "ai_qaqc") {
      bodyHtml = `
        <h3 style="margin:0 0 10px;color:#b45309;">🔎 مدقق أخطاء الترافيرس وأرصاد GNSS بالـ AI</h3>
        <label style="font-size:12px;font-weight:800;">خطأ القفل الإحداثي (ΔE بالمتر):</label>
        <input type="number" step="any" id="gdQaDe" class="gd-adv-input" placeholder="مثال: 0.018">
        <label style="font-size:12px;font-weight:800;">خطأ القفل الإحداثي (ΔN بالمتر):</label>
        <input type="number" step="any" id="gdQaDn" class="gd-adv-input" placeholder="مثال: 0.022">
        <label style="font-size:12px;font-weight:800;">إجمالي محيط الترافيرس (بالمتر):</label>
        <input type="number" step="any" id="gdQaPerim" class="gd-adv-input" placeholder="مثال: 850">
        <button type="button" onclick="window.GEOAdvancedTools.calcAiQaqc()"
          style="width:100%;background:#e09f24;color:#0f172a;border:none;padding:10px;border-radius:10px;font-weight:900;cursor:pointer;">
          تشخيص الدقة واقتراح التصحيح
        </button>
        <div id="gdAdvToolOut" class="gd-adv-result" style="display:none;"></div>
      `;
    }

    modal.innerHTML = `
      <div class="gd-adv-modal-box">
        ${bodyHtml}
        <button type="button" onclick="document.getElementById('gdAdvToolModal').style.display='none'"
          style="width:100%;margin-top:12px;background:#e2e8f0;color:#334155;border:none;padding:9px;border-radius:10px;font-weight:800;cursor:pointer;">
          إغلاق
        </button>
      </div>
    `;
    modal.style.display = "flex";
  }

  window.GEOAdvancedTools = {
    open: openAdvancedToolModal,
    calcRs() {
      const type = document.getElementById("gdRsType").value;
      const b1 = parseFloat(document.getElementById("gdRsB1").value);
      const b2 = parseFloat(document.getElementById("gdRsB2").value);
      const out = document.getElementById("gdAdvToolOut");
      if (isNaN(b1) || isNaN(b2) || b1 + b2 === 0) return alert("أدخل قيم الباندات بشكل صحيح.");
      const val = ((b1 - b2) / (b1 + b2)).toFixed(4);
      let desc = type === "NDVI" ? (val > 0.4 ? "غطاء نباتي صحي" : "تربة أو عمران") : val > 0.1 ? "ظاهرة موجبة واضحة" : "ظاهرة منخفضة";
      const formula = type === "NDVI" ? `Float("NIR" - "Red") / Float("NIR" + "Red")` : type === "NDWI" ? `Float("Green" - "NIR") / Float("Green" + "NIR")` : `Float("SWIR" - "NIR") / Float("SWIR" + "NIR")`;
      out.style.display = "block";
      out.innerHTML = `<strong>قيمة ${type}:</strong> <b>${val}</b> (${desc})<br><strong>معادلة Raster Calculator:</strong><code style="display:block;direction:ltr;background:#fef3c7;padding:5px;border-radius:6px;margin-top:4px;">${formula}</code>`;
    },
    calcUtm() {
      const lon = parseFloat(document.getElementById("gdUtmLon").value);
      const lat = parseFloat(document.getElementById("gdUtmLat").value);
      const out = document.getElementById("gdAdvToolOut");
      if (isNaN(lon) || isNaN(lat)) return alert("أدخل خط الطول ودائرة العرض.");
      const zone = Math.floor((lon + 180) / 6) + 1;
      const epsg = (lat >= 0 ? 32600 : 32700) + zone;
      let etm = lon < 29.5 ? "Egypt Purple Belt (EPSG:22993)" : lon <= 32.5 ? "Egypt Red Belt (EPSG:22992)" : "Egypt Blue Belt (EPSG:22994)";
      out.style.display = "block";
      out.innerHTML = `<strong>نطاق UTM:</strong> Zone <b>${zone}${lat >= 0 ? "N" : "S"}</b> (<code>EPSG:${epsg}</code>)<br><strong>حزام مصر ETM:</strong> ${etm}`;
    },
    calcAiChange() {
      const t1 = parseFloat(document.getElementById("gdChT1").value);
      const t2 = parseFloat(document.getElementById("gdChT2").value);
      const out = document.getElementById("gdAdvToolOut");
      if (isNaN(t1) || isNaN(t2)) return alert("أدخل القيمتين T1 و T2.");
      const diff = (t2 - t1).toFixed(4);
      const diagnosis = diff < -0.25 ? "⚠️ تراجع حاد في الغطاء النباتي (مؤشر زحف عمراني أو تجريف)" : diff > 0.25 ? "🌱 توسع زراعي / استصلاح جديد" : "✔ استقرار نسبي في الغطاء الأرضي";
      out.style.display = "block";
      out.innerHTML = `<strong>مقدار التغير (Δ):</strong> ${diff}<br><strong>التشخيص الذكي:</strong> ${diagnosis}`;
    },
    calcAiDrone() {
      const feddan = parseFloat(document.getElementById("gdDrArea").value);
      const alt = parseFloat(document.getElementById("gdDrAlt").value);
      const out = document.getElementById("gdAdvToolOut");
      if (isNaN(feddan) || isNaN(alt) || feddan <= 0) return alert("أدخل المساحة وارتفاع الطيران.");
      const gsdCm = (alt * 0.027).toFixed(2);
      const estPhotos = Math.ceil((feddan * 4200.83) / (alt * alt * 0.35));
      const batteries = Math.max(1, Math.ceil(estPhotos / 180));
      out.style.display = "block";
      out.innerHTML = `<strong>دقة البكسل الأرضية (GSD):</strong> ${gsdCm} سم/بكسل<br><strong>عدد الصور التقديري (تداخل 80%/70%):</strong> ~${estPhotos} صورة<br><strong>عدد البطاريات المطلوبة:</strong> ${batteries} بطارية`;
    },
    calcAiEarthwork() {
      const area = parseFloat(document.getElementById("gdEwArea").value);
      const depth = parseFloat(document.getElementById("gdEwDepth").value);
      const swell = parseFloat(document.getElementById("gdEwSoil").value);
      const out = document.getElementById("gdAdvToolOut");
      if (isNaN(area) || isNaN(depth)) return alert("أدخل المساحة وفرق المنسوب.");
      const netVol = area * Math.abs(depth);
      const looseVol = netVol * swell;
      const trucks = Math.ceil(looseVol / 18);
      out.style.display = "block";
      out.innerHTML = `<strong>الحجم الهندسي الصافي:</strong> ${netVol.toFixed(1)} م³<br><strong>الحجم بعد الانتفاش:</strong> ${looseVol.toFixed(1)} م³<br><strong>عدد النقلات (قلاّب 18 م³):</strong> ~${trucks} نقلة`;
    },
    calcAiQaqc() {
      const de = parseFloat(document.getElementById("gdQaDe").value);
      const dn = parseFloat(document.getElementById("gdQaDn").value);
      const perim = parseFloat(document.getElementById("gdQaPerim").value);
      const out = document.getElementById("gdAdvToolOut");
      if (isNaN(de) || isNaN(dn) || isNaN(perim) || perim <= 0) return alert("أدخل قيم الخطأ ومحيط الترافيرس.");
      const linearErr = Math.hypot(de, dn);
      const ratio = Math.round(perim / (linearErr || 0.0001));
      const status = ratio >= 10000 ? "✔ دقة ممتازة (درجة أولى - يُصحح بطريقة بوديتش)" : "⚠️ الدقة منخفضة (يُنصح بمراجعة التسامت وارتفاع العاكس)";
      out.style.display = "block";
      out.innerHTML = `<strong>خطأ القفل الخطي:</strong> ${(linearErr * 100).toFixed(2)} سم<br><strong>نسبة الدقة النسبية:</strong> 1 : ${ratio.toLocaleString()}<br><strong>التوصية الذكية:</strong> ${status}`;
    }
  };

  window.GEOAcademyBridgeActions = {
    searchByApp() {
      const sel = document.getElementById("gdAcademySwSelect");
      selectedSoftware = sel ? sel.value : "all";
      renderAiAcademySection();
    },
    toggleToolsBtn(checked) {
      showToolsDownloadBtn = !!checked;
      localStorage.setItem("gd_ai_show_tools_btn", showToolsDownloadBtn ? "1" : "0");
      renderAiAcademySection();
    },
    openUploadModal: openAdminUploadModal,
    playVideo(id) {
      const item = aiBridgeCourses.find(c => c.id === id);
      if (!item || !item.videoUrl) return;
      window.open(item.videoUrl, "_blank", "noopener");
    },
    requestUpgrade(title) {
      const msg = encodeURIComponent(`مرحبا، أريد الاشتراك في باقة PRO Plus لفتح قسم ربط التطبيقات بالـ AI ومشاهدة: ${title}`);
      if (confirm("🔒 هذا المحتوى حصري لمشتركي باقة PRO Plus.\n\nهل تريد التواصل عبر واتساب لتفعيل اشتراك PRO Plus الآن؟")) {
        window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${msg}`, "_blank", "noopener");
      }
    },
    deleteCourse(id) {
      if (!isAdminUser || !confirm("حذف هذا الفيديو نهائياً؟")) return;
      aiBridgeCourses = aiBridgeCourses.filter(c => c.id !== id);
      localStorage.setItem("gd_ai_bridge_courses_v2", JSON.stringify(aiBridgeCourses));
      renderAiAcademySection();
    }
  };

  function mountAll() {
    cleanupOldGlobalBox();
    renderAiAcademySection();
    injectToolsIntoSurveyAndGeomatics();
  }

  function watchAuth() {
    const check = () => {
      if (window.firebase && firebase.apps && firebase.apps.length) {
        firebase.auth().onAuthStateChanged(async user => {
          isAdminUser = !!(user && user.email && user.email.toLowerCase() === ADMIN_EMAIL);
          if (user && firebase.firestore) {
            try {
              const doc = await firebase.firestore().collection("users").doc(user.uid).get();
              const data = doc.exists ? doc.data() : {};
              const tier = String(data.plan || data.tier || data.subscription || "").toLowerCase();
              isProPlusUser = tier.includes("plus") || tier.includes("pro_plus");
            } catch (_) {}
          }
          mountAll();
        });
        return true;
      }
      return false;
    };
    if (!check()) {
      const iv = setInterval(() => {
        if (check()) clearInterval(iv);
      }, 400);
      setTimeout(() => clearInterval(iv), 10000);
    }
  }

  function init() {
    injectStyles();
    watchAuth();
    mountAll();
    document.addEventListener("click", () => setTimeout(mountAll, 180));
    setTimeout(mountAll, 800);
    setTimeout(mountAll, 2000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();