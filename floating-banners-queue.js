/* ============================================================================
   نظام الطابور الذكي للرسائل العائمة (ظهور متتابع واحدة تلو الأخرى + إعلان AI)
   ============================================================================ */
(function () {
  "use strict";
  if (window.GEOSmartBannerQueueInit) return;
  window.GEOSmartBannerQueueInit = true;

  const WHATSAPP_PRO_URL = "https://wa.me/201015912371";
  const APK_DOWNLOAD_URL = "https://www.mediafire.com/file/3tljcf6jlglju06/GEO_DEV_AI_.apk/file";

  // إيقاف البانرات العشوائية القديمة لمنع التراكب فوق بعضها
  window.GEOGiveawayBannerInit = true;
  window.GEODownloadBannerInit = true;

  function removeLegacyBanners() {
    const old1 = document.getElementById("gdGiveawayFloatingCard");
    const old2 = document.getElementById("gdApkFloatingBanner");
    if (old1) old1.remove();
    if (old2) old2.remove();
  }

  const isInsideAndroidApp = () => {
    const ua = (navigator.userAgent || "").toLowerCase();
    return (
      ua.includes("median") ||
      ua.includes("gonative") ||
      typeof window.median !== "undefined" ||
      typeof window.gonative !== "undefined"
    );
  };

  function injectQueueStyles() {
    if (document.getElementById("gdSmartQueueStyles")) return;
    const style = document.createElement("style");
    style.id = "gdSmartQueueStyles";
    style.textContent = `
      @keyframes gdBannerPopIn {
        from { opacity: 0; transform: translateY(-16px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      #gdQueueFloatingBanner {
        position: fixed;
        top: 66px;
        left: 12px;
        right: 12px;
        max-width: 520px;
        margin: 0 auto;
        background: #ffffff;
        border: 1.5px solid #e09f24;
        border-right: 5px solid #e09f24;
        border-radius: 16px;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 11px;
        z-index: 9996;
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
        direction: rtl;
        font-family: inherit;
        animation: gdBannerPopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      }

      /* التوافق التلقائي مع الوضع الداكن إن اختاره المستخدم */
      body.dark-mode #gdQueueFloatingBanner,
      body.dark #gdQueueFloatingBanner,
      [data-theme="dark"] #gdQueueFloatingBanner {
        background: linear-gradient(135deg, #1b2230 0%, #131822 100%);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
      }

      .gd-qb-badge {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        flex-shrink: 0;
        font-weight: 900;
      }

      .gd-qb-badge.ai-style {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(217, 119, 6, 0.35);
      }

      .gd-qb-badge.wa-style {
        background: #25D366;
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(37, 211, 102, 0.35);
      }

      .gd-qb-badge.apk-style {
        background: #0f172a;
        color: #e09f24;
        border: 1px solid #e09f24;
      }

      .gd-qb-content {
        flex: 1;
        min-width: 0;
      }

      .gd-qb-tag {
        display: inline-block;
        font-size: 10px;
        font-weight: 800;
        padding: 1px 7px;
        border-radius: 99px;
        background: rgba(224, 159, 36, 0.16);
        color: #b45309;
        margin-bottom: 3px;
      }

      body.dark-mode .gd-qb-tag,
      body.dark .gd-qb-tag,
      [data-theme="dark"] .gd-qb-tag {
        color: #fbbf24;
      }

      .gd-qb-content h4 {
        margin: 0 0 2px;
        color: #0f172a;
        font-size: 13.5px;
        font-weight: 900;
        line-height: 1.35;
      }

      body.dark-mode .gd-qb-content h4,
      body.dark .gd-qb-content h4,
      [data-theme="dark"] .gd-qb-content h4 {
        color: #ffffff;
      }

      .gd-qb-content p {
        margin: 0;
        color: #475569;
        font-size: 12px;
        line-height: 1.45;
      }

      body.dark-mode .gd-qb-content p,
      body.dark .gd-qb-content p,
      [data-theme="dark"] .gd-qb-content p {
        color: #cbd5e1;
      }

      .gd-qb-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }

      .gd-qb-action-btn {
        border: none;
        border-radius: 10px;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 900;
        cursor: pointer;
        text-decoration: none;
        white-space: nowrap;
        font-family: inherit;
        transition: transform 0.15s ease;
      }

      .gd-qb-action-btn:active {
        transform: scale(0.96);
      }

      .gd-qb-action-btn.ai-btn {
        background: #d97706;
        color: #ffffff;
      }

      .gd-qb-action-btn.wa-btn {
        background: #25D366;
        color: #0f172a;
      }

      .gd-qb-action-btn.apk-btn {
        background: #e09f24;
        color: #0f172a;
      }

      .gd-qb-close-btn {
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        color: #475569;
        border-radius: 9px;
        padding: 6px 9px;
        font-size: 11.5px;
        font-weight: 800;
        cursor: pointer;
        font-family: inherit;
      }

      body.dark-mode .gd-qb-close-btn,
      body.dark .gd-qb-close-btn,
      [data-theme="dark"] .gd-qb-close-btn {
        background: #262e3d;
        border-color: #384459;
        color: #cbd5e1;
      }

      /* نافذة تعليمات تثبيت APK */
      #gdQueueApkModal {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.78);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 10005;
        direction: rtl;
      }
      .gd-qmodal-box {
        background: #171c26;
        border: 1.5px solid #e09f24;
        border-radius: 18px;
        width: 100%;
        max-width: 440px;
        max-height: 88vh;
        overflow-y: auto;
        padding: 18px;
        color: #f3f6fa;
      }
      .gd-qmodal-step {
        background: #10141c;
        border: 1px solid #2a3242;
        border-radius: 12px;
        padding: 10px 12px;
        margin-bottom: 10px;
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }
      .gd-qmodal-num {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background: #e0531f;
        color: #fff;
        font-weight: 900;
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-top: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  function injectApkModal() {
    if (document.getElementById("gdQueueApkModal")) return;
    const modalHtml = `
      <div id="gdQueueApkModal">
        <div class="gd-qmodal-box">
          <h3 style="margin:0 0 6px;color:#e09f24;font-size:16px">خطوات تحميل وتثبيت تطبيق GeoDev Studio</h3>
          <p style="margin:0 0 14px;color:#b8c2d1;font-size:12.5px;line-height:1.6">
            اتبع الخطوات الأربع التالية لتثبيت التطبيق بنجاح على هاتفك الأندرويد:
          </p>
          <div class="gd-qmodal-step">
            <div class="gd-qmodal-num">1</div>
            <div style="font-size:12.5px;line-height:1.6">
              <strong style="color:#fff">تنزيل وفتح الملف:</strong><br>
              بعد انتهاء التحميل من MediaFire، افتح قائمة التنزيلات في هاتفك واضغط على ملف <code style="color:#e09f24">GEO_DEV_AI_.apk</code>.
            </div>
          </div>
          <div class="gd-qmodal-step">
            <div class="gd-qmodal-num">2</div>
            <div style="font-size:12.5px;line-height:1.6">
              <strong style="color:#fff">اختيار أداة التثبيت:</strong><br>
              في نافذة "فتح باستخدام"، اختر <strong style="color:#e09f24">أداة تثبيت الحزم (Package Installer)</strong> واضغط "مرة واحدة فقط".
            </div>
          </div>
          <div class="gd-qmodal-step">
            <div class="gd-qmodal-num">3</div>
            <div style="font-size:12.5px;line-height:1.6">
              <strong style="color:#fff">تأكيد التثبيت:</strong><br>
              ستظهر رسالة "هل المطلوب تثبيت هذا التطبيق؟ GeoDev Studio"، اضغط على <strong style="color:#e09f24">تثبيت</strong>.
            </div>
          </div>
          <div class="gd-qmodal-step">
            <div class="gd-qmodal-num">4</div>
            <div style="font-size:12.5px;line-height:1.6">
              <strong style="color:#fff">تخطي رسالة Google Play للحماية:</strong><br>
              إذا ظهرت رسالة "تم حظر التطبيق لحماية جهازك"، اضغط على <strong style="color:#e09f24">التثبيت على أي حال</strong> لإتمام التثبيت.
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:14px">
            <a href="${APK_DOWNLOAD_URL}" target="_blank" rel="noopener"
               style="flex:1;background:#e09f24;color:#11151c;text-decoration:none;text-align:center;padding:11px;border-radius:11px;font-weight:900;font-size:13.5px">
              بدء تحميل التطبيق الآن
            </a>
            <button type="button" id="gdCloseQueueApkModal"
               style="background:#262e3d;color:#fff;border:none;padding:11px 14px;border-radius:11px;font-weight:700;font-size:12.5px;cursor:pointer">
              إغلاق
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);
    document.getElementById("gdCloseQueueApkModal").onclick = () => {
      document.getElementById("gdQueueApkModal").style.display = "none";
    };
  }

  // بناء قائمة الرسائل بالتتابع (تظهر واحدة تلو الأخرى عند إغلاق السابقة)
  function buildBannerQueue() {
    const queue = [
      {
        id: "ai_courses_announcement",
        badgeIcon: "🤖",
        badgeClass: "ai-style",
        tag: "إعلان هام • 1 من " + (isInsideAndroidApp() ? "2" : "3"),
        title: "قريباً في GeoDev Studio Pro 🚀",
        text: "قريباً سيتم توفير كورسات ودورات احترافية في ربط البرامج الهندسية والمساحية بالـ AI.",
        actionLabel: "حسناً",
        actionClass: "ai-btn",
        isCloseOnly: true
      },
            {
        id: "whatsapp_pro_offer",
        badgeIcon: "💬",
        badgeClass: "wa-style",
        tag: "عرض الاشتراك • 2 من " + (isInsideAndroidApp() ? "2" : "3"),
        title: "عرض PRO بـ 50 ج لأول شهر + باقة PRO Plus!",
        text: "اشترك الآن في باقة PRO (أول شهر 50 ج بدل 70 ج) أو باقة PRO Plus وتواصل معنا عبر واتساب للتفعيل الفوري.",
        actionLabel: "تواصل واتساب",
        actionClass: "wa-btn",
        href: WHATSAPP_PRO_URL + "?text=" + encodeURIComponent("مرحبا استفسر عن عرض الاشتراك في البرو وعرض اشتراك البرو بلس")
      }

   

      
    ];

    if (!isInsideAndroidApp()) {
      queue.push({
        id: "android_apk_install",
        badgeIcon: "⬇",
        badgeClass: "apk-style",
        tag: "تطبيق الهاتف • 3 من 3",
        title: "تثبيت تطبيق GeoDev Studio",
        text: "حمّل تطبيق الأندرويد الرسمي على هاتفك واستمتع بتجربة أسرع بضغطة واحدة.",
        actionLabel: "تثبيت الآن",
        actionClass: "apk-btn",
        onAction: () => {
          injectApkModal();
          document.getElementById("gdQueueApkModal").style.display = "flex";
        }
      });
    }

    return queue;
  }

  let currentQueue = [];
  let currentIndex = 0;

  // التحقق من عدم وجود نافذة ترحيبية مفتوحة تغطي الشاشة
  function isBlockingModalVisible() {
    const modals = document.querySelectorAll('[role="dialog"], .modal, [id*="Modal"], [id*="welcome"]');
    for (const m of modals) {
      if (m.id === "gdQueueApkModal") continue;
      const st = getComputedStyle(m);
      if (st.display !== "none" && st.visibility !== "hidden" && m.offsetHeight > 120) {
        return true;
      }
    }
    return false;
  }

  function showBannerAtIndex(index) {
    removeLegacyBanners();
    const existing = document.getElementById("gdQueueFloatingBanner");
    if (existing) existing.remove();

    if (index >= currentQueue.length) return; // انتهت جميع الرسائل في هذه الجلسة

    // الانتظار إذا كانت هناك نافذة ترحيبية للحساب الجديد مفتوحة حالياً
    if (isBlockingModalVisible()) {
      setTimeout(() => showBannerAtIndex(index), 900);
      return;
    }

    const item = currentQueue[index];
    const actionHtml = item.href
      ? `<a href="${item.href}" target="_blank" rel="noopener" class="gd-qb-action-btn ${item.actionClass}" id="gdQbActionBtn">${item.actionLabel}</a>`
      : `<button type="button" class="gd-qb-action-btn ${item.actionClass}" id="gdQbActionBtn">${item.actionLabel}</button>`;

    const bannerHtml = `
      <div id="gdQueueFloatingBanner">
        <div class="gd-qb-badge ${item.badgeClass}">${item.badgeIcon}</div>
        <div class="gd-qb-content">
          <span class="gd-qb-tag">${item.tag}</span>
          <h4>${item.title}</h4>
          <p>${item.text}</p>
        </div>
        <div class="gd-qb-actions">
          ${actionHtml}
          <button type="button" class="gd-qb-close-btn" id="gdQbCloseBtn" title="إغلاق وعرض التالي">إغلاق ✕</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", bannerHtml);

    const goNext = () => {
      const el = document.getElementById("gdQueueFloatingBanner");
      if (el) el.remove();
      currentIndex++;
      // إظهار الرسالة التالية في الطابور بعد 350 ملي ثانية بسلاسة
      setTimeout(() => showBannerAtIndex(currentIndex), 350);
    };

    document.getElementById("gdQbCloseBtn").onclick = goNext;

    const actionBtn = document.getElementById("gdQbActionBtn");
    if (item.isCloseOnly) {
      actionBtn.onclick = goNext;
    } else if (item.onAction) {
      actionBtn.onclick = () => {
        item.onAction();
        goNext();
      };
    }
  }

  function startBannerQueueForUser() {
    injectQueueStyles();
    removeLegacyBanners();
    currentQueue = buildBannerQueue();
    currentIndex = 0;
    // بدء عرض الرسالة الأولى بعد ثانيتين من فتح الحساب
    setTimeout(() => showBannerAtIndex(0), 2000);
  }

  function init() {
    injectQueueStyles();
    removeLegacyBanners();

    // مراقبة أي حساب مسجل (قديم أو جديد أو بمجرد تسجيل الدخول) وتشغيل الطابور في كل فتح
    const attachAuthListener = () => {
      if (window.firebase && firebase.apps && firebase.apps.length) {
        firebase.auth().onAuthStateChanged(user => {
          if (user) {
            startBannerQueueForUser();
          }
        });
        return true;
      }
      return false;
    };

    if (!attachAuthListener()) {
      const waitFb = setInterval(() => {
        if (attachAuthListener()) clearInterval(waitFb);
      }, 400);
      setTimeout(() => clearInterval(waitFb), 10000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
