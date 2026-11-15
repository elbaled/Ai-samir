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
