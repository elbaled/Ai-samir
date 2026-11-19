/* ============================================================================
   لوحة إدارة وتصنيف حسابات المستخدمين التفاعلية (مُحدثة: إلغاء كامل + تصفية شاملة)
   ============================================================================ */
(function () {
  "use strict";
  if (window.GEOAdminDashboardSegV2Init) return;
  window.GEOAdminDashboardSegV2Init = true;

  const ADMIN_EMAIL = "eng.ahmedsamir.gis@gmail.com";
  const DAY_MS = 24 * 60 * 60 * 1000;
  let allUsersList = [];
  let currentCategoryFilter = "all_active";

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
      .gd-admin-top-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 14px;
      }
      .gd-admin-title {
        margin: 0;
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
      .gd-segment-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
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
      .gd-segment-count {
        font-size: 23px;
        font-weight: 900;
        color: #b45309;
      }
      .gd-segment-label {
        font-size: 13px;
        font-weight: 800;
        color: #334155;
      }
      .gd-segment-sub {
        font-size: 11px;
        color: #64748b;
      }
      .gd-users-section-header {
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
      .gd-auc-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
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
        line-height: 1.5;
        background: #f8fafc;
        padding: 6px 8px;
        border-radius: 8px;
      }
      .gd-auc-actions {
        display: flex;
        gap: 6px;
        margin-top: 4px;
      }
      .gd-admin-btn {
        flex: 1;
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
      .gd-admin-btn.demote { background: #dc2626; color: #fff; }

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
    const parent =
      document.getElementById("admin") ||
      document.getElementById("adminView") ||
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
      pro: { count: 0, label: "حسابات البرو (PRO)", sub: "الاشتراك المدفوع" },
      pro_plus: { count: 0, label: "حسابات البرو بلس", sub: "ربط البرامج بالـ AI" },
      trial_active: { count: 0, label: "الحسابات العادية (تجريبي)", sub: "فترة التجربة النشطة" },
      trial_expired: { count: 0, label: "حسابات من غير اشتراك", sub: "منتهية / ملغاة" }
    };

    allUsersList.forEach(u => {
      const cat = categorizeUser(u);
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
      pro: "حسابات البرو (PRO)",
      pro_plus: "حسابات البرو بلس (PRO Plus)",
      trial_active: "الحسابات العادية (التجريبية النشطة)",
      trial_expired: "حسابات من غير اشتراك (منتهية / ملغاة)"
    };

    const filteredUsers = allUsersList.filter(u => {
      const cat = categorizeUser(u);
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
            let badgeHtml = "";
            if (cat === "pro") badgeHtml = `<span class="gd-badge active-pro">💎 PRO فعال</span>`;
            else if (cat === "pro_plus") badgeHtml = `<span class="gd-badge active-plus">👑 PRO Plus</span>`;
            else if (cat === "trial_active") badgeHtml = `<span class="gd-badge trial-active">⏳ تجريبي نشط</span>`;
            else badgeHtml = `<span class="gd-badge trial-expired">🚫 من غير اشتراك</span>`;

            const tEnd = Number(u.trial_end || u.trialEnd || 0);
            const trialEndStr = tEnd > 0 ? new Date(tEnd).toLocaleDateString("ar-EG") : "منتهية (0)";
            const proEndStr = Number(u.pro_until || 0) > 0 ? new Date(Number(u.pro_until)).toLocaleDateString("ar-EG") : "لا يوجد";

            return `
            <div class="gd-admin-user-card">
              <div>
                <div class="gd-auc-header">
                  <span class="gd-auc-name">👤 ${u.name || u.displayName || "مستخدم"}</span>
                  ${badgeHtml}
                </div>
                <div class="gd-auc-email">${u.email || u.id}</div>
                <div class="gd-auc-dates" style="margin-top: 6px;">
                  ⏳ نهاية التجريبي: <b>${trialEndStr}</b><br>
                  💳 نهاية البرو المدفوع: <b>${proEndStr}</b>
                </div>
              </div>

              <div class="gd-auc-actions">
                <button type="button" class="gd-admin-btn upgrade-pro" onclick="window.GEOAdminSegActions.changePlan('${u.id}', 'pro')">تفعيل PRO</button>
                <button type="button" class="gd-admin-btn upgrade-plus" onclick="window.GEOAdminSegActions.changePlan('${u.id}', 'pro_plus')">PRO Plus</button>
                <button type="button" class="gd-admin-btn demote" onclick="window.GEOAdminSegActions.changePlan('${u.id}', 'free')">إلغاء نهائي</button>
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    `;
  }

  function fetchAllUsersLive() {
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
        // إلغاء كامل للبرو + الفترة التجريبية حتى يتحول لحساب من غير اشتراك فوراً
        updateData = {
          plan: "free",
          pro_until: 0,
          trial_end: 0,
          trialEnd: 0,
          trial_days: 0,
          updatedAt: Date.now()
        };
      }

      try {
        await userRef.set(updateData, { merge: true });
        if (typeof window.toast === "function") {
          window.toast("تم تحديث حالة الحساب وإلغاء/تفعيل الصلاحية فوراً!", "success");
        }
      } catch (err) {
        alert("فشل تحديث الحساب: " + err.message);
      }
    },

    // تصفية شاملة لجميع الحسابات القديمة ذات الـ 30 يوماً بضغطة واحدة
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
        // أي حساب غير مدفوع لديه فترة تجريبية تزيد عن 3 أيام من الآن (مثل حسابات الـ 24 يوم الظاهرة في الصورة)
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
