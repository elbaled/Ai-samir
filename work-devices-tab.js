/* ============================================================================
   قسم "شغل وأجهزة" المتكامل (نشر فوري مضمون + استخراج ذكي لرقم التواصل)
   ============================================================================ */
(function () {
  "use strict";
  if (window.GEOWorkDevicesFullInit) return;
  window.GEOWorkDevicesFullInit = true;

  const ADMIN_EMAIL = "eng.ahmedsamir.gis@gmail.com";
  const ADMIN_WHATSAPP = "201015912371";

  let isAdminUser = false;
  let activeSubTab = "jobs";
  let jobCategoryFilter = "all";
  let deviceTypeFilter = "all";
  let searchQuery = "";

  let jobsList = [];
  let devicesList = [];

  // استخراج رقم الهاتف من أي نص (مثل "م/محمود: 01280421912") وتحويله لصيغة الواتساب الدولية
  function formatWhatsappNumber(rawText) {
    const str = String(rawText || "");
    const match = str.match(/(?:\+?20|0020|0)?1[0125][0-9\s-]{8,11}/);
    let cleaned = match ? match[0].replace(/[^0-9]/g, "") : str.replace(/[^0-9]/g, "");
    if (!cleaned) return ADMIN_WHATSAPP;
    if (cleaned.startsWith("01") && cleaned.length === 11) {
      cleaned = "2" + cleaned;
    } else if (cleaned.startsWith("00")) {
      cleaned = cleaned.slice(2);
    }
    return cleaned;
  }

  function injectStyles() {
    if (document.getElementById("gdWorkDevicesFullStyles")) return;
    const style = document.createElement("style");
    style.id = "gdWorkDevicesFullStyles";
    style.textContent = `
      #gdWorkDevicesView {
        display: none;
        padding: 16px 14px 110px;
        max-width: 820px;
        margin: 0 auto;
        direction: rtl;
        text-align: right;
        font-family: inherit;
      }
      #gdWorkDevicesView.active {
        display: block;
      }

      body.gd-wd-open nav .active:not(#gdWorkDevicesNavBtn),
      body.gd-wd-open nav .on:not(#gdWorkDevicesNavBtn),
      body.gd-wd-open footer .active:not(#gdWorkDevicesNavBtn),
      body.gd-wd-open footer .on:not(#gdWorkDevicesNavBtn),
      body.gd-wd-open [class*="nav"] .active:not(#gdWorkDevicesNavBtn),
      body.gd-wd-open [class*="bottom"] .active:not(#gdWorkDevicesNavBtn) {
        color: #8b949e !important;
        border-color: transparent !important;
        background: transparent !important;
      }
      #gdWorkDevicesNavBtn.gd-wd-active {
        color: #e0531f !important;
        border-top: 2px solid #e0531f !important;
        background: rgba(224, 83, 31, 0.08) !important;
      }

      .gd-wd-main-tabs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        background: #f1f5f9;
        padding: 6px;
        border-radius: 14px;
        border: 1px solid #cbd5e1;
        margin-bottom: 14px;
      }
      .gd-wd-main-tab {
        border: none;
        border-radius: 10px;
        padding: 11px 10px;
        font-size: 14px;
        font-weight: 900;
        cursor: pointer;
        background: transparent;
        color: #475569;
        transition: all 0.2s ease;
        font-family: inherit;
      }
      .gd-wd-main-tab.active {
        background: #e09f24;
        color: #0f172a;
        box-shadow: 0 4px 12px rgba(224, 159, 36, 0.35);
      }

      .gd-wd-search-box {
        position: relative;
        margin-bottom: 12px;
      }
      .gd-wd-search-input {
        width: 100%;
        box-sizing: border-box;
        padding: 11px 38px 11px 14px;
        border-radius: 12px;
        border: 1.5px solid #cbd5e1;
        background: #ffffff;
        color: #0f172a;
        font-size: 13.5px;
        font-family: inherit;
        outline: none;
      }
      .gd-wd-search-input:focus {
        border-color: #e09f24;
      }
      .gd-wd-search-icon {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 16px;
        pointer-events: none;
      }

      .gd-wd-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        margin-bottom: 14px;
      }
      .gd-wd-filter-chip {
        padding: 6px 13px;
        border-radius: 99px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        color: #334155;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        font-family: inherit;
      }
      .gd-wd-filter-chip.active {
        background: #0f172a;
        color: #e09f24;
        border-color: #0f172a;
      }

      .gd-wd-contact-banner {
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        border: 1.5px solid #f59e0b;
        border-radius: 14px;
        padding: 12px 14px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
      }
      .gd-wd-contact-banner p {
        margin: 0;
        font-size: 12.5px;
        font-weight: 700;
        color: #78350f;
        line-height: 1.5;
        flex: 1;
        min-width: 200px;
      }
      .gd-wd-wa-btn {
        background: #25D366;
        color: #0f172a;
        text-decoration: none;
        padding: 8px 14px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 900;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }

      .gd-wd-admin-add-btn {
        width: 100%;
        background: #e0531f;
        color: #ffffff;
        border: none;
        border-radius: 12px;
        padding: 11px;
        font-size: 13.5px;
        font-weight: 900;
        cursor: pointer;
        margin-bottom: 14px;
        font-family: inherit;
        box-shadow: 0 4px 14px rgba(224, 83, 31, 0.3);
      }

      .gd-wd-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
        gap: 14px;
      }
      .gd-wd-card {
        background: #ffffff;
        border: 1.5px solid #e2e8f0;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
        display: flex;
        flex-direction: column;
        position: relative;
      }
      .gd-wd-card.closed-item {
        opacity: 0.78;
        border-color: #cbd5e1;
      }
      .gd-wd-card-img-wrap {
        position: relative;
        width: 100%;
        height: 185px;
        background: #0f172a;
        overflow: hidden;
      }
      .gd-wd-card-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .gd-wd-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 900;
        background: #0f172a;
        color: #e09f24;
      }
      .gd-wd-status-ribbon {
        position: absolute;
        top: 10px;
        left: 10px;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 900;
      }
      .gd-wd-status-ribbon.open {
        background: #16a34a;
        color: #ffffff;
      }
      .gd-wd-status-ribbon.closed {
        background: #dc2626;
        color: #ffffff;
      }

      .gd-wd-card-body {
        padding: 14px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .gd-wd-card-title {
        margin: 0;
        font-size: 15.5px;
        font-weight: 900;
        color: #0f172a;
      }
      .gd-wd-card-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        font-size: 11.5px;
        color: #475569;
        font-weight: 700;
      }
      .gd-wd-card-meta span {
        background: #f1f5f9;
        padding: 3px 8px;
        border-radius: 6px;
      }
      .gd-wd-card-desc {
        margin: 0;
        font-size: 13px;
        color: #334155;
        line-height: 1.65;
        white-space: pre-line;
      }
      .gd-wd-card-footer {
        padding: 10px 14px;
        border-top: 1px solid #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
      }
      .gd-wd-price {
        font-size: 14px;
        font-weight: 900;
        color: #b45309;
      }

      .gd-wd-admin-controls {
        width: 100%;
        display: flex;
        gap: 6px;
        margin-top: 6px;
        padding-top: 8px;
        border-top: 1px dashed #cbd5e1;
      }
      .gd-wd-admin-ctrl-btn {
        flex: 1;
        border: none;
        border-radius: 8px;
        padding: 6px 8px;
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
        font-family: inherit;
      }

      #gdWdAdminModal {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.78);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 10020;
        direction: rtl;
      }
      .gd-wd-modal-box {
        background: #ffffff;
        border: 2px solid #e09f24;
        border-radius: 18px;
        width: 100%;
        max-width: 460px;
        max-height: 90vh;
        overflow-y: auto;
        padding: 18px;
        color: #0f172a;
      }
      .gd-wd-field {
        margin-bottom: 11px;
      }
      .gd-wd-field label {
        display: block;
        font-size: 12px;
        font-weight: 800;
        margin-bottom: 4px;
        color: #334155;
      }
      .gd-wd-field input,
      .gd-wd-field select,
      .gd-wd-field textarea {
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

      body.dark-mode .gd-wd-main-tabs,
      body.dark .gd-wd-main-tabs,
      [data-theme="dark"] .gd-wd-main-tabs {
        background: #171c26;
        border-color: #2a3242;
      }
      body.dark-mode .gd-wd-main-tab,
      body.dark .gd-wd-main-tab,
      [data-theme="dark"] .gd-wd-main-tab {
        color: #cbd5e1;
      }
      body.dark-mode .gd-wd-card,
      body.dark .gd-wd-card,
      [data-theme="dark"] .gd-wd-card {
        background: #171c26;
        border-color: #2a3242;
      }
      body.dark-mode .gd-wd-card-title,
      body.dark .gd-wd-card-title,
      [data-theme="dark"] .gd-wd-card-title {
        color: #ffffff;
      }
      body.dark-mode .gd-wd-card-desc,
      body.dark .gd-wd-card-desc,
      [data-theme="dark"] .gd-wd-card-desc {
        color: #cbd5e1;
      }
      body.dark-mode .gd-wd-search-input,
      body.dark-mode .gd-wd-filter-chip,
      [data-theme="dark"] .gd-wd-search-input,
      [data-theme="dark"] .gd-wd-filter-chip {
        background: #171c26;
        border-color: #2a3242;
        color: #f3f6fa;
      }
    `;
    document.head.appendChild(style);
  }

  function getFirestoreDb() {
    try {
      if (window.firebase && typeof firebase.firestore === "function") {
        return firebase.firestore();
      }
    } catch (_) {}
    return null;
  }

  function loadLocalData() {
    const localJobs = JSON.parse(localStorage.getItem("gd_wd_jobs") || "[]");
    const localDevices = JSON.parse(localStorage.getItem("gd_wd_devices") || "[]");

    if (localJobs.length === 0) {
      jobsList = [
        {
          id: "sample_job_1",
          category: "مساح",
          title: "مطلوب مهندس مساحة خبرة للعمل بمشروع بنية تحتية",
          location: "القاهرة / الجيزة",
          salary: "يحدد حسب الخبرة",
          details: "إجادة العمل على أجهزة Total Station و GPS واستخراج اللوحات والكميات على AutoCAD Civil 3D.",
          displayPhone: "01015912371",
          phone: ADMIN_WHATSAPP,
          status: "open",
          createdAt: Date.now()
        }
      ];
      localStorage.setItem("gd_wd_jobs", JSON.stringify(jobsList));
    } else {
      jobsList = localJobs;
    }

    if (localDevices.length === 0) {
      devicesList = [
        {
          id: "sample_dev_1",
          offerType: "بيع",
          title: "جهاز توتال ستيشن Leica TS06 Plus",
          condition: "بحالة ممتازة + كامل المشتملات",
          price: "تواصل لمعرفة السعر",
          imageUrl: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80",
          details: "الجهاز معاير وجاهز للعمل فوراً، يشمل الحامل الثلاثي، العاكس، الشاحن، وشنطة الحفظ الأصلية.",
          displayPhone: "01015912371",
          phone: ADMIN_WHATSAPP,
          status: "available",
          createdAt: Date.now()
        }
      ];
      localStorage.setItem("gd_wd_devices", JSON.stringify(devicesList));
    } else {
      devicesList = localDevices;
    }
  }

  function syncDataFromCloud() {
    loadLocalData();
    renderContent();

    const db = getFirestoreDb();
    if (!db) return;

    try {
      db.collection("geodev_jobs")
        .orderBy("createdAt", "desc")
        .onSnapshot(
          snap => {
            if (!snap.empty) {
              jobsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
              localStorage.setItem("gd_wd_jobs", JSON.stringify(jobsList));
              renderContent();
            }
          },
          () => {}
        );

      db.collection("geodev_devices")
        .orderBy("createdAt", "desc")
        .onSnapshot(
          snap => {
            if (!snap.empty) {
              devicesList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
              localStorage.setItem("gd_wd_devices", JSON.stringify(devicesList));
              renderContent();
            }
          },
          () => {}
        );
    } catch (_) {}
  }

  async function saveNewItem(type, payload) {
    const tempId = (type === "jobs" ? "job_" : "dev_") + Date.now();
    // 1. الحفظ والعرض الفوري أولاً حتى لا يتعطل النشر أبداً
    if (type === "jobs") {
      jobsList.unshift({ id: tempId, ...payload });
      localStorage.setItem("gd_wd_jobs", JSON.stringify(jobsList));
    } else {
      devicesList.unshift({ id: tempId, ...payload });
      localStorage.setItem("gd_wd_devices", JSON.stringify(devicesList));
    }
    renderContent();

    // 2. المزامنة مع Firestore في الخلفية ليظهر لجميع المستخدمين
    const db = getFirestoreDb();
    if (db) {
      try {
        const colName = type === "jobs" ? "geodev_jobs" : "geodev_devices";
        await db.collection(colName).add(payload);
      } catch (err) {
        console.warn("Firestore sync warning:", err);
        alert("تم النشر على جهازك، ولكن لم يتم الحفظ السحابي لجميع المستخدمين بعد. تأكد من تفعيل Firestore Database في وضع Test Mode من لوحة Firebase.");
      }
    }
  }

  async function updateItemStatus(type, id, newStatus) {
    if (type === "jobs") {
      jobsList = jobsList.map(item => (item.id === id ? { ...item, status: newStatus } : item));
      localStorage.setItem("gd_wd_jobs", JSON.stringify(jobsList));
    } else {
      devicesList = devicesList.map(item => (item.id === id ? { ...item, status: newStatus } : item));
      localStorage.setItem("gd_wd_devices", JSON.stringify(devicesList));
    }
    renderContent();

    const db = getFirestoreDb();
    if (db && !id.startsWith("sample_") && !id.startsWith("job_") && !id.startsWith("dev_")) {
      try {
        const colName = type === "jobs" ? "geodev_jobs" : "geodev_devices";
        await db.collection(colName).doc(id).update({ status: newStatus });
      } catch (_) {}
    }
  }

  async function deleteItem(type, id) {
    if (!confirm("هل أنت متأكد من حذف هذا العنصر نهائياً؟")) return;
    if (type === "jobs") {
      jobsList = jobsList.filter(item => item.id !== id);
      localStorage.setItem("gd_wd_jobs", JSON.stringify(jobsList));
    } else {
      devicesList = devicesList.filter(item => item.id !== id);
      localStorage.setItem("gd_wd_devices", JSON.stringify(devicesList));
    }
    renderContent();

    const db = getFirestoreDb();
    if (db && !id.startsWith("sample_") && !id.startsWith("job_") && !id.startsWith("dev_")) {
      try {
        const colName = type === "jobs" ? "geodev_jobs" : "geodev_devices";
        await db.collection(colName).doc(id).delete();
      } catch (_) {}
    }
  }

  function renderContent() {
    const view = document.getElementById("gdWorkDevicesView");
    if (!view) return;

    const q = searchQuery.trim().toLowerCase();

    let jobsHtml = "";
    if (activeSubTab === "jobs") {
      const filteredJobs = jobsList.filter(job => {
        const matchCat = jobCategoryFilter === "all" || job.category === jobCategoryFilter;
        const matchQuery =
          !q ||
          (job.title || "").toLowerCase().includes(q) ||
          (job.category || "").toLowerCase().includes(q) ||
          (job.location || "").toLowerCase().includes(q) ||
          (job.details || "").toLowerCase().includes(q);
        return matchCat && matchQuery;
      });

      const jobCards = filteredJobs.length
        ? filteredJobs
            .map(job => {
              const isCompleted = job.status === "completed";
              const targetPhone = formatWhatsappNumber(job.phone || job.displayPhone);
              const displayPhone = job.displayPhone || job.phone || "";
              const waMsg = encodeURIComponent(`مرحباً، أستفسر بخصوص وظيفة: ${job.title} (${job.category}) المعروضة على منصة GeoDev Studio Pro`);
              return `
                <div class="gd-wd-card ${isCompleted ? "closed-item" : ""}">
                  <div class="gd-wd-card-body">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                      <span style="background:#0f172a;color:#e09f24;padding:3px 10px;border-radius:7px;font-size:11.5px;font-weight:900;">
                        👷‍♂️ ${job.category}
                      </span>
                      <span style="background:${isCompleted ? "#dc2626" : "#16a34a"};color:#fff;padding:3px 10px;border-radius:7px;font-size:11px;font-weight:900;">
                        ${isCompleted ? "تم اكتمال العدد المطلوب" : "متاح للتقديم"}
                      </span>
                    </div>
                    <h3 class="gd-wd-card-title">${job.title}</h3>
                    <div class="gd-wd-card-meta">
                      ${job.location ? `<span>📍 ${job.location}</span>` : ""}
                      ${job.salary ? `<span>💰 ${job.salary}</span>` : ""}
                      ${displayPhone ? `<span>📞 ${displayPhone}</span>` : ""}
                    </div>
                    <p class="gd-wd-card-desc">${job.details || ""}</p>
                  </div>
                  <div class="gd-wd-card-footer">
                    ${
                      isCompleted
                        ? `<span style="color:#dc2626;font-size:12px;font-weight:900;">✔ أُغلق باب التقديم</span>`
                        : `<a href="https://wa.me/${targetPhone}?text=${waMsg}" target="_blank" rel="noopener" class="gd-wd-wa-btn">💬 تواصل للتقديم</a>`
                    }
                    ${
                      isAdminUser
                        ? `
                      <div class="gd-wd-admin-controls">
                        <button type="button" class="gd-wd-admin-ctrl-btn" style="background:${isCompleted ? "#16a34a" : "#dc2626"};color:#fff;"
                          onclick="window.GDWorkDevicesActions.toggleJobStatus('${job.id}', '${isCompleted ? "open" : "completed"}')">
                          ${isCompleted ? "إعادة فتح الوظيفة" : "تم اكتمال العدد المطلوب"}
                        </button>
                        <button type="button" class="gd-wd-admin-ctrl-btn" style="background:#334155;color:#fff;max-width:65px;"
                          onclick="window.GDWorkDevicesActions.deleteItem('jobs', '${job.id}')">
                          حذف
                        </button>
                      </div>
                    `
                        : ""
                    }
                  </div>
                </div>
              `;
            })
            .join("")
        : `<p style="text-align:center;color:#64748b;padding:24px;font-weight:700;">لا توجد وظائف مطابقة لبحثك حالياً.</p>`;

      jobsHtml = `
        <div class="gd-wd-filters">
          ${["all", "مساح", "مساعد مساحة", "GIS"]
            .map(
              cat => `
            <button type="button" class="gd-wd-filter-chip ${jobCategoryFilter === cat ? "active" : ""}"
              onclick="window.GDWorkDevicesActions.setJobFilter('${cat}')">
              ${cat === "all" ? "الكل" : "شغل " + cat}
            </button>
          `
            )
            .join("")}
        </div>
        ${
          isAdminUser
            ? `<button type="button" class="gd-wd-admin-add-btn" onclick="window.GDWorkDevicesActions.openAdminModal('jobs')">➕ إضافة إعلان وظيفة جديدة (أدمن)</button>`
            : ""
        }
        <div class="gd-wd-grid">${jobCards}</div>
      `;
    }

    let devicesHtml = "";
    if (activeSubTab === "devices") {
      const filteredDevices = devicesList.filter(dev => {
        const matchType = deviceTypeFilter === "all" || dev.offerType === deviceTypeFilter;
        const matchQuery =
          !q ||
          (dev.title || "").toLowerCase().includes(q) ||
          (dev.offerType || "").toLowerCase().includes(q) ||
          (dev.condition || "").toLowerCase().includes(q) ||
          (dev.details || "").toLowerCase().includes(q);
        return matchType && matchQuery;
      });

      const deviceCards = filteredDevices.length
        ? filteredDevices
            .map(dev => {
              const isSold = dev.status === "sold";
              const isRented = dev.status === "rented";
              const isClosed = isSold || isRented;
              const statusLabel = isSold ? "تم البيع" : isRented ? "تم التأجير" : `متاح (${dev.offerType})`;
              const targetPhone = formatWhatsappNumber(dev.phone || dev.displayPhone);
              const waMsg = encodeURIComponent(`مرحباً، أستفسر بخصوص وظيفة: ${job.title} (${job.category})`);

              return `
                <div class="gd-wd-card ${isClosed ? "closed-item" : ""}">
                  <div class="gd-wd-card-img-wrap">
                    <img class="gd-wd-card-img" src="${dev.imageUrl || "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80"}" alt="${dev.title}">
                    <span class="gd-wd-badge">${dev.offerType === "بيع" ? "🏷️ للبيع" : "⏱️ للإيجار"}</span>
                    <span class="gd-wd-status-ribbon ${isClosed ? "closed" : "open"}">${statusLabel}</span>
                  </div>
                  <div class="gd-wd-card-body">
                    <h3 class="gd-wd-card-title">${dev.title}</h3>
                    <div class="gd-wd-card-meta">
                      ${dev.condition ? `<span>⚙️ ${dev.condition}</span>` : ""}
                      ${dev.displayPhone ? `<span>📞 ${dev.displayPhone}</span>` : ""}
                    </div>
                    <p class="gd-wd-card-desc">${dev.details || ""}</p>
                  </div>
                  <div class="gd-wd-card-footer">
                    <span class="gd-wd-price">${dev.price || "تواصل للسعر"}</span>
                    ${
                      isClosed
                        ? `<span style="color:#dc2626;font-size:12px;font-weight:900;">✔ ${statusLabel}</span>`
                        : `<a href="https://wa.me/${targetPhone}?text=${waMsg}" target="_blank" rel="noopener" class="gd-wd-wa-btn">💬 تواصل عبر واتساب</a>`
                    }
                    ${
                      isAdminUser
                        ? `
                      <div class="gd-wd-admin-controls">
                        <button type="button" class="gd-wd-admin-ctrl-btn" style="background:#dc2626;color:#fff;"
                          onclick="window.GDWorkDevicesActions.toggleDeviceStatus('${dev.id}', 'sold')">
                          تم البيع
                        </button>
                        <button type="button" class="gd-wd-admin-ctrl-btn" style="background:#d97706;color:#fff;"
                          onclick="window.GDWorkDevicesActions.toggleDeviceStatus('${dev.id}', 'rented')">
                          تم التأجير
                        </button>
                        <button type="button" class="gd-wd-admin-ctrl-btn" style="background:#16a34a;color:#fff;"
                          onclick="window.GDWorkDevicesActions.toggleDeviceStatus('${dev.id}', 'available')">
                          متاح
                        </button>
                        <button type="button" class="gd-wd-admin-ctrl-btn" style="background:#334155;color:#fff;max-width:55px;"
                          onclick="window.GDWorkDevicesActions.deleteItem('devices', '${dev.id}')">
                          حذف
                        </button>
                      </div>
                    `
                        : ""
                    }
                  </div>
                </div>
              `;
            })
            .join("")
        : `<p style="text-align:center;color:#64748b;padding:24px;font-weight:700;">لا توجد أجهزة مطابقة لبحثك حالياً.</p>`;

      devicesHtml = `
        <div class="gd-wd-filters">
          ${["all", "بيع", "إيجار"]
            .map(
              t => `
            <button type="button" class="gd-wd-filter-chip ${deviceTypeFilter === t ? "active" : ""}"
              onclick="window.GDWorkDevicesActions.setDeviceFilter('${t}')">
              ${t === "all" ? "جميع الأجهزة" : "أجهزة لل" + t}
            </button>
          `
            )
            .join("")}
        </div>
        ${
          isAdminUser
            ? `<button type="button" class="gd-wd-admin-add-btn" onclick="window.GDWorkDevicesActions.openAdminModal('devices')">➕ إضافة جهاز جديد للبيع أو الإيجار (أدمن)</button>`
            : ""
        }
        <div class="gd-wd-grid">${deviceCards}</div>
      `;
    }

    const contactBannerText =
      activeSubTab === "jobs"
        ? "هل لديك فرصة عمل مساحي أو GIS وتريد نشرها هنا؟ تواصل مع الأدمن لإضافتها فوراً."
        : "هل لديك جهاز مساحي (Total Station / GPS / Level) وتريد عرضه للبيع أو الإيجار؟ تواصل مع الأدمن لإضافته بالصور والتفاصيل.";

    const contactWaText = encodeURIComponent(
      activeSubTab === "jobs"
        ? "مرحباً م. أحمد، أريد نشر إعلان وظيفة في قسم الشغل بالمنصة."
        : "مرحباً م. أحمد، أريد عرض جهاز مساحي للبيع / الإيجار في قسم الأجهزة بالمنصة."
    );

    view.innerHTML = `
      <div class="gd-wd-main-tabs">
        <button type="button" class="gd-wd-main-tab ${activeSubTab === "jobs" ? "active" : ""}"
          onclick="window.GDWorkDevicesActions.switchTab('jobs')">
          👷‍♂️ قسم الشغل والوظائف
        </button>
        <button type="button" class="gd-wd-main-tab ${activeSubTab === "devices" ? "active" : ""}"
          onclick="window.GDWorkDevicesActions.switchTab('devices')">
          📡 قسم الأجهزة (بيع وإيجار)
        </button>
      </div>

      <div class="gd-wd-search-box">
        <span class="gd-wd-search-icon">🔍</span>
        <input type="text" class="gd-wd-search-input"
          placeholder="${activeSubTab === "jobs" ? "ابحث عن شغل مساح، مساعد مساحة، GIS، أو المحافظة..." : "ابحث عن جهاز Total Station، GPS، ميزان، بيع أو إيجار..."}"
          value="${searchQuery.replace(/"/g, "&quot;")}"
          oninput="window.GDWorkDevicesActions.onSearch(this.value)">
      </div>

      <div class="gd-wd-contact-banner">
        <p>📢 ${contactBannerText}</p>
        <a href="https://wa.me/${ADMIN_WHATSAPP}?text=${contactWaText}" target="_blank" rel="noopener" class="gd-wd-wa-btn">
          💬 تواصل مع الأدمن (01015912371)
        </a>
      </div>

      ${activeSubTab === "jobs" ? jobsHtml : devicesHtml}
    `;
  }

  function injectAdminModal() {
    if (document.getElementById("gdWdAdminModal")) return;
    const modalHtml = `
      <div id="gdWdAdminModal">
        <div class="gd-wd-modal-box">
          <h3 id="gdWdModalTitle" style="margin:0 0 12px;color:#b45309;font-size:16px;">إضافة عنصر جديد</h3>
          <form id="gdWdAdminForm">
            <div id="gdWdFormFields"></div>
            <div style="display:flex;gap:8px;margin-top:14px;">
              <button type="button" id="gdWdSubmitPublishBtn" style="flex:1;background:#e09f24;color:#0f172a;border:none;padding:10px;border-radius:10px;font-weight:900;cursor:pointer;font-family:inherit;">
                نشر الآن
              </button>
              <button type="button" onclick="document.getElementById('gdWdAdminModal').style.display='none'"
                style="background:#e2e8f0;color:#334155;border:none;padding:10px 14px;border-radius:10px;font-weight:800;cursor:pointer;font-family:inherit;">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
  }

  function openAdminModal(type) {
    if (!isAdminUser) return;
    injectAdminModal();
    const modal = document.getElementById("gdWdAdminModal");
    const titleEl = document.getElementById("gdWdModalTitle");
    const fieldsEl = document.getElementById("gdWdFormFields");
    const form = document.getElementById("gdWdAdminForm");
    const submitBtn = document.getElementById("gdWdSubmitPublishBtn");

    if (type === "jobs") {
      titleEl.textContent = "➕ إضافة وظيفة جديدة في قسم الشغل";
      fieldsEl.innerHTML = `
        <div class="gd-wd-field">
          <label>تخصص الوظيفة</label>
          <select name="category">
            <option value="مساح">شغل مساح</option>
            <option value="مساعد مساحة">شغل مساعد مساحة</option>
            <option value="GIS">شغل GIS</option>
          </select>
        </div>
        <div class="gd-wd-field">
          <label>عنوان الوظيفة *</label>
          <input type="text" name="title" placeholder="مثال: مطلوب مساح طرق خبرة 3 سنوات">
        </div>
        <div class="gd-wd-field">
          <label>موقع العمل / المحافظة</label>
          <input type="text" name="location" placeholder="مثال: المنيا / القاهرة / التجمع">
        </div>
        <div class="gd-wd-field">
          <label>الراتب / المميزات</label>
          <input type="text" name="salary" placeholder="مثال: 8000 ج + إقامة">
        </div>
        <div class="gd-wd-field">
          <label>رقم واتساب التواصل للتقديم على هذه الوظيفة *</label>
          <input type="text" name="phone" placeholder="مثال: م/محمود 01280421912">
        </div>
        <div class="gd-wd-field">
          <label>تفاصيل وشروط الوظيفة *</label>
          <textarea name="details" rows="3" placeholder="اكتب تفاصيل العمل والأجهزة المطلوبة..."></textarea>
        </div>
      `;
    } else {
      titleEl.textContent = "➕ إضافة جهاز جديد للبيع أو الإيجار";
      fieldsEl.innerHTML = `
        <div class="gd-wd-field">
          <label>نوع العرض</label>
          <select name="offerType">
            <option value="بيع">للبيع</option>
            <option value="إيجار">للإيجار</option>
          </select>
        </div>
        <div class="gd-wd-field">
          <label>اسم وموديل الجهاز *</label>
          <input type="text" name="title" placeholder="مثال: توتال ستيشن Sokkia CX-105">
        </div>
        <div class="gd-wd-field">
          <label>السعر / قيمة الإيجار *</label>
          <input type="text" name="price" placeholder="مثال: 145,000 جنيه أو 700 ج/يوم">
        </div>
        <div class="gd-wd-field">
          <label>حالة الجهاز ومشتملاته</label>
          <input type="text" name="condition" placeholder="مثال: كسر زيرو بالضمان والمعايرة">
        </div>
        <div class="gd-wd-field">
          <label>رقم واتساب التواصل لهذا الجهاز *</label>
          <input type="text" name="phone" value="01015912371" placeholder="اكتب رقم التواصل">
        </div>
        <div class="gd-wd-field">
          <label>صورة الجهاز (اختر صورة من جهازك أو ضع رابط صورة)</label>
          <input type="file" id="gdWdDeviceFile" accept="image/*" style="margin-bottom:6px;">
          <input type="text" name="imageUrl" placeholder="أو الصق رابط الصورة مباشرة https://...">
        </div>
        <div class="gd-wd-field">
          <label>التفاصيل الكاملة للجهاز *</label>
          <textarea name="details" rows="3" placeholder="اكتب كافة المواصفات والملحقات..."></textarea>
        </div>
      `;
    }

    submitBtn.onclick = async () => {
      const fd = new FormData(form);
      const title = (fd.get("title") || "").trim();
      const details = (fd.get("details") || "").trim();
      const rawInputPhone = (fd.get("phone") || "").trim();

      if (!title) {
        alert("من فضلك اكتب العنوان أولاً.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "جاري النشر...";

      try {
        const formattedWaPhone = formatWhatsappNumber(rawInputPhone);

        if (type === "jobs") {
          await saveNewItem("jobs", {
            category: fd.get("category") || "مساح",
            title,
            location: (fd.get("location") || "").trim(),
            salary: (fd.get("salary") || "").trim(),
            details,
            displayPhone: rawInputPhone,
            phone: formattedWaPhone,
            status: "open",
            createdAt: Date.now()
          });
        } else {
          let finalImgUrl = (fd.get("imageUrl") || "").trim();
          const fileInput = document.getElementById("gdWdDeviceFile");
          if (fileInput && fileInput.files && fileInput.files[0]) {
            finalImgUrl = await compressImageToDataUrl(fileInput.files[0]);
          }
          await saveNewItem("devices", {
            offerType: fd.get("offerType") || "بيع",
            title,
            price: (fd.get("price") || "").trim(),
            condition: (fd.get("condition") || "").trim(),
            imageUrl: finalImgUrl,
            details,
            displayPhone: rawInputPhone,
            phone: formattedWaPhone,
            status: "available",
            createdAt: Date.now()
          });
        }

        modal.style.display = "none";
        if (typeof window.toast === "function") window.toast("تم النشر بنجاح!", "success");
      } catch (err) {
        alert("حدث خطأ أثناء النشر: " + (err && err.message ? err.message : err));
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "نشر الآن";
      }
    };

    modal.style.display = "flex";
  }

  function compressImageToDataUrl(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxW = 720;
          const scale = Math.min(1, maxW / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.78));
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  window.GDWorkDevicesActions = {
    switchTab(tab) {
      activeSubTab = tab;
      renderContent();
    },
    setJobFilter(cat) {
      jobCategoryFilter = cat;
      renderContent();
    },
    setDeviceFilter(type) {
      deviceTypeFilter = type;
      renderContent();
    },
    onSearch(val) {
      searchQuery = val;
      renderContent();
      const input = document.querySelector("#gdWorkDevicesView .gd-wd-search-input");
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    },
    openAdminModal,
    toggleJobStatus(id, status) {
      updateItemStatus("jobs", id, status);
    },
    toggleDeviceStatus(id, status) {
      updateItemStatus("devices", id, status);
    },
    deleteItem
  };

  function setupWorkDevicesTab() {
    if (document.getElementById("gdWorkDevicesNavBtn")) return;

    const allButtons = Array.from(document.querySelectorAll("button, a, .nav-item, [data-tab]"));
    const surveyBtn = allButtons.find(
      el =>
        (el.textContent || "").trim().includes("المساحة") &&
        el.closest("nav, footer, [class*='nav'], [class*='bottom'], [id*='nav']")
    );

    if (!surveyBtn) return;

    const newBtn = surveyBtn.cloneNode(true);
    newBtn.id = "gdWorkDevicesNavBtn";
    newBtn.classList.remove("active", "on", "selected", "current");
    newBtn.removeAttribute("onclick");
    newBtn.removeAttribute("data-tab");
    newBtn.removeAttribute("data-view");
    newBtn.removeAttribute("data-target");
    newBtn.removeAttribute("aria-selected");

    const customIconSvg = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 2px;">
        <path d="M5 10a7 7 0 0 1 14 0v1H5v-1z" fill="rgba(224,159,36,0.2)"/>
        <path d="M3 11h18"/>
        <path d="M12 3v4"/>
        <rect x="9" y="13" width="6" height="4" rx="1"/>
        <circle cx="12" cy="15" r="1"/>
        <path d="M12 17v4"/>
        <path d="M10 17l-3 4"/>
        <path d="M14 17l3 4"/>
      </svg>
    `;

    const svgEl = newBtn.querySelector("svg, i, span:first-child");
    if (svgEl) svgEl.outerHTML = customIconSvg;

    const walker = document.createTreeWalker(newBtn, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.includes("المساحة")) {
        node.nodeValue = node.nodeValue.replace("المساحة", "شغل وأجهزة");
      }
    }

    surveyBtn.insertAdjacentElement("afterend", newBtn);

    const mainContainer = document.querySelector("main, .main-content, #app, .container") || document.body;
    const viewDiv = document.createElement("div");
    viewDiv.id = "gdWorkDevicesView";
    mainContainer.appendChild(viewDiv);

    const navContainer = surveyBtn.parentElement;
    const siblingTabs = Array.from(navContainer.children).filter(el => el !== newBtn);

    newBtn.addEventListener(
      "click",
      e => {
        e.preventDefault();
        e.stopImmediatePropagation();

        document.body.classList.add("gd-wd-open");
        siblingTabs.forEach(btn => btn.classList.remove("active", "on", "selected", "current"));
        newBtn.classList.add("gd-wd-active");

        Array.from(mainContainer.children).forEach(child => {
          if (
            child !== viewDiv &&
            !child.contains(navContainer) &&
            child.id !== "gdQueueFloatingBanner" &&
            child.id !== "gdApkFloatingBanner" &&
            child.id !== "gdGiveawayFloatingCard"
          ) {
            if (child.style.display !== "none") {
              child.dataset.prevDisplay = child.style.display || "block";
              child.style.display = "none";
            }
          }
        });

        viewDiv.classList.add("active");
        renderContent();
      },
      true
    );

    siblingTabs.forEach(btn => {
      btn.addEventListener(
        "click",
        () => {
          document.body.classList.remove("gd-wd-open");
          newBtn.classList.remove("gd-wd-active", "active", "on", "selected", "current");
          viewDiv.classList.remove("active");

          Array.from(mainContainer.children).forEach(child => {
            if (child !== viewDiv && child.dataset.prevDisplay) {
              child.style.display = child.dataset.prevDisplay === "block" ? "" : child.dataset.prevDisplay;
              delete child.dataset.prevDisplay;
            }
          });
        },
        true
      );
    });
  }

  function watchAdminAuth() {
    const checkAuth = () => {
      if (window.firebase && firebase.apps && firebase.apps.length) {
        firebase.auth().onAuthStateChanged(user => {
          isAdminUser = !!(user && user.email && user.email.toLowerCase() === ADMIN_EMAIL);
          renderContent();
        });
        return true;
      }
      return false;
    };

    if (!checkAuth()) {
      const iv = setInterval(() => {
        if (checkAuth()) clearInterval(iv);
      }, 400);
      setTimeout(() => clearInterval(iv), 10000);
    }
  }

  function init() {
    injectStyles();
    setupWorkDevicesTab();
    watchAdminAuth();
    syncDataFromCloud();
    setTimeout(setupWorkDevicesTab, 800);
    setTimeout(setupWorkDevicesTab, 2000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
