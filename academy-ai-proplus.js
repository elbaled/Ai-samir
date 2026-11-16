/* ============================================================================
   قسم "ربط التطبيقات بالـ AI" في الأكاديمية (PRO Plus) + الأدوات الهندسية المتطورة
   ============================================================================ */
(function () {
  "use strict";
  if (window.GEOAcademyProPlusInit) return;
  window.GEOAcademyProPlusInit = true;

  const ADMIN_EMAIL = "eng.ahmedsamir.gis@gmail.com";
  const ADMIN_WHATSAPP = "201015912371";

  let isAdminUser = false;
  let isProPlusUser = false;
  let selectedSoftware = "all"; // 'all' | 'AutoCAD' | 'Civil 3D' | 'ArcGIS Pro' | 'ERDAS'

  // قاعدة بيانات دروس وفيديوهات ربط التطبيقات بالـ AI (قابلة للتوسيع من لوحة الأدمن)
  let aiBridgeCourses = JSON.parse(localStorage.getItem("gd_ai_bridge_courses") || "null") || [
    {
      id: "ai_cad_1",
      software: "AutoCAD",
      title: "ربط AutoCAD بالذكاء الاصطناعي وتوليد الليسبات التلقائية",
      duration: "25 دقيقة",
      level: "تطبيقي",
      videoUrl: "https://www.youtube.com/results?search_query=AutoCAD+AI+AutoLISP+automation",
      desc: "شرح عملي لربط أوتوكاد بأوامر الذكاء الاصطناعي لتسريع التفريد، الترقيم، واستخراج الجداول بضغطة زر."
    },
    {
      id: "ai_civil_1",
      software: "Civil 3D",
      title: "أتمتة تصميم الطرق والبروفايلات في Civil 3D باستخدام AI",
      duration: "32 دقيقة",
      level: "متقدم",
      videoUrl: "https://www.youtube.com/results?search_query=Civil+3D+AI+Dynamo+automation",
      desc: "كيفية استخدام الذكاء الاصطناعي و Dynamo لإنشاء المقاطع العرضية وحساب كميات الحفر والردم آلياً."
    },
    {
      id: "ai_arcgis_1",
      software: "ArcGIS Pro",
      title: "ربط ArcGIS Pro بالذكاء الاصطناعي وكتابة سكريبتات ArcPy",
      duration: "40 دقيقة",
      level: "شامل",
      videoUrl: "https://www.youtube.com/results?search_query=ArcGIS+Pro+AI+ArcPy+automation",
      desc: "تشغيل التحليلات المكانية المعقدة وإخراج الخرائط الآلية في ArcGIS Pro عبر دمج نماذج AI مع Python."
    },
    {
      id: "ai_erdas_1",
      software: "ERDAS",
      title: "معالجة المرئيات الفضائية في ERDAS Imagine بمساعدة AI",
      duration: "28 دقيقة",
      level: "استشعار عن بُعد",
      videoUrl: "https://www.youtube.com/results?search_query=ERDAS+Imagine+AI+remote+sensing+classification",
      desc: "التصنيف المراقب وغير المراقب وتحسين الدقة الطيفية للمرئيات الفضائية عبر بناء نماذج Spatial Modeler ذكية."
    }
  ];

  // 1. حقن التنسيقات
  function injectStyles() {
    if (document.getElementById("gdAcademyProPlusStyles")) return;
    const style = document.createElement("style");
    style.id = "gdAcademyProPlusStyles";
    style.textContent = `
      .gd-ai-academy-box {
        background: #ffffff;
        border: 2px solid #e09f24;
        border-radius: 18px;
        padding: 16px;
        margin: 16px 0;
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
        letter-spacing: 0.4px;
      }

      /* شريط اختيار البرنامج */
      .gd-sw-selector-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 14px;
      }
      .gd-sw-select {
        padding: 8px 12px;
        border-radius: 10px;
        border: 1.5px solid #cbd5e1;
        background: #f8fafc;
        color: #0f172a;
        font-size: 13px;
        font-weight: 800;
        font-family: inherit;
        cursor: pointer;
      }
      .gd-sw-chip {
        padding: 6px 12px;
        border-radius: 99px;
        border: 1px solid #cbd5e1;
        background: #f8fafc;
        color: #334155;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        font-family: inherit;
      }
      .gd-sw-chip.active {
        background: #0f172a;
        color: #e09f24;
        border-color: #0f172a;
      }

      /* شبكة الفيديوهات */
      .gd-ai-videos-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 12px;
      }
      .gd-ai-video-card {
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        border-radius: 14px;
        padding: 13px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 8px;
        position: relative;
      }
      .gd-ai-video-card h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 900;
        color: #0f172a;
        line-height: 1.45;
      }
      .gd-ai-video-card p {
        margin: 0;
        font-size: 12px;
        color: #475569;
        line-height: 1.6;
      }
      .gd-ai-watch-btn {
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
        margin-top: 4px;
      }
      .gd-ai-watch-btn.unlocked {
        background: #16a34a;
        color: #ffffff;
      }
      .gd-ai-watch-btn.locked {
        background: #0f172a;
        color: #e09f24;
      }

      /* قسم الأدوات المتطورة (استشعار + GIS + مساحة) */
      .gd-adv-tools-section {
        background: #ffffff;
        border: 1.5px solid #cbd5e1;
        border-radius: 18px;
        padding: 16px;
        margin: 16px 0;
        direction: rtl;
        text-align: right;
      }
      .gd-adv-tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 11px;
        margin-top: 12px;
      }
      .gd-adv-tool-card {
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        border-radius: 14px;
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
        font-size: 13.5px;
        font-weight: 900;
        color: #0f172a;
      }
      .gd-adv-tool-card p {
        margin: 0;
        font-size: 11.5px;
        color: #475569;
        line-height: 1.5;
      }

      /* نافذة تشغيل الأداة المتطورة */
      #gdAdvToolModal {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.8);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 10030;
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

      /* التوافق مع الثيم الداكن */
      body.dark-mode .gd-ai-academy-box,
      body.dark-mode .gd-adv-tools-section,
      [data-theme="dark"] .gd-ai-academy-box,
      [data-theme="dark"] .gd-adv-tools-section {
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

  // 2. التحقق من صلاحية PRO Plus للمستخدم الحالي
  function checkUserProPlusAccess() {
    if (isAdminUser) return true;
    const plan = (localStorage.getItem("gd_user_plan") || localStorage.getItem("plan") || "").toLowerCase();
    return isProPlusUser || plan.includes("plus") || plan.includes("pro_plus");
  }

  function handleUpgradePrompt(courseTitle) {
    const msg = encodeURIComponent(
      `مرحبا، أريد الاشتراك في باقة PRO Plus لفتح قسم ربط التطبيقات بالـ AI ومشاهدة: ${courseTitle}`
    );
    if (
      confirm(
        "🔒 هذا المحتوى حصري لمشتركي باقة PRO Plus (ربط أوتوكاد وسيفيل وأرك جي آي إس وإيرداس بالـ AI).\n\nهل تريد التواصل عبر واتساب لتفعيل اشتراك PRO Plus الآن؟"
      )
    ) {
      window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${msg}`, "_blank", "noopener");
    }
  }

  // 3. رسم قسم "ربط التطبيقات بالـ AI" داخل الأكاديمية
  function renderAiAcademySection(container) {
    if (!container) return;
    let box = document.getElementById("gdAcademyAiBridgeBox");
    if (!box) {
      box = document.createElement("div");
      box.id = "gdAcademyAiBridgeBox";
      box.className = "gd-ai-academy-box";
      container.prepend(box);
    }

    const hasAccess = checkUserProPlusAccess();
    const programs = ["all", "AutoCAD", "Civil 3D", "ArcGIS Pro", "ERDAS"];
    const filtered = aiBridgeCourses.filter(c => selectedSoftware === "all" || c.software === selectedSoftware);

    const cardsHtml = filtered
      .map(
        c => `
      <div class="gd-ai-video-card">
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <span style="background:#0f172a;color:#e09f24;padding:2px 9px;border-radius:6px;font-size:11px;font-weight:900;">
              💻 ${c.software}
            </span>
            <span style="font-size:11px;color:#64748b;font-weight:700;">⏱ ${c.duration} • ${c.level}</span>
          </div>
          <h4>${c.title}</h4>
          <p style="margin-top:5px;">${c.desc}</p>
        </div>
        <div>
          ${
            hasAccess
              ? `<a href="${c.videoUrl}" target="_blank" rel="noopener" class="gd-ai-watch-btn unlocked">▶ مشاهدة الدرس والتطبيق العملي</a>`
              : `<button type="button" class="gd-ai-watch-btn locked" onclick="window.GEOAcademyBridgeActions.requestUpgrade('${c.title.replace(/'/g, "")}')">
                  🔒 حصري لمشتركي PRO Plus — اشترك للمشاهدة
                </button>`
          }
          ${
            isAdminUser
              ? `<button type="button" onclick="window.GEOAcademyBridgeActions.deleteCourse('${c.id}')"
                  style="width:100%;margin-top:5px;background:#dc2626;color:#fff;border:none;border-radius:7px;padding:4px;font-size:11px;cursor:pointer;">
                  حذف الدرس (أدمن)
                </button>`
              : ""
          }
        </div>
      </div>
    `
      )
      .join("");

    box.innerHTML = `
      <div class="gd-ai-academy-header">
        <h3 class="gd-ai-academy-title">
          🤖 قسم ربط التطبيقات الهندسية بالـ AI
          <span class="gd-proplus-pill">PRO Plus</span>
        </h3>
        ${
          isAdminUser
            ? `<button type="button" onclick="window.GEOAcademyBridgeActions.addNewCourse()"
                style="background:#e0531f;color:#fff;border:none;border-radius:9px;padding:6px 12px;font-size:12px;font-weight:900;cursor:pointer;font-family:inherit;">
                ➕ إضافة فيديو ربط جديد
              </button>`
            : ""
        }
      </div>

      <div class="gd-sw-selector-row">
        <span style="font-size:12.5px;font-weight:800;color:#475569;">اختر البرنامج:</span>
        <select class="gd-sw-select" onchange="window.GEOAcademyBridgeActions.selectProgram(this.value)">
          <option value="all" ${selectedSoftware === "all" ? "selected" : ""}>جميع البرامج (AutoCAD / Civil / ArcGIS / ERDAS)</option>
          <option value="AutoCAD" ${selectedSoftware === "AutoCAD" ? "selected" : ""}>AutoCAD (أوتوكاد)</option>
          <option value="Civil 3D" ${selectedSoftware === "Civil 3D" ? "selected" : ""}>Civil 3D (سيفيل ثري دي)</option>
          <option value="ArcGIS Pro" ${selectedSoftware === "ArcGIS Pro" ? "selected" : ""}>ArcGIS Pro (أرك جي آي إس برو)</option>
          <option value="ERDAS" ${selectedSoftware === "ERDAS" ? "selected" : ""}>ERDAS Imagine (إيرداس)</option>
        </select>

        ${programs
          .map(
            p => `
          <button type="button" class="gd-sw-chip ${selectedSoftware === p ? "active" : ""}"
            onclick="window.GEOAcademyBridgeActions.selectProgram('${p}')">
            ${p === "all" ? "الكل" : p}
          </button>
        `
          )
          .join("")}
      </div>

      <div class="gd-ai-videos-grid">${cardsHtml}</div>
    `;
  }

  // 4. حقن حزمة الأدوات المتطورة (الاستشعار عن بُعد + GIS + المساحة)
  function renderAdvancedEngineeringTools() {
    const targetParent =
      document.querySelector("#tools, #survey, #gis, main, .main-content, #app") || document.body;
    if (!targetParent || document.getElementById("gdAdvancedEngToolsBox")) return;

    const section = document.createElement("div");
    section.id = "gdAdvancedEngToolsBox";
    section.className = "gd-adv-tools-section";
    section.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <h3 style="margin:0;font-size:16px;font-weight:900;color:#b45309;">
          🚀 أدوات هندسية متطورة (استشعار عن بُعد • GIS • مساحة)
        </h3>
        <span style="font-size:11px;font-weight:800;color:#64748b;">اضغط على الأداة لتشغيلها فوراً</span>
      </div>

      <div class="gd-adv-tools-grid">
        <div class="gd-adv-tool-card" onclick="window.GEOAdvancedTools.open('ndvi')">
          <h5>🛰️ حاسبة المؤشرات الطيفية (NDVI / NDWI / NDBI)</h5>
          <p>حساب مؤشرات الغطاء النباتي والمياه والمباني من قيم الباندات مع توليد معادلة Raster Calculator.</p>
        </div>

        <div class="gd-adv-tool-card" onclick="window.GEOAdvancedTools.open('utm')">
          <h5>🗺️ تحديد نطاق UTM & ETM ومعامل القياس</h5>
          <p>استخراج نطاق UTM Zone وحزام مصر ETM مباشرة من الإحداثيات الجغرافية (خط الطول والعرض).</p>
        </div>

        <div class="gd-adv-tool-card" onclick="window.GEOAdvancedTools.open('area')">
          <h5>📏 حاسبة المساحات (م² / فدان / قيراط / سهم)</h5>
          <p>حساب المساحة الدقيقة لأي قطعة أرض من إحداثيات أركانها (E, N) وتحويلها للوحدات المصرية.</p>
        </div>

        <div class="gd-adv-tool-card" onclick="window.GEOAdvancedTools.open('leveling')">
          <h5>📐 حاسبة الميزانية الطولية وخطأ القفل</h5>
          <p>حساب فرق المنسوب وخطأ القفل المسموح به ومقارنته بالقراءة الفعلية في أعمال الميزانية.</p>
        </div>
      </div>
    `;

    targetParent.appendChild(section);
  }

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
        <h3 style="margin:0 0 10px;color:#b45309;">🛰️ حاسبة المؤشرات الطيفية (Remote Sensing)</h3>
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
        <input type="number" step="any" id="gdUtmLon" class="gd-adv-input" placeholder="مثال: 30.75 (المنيا)">
        <label style="font-size:12px;font-weight:800;">دائرة العرض (Latitude) بالدرجات العشرية:</label>
        <input type="number" step="any" id="gdUtmLat" class="gd-adv-input" placeholder="مثال: 28.10">
        <button type="button" onclick="window.GEOAdvancedTools.calcUtm()"
          style="width:100%;background:#e09f24;color:#0f172a;border:none;padding:10px;border-radius:10px;font-weight:900;cursor:pointer;">
          تحديد النطاق ونظام الإسقاط
        </button>
        <div id="gdAdvToolOut" class="gd-adv-result" style="display:none;"></div>
      `;
    } else if (toolKey === "area") {
      bodyHtml = `
        <h3 style="margin:0 0 10px;color:#b45309;">📏 حاسبة المساحات من الإحداثيات (م² / فدان)</h3>
        <p style="font-size:12px;color:#475569;margin:0 0 8px;">أدخل إحداثيات كل ركن في سطر منفصل بصيغة: <code>E, N</code></p>
        <textarea id="gdAreaCoords" rows="5" class="gd-adv-input" placeholder="500100, 3100200&#10;500150, 3100200&#10;500150, 3100240&#10;500100, 3100240"></textarea>
        <button type="button" onclick="window.GEOAdvancedTools.calcArea()"
          style="width:100%;background:#e09f24;color:#0f172a;border:none;padding:10px;border-radius:10px;font-weight:900;cursor:pointer;">
          حساب المساحة بالمتر والفدان والقيراط
        </button>
        <div id="gdAdvToolOut" class="gd-adv-result" style="display:none;"></div>
      `;
    } else if (toolKey === "leveling") {
      bodyHtml = `
        <h3 style="margin:0 0 10px;color:#b45309;">📐 فاحص خطأ القفل في الميزانية الطولية</h3>
        <label style="font-size:12px;font-weight:800;">منسوب أول روبير (BM Start):</label>
        <input type="number" step="any" id="gdLvlStart" class="gd-adv-input" placeholder="مثال: 25.400">
        <label style="font-size:12px;font-weight:800;">منسوب روبير القفل المعلوم (BM End):</label>
        <input type="number" step="any" id="gdLvlKnownEnd" class="gd-adv-input" placeholder="مثال: 26.150">
        <label style="font-size:12px;font-weight:800;">منسوب القفل المحسوب من الرصد:</label>
        <input type="number" step="any" id="gdLvlObsEnd" class="gd-adv-input" placeholder="مثال: 26.158">
        <label style="font-size:12px;font-weight:800;">طول خط الميزانية بالكيلومتر (K):</label>
        <input type="number" step="any" id="gdLvlDist" class="gd-adv-input" placeholder="مثال: 1.5">
        <button type="button" onclick="window.GEOAdvancedTools.calcLeveling()"
          style="width:100%;background:#e09f24;color:#0f172a;border:none;padding:10px;border-radius:10px;font-weight:900;cursor:pointer;">
          فحص الدقة وخطأ القفل
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
      let desc = "";
      let formula = "";
      if (type === "NDVI") {
        formula = `Float("NIR" - "Red") / Float("NIR" + "Red")`;
        desc = val > 0.5 ? "غطاء نباتي كثيف وصحي" : val > 0.2 ? "غطاء نباتي متوسط / محاصيل" : "تربة جرداء أو مياه أو مباني";
      } else if (type === "NDWI") {
        formula = `Float("Green" - "NIR") / Float("Green" + "NIR")`;
        desc = val > 0.1 ? "مسطح مائي واضح" : "منطقة يابسة / غير مائية";
      } else {
        formula = `Float("SWIR" - "NIR") / Float("SWIR" + "NIR")`;
        desc = val > 0.1 ? "منطقة عمرانية / مباني كثيفة" : "منطقة غير مبنية";
      }

      out.style.display = "block";
      out.innerHTML = `
        <strong>النتيجة (${type}):</strong> <span style="font-size:16px;color:#b45309;font-weight:900;">${val}</span><br>
        <strong>التفسير الطيفي:</strong> ${desc}<br>
        <strong>معادلة ArcGIS Raster Calculator:</strong><br>
        <code style="display:block;direction:ltr;background:#fef3c7;padding:6px;border-radius:6px;margin-top:4px;">${formula}</code>
      `;
    },
    calcUtm() {
      const lon = parseFloat(document.getElementById("gdUtmLon").value);
      const lat = parseFloat(document.getElementById("gdUtmLat").value);
      const out = document.getElementById("gdAdvToolOut");
      if (isNaN(lon) || isNaN(lat)) return alert("أدخل خط الطول ودائرة العرض.");

      const zone = Math.floor((lon + 180) / 6) + 1;
      const hemi = lat >= 0 ? "N (شمال خط الاستواء)" : "S (جنوب خط الاستواء)";
      const epsg = (lat >= 0 ? 32600 : 32700) + zone;
      let etm = "خارج أحزمة ETM المصرية";
      if (lat >= 22 && lat <= 32 && lon >= 24 && lon <= 37) {
        if (lon < 29.5) etm = "Egypt Purple Belt (الحزام البنفسجي - EPSG:22993)";
        else if (lon <= 32.5) etm = "Egypt Red Belt (الحزام الأحمر - EPSG:22992)";
        else etm = "Egypt Blue Belt (الحزام الأزرق - EPSG:22994)";
      }

      out.style.display = "block";
      out.innerHTML = `
        <strong>نطاق UTM العالمي:</strong> Zone <b>${zone}${lat >= 0 ? "N" : "S"}</b> (${hemi})<br>
        <strong>كود الإسقاط القياسي:</strong> <code>EPSG:${epsg}</code><br>
        <strong>نظام المساحة المصرية:</strong> ${etm}
      `;
    },
    calcArea() {
      const raw = document.getElementById("gdAreaCoords").value.trim();
      const out = document.getElementById("gdAdvToolOut");
      const pts = raw
        .split("\n")
        .map(line => line.split(/[,;\s]+/).map(Number))
        .filter(arr => arr.length >= 2 && !isNaN(arr[0]) && !isNaN(arr[1]));

      if (pts.length < 3) return alert("أدخل 3 نقاط على الأقل لحساب المساحة.");

      let sum = 0;
      for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        sum += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
      }
      const sqm = Math.abs(sum) / 2;
      const feddanTotal = sqm / 4200.83;
      const feddan = Math.floor(feddanTotal);
      const qiratTotal = (feddanTotal - feddan) * 24;
      const qirat = Math.floor(qiratTotal);
      const sahm = ((qiratTotal - qirat) * 24).toFixed(2);

      out.style.display = "block";
      out.innerHTML = `
        <strong>المساحة بالمتر المربع:</strong> <span style="font-size:15px;font-weight:900;color:#b45309;">${sqm.toFixed(2)} م²</span><br>
        <strong>بالمقياس المصري:</strong> <b>${feddan}</b> فدان • <b>${qirat}</b> قيراط • <b>${sahm}</b> سهم
      `;
    },
    calcLeveling() {
      const knownEnd = parseFloat(document.getElementById("gdLvlKnownEnd").value);
      const obsEnd = parseFloat(document.getElementById("gdLvlObsEnd").value);
      const dist = parseFloat(document.getElementById("gdLvlDist").value);
      const out = document.getElementById("gdAdvToolOut");
      if (isNaN(knownEnd) || isNaN(obsEnd) || isNaN(dist) || dist <= 0) {
        return alert("أدخل منسوب القفل وطول الخط بشكل صحيح.");
      }
      const errMm = ((obsEnd - knownEnd) * 1000).toFixed(1);
      const allowableMm = (12 * Math.sqrt(dist)).toFixed(1);
      const isAccepted = Math.abs(obsEnd - knownEnd) * 1000 <= 12 * Math.sqrt(dist);

      out.style.display = "block";
      out.innerHTML = `
        <strong>خطأ القفل الفعلي:</strong> ${errMm} مم<br>
        <strong>الخطأ المسموح به (درجة أولى 12√K):</strong> ±${allowableMm} مم<br>
        <strong>الحالة:</strong> <span style="font-weight:900;color:${isAccepted ? "#16a34a" : "#dc2626"};">
          ${isAccepted ? "✔ مقبول هندسياً (ضمن الحدود المسموحة)" : "✖ مرفوض (يتجاوز الخطأ المسموح ويلزم إعادة الرصد)"}
        </span>
      `;
    }
  };

  window.GEOAcademyBridgeActions = {
    selectProgram(sw) {
      selectedSoftware = sw;
      const academyContainer = findAcademyContainer();
      if (academyContainer) renderAiAcademySection(academyContainer);
    },
    requestUpgrade: handleUpgradePrompt,
    addNewCourse() {
      if (!isAdminUser) return;
      const software = prompt("اكتب اسم البرنامج (AutoCAD أو Civil 3D أو ArcGIS Pro أو ERDAS):", "AutoCAD");
      if (!software) return;
      const title = prompt("اكتب عنوان الدرس / الفيديو:");
      if (!title) return;
      const videoUrl = prompt("ضع رابط الفيديو (YouTube / Google Drive):", "https://www.youtube.com");
      const desc = prompt("اكتب وصف مختصر لمحتوى الدرس:", "شرح عملي لربط البرنامج بالذكاء الاصطناعي.");

      aiBridgeCourses.unshift({
        id: "ai_c_" + Date.now(),
        software: software.trim(),
        title: title.trim(),
        duration: "فيديو تطبيقي",
        level: "PRO Plus",
        videoUrl: (videoUrl || "").trim(),
        desc: (desc || "").trim()
      });
      localStorage.setItem("gd_ai_bridge_courses", JSON.stringify(aiBridgeCourses));
      const academyContainer = findAcademyContainer();
      if (academyContainer) renderAiAcademySection(academyContainer);
    },
    deleteCourse(id) {
      if (!isAdminUser || !confirm("حذف هذا الفيديو من القسم؟")) return;
      aiBridgeCourses = aiBridgeCourses.filter(c => c.id !== id);
      localStorage.setItem("gd_ai_bridge_courses", JSON.stringify(aiBridgeCourses));
      const academyContainer = findAcademyContainer();
      if (academyContainer) renderAiAcademySection(academyContainer);
    }
  };

  function findAcademyContainer() {
    return (
      document.getElementById("academy") ||
      document.getElementById("academyView") ||
      document.querySelector('[data-section="academy"], [id*="academy"], [class*="academy"]')
    );
  }

  function mountFeatures() {
    const academyContainer = findAcademyContainer();
    if (academyContainer) {
      renderAiAcademySection(academyContainer);
    }
    renderAdvancedEngineeringTools();
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
          mountFeatures();
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
    mountFeatures();

    // مراقبة التنقل إلى تبويب الأكاديمية لحقن القسم فوراً عند فتحه
    document.addEventListener("click", () => {
      setTimeout(mountFeatures, 200);
    });
    setTimeout(mountFeatures, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
