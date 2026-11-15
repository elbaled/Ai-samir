/* ============================================================================
   GeoDev PWA App, OneSignal Push Broadcast & Background AI Reply Alert v4.1
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOPWAPushV4) return;
  window.GEOPWAPushV4 = true;

  const ONESIGNAL_APP_ID = "105d6a7a-9b6d-4033-ba38-f26abb556cc8";
  // ملاحظة: ضع مفتاح REST API Key الجديد هنا (بعد إلغاء القديم من OneSignal للأمان)
  const ONESIGNAL_REST_KEY = "os_v2_app_cbowu6u3nvadhory6jvlwvlmzazbt76te3cusf5qa3oboq6v5d5gabz3wl2gchnyyaxuqfskk4tt32yykl5racfwl35xt6faymfhyfi";

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

  const isMedianApp = () => {
    const ua = (navigator.userAgent || "").toLowerCase();
    return ua.includes("median") || ua.includes("gonative") || typeof window.median !== "undefined" || typeof window.gonative !== "undefined";
  };

  const getMedianBridge = () => window.median || window.gonative || null;
  let deferredInstallPrompt = null;
  let swRegistration = null;

  /* ==========================================================================
     1. تسجيل PWA و Service Worker
     ========================================================================== */
  function registerPWA() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").then(reg => {
        swRegistration = reg;
      }).catch(() => {});
    }

    window.addEventListener("beforeinstallprompt", e => {
      e.preventDefault();
      deferredInstallPrompt = e;
      const btn = $("gdInstallAppBtn");
      if (btn && !isMedianApp()) btn.style.display = "flex";
    });
  }

  /* ==========================================================================
     2. مزامنة معرّف OneSignal مع Firestore
     ========================================================================== */
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
    } catch (e) {
      console.warn("OneSignal Sync:", e);
    }
  }

  /* ==========================================================================
     3. تفعيل الإشعارات (Median OneSignal + Web Push)
     ========================================================================== */
  window.GEORequestNotifPermission = async function () {
    if (isMedianApp()) {
      try {
        const bridge = getMedianBridge();
        if (bridge && bridge.onesignal && typeof bridge.onesignal.register === "function") {
          bridge.onesignal.register();
          window.toast && window.toast("تم تفعيل إشعارات التطبيق بنجاح!", "success");
          setTimeout(syncOneSignalPlayerId, 2500);
        } else {
          window.toast && window.toast("تأكد من تفعيل إضافة OneSignal في Median", "warn");
        }
      } catch (e) {
        window.toast && window.toast("حدث خطأ أثناء تفعيل الإشعارات", "error");
      }
      return;
    }

    if (!("Notification" in window)) {
      return window.toast && window.toast("متصفحك لا يدعم الإشعارات", "warn");
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      window.toast && window.toast("تم تفعيل إشعارات المتصفح بنجاح!", "success");
      sendSystemNotification("GeoDev Studio Pro", "تم تفعيل الإشعارات الفورية بنجاح.");
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

  /* ==========================================================================
     4. إرسال إشعار فوري يظهر في شريط إشعارات الهاتف (حتى في الخلفية)
     ========================================================================== */
  function sendSystemNotification(title, body) {
    // 1. داخل تطبيق Median: استخدام الإشعارات المحلية الأصلية للأندرويد/iOS
    if (isMedianApp()) {
      try {
        const bridge = getMedianBridge();
        if (bridge && bridge.localNotifications && typeof bridge.localNotifications.create === "function") {
          bridge.localNotifications.create({
            title: title,
            message: body,
            text: body,
            id: Math.floor(Math.random() * 100000)
          });
        }
      } catch (e) {
        console.warn("Median LocalNotif Error:", e);
      }

      // 2. إرسال إشعار Push عبر رابط OneSignal API المحدث (v2)
      const myPlayerId = localStorage.getItem("geodev_onesignal_id");
      if (myPlayerId && ONESIGNAL_REST_KEY && !ONESIGNAL_REST_KEY.includes("ضع_هنا")) {
        fetch("https://api.onesignal.com/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": "Key " + ONESIGNAL_REST_KEY
          },
          body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,
            include_subscription_ids: [myPlayerId],
            headings: { en: title, ar: title },
            contents: { en: body, ar: body }
          })
        }).catch(() => {});
      }
      return;
    }

    // 3. في حالة متصفح الويب
    if ("Notification" in window && Notification.permission === "granted") {
      if (swRegistration && swRegistration.active) {
        swRegistration.active.postMessage({ type: "SHOW_NOTIFICATION", title, body });
      } else {
        try { new Notification(title, { body, icon: "icon.svg" }); } catch (_) {}
      }
    }
  }

  /* ==========================================================================
     5. مراقبة اكتمال إجابات الذكاء الاصطناعي وإشعار المستخدم إذا كان خارج التطبيق
     ========================================================================== */
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
      const isGenerating = stText === "..." || stText.includes("يكتب") || stText.includes("استكمال") ||
                           document.querySelector(".gd-cw.gd-live") !== null;

      if (isGenerating) {
        wasGenerating = true;
      } else if (wasGenerating && !isGenerating) {
        wasGenerating = false;
        if (document.hidden || document.visibilityState === "hidden") {
          const msg = lastQuestion
            ? `اكتملت الإجابة على سؤالك: "${lastQuestion}..."`
            : "إجابتك جاهزة الآن داخل GeoDev Studio Pro.";
          sendSystemNotification("GeoDev AI • إجابتك جاهزة", msg);
        }
      }
    }, 1000);
  }

  /* ==========================================================================
     6. إرسال إشعارات الإدارة (Firestore + OneSignal API المحدث)
     ========================================================================== */
  window.GEOSendBroadcastNotif = async function () {
    const title = $("admNotifTitle")?.value.trim();
    const body = $("admNotifBody")?.value.trim();
    if (!title || !body) {
      return window.toast && window.toast("اكتب عنوان الإشعار وتفاصيل الإشعار أولاً", "warn");
    }

    try {
      // 1. حفظ الإشعار في Firestore ليظهر في السجل وداخل التطبيق
      if (window.firebase && firebase.apps.length) {
        await firebase.firestore().collection("geodev_notifications").add({
          title,
          body,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      // 2. إرسال الإشعار عبر OneSignal API المحدث (v2)
      if (ONESIGNAL_REST_KEY && !ONESIGNAL_REST_KEY.includes("ضع_هنا")) {
        try {
          const res = await fetch("https://api.onesignal.com/notifications", {
            method: "POST",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Authorization": "Key " + ONESIGNAL_REST_KEY
            },
            body: JSON.stringify({
              app_id: ONESIGNAL_APP_ID,
              included_segments: ["Total Subscriptions"],
              headings: { en: title, ar: title },
              contents: { en: body, ar: body }
            })
          });
          const data = await res.json();
          if (data.errors) console.warn("OneSignal Errors:", data.errors);
        } catch (fetchErr) {
          console.warn("OneSignal Fetch Blocked by CORS:", fetchErr);
          window.toast && window.toast("تم الحفظ في قاعدة البيانات، لكن المتصفح حظر الاتصال المباشر بـ OneSignal", "warn");
          return;
        }
      }

      $("admNotifTitle").value = "";
      $("admNotifBody").value = "";
      window.toast && window.toast("تم إرسال الإشعار لجميع المستخدمين بنجاح!", "success");
    } catch (e) {
      window.toast && window.toast("تعذر الإرسال: " + e.message, "error");
    }
  };

  /* ==========================================================================
     7. الاستماع لإشعارات Firestore داخل التطبيق وعرض السجل في لوحة الإدارة
     ========================================================================== */
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
      }, err => console.warn("Notif Listener:", err.message));
  }

  function injectDrawerAppControls() {
    const dm = document.querySelector("#drw .dm");
    if (!dm || $("gdEnableNotifBtn")) return;

    const installBtnHtml = isMedianApp() ? "" : `
      <button id="gdInstallAppBtn" onclick="toggleDrawer();window.GEOInstallApp()">
        تثبيت التطبيق على الهاتف
      </button>
    `;

    dm.insertAdjacentHTML("afterbegin", `
      ${installBtnHtml}
      <button id="gdEnableNotifBtn" onclick="toggleDrawer();window.GEORequestNotifPermission()">
        تفعيل إشعارات التطبيق
      </button>
    `);
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

    const cardHtml = `
      <div class="card" id="gdAdminNotifCard" style="border-color:var(--am)">
        <h3><i data-lucide="bell-ring"></i> إرسال إشعار للمستخدمين</h3>
        <p class="mt" style="line-height:1.7">
          أرسل إشعاراً فورياً يظهر على هواتف وواجهات جميع مستخدمي المنصة.
        </p>
        <label style="display:block;font-size:12.5px;font-weight:800;margin:8px 0 4px;color:var(--tx)">عنوان الإشعار</label>
        <input id="admNotifTitle" placeholder="اكتب عنوان الإشعار هنا (مثال: تحديث جديد في أدوات المساحة)">

        <label style="display:block;font-size:12.5px;font-weight:800;margin:8px 0 4px;color:var(--tx)">التفاصيل</label>
        <textarea id="admNotifBody" rows="3" placeholder="اكتب تفاصيل الإشعار والرسالة التي ستظهر للمستخدمين..."></textarea>

        <button type="button" class="a" style="width:100%;margin-top:6px" onclick="window.GEOSendBroadcastNotif()">
          إرسال الإشعار لجميع المستخدمين
        </button>
        <div id="gdAdminNotifHistory"></div>
      </div>
    `;

    adminPanel.insertAdjacentHTML("afterbegin", cardHtml);
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
        if (bridge && bridge.onesignal && typeof bridge.onesignal.register === "function") {
          bridge.onesignal.register();
        }
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
