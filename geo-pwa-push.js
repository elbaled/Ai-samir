/* ============================================================================
   GeoDev PWA App, Authenticated Worker-OneSignal Push & Background AI Alert v5.1
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOPWAPushV5) return;
  window.GEOPWAPushV5 = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

  const isMedianApp = () => {
    const ua = (navigator.userAgent || "").toLowerCase();
    return ua.includes("median") || ua.includes("gonative") || typeof window.median !== "undefined" || typeof window.gonative !== "undefined";
  };

  const getMedianBridge = () => window.median || window.gonative || null;
  let deferredInstallPrompt = null;
  let swRegistration = null;

  async function getAuthHeaders() {
    const headers = { "Content-Type": "application/json" };
    if (window.firebase && firebase.apps.length && firebase.auth().currentUser) {
      const token = await firebase.auth().currentUser.getIdToken();
      if (token) headers["Authorization"] = "Bearer " + token;
    }
    return headers;
  }

  /* 1. تسجيل PWA و Service Worker */
  function registerPWA() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").then(reg => { swRegistration = reg; }).catch(() => {});
    }
    window.addEventListener("beforeinstallprompt", e => {
      e.preventDefault();
      deferredInstallPrompt = e;
      const btn = $("gdInstallAppBtn");
      if (btn && !isMedianApp()) btn.style.display = "flex";
    });
  }

  /* 2. مزامنة معرّف OneSignal مع Firestore */
  async function syncOneSignalPlayerId() {
    if (!isMedianApp()) return;
    try {
      const bridge = getMedianBridge();
      if (!bridge || !bridge.onesignal || !bridge.onesignal.info) return;
      const info = await bridge.onesignal.info();
      const playerId = info?.oneSignalId || info?.oneSignalUserId;
      if (playerId) {
        localStorage.setItem("geodev_onesignal_id", playerId);
        if (window.firebase && firebase.apps.length && firebase.auth().currentUser) {
          const uid = firebase.auth().currentUser.uid;
          await firebase.firestore().collection("users").doc(uid).set({
            oneSignalPlayerId: playerId,
            platform: "median_app",
            notificationsUpdatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }
    } catch (_) {}
  }

  /* 3. طلب إذن الإشعارات */
  window.GEORequestNotifPermission = async function () {
    if (isMedianApp()) {
      try {
        const bridge = getMedianBridge();
        if (bridge && bridge.onesignal && typeof bridge.onesignal.register === "function") {
          bridge.onesignal.register();
          window.toast && window.toast("تم تفعيل إشعارات التطبيق بنجاح!", "success");
          setTimeout(syncOneSignalPlayerId, 2500);
        }
      } catch (_) {}
      return;
    }
    if (!("Notification" in window)) {
      return window.toast && window.toast("متصفحك لا يدعم الإشعارات", "warn");
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      window.toast && window.toast("تم تفعيل إشعارات المتصفح بنجاح!", "success");
    }
  };

  window.GEOInstallApp = async function () {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt = null;
    } else {
      window.toast && window.toast("من قائمة المتصفح اختر: الإضافة إلى الشاشة الرئيسية", "info");
    }
  };

  /* 4. إرسال إشعار فوري للهاتف (عبر Median + Cloudflare Worker) */
  async function sendSystemNotification(title, body) {
    if (isMedianApp()) {
      try {
        const bridge = getMedianBridge();
        if (bridge && bridge.localNotifications && typeof bridge.localNotifications.create === "function") {
          bridge.localNotifications.create({ title, message: body, text: body, id: Math.floor(Math.random() * 100000) });
        }
      } catch (_) {}

      const myPlayerId = localStorage.getItem("geodev_onesignal_id");
      const workerBase = (window.GEO_API || "").replace(/\/$/, "");
      if (myPlayerId && workerBase) {
        try {
          const headers = await getAuthHeaders();
          fetch(workerBase + "/push/self", {
            method: "POST",
            headers,
            body: JSON.stringify({ playerId: myPlayerId, title, body })
          }).catch(() => {});
        } catch (_) {}
      }
      return;
    }

    if ("Notification" in window && Notification.permission === "granted") {
      if (swRegistration && swRegistration.active) {
        swRegistration.active.postMessage({ type: "SHOW_NOTIFICATION", title, body });
      } else {
        try { new Notification(title, { body, icon: "icon.svg" }); } catch (_) {}
      }
    }
  }

  /* 5. مراقبة اكتمال إجابات الذكاء الاصطناعي في الخلفية */
  function setupAIReplyWatcher() {
    let wasGenerating = false;
    let lastQuestion = "";

    document.addEventListener("click", e => {
      if (e.target.closest("button")?.textContent?.includes("نفّذ") || e.target.closest("button")?.textContent?.includes("إرسال")) {
        const q = $("ui")?.value.trim() || $("gisInput")?.value.trim();
        if (q) lastQuestion = q.slice(0, 60);
      }
    }, true);

    $("ui")?.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        const q = $("ui").value.trim();
        if (q) lastQuestion = q.slice(0, 60);
      }
    });

    setInterval(() => {
      const stText = ($("st")?.textContent || "").trim();
      const isGenerating = stText === "..." || stText.includes("يكتب") || stText.includes("استكمال") || document.querySelector(".gd-cw.gd-live") !== null;

      if (isGenerating) {
        wasGenerating = true;
      } else if (wasGenerating && !isGenerating) {
        wasGenerating = false;
        if (document.hidden || document.visibilityState === "hidden") {
          const msg = lastQuestion ? `اكتملت الإجابة على: "${lastQuestion}..."` : "إجابتك جاهزة الآن داخل GeoDev Studio Pro.";
          sendSystemNotification("GeoDev AI • إجابتك جاهزة", msg);
        }
      }
    }, 1000);
  }

  /* 6. إرسال إشعارات الإدارة (Firestore + Authenticated Cloudflare Worker) */
  window.GEOSendBroadcastNotif = async function () {
    const title = $("admNotifTitle")?.value.trim();
    const body = $("admNotifBody")?.value.trim();
    if (!title || !body) {
      return window.toast && window.toast("اكتب عنوان الإشعار وتفاصيل الإشعار أولاً", "warn");
    }

    try {
      if (window.firebase && firebase.apps.length) {
        await firebase.firestore().collection("geodev_notifications").add({
          title,
          body,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      const workerBase = (window.GEO_API || "").replace(/\/$/, "");
      if (!workerBase) throw new Error("رابط الخادم GEO_API غير معرف");

      const headers = await getAuthHeaders();
      const res = await fetch(workerBase + "/admin/push", {
        method: "POST",
        headers,
        body: JSON.stringify({ title, body })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "فشل الإرسال عبر الخادم");
      }

      $("admNotifTitle").value = "";
      $("admNotifBody").value = "";
      window.toast && window.toast("تم إرسال الإشعار لجميع هواتف المستخدمين بنجاح!", "success");
    } catch (e) {
      window.toast && window.toast("تعذر الإرسال: " + e.message, "error");
    }
  };

  /* 7. الاستماع لإشعارات Firestore وعرض السجل في الإدارة */
  function listenForNotifications() {
    if (!window.firebase || !firebase.apps.length) return;
    const db = firebase.firestore();
    const seenKey = "gd_last_notif_id";

    db.collection("geodev_notifications")
      .orderBy("createdAt", "desc")
      .limit(10)
      .onSnapshot(snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderNotifHistoryInAdmin(docs);

        if (!docs.length) return;
        const latest = docs[0];
        const lastSeen = localStorage.getItem(seenKey);

        if (!lastSeen) {
          localStorage.setItem(seenKey, latest.id);
          return;
        }

        if (latest.id !== lastSeen) {
          localStorage.setItem(seenKey, latest.id);
          if (typeof window.toast === "function") {
            window.toast(`${latest.title}: ${latest.body}`, "info");
          }
          if (document.hidden || document.visibilityState === "hidden") {
            sendSystemNotification(latest.title, latest.body);
          }
        }
      }, () => {});
  }

  function injectDrawerAppControls() {
    const dm = document.querySelector("#drw .dm");
    if (!dm || $("gdEnableNotifBtn")) return;
    const installBtnHtml = isMedianApp() ? "" : `<button id="gdInstallAppBtn" onclick="toggleDrawer();window.GEOInstallApp()">تثبيت التطبيق على الهاتف</button>`;
    dm.insertAdjacentHTML("afterbegin", `${installBtnHtml}<button id="gdEnableNotifBtn" onclick="toggleDrawer();window.GEORequestNotifPermission()">تفعيل إشعارات التطبيق</button>`);
  }

  function renderNotifHistoryInAdmin(list) {
    const box = $("gdAdminNotifHistory");
    if (!box) return;
    if (!list.length) {
      box.innerHTML = `<div class="mt">لم يتم إرسال إشعارات للمستخدمين بعد.</div>`;
      return;
    }
    box.innerHTML = `<b style="display:block;font-size:12px;color:var(--mt);margin:10px 0 6px">آخر الإشعارات المرسلة:</b>` +
      list.slice(0, 5).map(n => `
        <div style="background:var(--bg);border:1px solid var(--ln);border-radius:10px;padding:8px 10px;margin-bottom:6px">
          <b style="color:var(--am);font-size:13px;display:block">${esc(n.title)}</b>
          <span class="mt" style="font-size:12px;line-height:1.6;display:block;margin-top:2px">${esc(n.body)}</span>
        </div>
      `).join("");
  }

  function injectAdminNotifCard() {
    const adminPanel = $("adminPanel");
    if (!adminPanel || $("gdAdminNotifCard")) return;
    adminPanel.insertAdjacentHTML("afterbegin", `
      <div class="card" id="gdAdminNotifCard" style="border-color:var(--am)">
        <h3><i data-lucide="bell-ring"></i> إرسال إشعار للمستخدمين</h3>
        <p class="mt" style="line-height:1.7">أرسل إشعاراً فورياً يظهر على هواتف وواجهات جميع مستخدمي المنصة.</p>
        <label style="display:block;font-size:12.5px;font-weight:800;margin:8px 0 4px;color:var(--tx)">عنوان الإشعار</label>
        <input id="admNotifTitle" placeholder="اكتب عنوان الإشعار هنا">
        <label style="display:block;font-size:12.5px;font-weight:800;margin:8px 0 4px;color:var(--tx)">التفاصيل</label>
        <textarea id="admNotifBody" rows="3" placeholder="اكتب تفاصيل الإشعار..."></textarea>
        <button type="button" class="a" style="width:100%;margin-top:6px" onclick="window.GEOSendBroadcastNotif()">إرسال الإشعار لجميع المستخدمين</button>
        <div id="gdAdminNotifHistory"></div>
      </div>
    `);
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons({ root: $("gdAdminNotifCard"), attrs: { "stroke-width": 1.85 } });
    }
  }

  function initPWA() {
    registerPWA();
    injectDrawerAppControls();
    injectAdminNotifCard();
    setupAIReplyWatcher();

    if (isMedianApp()) {
      setTimeout(() => {
        const bridge = getMedianBridge();
        if (bridge && bridge.onesignal && typeof bridge.onesignal.register === "function") bridge.onesignal.register();
        syncOneSignalPlayerId();
      }, 2500);
    }

    if (window.firebase && firebase.apps.length) {
      firebase.auth().onAuthStateChanged(u => {
        if (u) {
          injectDrawerAppControls();
          injectAdminNotifCard();
          listenForNotifications();
          if (isMedianApp()) setTimeout(syncOneSignalPlayerId, 2000);
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPWA);
  } else {
    initPWA();
  }
})();
/* ============================================================================
   بانر تحميل تطبيق Android APK + نافذة تعليمات التثبيت المرقّمة
   ============================================================================ */
(function () {
  "use strict";
  if (window.GEODownloadBannerInit) return;
  window.GEODownloadBannerInit = true;

  const APK_DOWNLOAD_URL = "https://www.mediafire.com/file/3tljcf6jlglju06/GEO_DEV_AI_.apk/file";

  // عدم إظهار البانر إذا كان المستخدم يفتح المنصة من داخل تطبيق الأندرويد نفسه
  const isInsideAndroidApp = () => {
    const ua = (navigator.userAgent || "").toLowerCase();
    return ua.includes("median") || ua.includes("gonative") || typeof window.median !== "undefined" || typeof window.gonative !== "undefined";
  };

  function injectApkBannerAndGuide() {
    if (isInsideAndroidApp()) return;
    if (sessionStorage.getItem("gd_apk_banner_closed") === "1") return;
    if (document.getElementById("gdApkFloatingBanner")) return;

    const style = document.createElement("style");
    style.textContent = `
      #gdApkFloatingBanner {
        position: fixed;
        bottom: 68px;
        left: 12px;
        right: 12px;
        max-width: 520px;
        margin: 0 auto;
        background: #171c26;
        border: 1.5px solid #e09f24;
        border-radius: 16px;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        z-index: 9990;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55);
        direction: rtl;
        font-family: inherit;
      }
      .gd-apk-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: #e09f24;
        color: #11151c;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 22px;
        font-weight: 900;
      }
      .gd-apk-text {
        flex: 1;
        min-width: 0;
      }
      .gd-apk-text h4 {
        margin: 0 0 3px;
        color: #ffffff;
        font-size: 13.5px;
        font-weight: 800;
        line-height: 1.3;
      }
      .gd-apk-text p {
        margin: 0;
        color: #b8c2d1;
        font-size: 11.5px;
        line-height: 1.45;
      }
      .gd-apk-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .gd-apk-btn-install {
        background: #e09f24;
        color: #11151c;
        border: none;
        border-radius: 10px;
        padding: 8px 13px;
        font-size: 12px;
        font-weight: 900;
        cursor: pointer;
        line-height: 1.25;
        text-align: center;
      }
      .gd-apk-btn-close {
        background: transparent;
        border: none;
        color: #9aa5b4;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        padding: 4px 6px;
      }
      /* نافذة تعليمات التثبيت */
      #gdApkGuideModal {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.78);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 10000;
        direction: rtl;
      }
      .gd-guide-box {
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
      .gd-guide-step {
        background: #10141c;
        border: 1px solid #2a3242;
        border-radius: 12px;
        padding: 10px 12px;
        margin-bottom: 10px;
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }
      .gd-step-num {
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

    const html = `
      <div id="gdApkFloatingBanner">
        <div class="gd-apk-icon">⬇</div>
        <div class="gd-apk-text">
          <h4>تثبيت تطبيق GeoDev Studio</h4>
          <p>حمّل تطبيق الأندرويد الرسمي الجديد على هاتفك بضغطة واحدة</p>
        </div>
        <div class="gd-apk-actions">
          <button type="button" class="gd-apk-btn-install" id="gdOpenApkGuideBtn">تثبيت<br>الآن</button>
          <button type="button" class="gd-apk-btn-close" id="gdCloseApkBannerBtn">إغلاق</button>
        </div>
      </div>

      <div id="gdApkGuideModal">
        <div class="gd-guide-box">
          <h3 style="margin:0 0 6px;color:#e09f24;font-size:16px">خطوات تحميل وتثبيت تطبيق GeoDev Studio</h3>
          <p style="margin:0 0 14px;color:#b8c2d1;font-size:12.5px;line-height:1.6">
            اتبع الخطوات الأربع التالية لتثبيت التطبيق بنجاح على هاتفك الأندرويد:
          </p>

          <div class="gd-guide-step">
            <div class="gd-step-num">1</div>
            <div style="font-size:12.5px;line-height:1.6">
              <strong style="color:#fff">تنزيل وفتح الملف:</strong><br>
              بعد انتهاء التحميل من MediaFire، افتح قائمة التنزيلات في هاتفك واضغط على ملف <code style="color:#e09f24">app-release (1).apk</code>.
            </div>
          </div>

          <div class="gd-guide-step">
            <div class="gd-step-num">2</div>
            <div style="font-size:12.5px;line-height:1.6">
              <strong style="color:#fff">اختيار أداة التثبيت:</strong><br>
              في نافذة "فتح باستخدام"، اختر <strong style="color:#e09f24">أداة تثبيت الحزم (Package Installer)</strong> واضغط "مرة واحدة فقط".
            </div>
          </div>

          <div class="gd-guide-step">
            <div class="gd-step-num">3</div>
            <div style="font-size:12.5px;line-height:1.6">
              <strong style="color:#fff">تأكيد التثبيت:</strong><br>
              ستظهر رسالة "هل المطلوب تثبيت هذا التطبيق؟ GeoDev Studio"، اضغط على <strong style="color:#e09f24">تثبيت</strong>.
            </div>
          </div>

          <div class="gd-guide-step">
            <div class="gd-step-num">4</div>
            <div style="font-size:12.5px;line-height:1.6">
              <strong style="color:#fff">تخطي رسالة Google Play للحماية:</strong><br>
              إذا ظهرت رسالة "تم حظر التطبيق لحماية جهازك"، اضغط على <strong style="color:#e09f24">التثبيت على أي حال</strong> (Install anyway) لإتمام التثبيت.
            </div>
          </div>

          <div style="display:flex;gap:8px;margin-top:14px">
            <a href="${APK_DOWNLOAD_URL}" target="_blank" rel="noopener"
               style="flex:1;background:#e09f24;color:#11151c;text-decoration:none;text-align:center;padding:11px;border-radius:11px;font-weight:900;font-size:13.5px">
              بدء تحميل التطبيق الآن
            </a>
            <button type="button" id="gdCloseGuideModalBtn"
               style="background:#262e3d;color:#fff;border:none;padding:11px 14px;border-radius:11px;font-weight:700;font-size:12.5px;cursor:pointer">
              إغلاق
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);

    document.getElementById("gdCloseApkBannerBtn").onclick = () => {
      sessionStorage.setItem("gd_apk_banner_closed", "1");
      document.getElementById("gdApkFloatingBanner").remove();
    };

    document.getElementById("gdOpenApkGuideBtn").onclick = () => {
      document.getElementById("gdApkGuideModal").style.display = "flex";
    };

    document.getElementById("gdCloseGuideModalBtn").onclick = () => {
      document.getElementById("gdApkGuideModal").style.display = "none";
    };
  }

  // إظهار البانر لجميع الحسابات المسجلة (تجريبي / مجاني / PRO / أدمن)
  function initForAllLoggedUsers() {
    if (window.firebase && firebase.apps.length) {
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          injectApkBannerAndGuide();
        }
      });
    } else {
      injectApkBannerAndGuide();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initForAllLoggedUsers);
  } else {
    initForAllLoggedUsers();
  }
})();



/* ============================================================================
   بانر التواصل عبر واتساب للحصول على عرض اشتراك PRO
   ============================================================================ */
(function () {
  "use strict";
  if (window.GEOGiveawayBannerInit) return;
  window.GEOGiveawayBannerInit = true;

  const WHATSAPP_PRO_URL = "https://wa.me/201015912371";

  function injectGiveawayBanner() {
    if (sessionStorage.getItem("gd_pro_offer_closed") === "1") return;
    if (document.getElementById("gdGiveawayFloatingCard")) return;

    const style = document.createElement("style");
    style.textContent = `
      #gdGiveawayFloatingCard {
        position: fixed;
        top: 66px;
        left: 12px;
        right: 12px;
        max-width: 520px;
        margin: 0 auto;
        background: linear-gradient(135deg, #1b2230 0%, #131822 100%);
        border: 1.5px solid #e09f24;
        border-radius: 14px;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        z-index: 9995;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55);
        direction: rtl;
        font-family: inherit;
        animation: gdSlideDown 0.35s ease;
      }
      @keyframes gdSlideDown {
        from { opacity: 0; transform: translateY(-12px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .gd-gw-badge {
        background: #25D366;
        color: #ffffff;
        font-size: 18px;
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-weight: 900;
      }
      .gd-gw-info {
        flex: 1;
        min-width: 0;
      }
      .gd-gw-info h4 {
        margin: 0 0 2px;
        color: #fff;
        font-size: 13px;
        font-weight: 800;
      }
      .gd-gw-info p {
        margin: 0;
        color: #cbd5e1;
        font-size: 11.5px;
        line-height: 1.4;
      }
      .gd-gw-btn {
        background: #25D366;
        color: #11151c;
        text-decoration: none;
        padding: 7px 12px;
        border-radius: 9px;
        font-size: 12px;
        font-weight: 900;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .gd-gw-close {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 16px;
        cursor: pointer;
        padding: 2px 6px;
        line-height: 1;
      }
    `;
    document.head.appendChild(style);

    const html = `
      <div id="gdGiveawayFloatingCard">
        <div class="gd-gw-badge">💬</div>
        <div class="gd-gw-info">
          <h4>عرض خاص على باقة PRO!</h4>
          <p>تواصل معنا الآن عبر واتساب للاستفادة من عرض اشتراك البرو وليك ضعفين  المدة .</p>
        </div>
        <a href="${WHATSAPP_PRO_URL}" target="_blank" rel="noopener" class="gd-gw-btn">تواصل معنا</a>
        <button type="button" class="gd-gw-close" id="gdCloseGiveawayBtn" title="إغلاق">×</button>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);

    document.getElementById("gdCloseGiveawayBtn").onclick = () => {
      sessionStorage.setItem("gd_pro_offer_closed", "1");
      document.getElementById("gdGiveawayFloatingCard").remove();
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectGiveawayBanner);
  } else {
    injectGiveawayBanner();
  }
})();
/* ============================================================================
   تنسيق صناديق الأكواد في المختبر (خلفية سوداء + اتجاه LTR + زر نسخ علوي)
   ============================================================================ */
(function () {
  "use strict";
  if (window.GEOLabCodeFormatterInit) return;
  window.GEOLabCodeFormatterInit = true;

  function injectLabCodeStyles() {
    if (document.getElementById("gdLabCodeStyles")) return;
    const style = document.createElement("style");
    style.id = "gdLabCodeStyles";
    style.textContent = `
      /* ضبط تنسيق النصوص العامة داخل صناديق الإجابات */
      #labOut, .gd-cw, [id*="Out"], [id*="Result"] {
        line-height: 1.75 !important;
        word-wrap: break-word !important;
      }

      /* حاوية الكود المستقلة داخل مربع الإجابة */
      .gd-code-box {
        background: #090c10 !important;
        border: 1.5px solid #2a3342 !important;
        border-radius: 12px !important;
        margin: 14px 0 !important;
        overflow: hidden !important;
        direction: ltr !important;
        text-align: left !important;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45) !important;
      }

      /* الشريط العلوي للكود (اسم اللغة + زر النسخ) */
      .gd-code-header {
        background: #141923 !important;
        border-bottom: 1px solid #252e3d !important;
        padding: 7px 12px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        direction: ltr !important;
      }

      .gd-code-lang {
        color: #e09f24 !important;
        font-size: 11.5px !important;
        font-weight: 800 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        font-family: monospace !important;
      }

      .gd-code-copy-btn {
        background: #232b3a !important;
        color: #f3f6fa !important;
        border: 1px solid #384459 !important;
        border-radius: 7px !important;
        padding: 4px 11px !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        cursor: pointer !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 5px !important;
        transition: all 0.2s ease !important;
        font-family: inherit !important;
      }

      .gd-code-copy-btn:hover {
        background: #e09f24 !important;
        color: #11151c !important;
        border-color: #e09f24 !important;
      }

      .gd-code-copy-btn.copied {
        background: #16a34a !important;
        color: #ffffff !important;
        border-color: #16a34a !important;
      }

      /* جسم الكود نفسه */
      .gd-code-box pre {
        margin: 0 !important;
        padding: 14px !important;
        background: #090c10 !important;
        color: #e6edf3 !important;
        font-family: "Fira Code", "Consolas", "Courier New", monospace !important;
        font-size: 12.5px !important;
        line-height: 1.6 !important;
        overflow-x: auto !important;
        white-space: pre !important;
        direction: ltr !important;
        text-align: left !important;
        border: none !important;
        border-radius: 0 !important;
      }

      .gd-code-box code {
        background: transparent !important;
        color: inherit !important;
        padding: 0 !important;
        font-family: inherit !important;
        direction: ltr !important;
        unicode-bidi: embed !important;
      }
    `;
    document.head.appendChild(style);
  }

  function enhanceCodeBlocks(root = document) {
    const pres = root.querySelectorAll("pre");
    pres.forEach(pre => {
      if (pre.closest(".gd-code-box")) return;

      const codeEl = pre.querySelector("code");
      const rawText = (codeEl ? codeEl.innerText : pre.innerText) || "";
      if (!rawText.trim()) return;

      // استخراج اسم اللغة البرمجية إن وُجد
      let lang = "CODE";
      if (codeEl && codeEl.className) {
        const match = codeEl.className.match(/language-([a-zA-Z0-9_+-]+)/);
        if (match) lang = match[1];
      } else if (rawText.includes("(defun ")) {
        lang = "AutoLISP";
      } else if (rawText.includes("import ") || rawText.includes("def ")) {
        lang = "Python";
      }

      // إنشاء الحاوية السوداء وزر النسخ
      const wrapper = document.createElement("div");
      wrapper.className = "gd-code-box";

      const header = document.createElement("div");
      header.className = "gd-code-header";

      const langBadge = document.createElement("span");
      langBadge.className = "gd-code-lang";
      langBadge.textContent = lang;

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "gd-code-copy-btn";
      copyBtn.innerHTML = `<span>📋</span><span>نسخ الكود</span>`;

      copyBtn.onclick = async () => {
        const textToCopy = (codeEl ? codeEl.innerText : pre.innerText) || "";
        try {
          await navigator.clipboard.writeText(textToCopy);
        } catch (_) {
          const ta = document.createElement("textarea");
          ta.value = textToCopy;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        copyBtn.classList.add("copied");
        copyBtn.innerHTML = `<span>✔</span><span>تم النسخ</span>`;
        if (typeof window.toast === "function") {
          window.toast("تم نسخ الكود بنجاح!", "success");
        }
        setTimeout(() => {
          copyBtn.classList.remove("copied");
          copyBtn.innerHTML = `<span>📋</span><span>نسخ الكود</span>`;
        }, 2000);
      };

      header.appendChild(langBadge);
      header.appendChild(copyBtn);

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);
    });
  }

  function initLabFormatter() {
    injectLabCodeStyles();
    enhanceCodeBlocks(document);

    // مراقبة أي إجابات جديدة تتولد في المختبر أو الشات وتنسيقها فوراً
    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length) {
          enhanceCodeBlocks(document);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLabFormatter);
  } else {
    initLabFormatter();
  }
})();
/* ============================================================================
   إضافة دليل البدء من المنصة (نسخ الكود -> حفظ الملف -> التشغيل) في المختبر
   ============================================================================ */
(function () {
  "use strict";
  if (window.GEOLabPrepGuideInit) return;
  window.GEOLabPrepGuideInit = true;

  function getPrepStepsByCode(codeText) {
    const t = (codeText || "").toLowerCase();

    if (t.includes("(defun ") || t.includes("autolisp") || t.includes("vl-load-com")) {
      return {
        title: "خطوات تجهيز وحفظ الكود من المنصة (AutoCAD / Civil 3D):",
        steps: [
          "اضغط على زر <b>«نسخ الكود»</b> الموجود في أعلى الصندوق الأسود أعلاه.",
          "افتح برنامج <b>المفكرة (Notepad)</b> على جهازك والصق الكود بداخله (<code>Ctrl + V</code>).",
          "من قائمة <b>File</b> اختر <b>Save As</b>، واكتب اسم الملف متبوعاً بامتداد الليسب مثل: <code>GeoDev_Tool.lsp</code>، وغير خيار Save as type إلى <b>All Files</b> ثم احفظه على سطح المكتب.",
          "انتقل الآن إلى برنامج <b>AutoCAD / Civil 3D</b> واتبع خطوات التحميل والتشغيل الموضحة في الجدول أدناه:"
        ]
      };
    }

    if (t.includes("arcpy") || t.includes("qgis") || t.includes("import ") || t.includes("def ")) {
      return {
        title: "خطوات تجهيز الكود من المنصة وتشغيله (Python / ArcGIS / QGIS):",
        steps: [
          "اضغط على زر <b>«نسخ الكود»</b> الموجود في أعلى الصندوق الأسود أعلاه.",
          "افتح نافذة <b>Python Window</b> داخل ArcGIS Pro / ArcMap (أو <b>Python Console</b> داخل QGIS).",
          "الصق الكود مباشرة في محرر السكريبت واضغط <b>Run</b> (أو احفظه في ملف بامتداد <code>.py</code> لتشغيله في أي وقت).",
          "تابع تفاصيل الضبط والتنفيذ الموضحة في الخطوات أدناه:"
        ]
      };
    }

    return {
      title: "خطوات تجهيز الكود من المنصة قبل التشغيل:",
      steps: [
        "اضغط على زر <b>«نسخ الكود»</b> في أعلى الصندوق الأسود أعلاه لنسخ الكود بالكامل.",
        "افتح محرر النصوص أو بيئة البرمجة الخاصة بالبرنامج المستهدف والصق الكود.",
        "احفظ الملف بالامتداد المناسب للغة البرمجة ثم اتبع خطوات التشغيل التالية:"
      ]
    };
  }

  function injectPrepGuides() {
    const codeBoxes = document.querySelectorAll(".gd-code-box");
    codeBoxes.forEach(box => {
      if (box.dataset.hasPrepGuide === "1") return;
      box.dataset.hasPrepGuide = "1";

      const codeText = box.querySelector("pre")?.innerText || "";
      const info = getPrepStepsByCode(codeText);

      const guideCard = document.createElement("div");
      guideCard.style.cssText = `
        background: rgba(224, 159, 36, 0.08);
        border: 1px solid rgba(224, 159, 36, 0.45);
        border-right: 4px solid #e09f24;
        border-radius: 12px;
        padding: 12px 14px;
        margin: 14px 0;
        direction: rtl;
        text-align: right;
        font-size: 13px;
        line-height: 1.75;
        color: #f3f6fa;
      `;

      const listHtml = info.steps.map((s, idx) => `
        <div style="display:flex;align-items:flex-start;gap:8px;margin-top:6px">
          <span style="background:#e09f24;color:#11151c;font-weight:900;font-size:11.5px;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:3px">${idx + 1}</span>
          <span>${s}</span>
        </div>
      `).join("");

      guideCard.innerHTML = `
        <div style="color:#e09f24;font-weight:800;font-size:13.5px;margin-bottom:4px">
          📌 ${info.title}
        </div>
        ${listHtml}
      `;

      box.insertAdjacentElement("afterend", guideCard);
    });
  }

  function initPrepGuideObserver() {
    injectPrepGuides();
    const observer = new MutationObserver(() => injectPrepGuides());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPrepGuideObserver);
  } else {
    initPrepGuideObserver();
  }
})();
