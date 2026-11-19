/* ============================================================================
   لوحة إدارة وتصنيف حسابات المستخدمين + نظام إنشاء أكواد الكورسات (CRS-XXXX)
   ============================================================================ */
(function () {
  "use strict";
  if (window.GEOAdminDashboardSegV3Init) return;
  window.GEOAdminDashboardSegV3Init = true;

  const ADMIN_EMAIL = "eng.ahmedsamir.gis@gmail.com";
  const DAY_MS = 24 * 60 * 60 * 1000;
  let allUsersList = [];
  let courseCodesList = [];
  let currentCategoryFilter = "all_active";
  let lastGeneratedCourseCode = "";

  function escapeHTML(val) {
    return String(val ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[ch]);
  }

  function injectStyles() {
    if (document.getElementById("gdAdminSegmentationStyles")) return;
    const style = document.createElement("style");
    style.id = "gdAdminSegmentationStyles";
    style.textContent = `
      #gdAdminDashboardSection,
      #gdCourseCodeGenCard {
        direction: rtl;
        text-align: right;
        padding: 16px;
        font-family: inherit;
        background: #f8fafc;
        border-radius: 16px;
        margin: 14px 0;
        border: 2px solid #e09f24;
        color: #0f172a;
      }
      .gd-admin-top-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 14px;
      }
      .gd-admin-title {
        margin: 0 0 8px;
        font-size: 17px;
        font-weight: 900;
        color: #0f172a;
      }
      .gd-bulk-fix-btn {
        background: #dc2626;
        color: #ffffff;
        border: none;
        border-radius: 10px;
        padding: 8px 13px;
        font-size: 12px;
        font-weight: 900;
        cursor: pointer;
        font-family: inherit;
      }
      .gd-cc-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
        gap: 10px;
        margin: 10px 0;
      }
      .gd-cc-input {
        width: 100%;
        box-sizing: border-box;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1.5px solid #cbd5e1;
        background: #ffffff;
        color: #0f172a;
        font-size: 13px;
        font-weight: 700;
        font-family: inherit;
      }
      .gd-cc-result-box {
        background: #0f172a;
        color: #fbbf24;
        border: 2px dashed #e09f24;
        border-radius: 12px;
        padding: 12px;
        margin-top: 10px;
        text-align: center;
      }
      .gd-cc-code-text {
        font-size: 20px;
        font-weight: 900;
        letter-spacing: 1.5px;
        direction: ltr;
        display: inline-block;
        margin: 4px 0 8px;
        user-select: all;
      }
      .gd-cc-list {
        margin-top: 12px;
        max-height: 240px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 7px;
      }
      .gd-cc-item {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        padding: 8px 11px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 6px;
        font-size: 12px;
      }
      .gd-segment-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 10px;
        margin-bottom: 18px;
      }
      .gd-segment-card {
        background: #ffffff;
        border: 2px solid #e2e8f0;
        border-radius: 14px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .gd-segment-card:hover, .gd-segment-card.active {
        border-color: #e09f24;
        background: #fffbeb;
      }
      .gd-segment-count { font-size: 23px; font-weight: 900; color: #b45309; }
      .gd-segment-label { font-size: 13px; font-weight: 800; color: #334155; }
      .gd-segment-sub { font-size: 11px; color: #64748b; }
      .gd-users-section-header {
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 2px solid #e09f24;
      }
      .gd-users-section-title { font-size: 14.5px; font-weight: 900; color: #0f172a; }
      .gd-user-cards-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(285px, 1fr));
        gap: 12px;
        max-height: 550px;
        overflow-y: auto;
      }
      .gd-admin-user-card {
        background: #ffffff;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 8px;
      }
      .gd-auc-header { display: flex; align-items: center; justify-content: space-between; gap: 6px; flex-wrap: wrap; }
      .gd-auc-name { font-weight: 900; font-size: 13.5px; color: #0f172a; }
      .gd-auc-email { font-size: 11.5px; color: #64748b; user-select: all; }
      .gd-badge { font-size: 10.5px; font-weight: 800; padding: 2px 8px; border-radius: 99px; }
      .gd-badge.active-pro { background: #dcfce7; color: #166534; }
      .gd-badge.active-plus { background: #fef3c7; color: #92400e; }
      .gd-badge.courses-ok { background: #ede9fe; color: #5b21b6; border: 1px solid #c4b5fd; }
      .gd-badge.trial-active { background: #e0f2fe; color: #075985; }
      .gd-badge.trial-expired { background: #fee2e2; color: #991b1b; }
      .gd-auc-dates {
        font-size: 11px;
        color: #475569;
        line-height: 1.5;
        background: #f8fafc;
        padding: 6px 8px;
        border-radius: 8px;
      }
      .gd-auc-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
      .gd-admin-btn {
        flex: 1;
        min-width: 80px;
        padding: 7px 5px;
        font-size: 11px;
        font-weight: 900;
        border-radius: 8px;
        cursor: pointer;
        border: none;
        font-family: inherit;
      }
      .gd-admin-btn.upgrade-pro { background: #0284c7; color: #fff; }
      .gd-admin-btn.upgrade-plus { background: #d97706; color: #fff; }
      .gd-admin-btn.courses-btn { background: #7c3aed; color: #fff; }
      .gd-admin-btn.demote { background: #dc2626; color: #fff; }

      body.dark-mode #gdAdminDashboardSection,
      body.dark-mode #gdCourseCodeGenCard,
      [data-theme="dark"] #gdAdminDashboardSection,
      [data-theme="dark"] #gdCourseCodeGenCard {
        background: #171c26;
        border-color: #2a3242;
        color: #ffffff;
      }
      body.dark-mode .gd-admin-title,
      body.dark-mode .gd-auc-name,
      body.dark-mode .gd-users-section-title,
      [data-theme="dark"] .gd-admin-title,
      [data-theme="dark"] .gd-auc-name,
      [data-theme="dark"] .gd-users-section-title {
        color: #ffffff;
      }
      body.dark-mode .gd-segment-card,
      body.dark-mode .gd-admin-user-card,
      body.dark-mode .gd-cc-item,
      body.dark-mode .gd-cc-input,
      [data-theme="dark"] .gd-segment-card,
      [data-theme="dark"] .gd-admin-user-card,
      [data-theme="dark"] .gd-cc-item,
      [data-theme="dark"] .gd-cc-input {
        background: #10141c;
        border-color: #2a3242;
        color: #ffffff;
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

  function generateRandomCourseCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const part = len => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `CRS-${part(4)}-${part(4)}`;
  }

  function renderCourseCodeGeneratorHTML() {
    const recentCodesHtml = courseCodesList.slice(0, 15).map(item => {
      const statusBadge = item.used
        ? `<span style="background:#fee2e2;color:#991b1b;padding:2px 7px;border-radius:6px;font-weight:800;">مُستخدم (${escapeHTML(item.usedByEmail || "مستخدم")})</span>`
        : `<span style="background:#dcfce7;color:#166534;padding:2px 7px;border-radius:6px;font-weight:800;">متاح (${item.days} يوم)</span>`;

      return `
        <div class="gd-cc-item">
          <div>
            <strong style="direction:ltr;display:inline-block;font-size:13px;color:#b45309;">${escapeHTML(item.code)}</strong>
            ${item.note ? `<span style="color:#64748b;"> (${escapeHTML(item.note)})</span>` : ""}
            <div style="margin-top:3px;">${statusBadge}</div>
          </div>
          <div style="display:flex;gap:5px;">
            <button type="button" onclick="window.GEOAdminSegActions.copyCode('${escapeHTML(item.code)}')"
              style="background:#0f172a;color:#fbbf24;border:0;border-radius:7px;padding:5px 9px;font-size:11px;font-weight:800;cursor:pointer;">نسخ</button>
            <button type="button" onclick="window.GEOAdminSegActions.deleteCourseCode('${escapeHTML(item.code)}')"
              style="background:#dc2626;color:#fff;border:0;border-radius:7px;padding:5px 8px;font-size:11px;font-weight:800;cursor:pointer;">حذف</button>
          </div>
        </div>
      `;
    }).join("");

    return `
      <h3 class="gd-admin-title">🎓 إنشاء كود للكورسات (خاص بالأكاديمية)</h3>
      <p style="margin:0 0 8px;font-size:12.5px;opacity:.85;">
        هذا الكود مخصص لفتح فيديوهات وملفات الكورسات في الأكاديمية فقط (منفصل عن اشتراك PRO).
      </p>

      <div class="gd-cc-grid">
        <div>
          <label style="font-size:11.5px;font-weight:800;">مدة تفعيل الكورسات:</label>
          <select id="gdCourseCodeDaysSelect" class="gd-cc-input" onchange="document.getElementById('gdCourseCodeCustomDays').style.display = this.value === 'custom' ? 'block' : 'none'">
            <option value="30">شهر واحد (30 يوم)</option>
            <option value="90">3 شهور (90 يوم)</option>
            <option value="180">6 شهور (180 يوم)</option>
            <option value="365">سنة كاملة (365 يوم)</option>
            <option value="3650">مفتوح (10 سنوات)</option>
            <option value="custom">مدة مخصصة بالأيام...</option>
          </select>
          <input type="number" id="gdCourseCodeCustomDays" class="gd-cc-input" placeholder="أدخل عدد الأيام" style="display:none;margin-top:6px;" min="1">
        </div>

        <div>
          <label style="font-size:11.5px;font-weight:800;">اسم الطالب / ملاحظة (اختياري):</label>
          <input type="text" id="gdCourseCodeNote" class="gd-cc-input" placeholder="مثال: م. محمد - كورس أوتوكاد">
        </div>
      </div>

      <button type="button" id="gdCreateCourseCodeBtn" onclick="window.GEOAdminSegActions.createCourseCode()"
        style="width:100%;background:#7c3aed;color:#ffffff;border:none;border-radius:11px;padding:11px;font-size:13.5px;font-weight:900;cursor:pointer;font-family:inherit;">
        🎟️ إنشاء كود للكورسات الآن
      </button>

      ${lastGeneratedCourseCode ? `
        <div class="gd-cc-result-box">
          <div style="font-size:12px;color:#cbd5e1;">تم إنشاء كود الكورسات بنجاح:</div>
          <div class="gd-cc-code-text">${escapeHTML(lastGeneratedCourseCode)}</div>
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
            <button type="button" onclick="window.GEOAdminSegActions.copyCode('${escapeHTML(lastGeneratedCourseCode)}')"
              style="background:#e09f24;color:#0f172a;border:0;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:900;cursor:pointer;">
              📋 نسخ الكود
            </button>
            <a href="https://wa.me/?text=${encodeURIComponent("كود تفعيل الكورسات الخاص بك في منصة GeoDev Studio Pro:\n" + lastGeneratedCourseCode + "\nادخل على قسم الأكاديمية > الكورسات والدورات وأدخل الكود لفتح الفيديوهات.")}"
              target="_blank" rel="noopener"
              style="background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:900;">
              💬 إرسال عبر واتساب
            </a>
          </div>
        </div>
      ` : ""}

      ${courseCodesList.length ? `
        <div style="margin-top:12px;font-size:12.5px;font-weight:900;">📋 سجل أكواد الكورسات (${courseCodesList.length}):</div>
        <div class="gd-cc-list">${recentCodesHtml}</div>
      ` : ""}
    `;
  }

  // حقن بطاقة "إنشاء كود للكورسات" مباشرة تحت بطاقة "إنشاء كود" في #adminPanel
  function mountCourseCodeGeneratorCard() {
    const adminPanel = document.getElementById("adminPanel") || document.getElementById("admin") || document.getElementById("adminView");
    if (!adminPanel) return;

    let card = document.getElementById("gdCourseCodeGenCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "gdCourseCodeGenCard";
      card.className = "card";

      // البحث عن بطاقة "إنشاء كود" الأصلية لوضع كود الكورسات تحتها مباشرة
      const cards = Array.from(adminPanel.querySelectorAll(".card, div"));
      const proCodeCard = cards.find(el => {
        const h = el.querySelector("h3, h4");
        return h && h.textContent && h.textContent.includes("إنشاء كود") && !h.textContent.includes("الكورسات");
      });

      if (proCodeCard && proCodeCard.parentNode) {
        proCodeCard.insertAdjacentElement("afterend", card);
      } else {
        adminPanel.prepend(card);
      }
    }

    card.innerHTML = renderCourseCodeGeneratorHTML();
  }

  function categorizeUser(u) {
    const now = Date.now();
    const plan = String(u.plan || "").toLowerCase();
    const proUntil = Number(u.pro_until || 0);
    const hasPaidSub =
      (plan === "pro" || plan === "pro_plus" || plan.includes("plus")) &&
      (!proUntil || proUntil > now);

    const trialEnd = Number(u.trial_end || u.trialEnd || 0);
    const isTrialLive = trialEnd > now;

    if (hasPaidSub) {
      if (plan.includes("plus") || plan === "pro_plus") return "pro_plus";
      return "pro";
    }
    if (isTrialLive) return "trial_active";
    if (trialEnd > 0 && !isTrialLive) return "trial_expired";
    return "no_sub";
  }

  function renderAdminDashboard() {
    mountCourseCodeGeneratorCard();

    const parent =
      document.getElementById("admin") ||
      document.getElementById("adminView") ||
      document.getElementById("adminPanel") ||
      document.querySelector('[data-section="admin"]');
    if (!parent) return;

    let section = document.getElementById("gdAdminDashboardSection");
    if (!section) {
      section = document.createElement("div");
      section.id = "gdAdminDashboardSection";
      parent.prepend(section);
    }

    const segments = {
      all_active: { count: 0, label: "الحسابات الشغالة دلوقتي", sub: "مشتركون + تجريبي نشط" },
      pro: { count: 0, label: "حسابات الـ PRO", sub: "الاشتراك المدفوع" },
      pro_plus: { count: 0, label: "حسابات البرو بلس", sub: "باقة PRO Plus" },
      courses_active: { count: 0, label: "مشتركو الكورسات", sub: "مفعّل بكود الكورسات" },
      trial_active: { count: 0, label: "الحسابات العادية (تجريبي)", sub: "فترة التجربة النشطة" },
      trial_expired: { count: 0, label: "حسابات من غير اشتراك", sub: "منتهية / ملغاة" }
    };

    const now = Date.now();
    allUsersList.forEach(u => {
      const cat = categorizeUser(u);
      const hasCourses = Boolean(u.courses_active && (!u.courses_until || Number(u.courses_until) > now));
      if (hasCourses) segments.courses_active.count++;

      if (cat === "pro") segments.pro.count++;
      else if (cat === "pro_plus") segments.pro_plus.count++;
      else if (cat === "trial_active") segments.trial_active.count++;
      else segments.trial_expired.count++;

      if (cat === "pro" || cat === "pro_plus" || cat === "trial_active") {
        segments.all_active.count++;
      }
    });

    const categoryNames = {
      all_active: "الحسابات الشغالة دلوقتي",
      pro: "حسابات الـ PRO",
      pro_plus: "حسابات البرو بلس (PRO Plus)",
      courses_active: "الحسابات المفعّل لها الكورسات",
      trial_active: "الحسابات العادية (التجريبية النشطة)",
      trial_expired: "حسابات من غير اشتراك (منتهية / ملغاة)"
    };

    const filteredUsers = allUsersList.filter(u => {
      const cat = categorizeUser(u);
      const hasCourses = Boolean(u.courses_active && (!u.courses_until || Number(u.courses_until) > now));
      if (currentCategoryFilter === "courses_active") return hasCourses;
      if (currentCategoryFilter === "all_active") {
        return cat === "pro" || cat === "pro_plus" || cat === "trial_active";
      }
      if (currentCategoryFilter === "trial_expired") {
        return cat === "trial_expired" || cat === "no_sub";
      }
      return cat === currentCategoryFilter;
    });

    section.innerHTML = `
      <div class="gd-admin-top-row">
        <h3 class="gd-admin-title">📊 لوحة تصنيف وإدارة حسابات المنصة</h3>
        <button type="button" class="gd-bulk-fix-btn" onclick="window.GEOAdminSegActions.enforce3DaysOnOldUsers()">
          ⚡ تصفية القدامى وضبط الجميع على 3 أيام
        </button>
      </div>
      
      <div class="gd-segment-grid">
        ${Object.entries(segments)
          .map(
            ([key, data]) => `
          <div class="gd-segment-card ${currentCategoryFilter === key ? "active" : ""}" onclick="window.GEOAdminSegActions.setFilter('${key}')">
            <div class="gd-segment-count">${data.count}</div>
            <div class="gd-segment-label">${data.label}</div>
            <div class="gd-segment-sub">${data.sub}</div>
          </div>
        `
          )
          .join("")}
      </div>

      <div class="gd-users-section-header">
        <span class="gd-users-section-title">👥 ${categoryNames[currentCategoryFilter]} (${filteredUsers.length} حساب)</span>
      </div>

      <div class="gd-user-cards-list">
        ${filteredUsers
          .map(u => {
            const cat = categorizeUser(u);
            const hasCourses = Boolean(u.courses_active && (!u.courses_until || Number(u.courses_until) > now));
            let badgeHtml = "";
            if (cat === "pro") badgeHtml = `<span class="gd-badge active-pro">💎 PRO فعال</span>`;
            else if (cat === "pro_plus") badgeHtml = `<span class="gd-badge active-plus">👑 PRO Plus</span>`;
            else if (cat === "trial_active") badgeHtml = `<span class="gd-badge trial-active">⏳ تجريبي نشط</span>`;
            else badgeHtml = `<span class="gd-badge trial-expired">🚫 من غير اشتراك</span>`;

            const coursesBadge = hasCourses ? `<span class="gd-badge courses-ok">🎓 كورسات مفعّلة</span>` : "";

            const tEnd = Number(u.trial_end || u.trialEnd || 0);
            const trialEndStr = tEnd > 0 ? new Date(tEnd).toLocaleDateString("ar-EG") : "منتهية (0)";
            const proEndStr = Number(u.pro_until || 0) > 0 ? new Date(Number(u.pro_until)).toLocaleDateString("ar-EG") : "لا يوجد";
            const coursesEndStr = hasCourses && Number(u.courses_until || 0) > 0 ? new Date(Number(u.courses_until)).toLocaleDateString("ar-EG") : "غير مفعّلة";

            return `
            <div class="gd-admin-user-card">
              <div>
                <div class="gd-auc-header">
                  <span class="gd-auc-name">👤 ${escapeHTML(u.name || u.displayName || "مستخدم")}</span>
                  <div style="display:flex;gap:4px;flex-wrap:wrap;">${badgeHtml}${coursesBadge}</div>
                </div>
                <div class="gd-auc-email">${escapeHTML(u.email || u.id)}</div>
                <div class="gd-auc-dates" style="margin-top: 6px;">
                  ⏳ نهاية التجريبي: <b>${trialEndStr}</b><br>
                  💳 نهاية البرو المدفوع: <b>${proEndStr}</b><br>
                  🎓 اشتراك الكورسات: <b>${coursesEndStr}</b>
                </div>
              </div>

              <div class="gd-auc-actions">
                <button type="button" class="gd-admin-btn upgrade-pro" onclick="window.GEOAdminSegActions.changePlan('${u.id}', 'pro')">تفعيل PRO</button>
                <button type="button" class="gd-admin-btn courses-btn" onclick="window.GEOAdminSegActions.toggleCoursesAccess('${u.id}', ${!hasCourses})">
                  ${hasCourses ? "إلغاء الكورسات" : "🎓 تفعيل الكورسات"}
                </button>
                <button type="button" class="gd-admin-btn demote" onclick="window.GEOAdminSegActions.changePlan('${u.id}', 'free')">إلغاء الكل</button>
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    `;
  }

  function fetchAllUsersAndCodesLive() {
    const db = getFirestoreDb();
    if (!db) return;

    db.collection("users").onSnapshot(
      snap => {
        allUsersList = [];
        snap.forEach(doc => {
          allUsersList.push({ id: doc.id, ...doc.data() });
        });
        renderAdminDashboard();
      },
      err => console.warn("Segmentation Dashboard fetch error:", err)
    );

    db.collection("geodev_course_codes")
      .orderBy("createdAt", "desc")
      .onSnapshot(
        snap => {
          courseCodesList = [];
          snap.forEach(doc => {
            courseCodesList.push({ id: doc.id, ...doc.data() });
          });
          mountCourseCodeGeneratorCard();
        },
        err => console.warn("Course codes fetch error:", err)
      );
  }

  window.GEOAdminSegActions = {
    setFilter(key) {
      currentCategoryFilter = key;
      renderAdminDashboard();
    },

    async createCourseCode() {
      const db = getFirestoreDb();
      if (!db) return alert("قاعدة البيانات غير متصلة.");

      const sel = document.getElementById("gdCourseCodeDaysSelect");
      const customInput = document.getElementById("gdCourseCodeCustomDays");
      const noteInput = document.getElementById("gdCourseCodeNote");
      const btn = document.getElementById("gdCreateCourseCodeBtn");

      let days = 30;
      if (sel && sel.value === "custom") {
        days = parseInt(customInput?.value || "0", 10);
        if (!days || days < 1) return alert("من فضلك أدخل عدد أيام صحيح.");
      } else if (sel) {
        days = parseInt(sel.value || "30", 10);
      }

      const note = (noteInput?.value || "").trim();
      const newCode = generateRandomCourseCode();

      if (btn) {
        btn.disabled = true;
        btn.textContent = "⏳ جاري إنشاء الكود...";
      }

      try {
        await db.collection("geodev_course_codes").doc(newCode).set({
          code: newCode,
          days: days,
          note: note,
          used: false,
          usedBy: "",
          usedByEmail: "",
          createdBy: ADMIN_EMAIL,
          createdAt: Date.now()
        });

        lastGeneratedCourseCode = newCode;
        if (noteInput) noteInput.value = "";
        mountCourseCodeGeneratorCard();
        if (typeof window.toast === "function") {
          window.toast("✔ تم إنشاء كود الكورسات بنجاح!", "success");
        }
      } catch (err) {
        alert("حدث خطأ أثناء إنشاء كود الكورسات: " + err.message);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = "🎟️ إنشاء كود للكورسات الآن";
        }
      }
    },

    copyCode(code) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code).catch(() => {});
      }
      if (typeof window.toast === "function") {
        window.toast("📋 تم نسخ الكود: " + code, "success");
      } else {
        alert("تم نسخ الكود: " + code);
      }
    },

    async deleteCourseCode(code) {
      const db = getFirestoreDb();
      if (!db || !confirm("حذف كود الكورسات " + code + " نهائياً؟")) return;
      try {
        await db.collection("geodev_course_codes").doc(code).delete();
      } catch (err) {
        alert("تعذر الحذف: " + err.message);
      }
    },

    async toggleCoursesAccess(userId, enable) {
      const db = getFirestoreDb();
      if (!db) return;
      try {
        await db.collection("users").doc(userId).set(
          {
            courses_active: Boolean(enable),
            courses_until: enable ? Date.now() + 30 * DAY_MS : 0,
            updatedAt: Date.now()
          },
          { merge: true }
        );
        if (typeof window.toast === "function") {
          window.toast(enable ? "✔ تم تفعيل الكورسات لهذا الحساب (30 يوم)!" : "تم إلغاء اشتراك الكورسات للحساب.", "success");
        }
      } catch (err) {
        alert("فشل التحديث: " + err.message);
      }
    },

    async changePlan(userId, planType) {
      const db = getFirestoreDb();
      if (!db) return;

      const userRef = db.collection("users").doc(userId);
      let updateData = {};

      if (planType === "pro") {
        updateData = {
          plan: "pro",
          pro_until: Date.now() + 30 * DAY_MS,
          trial_end: 0,
          trialEnd: 0,
          updatedAt: Date.now()
        };
      } else if (planType === "pro_plus") {
        updateData = {
          plan: "pro_plus",
          pro_until: Date.now() + 30 * DAY_MS,
          trial_end: 0,
          trialEnd: 0,
          updatedAt: Date.now()
        };
      } else {
        updateData = {
          plan: "free",
          pro_until: 0,
          trial_end: 0,
          trialEnd: 0,
          trial_days: 0,
          courses_active: false,
          courses_until: 0,
          updatedAt: Date.now()
        };
      }

      try {
        await userRef.set(updateData, { merge: true });
        if (typeof window.toast === "function") {
          window.toast("تم تحديث حالة الحساب بنجاح!", "success");
        }
      } catch (err) {
        alert("فشل تحديث الحساب: " + err.message);
      }
    },

    async enforce3DaysOnOldUsers() {
      const db = getFirestoreDb();
      if (!db) return;
      if (!confirm("هل تريد تصفية جميع الحسابات القديمة ذات الـ 30 يوماً وتقليص أقصى فترة تجريبية غير مدفوعة إلى 3 أيام فقط؟")) return;

      const now = Date.now();
      const maxAllowedTrial = now + 3 * DAY_MS;
      let updatedCount = 0;

      for (const u of allUsersList) {
        const email = String(u.email || "").toLowerCase();
        if (email === ADMIN_EMAIL) continue;

        const plan = String(u.plan || "").toLowerCase();
        const proUntil = Number(u.pro_until || 0);
        const isPaid = (plan === "pro" || plan === "pro_plus" || plan.includes("plus")) && proUntil > now;
        if (isPaid) continue;

        const tEnd = Number(u.trial_end || u.trialEnd || 0);
        if (tEnd > maxAllowedTrial) {
          await db.collection("users").doc(u.id).set(
            {
              plan: "free",
              pro_until: 0,
              trial_end: 0,
              trialEnd: 0,
              trial_days: 3,
              updatedAt: now
            },
            { merge: true }
          );
          updatedCount++;
        }
      }

      alert(`✔ تم تحديث وتصفية ${updatedCount} حساب بنجاح!`);
    }
  };

  function checkAdmin() {
    if (window.firebase && firebase.apps && firebase.apps.length) {
      firebase.auth().onAuthStateChanged(user => {
        const isAdminUser = user && user.email && user.email.toLowerCase() === ADMIN_EMAIL;
        if (isAdminUser) {
          injectStyles();
          fetchAllUsersAndCodesLive();
          setTimeout(mountCourseCodeGeneratorCard, 600);
          setTimeout(mountCourseCodeGeneratorCard, 1800);
        } else {
          const section = document.getElementById("gdAdminDashboardSection");
          if (section) section.remove();
          const codeCard = document.getElementById("gdCourseCodeGenCard");
          if (codeCard) codeCard.remove();
        }
      });
      return true;
    }
    return false;
  }

  function init() {
    if (!checkAdmin()) {
      const iv = setInterval(() => {
        if (checkAdmin()) clearInterval(iv);
      }, 400);
      setTimeout(() => clearInterval(iv), 10000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();