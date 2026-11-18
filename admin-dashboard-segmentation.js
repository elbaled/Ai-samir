/* ============================================================================
   لوحة إدارة وتصنيف حسابات المستخدمين التفاعلية (5 تصنيفات مخصصة)
   ============================================================================ */
(function () {
  "use strict";
  if (window.GEOAdminDashboardSegmentationInit) return;
  window.GEOAdminDashboardSegmentationInit = true;

  const ADMIN_EMAIL = "eng.ahmedsamir.gis@gmail.com";
  let currentUser = null;
  let allUsersList = [];

  function injectStyles() {
    if (document.getElementById("gdAdminSegmentationStyles")) return;
    const style = document.createElement("style");
    style.id = "gdAdminSegmentationStyles";
    style.textContent = `
      #gdAdminDashboardSection {
        direction: rtl;
        text-align: right;
        padding: 16px;
        font-family: inherit;
        background: #f8fafc;
        border-radius: 16px;
        margin: 15px 0;
        border: 2px solid #e09f24;
      }
      .gd-admin-title {
        margin: 0 0 15px;
        font-size: 18px;
        font-weight: 900;
        color: #0f172a;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .gd-segment-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 12px;
        margin-bottom: 20px;
      }
      .gd-segment-card {
        background: #ffffff;
        border: 2px solid #e2e8f0;
        border-radius: 14px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }
      .gd-segment-card:hover, .gd-segment-card.active {
        border-color: #e09f24;
        background: #fffbeb;
        transform: translateY(-2px);
      }
      .gd-segment-card.active {
        box-shadow: 0 4px 12px rgba(224, 159, 36, 0.2);
      }
      .gd-segment-count {
        font-size: 24px;
        font-weight: 900;
        color: #b45309;
        margin-bottom: 2px;
      }
      .gd-segment-label {
        font-size: 13px;
        font-weight: 800;
        color: #334155;
      }
      .gd-segment-sub {
        font-size: 11px;
        color: #64748b;
        margin-top: 2px;
      }
      
      /* قائمة الحسابات المدرجة */
      .gd-users-section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 2px solid #e09f24;
      }
      .gd-users-section-title {
        font-size: 14.5px;
        font-weight: 900;
        color: #0f172a;
      }
      .gd-user-cards-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
        gap: 12px;
        max-height: 550px;
        overflow-y: auto;
        padding: 4px;
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
        box-shadow: 0 2px 6px rgba(0,0,0,0.02);
      }
      .gd-auc-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .gd-auc-name {
        font-weight: 900;
        font-size: 13.5px;
        color: #0f172a;
      }
      .gd-auc-email {
        font-size: 11.5px;
        color: #64748b;
        user-select: all;
      }
      .gd-badge {
        font-size: 10.5px;
        font-weight: 800;
        padding: 2px 8px;
        border-radius: 99px;
      }
      .gd-badge.active-pro { background: #dcfce7; color: #166534; }
      .gd-badge.active-plus { background: #fef3c7; color: #92400e; }
      .gd-badge.trial-active { background: #e0f2fe; color: #075985; }
      .gd-badge.trial-expired { background: #fee2e2; color: #991b1b; }
      
      .gd-auc-dates {
        font-size: 11px;
        color: #475569;
        line-height: 1.4;
        background: #f8fafc;
        padding: 6px;
        border-radius: 8px;
      }
      
      /* أزرار الإدارة */
      .gd-auc-actions {
        display: flex;
        gap: 6px;
        margin-top: 4px;
      }
      .gd-admin-btn {
        flex: 1;
        padding: 6px;
        font-size: 11px;
        font-weight: 900;
        border-radius: 8px;
        cursor: pointer;
        border: none;
        font-family: inherit;
      }
      .gd-admin-btn.upgrade-pro { background: #0284c7; color: #fff; }
      .gd-admin-btn.upgrade-plus { background: #d97706; color: #fff; }
      .gd-admin-btn.demote { background: #64748b; color: #fff; }

      body.dark-mode #gdAdminDashboardSection,
      [data-theme="dark"] #gdAdminDashboardSection {
        background: #171c26;
        border-color: #2a3242;
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
      [data-theme="dark"] .gd-segment-card,
      [data-theme="dark"] .gd-admin-user-card {
        background: #10141c;
        border-color: #2a3242;
      }
      body.dark-mode .gd-segment-label,
      [data-theme="dark"] .gd-segment-label {
        color: #cbd5e1;
      }
      body.dark-mode .gd-auc-dates,
      [data-theme="dark"] .gd-auc-dates {
        background: #0d1017;
        color: #94a3b8;
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

  let currentCategoryFilter = "all_active";

  function categorizeUser(u) {
    const now = Date.now();
    const plan = (u.plan || "").toLowerCase();
    const proUntil = Number(u.pro_until || 0);
    const hasPaidSub = (plan === "pro" || plan === "pro_plus" || plan.includes("plus")) && (!proUntil || proUntil > now);
    const trialEnd = Number(u.trial_end || 0);
    const isTrialLive = trialEnd > now;

    if (hasPaidSub) {
      if (plan.includes("plus") || plan === "pro_plus") return "pro_plus";
      return "pro";
    }
    if (isTrialLive) return "trial_active";
    if (trialEnd && !isTrialLive) return "trial_expired";
    return "no_sub";
  }

  function renderAdminDashboard() {
    const parent = document.getElementById("admin") || document.getElementById("adminView") || document.querySelector('[data-section="admin"]');
    if (!parent) return;

    let section = document.getElementById("gdAdminDashboardSection");
    if (!section) {
      section = document.createElement("div");
      section.id = "gdAdminDashboardSection";
      parent.prepend(section);
    }

    const segments = {
      all_active: { count: 0, label: "الحسابات النشطة الآن", sub: "مشتركون وتجريبي فعال" },
      pro: { count: 0, label: "حسابات الـ PRO", sub: "الاشتراك القياسي المدفوع" },
      pro_plus: { count: 0, label: "حسابات PRO Plus", sub: "ربط البرامج بالـ AI" },
      trial_active: { count: 0, label: "حسابات تجريبية (3 أيام)", sub: "فترة التجربة النشطة" },
      trial_expired: { count: 0, label: "حسابات من غير اشتراك", sub: "منتهية الصلاحية" }
    };

    allUsersList.forEach(u => {
      const cat = categorizeUser(u);
      if (cat === "pro") segments.pro.count++;
      if (cat === "pro_plus") segments.pro_plus.count++;
      if (cat === "trial_active") segments.trial_active.count++;
      if (cat === "trial_expired") segments.trial_expired.count++;
      if (cat === "no_sub") segments.trial_expired.count++; // ضم بدون اشتراك للمنتهية

      if (cat !== "trial_expired" && cat !== "no_sub") {
        segments.all_active.count++;
      }
    });

    const categoryNames = {
      all_active: "الحسابات النشطة الآن",
      pro: "مشتركي PRO",
      pro_plus: "مشتركي PRO Plus",
      trial_active: "المستخدمين في الفترة التجريبية",
      trial_expired: "المستخدمين منتهي الاشتراك / بدون باقة"
    };

    const filteredUsers = allUsersList.filter(u => {
      const cat = categorizeUser(u);
      if (currentCategoryFilter === "all_active") return cat !== "trial_expired" && cat !== "no_sub";
      if (currentCategoryFilter === "trial_expired") return cat === "trial_expired" || cat === "no_sub";
      return cat === currentCategoryFilter;
    });

    section.innerHTML = `
      <h3 class="gd-admin-title">📊 لوحة تصنيف وإدارة حسابات المنصة المباشرة</h3>
      
      <div class="gd-segment-grid">
        ${Object.entries(segments).map(([key, data]) => `
          <div class="gd-segment-card ${currentCategoryFilter === key ? "active" : ""}" onclick="window.GEOAdminSegActions.setFilter('${key}')">
            <div class="gd-segment-count">${data.count}</div>
            <div class="gd-segment-label">${data.label}</div>
            <div class="gd-segment-sub">${data.sub}</div>
          </div>
        `).join("")}
      </div>

      <div class="gd-users-section-header">
        <span class="gd-users-section-title">👥 قائمة ${categoryNames[currentCategoryFilter]} (${filteredUsers.length} حساب)</span>
      </div>

      <div class="gd-user-cards-list">
        ${filteredUsers.map(u => {
          const cat = categorizeUser(u);
          let badgeHtml = "";
          if (cat === "pro") badgeHtml = `<span class="gd-badge active-pro">💎 PRO فعال</span>`;
          else if (cat === "pro_plus") badgeHtml = `<span class="gd-badge active-plus">👑 PRO Plus</span>`;
          else if (cat === "trial_active") badgeHtml = `<span class="gd-badge trial-active">⏳ تجريبي نشط</span>`;
          else badgeHtml = `<span class="gd-badge trial-expired">🚫 بدون اشتراك</span>`;

          const registered = u.createdAt ? new Date(u.createdAt).toLocaleDateString("ar-EG") : "غير مسجل";
          const trialEndStr = u.trial_end ? new Date(u.trial_end).toLocaleDateString("ar-EG") : "غير نشط";

          return `
            <div class="gd-admin-user-card">
              <div>
                <div class="gd-auc-header">
                  <span class="gd-auc-name">👤 ${u.name || "مستخدم غير معروف"}</span>
                  ${badgeHtml}
                </div>
                <div class="gd-auc-email">${u.email || "بدون بريد"}</div>
                <div class="gd-auc-dates" style="margin-top: 6px;">
                  🗓 تاريخ التسجيل: ${registered}<br>
                  ⏳ انتهاء التجربة: ${trialEndStr}
                  ${u.pro_until ? `<br>💳 انتهاء البرو: ${new Date(u.pro_until).toLocaleDateString("ar-EG")}` : ""}
                </div>
              </div>

              <div class="gd-auc-actions">
                <button type="button" class="gd-admin-btn upgrade-pro" onclick="window.GEOAdminSegActions.changePlan('${u.id}', 'pro')">PRO (50ج)</button>
                <button type="button" class="gd-admin-btn upgrade-plus" onclick="window.GEOAdminSegActions.changePlan('${u.id}', 'pro_plus')">PRO Plus (80ج)</button>
                <button type="button" class="gd-admin-btn demote" onclick="window.GEOAdminSegActions.changePlan('${u.id}', 'free')">إلغاء الباقة</button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function fetchAllUsersLive() {
    const db = getFirestoreDb();
    if (!db) return;

    db.collection("users")
      .orderBy("createdAt", "desc")
      .onSnapshot(snap => {
        allUsersList = [];
        snap.forEach(doc => {
          allUsersList.push({ id: doc.id, ...doc.data() });
        });
        renderAdminDashboard();
      }, err => console.warn("Segmentation Dashboard fetch error:", err));
  }

  window.GEOAdminSegActions = {
    setFilter(key) {
      currentCategoryFilter = key;
      renderAdminDashboard();
    },
    async changePlan(userId, planType) {
      const db = getFirestoreDb();
      if (!db) return;

      const userRef = db.collection("users").doc(userId);
      let updateData = {};

      if (planType === "pro") {
        updateData = {
          plan: "pro",
          pro_until: Date.now() + 30 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now()
        };
      } else if (planType === "pro_plus") {
        updateData = {
          plan: "pro_plus",
          pro_until: Date.now() + 30 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now()
        };
      } else {
        updateData = {
          plan: "free",
          pro_until: 0,
          updatedAt: Date.now()
        };
      }

      try {
        await userRef.update(updateData);
        if (typeof window.toast === "function") {
          window.toast("تم تحديث تصنيف وباقة الحساب بنجاح!", "success");
        }
      } catch (err) {
        alert("فشل تحديث باقة المستخدم: " + err.message);
      }
    }
  };

  function checkAdmin() {
    if (window.firebase && firebase.apps && firebase.apps.length) {
      firebase.auth().onAuthStateChanged(user => {
        currentUser = user;
        const isAdminUser = user && user.email && user.email.toLowerCase() === ADMIN_EMAIL;
        
        if (isAdminUser) {
          injectStyles();
          fetchAllUsersLive();
        } else {
          const section = document.getElementById("gdAdminDashboardSection");
          if (section) section.remove();
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
