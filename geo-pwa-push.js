/* ============================================================================
   GeoDev PWA App & Real-Time Admin Notifications v1.0 (geo-pwa-push.js)
   1. تحويل المنصة إلى تطبيق قابل للتثبيت على Android / iOS / PC.
   2. لوحة إرسال إشعارات فورية من الإدارة (#s-admin) لجميع المستخدمين عبر Firestore.
   3. استقبال الإشعارات وعرضها في شريط إشعارات الهاتف + جرس إشعارات داخل التطبيق.
   ============================================================================ */

(function () {
  "use strict";
  if (window.GEOPWAPush) return;
  window.GEOPWAPush = true;

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

  let deferredInstallPrompt = null;
  let swRegistration = null;

  /* ==========================================================================
     1. ربط manifest.json وتسجيل Service Worker
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
      if (btn) btn.style.display = "flex";
    });
  }

  /* ==========================================================================
     2. طلب إذن الإشعارات وعرض الإشعار على الهاتف وداخل المنصة
     ========================================================================== */
  window.GEORequestNotifPermission = async function () {
    if (!("Notification" in window)) {
      return window.toast && window.toast("متصفحك لا يدعم الإشعارات", "warn");
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      window.toast && window.toast("تم تفعيل إشعارات التطبيق بنجاح!", "success");
      sendSystemNotification("GeoDev Studio Pro", "تم تفعيل الإشعارات الفورية لحسابك بنجاح.");
    } else {
      window.toast && window.toast("تم رفض إذن الإشعارات من إعدادات المتصفح", "warn");
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

  function sendSystemNotification(title, body) {
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
     3. الاستماع اللحظي للإشعارات من Firestore وعرضها للمستخدمين
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

        // أول مرة يفتح فيها المستخدم نسجل آخر إشعار بدون إزعاجه بإشعارات قديمة
        if (!lastSeen) {
          localStorage.setItem(seenKey, latest.id);
          return;
        }

        if (latest.id !== lastSeen) {
          localStorage.setItem(seenKey, latest.id);
          // عرض إشعار داخل المنصة + إشعار نظام الهاتف
          if (typeof window.toast === "function") {
            window.toast(`إشعار جديد: ${latest.title} — ${latest.body}`, "info");
          }
          sendSystemNotification(latest.title, latest.body);
        }
      }, err => console.warn("Notif Listener:", err.message));
  }

  /* ==========================================================================
     4. إضافة أزرار التثبيت والإشعارات في القائمة الجانبية (☰) ولوحة الإدارة
     ========================================================================== */
  function injectDrawerAppControls() {
    const dm = document.querySelector("#drw .dm");
    if (!dm || $("gdInstallAppBtn")) return;

    dm.insertAdjacentHTML("afterbegin", `
      <button id="gdInstallAppBtn" onclick="toggleDrawer();window.GEOInstallApp()">
        تثبيت التطبيق على الهاتف
      </button>
      <button id="gdEnableNotifBtn" onclick="toggleDrawer();window.GEORequestNotifPermission()">
        تفعيل إشعارات التطبيق
      </button>
    `);
  }

  function renderNotifHistoryInAdmin(list) {
    const box = $("gdAdminNotifHistory");
    if (!box) return;
    if (!list.length) {
      box.innerHTML = `<div class="mt">لم يتم إرسال إشعارات بعد.</div>`;
      return;
    }
    box.innerHTML = list.slice(0, 5).map(n => `
      <div style="background:var(--bg);border:1px solid var(--ln);border-radius:10px;padding:8px 10px;margin-bottom:6px">
        <b style="color:var(--bl);font-size:13px;display:block">${esc(n.title)}</b>
        <span class="mt" style="font-size:12px">${esc(n.body)}</span>
      </div>
    `).join("");
  }

  window.GEOSendBroadcastNotif = async function () {
    if (!window.firebase || !firebase.apps.length) return;
    const title = $("admNotifTitle")?.value.trim();
    const body = $("admNotifBody")?.value.trim();
    if (!title || !body) {
      return window.toast && window.toast("اكتب عنوان الإشعار ونص الرسالة أولاً", "warn");
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
        <h3>إرسال إشعارات فورية للمستخدمين (Push Notifications)</h3>
        <p class="mt" style="line-height:1.7">
          أرسل تنبيهاً أو إعلاناً عن دورة أو أداة جديدة، وسيصل فوراً إلى هواتف جميع المستخدمين المثبتين للتطبيق.
        </p>
        <input id="admNotifTitle" placeholder="عنوان الإشعار (مثال: تم إضافة دورة Civil 3D جديدة)">
        <textarea id="admNotifBody" rows="2" placeholder="نص الإشعار الذي سيظهر على شاشة هاتف المستخدم..."></textarea>
        <button type="button" class="a" style="width:100%;margin-bottom:10px" onclick="window.GEOSendBroadcastNotif()">
          إرسال الإشعار للجميع الآن
        </button>
        <div id="gdAdminNotifHistory"></div>
      </div>
    `;

    adminPanel.insertAdjacentHTML("afterbegin", cardHtml);
  }

  function initPWA() {
    registerPWA();
    injectDrawerAppControls();
    injectAdminNotifCard();

    if (window.firebase && firebase.apps.length) {
      firebase.auth().onAuthStateChanged(u => {
        if (u) {
          injectDrawerAppControls();
          injectAdminNotifCard();
          listenForNotifications();
          // طلب إذن الإشعارات بهدوء بعد الدخول بـ 4 ثوانٍ إذا لم يُحدد بعد
          if ("Notification" in window && Notification.permission === "default") {
            setTimeout(() => Notification.requestPermission().catch(() => {}), 4000);
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
