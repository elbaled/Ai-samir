/* ============================================================================
   GeoDev PWA App, Median OneSignal Bridge, Background Reply Alert & Admin Push v3.0
   1. دعم إشعارات OneSignal الأصلية داخل تطبيق Median (Android / iOS) ومزامنتها مع Firestore.
   2. إرسال إشعار لهاتف المستخدم (في شريط الإشعارات) إذا خرج من التطبيق أثناء كتابة الإجابة واكتمل الرد.
   3. خانة إرسال إشعارات لجميع المستخدمين في لوحة الإدارة (#s-admin).
   4. تحويل المنصة إلى تطبيق قابل للتثبيت على الهاتف (PWA) في متصفحات الويب.
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOPWAPushV2) return;
  window.GEOPWAPushV2 = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

  // التحقق هل التطبيق يعمل داخل بيئة Median (GoNative سابقاً)
  const isMedianApp = () => {
    const ua = (navigator.userAgent || "").toLowerCase();
    return ua.includes("median") || ua.includes("gonative") || typeof window.median !== "undefined" || typeof window.gonative !== "undefined";
  };

  const getMedianBridge = () => window.median || window.gonative || null;

  let deferredInstallPrompt = null;
  let swRegistration = null;

  /* ==========================================================================
     1. ربط manifest.json وتسجيل Service Worker (للمتصفح)
     ========================================================================== */
  function registerPWA() {
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = "manifest.json";
      document.head.appendChild(link);
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").then(reg => {
        swRegistration = reg;
      }).catch(err => console.warn("SW Error:", err));
    }

    window.addEventListener("beforeinstallprompt", e => {
      e.preventDefault();
      deferredInstallPrompt = e;
      const btn = $("gdInstallAppBtn");
      if (btn && !isMedianApp()) btn.style.display = "flex";
    });
  }

  /* ==========================================================================
     2. مزامنة معرّف OneSignal مع Firestore وحفظه في مستند المستخدم
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
      console.warn("OneSignal Sync Info:", e);
    }
  }

  /* ==========================================================================
     3. طلب إذن الإشعارات (يدعم Median OneSignal + متصفحات الويب PWA)
     ========================================================================== */
  window.GEORequestNotifPermission = async function () {
    // أولاً: في حالة تطبيق Median للأندرويد / iOS
    if (isMedianApp()) {
      try {
        const bridge = getMedianBridge();
        if (bridge && bridge.onesignal && typeof bridge.onesignal.register === "function") {
          bridge.onesignal.register();
          window.toast && window.toast("تم تفعيل إشعارات التطبيق بنجاح!", "success");
          setTimeout(syncOneSignalPlayerId, 2500);
        } else {
          window.toast && window.toast("يرجى تفعيل إضافة OneSignal في إعدادات التطبيق", "warn");
        }
      } catch (e) {
        console.error("Median OneSignal Error:", e);
        window.toast && window.toast("حدث خطأ أثناء تفعيل إشعارات التطبيق", "error");
      }
      return;
    }

    // ثانياً: في حالة متصفح الويب العادي
    if (!("Notification" in window)) {
      return window.toast && window.toast("متصفحك لا يدعم الإشعارات", "warn");
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      window.toast && window.toast("تم تفعيل إشعارات التطبيق بنجاح!", "success");
      sendSystemNotification("GeoDev Studio Pro", "تم تفعيل الإشعارات الفورية لحسابك بنجاح.");
    } else {
      window.toast && window.toast("يرجى السماح بالإشعارات من إعدادات المتصفح", "warn");
    }
  };

  window.GEOInstallApp = async function () {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === "accepted") {
        window.toast && window.toast("جاري تثبيت التطبيق على جهازك...", "success");
      }
      deferredInstallPrompt = null;
    } else {
      window.toast && window.toast("من قائمة المتصفح (⋮ أو مشاركة) اختر: الإضافة إلى الشاشة الرئيسية", "info");
    }
  };

  /* ==========================================================================
     4. إرسال إشعار لنظام الهاتف (Median Native أو Web Push)
     ========================================================================== */
  function sendSystemNotification(title, body) {
    // إذا كان داخل تطبيق Median، نرسل إشعار نظام أصلي للهاتف
    if (isMedianApp()) {
      try {
        const bridge = getMedianBridge();
        if (bridge && bridge.localNotifications && typeof bridge.localNotifications.create === "function") {
          bridge.localNotifications.create({
            title: title,
            message: body,
            text: body
          });
          return;
        }
      } catch (e) {
        console.warn("Median Local Notification Error:", e);
      }
      return;
    }

    // في حالة المتصفح العادي
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    if (swRegistration && swRegistration.active) {
      swRegistration.active.postMessage({
        type: "SHOW_NOTIFICATION",
        title,
        body
      });
    } else {
      try {
        new Notification(title, {
          body,
          icon: "https://cdn-icons-png.flaticon.com/512/854/854878.png"
        });
      } catch (_) {}
    }
  }

  /* ==========================================================================
     5. إرسال إشعار تلقائي عند اكتمال إجابة الذكاء الاصطناعي والمستخدم خارج التطبيق
     ========================================================================== */
  function hookBackgroundReplyNotifications() {
    // 1. في المساعد الذكي العام (window.ask)
    const _origAsk = window.ask;
    if (typeof _origAsk === "function" && !_origAsk.__bgNotifHooked) {
      const wrappedAsk = async function (prompt, shown) {
        const questionPreview = String(shown || prompt || "").slice(0, 65);
        try {
          const result = await _origAsk.apply(this, arguments);
          if (document.hidden || document.visibilityState === "hidden") {
            sendSystemNotification(
              "تمت الإجابة على سؤالك • GeoDev AI",
              questionPreview ? `اكتمل الرد على: "${questionPreview}..."` : "إجابتك جاهزة الآن داخل المنصة."
            );
          }
          return result;
        } catch (err) {
          throw err;
        }
      };
      wrappedAsk.__bgNotifHooked = true;
      window.ask = wrappedAsk;
    }

    // 2. في شات الجيوماتكس (window.gisSend)
    const _origGisSend = window.gisSend;
    if (typeof _origGisSend === "function" && !_origGisSend.__bgNotifHooked) {
      const wrappedGis = async function () {
        try {
          const res = await _origGisSend.apply(this, arguments);
          if (document.hidden || document.visibilityState === "hidden") {
            sendSystemNotification(
              "تمت الإجابة في قسم الجيوماتكس",
              "اكتمل التحليل والرد على استفسارك الجغرافي، اضغط لعرضه."
            );
          }
          return res;
        } catch (err) {
          throw err;
        }
      };
      wrappedGis.__bgNotifHooked = true;
      window.gisSend = wrappedGis;
    }

    // 3. في المدرس الذكي (GEOAcademyEngines.teacherChat)
    if (window.GEOAcademyEngines && typeof window.GEOAcademyEngines.teacherChat === "function" && !window.GEOAcademyEngines.teacherChat.__bgNotifHooked) {
      const _origTeacher = window.GEOAcademyEngines.teacherChat;
      const wrappedTeacher = async function () {
        const res = await _origTeacher.apply(this, arguments);
        if (document.hidden || document.visibilityState === "hidden") {
          sendSystemNotification(
            "تمت الإجابة من المدرس الذكي",
            "شرح سؤالك جاهز الآن في الأكاديمية، اضغط للمتابعة."
          );
        }
        return res;
      };
      wrappedTeacher.__bgNotifHooked = true;
      window.GEOAcademyEngines.teacherChat = wrappedTeacher;
    }
  }

  /* ==========================================================================
     6. الاستماع اللحظي لإشعارات الإدارة من Firestore وعرضها لجميع المستخدمين
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
          sendSystemNotification(latest.title, latest.body);
        }
      }, err => console.warn("Notif Listener:", err.message));
  }

  /* ==========================================================================
     7. إضافة أزرار التثبيت والإشعارات في القائمة الجانبية (☰) وخانة الإرسال في الأدمن
     ========================================================================== */
  function injectDrawerAppControls() {
    const dm = document.querySelector("#drw .dm");
    if (!dm || $("gdEnableNotifBtn")) return;

    // إخفاء زر تثبيت التطبيق إذا كان المستخدم يفتحه من داخل تطبيق Median بالفعل
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

  window.GEOSendBroadcastNotif = async function () {
    if (!window.firebase || !firebase.apps.length) return;
    const title = $("admNotifTitle")?.value.trim();
    const body = $("admNotifBody")?.value.trim();
    if (!title || !body) {
      return window.toast && window.toast("اكتب عنوان الإشعار وتفاصيل الإشعار أولاً", "warn");
    }

    try {
      await firebase.firestore().collection("geodev_notifications").add({
        title,
        body,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      $("admNotifTitle").value = "";
      $("admNotifBody").value = "";
      window.toast && window.toast("تم إرسال الإشعار لجميع المستخدمين بنجاح!", "success");
    } catch (e) {
      window.toast && window.toast("تعذر الإرسال: " + e.message, "error");
    }
  };

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
    hookBackgroundReplyNotifications();

    setTimeout(hookBackgroundReplyNotifications, 600);

    // تفعيل ومزامنة OneSignal تلقائياً عند فتح تطبيق Median
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
          hookBackgroundReplyNotifications();
          listenForNotifications();

          if (isMedianApp()) {
            setTimeout(syncOneSignalPlayerId, 2000);
          } else if ("Notification" in window && Notification.permission === "default") {
            setTimeout(() => Notification.requestPermission().catch(() => {}), 3500);
          }
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
