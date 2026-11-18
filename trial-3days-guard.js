/* ============================================================================
   نظام الفترة التجريبية (3 أيام) + إخفاء الأدوات عن شاشة التسجيل + رسالة انتهاء PRO
   ============================================================================ */
(function () {
  "use strict";
  if (window.GEOTrial3DaysGuardV2Init) return;
  window.GEOTrial3DaysGuardV2Init = true;

  const ADMIN_EMAIL = "eng.ahmedsamir.gis@gmail.com";
  const ADMIN_WHATSAPP = "201015912371";
  const TRIAL_DAYS_NEW = 3;
  const DAY_MS = 24 * 60 * 60 * 1000;

  const NOV_17_START = new Date("2026-11-17T00:00:00+02:00").getTime();
  const NOV_18_START = new Date("2026-11-18T00:00:00+02:00").getTime();
  const NOV_19_START = new Date("2026-11-19T00:00:00+02:00").getTime();

  let currentUser = null;
  let isAdminUser = false;
  let hasActivePaidSub = false;
  let isTrialExpired = false;
  let trialEndTimestamp = 0;

  // 1. استبدال "7 أيام" (سواء مع PRO أو مجاناً أو تجريبي) بـ "3 أيام" في كل نصوص الصفحة
  function updateTrialTextsInUI() {
    if (!document.body) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      const txt = node.nodeValue;
      if (!txt) continue;
      if (/(7|١٤|14|30)\s*(أيام|ايام|يوم)/i.test(txt)) {
        node.nodeValue = txt.replace(/(7|١٤|14|30)\s*(أيام|ايام|يوم)/gi, "3 أيام");
      }
    }
  }

  // 2. إخفاء صناديق الأدوات من شاشة التسجيل وقبل تسجيل الدخول نهائياً
  function enforceAuthVisibilityForTools() {
    const loggedIn = Boolean(currentUser);
    const toolBoxes = [
      document.getElementById("gdGeomaticsAdvTools"),
      document.getElementById("gdSurveyAdvTools"),
      document.getElementById("gdAcademyAiBridgeBox"),
      document.getElementById("gdAdvancedEngToolsBox")
    ];

    toolBoxes.forEach(box => {
      if (!box) return;
      // إذا كان الصندوق محقوناً بالخطأ داخل شاشة تسجيل الدخول أو قبل الدخول -> احذفه/أخفه
      const insideAuth = box.closest("#authView, #loginScreen, #authModal, .auth-card, [id*='auth'], [id*='login']");
      if (!loggedIn || insideAuth) {
        box.remove();
      }
    });
  }

  function injectStyles() {
    if (document.getElementById("gdTrialExpiredStyles")) return;
    const style = document.createElement("style");
    style.id = "gdTrialExpiredStyles";
    style.textContent = `
      #gdProExpiredOverlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.86);
        backdrop-filter: blur(5px);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 10095;
        direction: rtl;
        text-align: right;
        font-family: inherit;
      }
      .gd-exp-card {
        background: #ffffff;
        border: 2px solid #e09f24;
        border-radius: 20px;
        width: 100%;
        max-width: 450px;
        max-height: 90vh;
        overflow-y: auto;
        padding: 20px 18px;
        color: #0f172a;
        box-shadow: 0 24px 50px rgba(0, 0, 0, 0.45);
      }
      .gd-exp-badge {
        display: inline-block;
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
        padding: 4px 12px;
        border-radius: 99px;
        font-size: 12px;
        font-weight: 900;
        margin-bottom: 8px;
      }
      .gd-exp-title {
        margin: 0 0 6px;
        font-size: 19px;
        font-weight: 900;
        color: #0f172a;
      }
      .gd-exp-desc {
        margin: 0 0 14px;
        font-size: 13px;
        color: #475569;
        line-height: 1.6;
      }
      .gd-exp-plans {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 14px;
      }
      .gd-exp-plan-box {
        background: #f8fafc;
        border: 1.5px solid #cbd5e1;
        border-radius: 14px;
        padding: 11px;
      }
      .gd-exp-plan-box.plus {
        border-color: #e09f24;
        background: #fffbeb;
      }
      .gd-exp-plan-box h4 {
        margin: 0 0 5px;
        font-size: 13.5px;
        font-weight: 900;
        color: #0f172a;
      }
      .gd-exp-price {
        font-size: 16px;
        font-weight: 900;
        color: #b45309;
        margin-bottom: 4px;
      }
      .gd-exp-subprice {
        font-size: 11px;
        color: #475569;
        line-height: 1.5;
      }
      .gd-exp-wa-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        box-sizing: border-box;
        background: #16a34a;
        color: #ffffff;
        text-decoration: none;
        border: none;
        border-radius: 12px;
        padding: 12px;
        font-size: 14px;
        font-weight: 900;
        cursor: pointer;
        font-family: inherit;
        margin-bottom: 8px;
      }
      .gd-exp-close-btn {
        width: 100%;
        background: #e2e8f0;
        color: #334155;
        border: none;
        border-radius: 10px;
        padding: 9px;
        font-size: 12.5px;
        font-weight: 800;
        cursor: pointer;
        font-family: inherit;
      }
      body.dark-mode .gd-exp-card,
      [data-theme="dark"] .gd-exp-card {
        background: #171c26;
        color: #ffffff;
      }
      body.dark-mode .gd-exp-title,
      body.dark-mode .gd-exp-plan-box h4,
      [data-theme="dark"] .gd-exp-title,
      [data-theme="dark"] .gd-exp-plan-box h4 {
        color: #ffffff;
      }
      body.dark-mode .gd-exp-plan-box,
      [data-theme="dark"] .gd-exp-plan-box {
        background: #10141c;
        border-color: #2a3242;
      }
    `;
    document.head.appendChild(style);
  }

  function computeExpectedTrialEnd(createdAtMs) {
    if (!createdAtMs || isNaN(createdAtMs)) {
      return Date.now() + TRIAL_DAYS_NEW * DAY_MS;
    }
    if (createdAtMs >= NOV_19_START) {
      return createdAtMs + TRIAL_DAYS_NEW * DAY_MS;
    }
    if (createdAtMs >= NOV_18_START) {
      return createdAtMs + 2 * DAY_MS;
    }
    if (createdAtMs >= NOV_17_START) {
      return NOV_19_START + DAY_MS - 1000;
    }
    return createdAtMs;
  }

  function showExpiredModal() {
    if (!currentUser || isAdminUser || hasActivePaidSub) return;
    let overlay = document.getElementById("gdProExpiredOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "gdProExpiredOverlay";
      document.body.appendChild(overlay);
    }

    const userEmail = currentUser && currentUser.email ? currentUser.email : "";
    const waMsg = encodeURIComponent(
      `مرحبا، انتهت الفترة التجريبية في منصة GeoDev Studio Pro وأريد تفعيل اشتراك PRO أو PRO Plus.\nحسابي: ${userEmail}`
    );

    overlay.innerHTML = `
      <div class="gd-exp-card">
        <div class="gd-exp-badge">⏳ انتهت الفترة التجريبية (3 أيام)</div>
        <h3 class="gd-exp-title">انتهى اشتراكك البرو (PRO)</h3>
        <p class="gd-exp-desc">
          انتهت مدة التجربة المجانية لحسابك. للاستمرار في استخدام أدوات المساحة والـ GIS، توليد الليسبات والأكواد، والأكاديمية، اشترك الآن في إحدى الباقات وكلم إدارة المنصة للتفعيل الفوري:
        </p>

        <div class="gd-exp-plans">
          <div class="gd-exp-plan-box">
            <h4>💎 باقة PRO</h4>
            <div class="gd-exp-price">50 ج <span style="font-size:11px;font-weight:700;">أول شهر</span></div>
            <div class="gd-exp-subprice">
              التجديد: 70 ج / شهر<br>
              3 شهور: 180 ج • سنوي: 550 ج
            </div>
          </div>

          <div class="gd-exp-plan-box plus">
            <h4>👑 باقة PRO Plus</h4>
            <div class="gd-exp-price">80 ج <span style="font-size:11px;font-weight:700;">أول شهر</span></div>
            <div class="gd-exp-subprice">
              التجديد: 100 ج / شهر<br>
              شامل ربط البرامج بالـ AI
            </div>
          </div>
        </div>

        <div style="background:#f1f5f9;border-radius:10px;padding:8px 10px;font-size:12px;font-weight:800;color:#0f172a;margin-bottom:12px;text-align:center;">
          💳 التحويل عبر فودافون كاش: <span style="color:#dc2626;direction:ltr;display:inline-block;">01015912371</span>
        </div>

        <a href="https://wa.me/${ADMIN_WHATSAPP}?text=${waMsg}" target="_blank" rel="noopener" class="gd-exp-wa-btn">
          💬 اشترك في البرو وكلم المنصة (واتساب)
        </a>

        <button type="button" class="gd-exp-close-btn" onclick="document.getElementById('gdProExpiredOverlay').style.display='none'">
          إغلاق
        </button>
      </div>
    `;
    overlay.style.display = "flex";
  }

  function attachProtectionInterceptor() {
    document.addEventListener(
      "click",
      function (e) {
        if (!currentUser || isAdminUser || hasActivePaidSub || !isTrialExpired) return;
        if (e.target.closest("#gdProExpiredOverlay") || e.target.closest("a[href*='wa.me']")) return;

        const interactiveTarget = e.target.closest(
          ".gd-adv-tool-card, .tool-card, [data-tool], [data-action], #sendBtn, #generateBtn, button[type='submit']"
        );
        if (interactiveTarget) {
          e.preventDefault();
          e.stopPropagation();
          showExpiredModal();
        }
      },
      true
    );
  }

  async function syncUserTrialInFirestore(user) {
    if (!user) return;
    isAdminUser = !!(user.email && user.email.toLowerCase() === ADMIN_EMAIL);
    if (isAdminUser) {
      isTrialExpired = false;
      hasActivePaidSub = true;
      return;
    }

    const creationTimeMs = user.metadata && user.metadata.creationTime
      ? new Date(user.metadata.creationTime).getTime()
      : Date.now();

    const expectedEnd = computeExpectedTrialEnd(creationTimeMs);
    trialEndTimestamp = expectedEnd;

    if (window.firebase && typeof firebase.firestore === "function") {
      try {
        const db = firebase.firestore();
        const userRef = db.collection("users").doc(user.uid);
        const snap = await userRef.get();
        const data = snap.exists ? snap.data() : {};

        const plan = String(data.plan || "").toLowerCase();
        const proUntil = Number(data.pro_until || 0);
        if ((plan === "pro" || plan === "pro_plus" || plan.includes("plus")) && (!proUntil || proUntil > Date.now())) {
          hasActivePaidSub = true;
          isTrialExpired = false;
          localStorage.setItem("gd_user_plan", plan);
          return;
        }

        hasActivePaidSub = false;
        const currentStoredEnd = Number(data.trial_end || 0);
        if (!currentStoredEnd || currentStoredEnd > expectedEnd) {
          await userRef.set(
            {
              email: user.email || "",
              trial_days: TRIAL_DAYS_NEW,
              trial_end: expectedEnd,
              updatedAt: Date.now()
            },
            { merge: true }
          );
        } else {
          trialEndTimestamp = currentStoredEnd;
        }
      } catch (_) {}
    }

    isTrialExpired = Date.now() > trialEndTimestamp;
    localStorage.setItem("gd_trial_end", String(trialEndTimestamp));

    if (isTrialExpired) {
      setTimeout(showExpiredModal, 1200);
    }
  }

  function init() {
    injectStyles();
    updateTrialTextsInUI();
    enforceAuthVisibilityForTools();
    attachProtectionInterceptor();

    // مراقبة مستمرة لمنع ظهور الأدوات في شاشة التسجيل ولتحديث نص الـ 3 أيام
    const guardInterval = setInterval(() => {
      updateTrialTextsInUI();
      enforceAuthVisibilityForTools();
    }, 350);
    setTimeout(() => clearInterval(guardInterval), 15000);

    const checkAuth = () => {
      if (window.firebase && firebase.apps && firebase.apps.length) {
        firebase.auth().onAuthStateChanged(user => {
          currentUser = user || null;
          enforceAuthVisibilityForTools();
          if (currentUser) {
            syncUserTrialInFirestore(currentUser);
          }
        });
        return true;
      }
      return false;
    };

    if (!checkAuth()) {
      const iv = setInterval(() => {
        if (checkAuth()) clearInterval(iv);
      }, 400);
      setTimeout(() => clearInterval(iv), 12000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
