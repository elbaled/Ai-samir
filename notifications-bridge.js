/**
 * notifications-bridge.js
 * جسر الإشعارات الموحد لتطبيق GeoDev Studio Pro (Median OneSignal + Web PWA + Firestore)
 */

// 1. دالة اكتشاف بيئة التشغيل وتفعيل الإشعارات
window.enableNotifications = async function () {
    const isMedianApp = navigator.userAgent.toLowerCase().includes('median') || 
                        navigator.userAgent.toLowerCase().includes('gonative') || 
                        typeof window.median !== 'undefined' ||
                        typeof window.gonative !== 'undefined';

    if (isMedianApp) {
        try {
            const bridge = window.median || window.gonative;
            if (bridge && bridge.onesignal) {
                bridge.onesignal.register();
                if (typeof toast === 'function') toast("جاري تفعيل إشعارات التطبيق...", "info");
                setTimeout(syncMedianOneSignalIdToFirestore, 3000);
            } else {
                if (typeof toast === 'function') toast("يرجى التأكد من تفعيل إضافة OneSignal في Median", "warn");
            }
        } catch (error) {
            console.error("Median OneSignal Error:", error);
            if (typeof toast === 'function') toast("حدث خطأ أثناء تفعيل إشعارات التطبيق", "error");
        }
        return;
    }

    // في حالة المتصفح العادي (Web / PWA)
    if (!("Notification" in window)) {
        if (typeof toast === 'function') toast("متصفحك لا يدعم الإشعارات", "warn");
        return;
    }

    if (Notification.permission === "granted") {
        if (typeof toast === 'function') toast("الإشعارات مفعلة بالفعل", "success");
        initOneSignalWeb();
    } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            if (typeof toast === 'function') toast("تم تفعيل الإشعارات بنجاح", "success");
            initOneSignalWeb();
        } else {
            if (typeof toast === 'function') toast("تم رفض إذن الإشعارات", "warn");
        }
    } else {
        if (typeof toast === 'function') toast("الإشعارات محظورة من إعدادات المتصفح", "warn");
    }
};

// 2. استخراج معرّف الجهاز (OneSignal ID) من Median وحفظه في Firestore
async function syncMedianOneSignalIdToFirestore() {
    try {
        const bridge = window.median || window.gonative;
        if (!bridge || !bridge.onesignal || !bridge.onesignal.info) return;

        const info = await bridge.onesignal.info();
        const playerId = info?.oneSignalId || info?.oneSignalUserId;

        if (playerId) {
            localStorage.setItem("geodev_onesignal_id", playerId);
            await savePlayerIdToUserDoc(playerId);
        }
    } catch (err) {
        console.warn("لم يتم جلب معرّف OneSignal بعد:", err);
    }
}

// 3. حفظ معرّف الإشعارات في مستند المستخدم users/{uid} (متوافق مع firebase-compat لديك)
async function savePlayerIdToUserDoc(playerId) {
    try {
        if (window.firebase && firebase.apps.length && firebase.auth().currentUser) {
            const uid = firebase.auth().currentUser.uid;
            await firebase.firestore().collection("users").doc(uid).set({
                oneSignalPlayerId: playerId,
                platform: "android_median",
                notificationsUpdatedAt: new Date().toISOString()
            }, { merge: true });
        }
    } catch (e) {
        console.warn("Firestore PlayerID Save Warning:", e);
    }
}

// 4. الاستماع للإشعارات الفورية من مجموعة geodev_notifications في Firestore
function listenToGeoDevNotifications() {
    if (!window.firebase || !firebase.apps.length) return;
    const lastSeenTime = Number(localStorage.getItem("geodev_last_notif_time") || Date.now());

    firebase.auth().onAuthStateChanged((user) => {
        if (!user) return;
        firebase.firestore().collection("geodev_notifications")
            .orderBy("createdAt", "desc")
            .limit(1)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const data = change.doc.data();
                        const notifTime = data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.timestamp || Date.now());
                        if (notifTime > lastSeenTime) {
                            localStorage.setItem("geodev_last_notif_time", notifTime);
                            const title = data.title || "إشعار جديد";
                            const body = data.body || data.message || "";
                            if (typeof toast === 'function') toast(`${title}: ${body}`, "info");
                            if ("Notification" in window && Notification.permission === "granted") {
                                new Notification(title, { body: body, icon: "icon.svg" });
                            }
                        }
                    }
                });
            }, () => {});
    });
}

// 5. تهيئة Web Push في المتصفح
function initOneSignalWeb() {
    if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function (OneSignal) {
            await OneSignal.Notifications.requestPermission();
            const webPlayerId = OneSignal.User?.PushSubscription?.id;
            if (webPlayerId) await savePlayerIdToUserDoc(webPlayerId);
        });
    }
}

// 6. اعتراض أي زر قديم في geo-pwa-push.js يسبب رسالة "متصفحك لا يدعم الإشعارات"
document.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;
    const txt = (btn.textContent || "").trim();
    const isMedianApp = navigator.userAgent.toLowerCase().includes('median') || 
                        navigator.userAgent.toLowerCase().includes('gonative') || 
                        typeof window.median !== 'undefined';

    if (isMedianApp && (txt.includes("تفعيل الإشعارات") || txt.includes("الإشعارات"))) {
        // إذا كان الزر تابعاً لـ geo-pwa-push.js، نمنع التنفيذ القديم ونشغّل جسر Median
        if (btn.id === "gdPushBtn" || btn.dataset.push || btn.getAttribute("onclick")?.includes("Push")) {
            e.preventDefault();
            e.stopImmediatePropagation();
            window.enableNotifications();
        }
    }
}, true);

// التشغيل التلقائي عند جاهزية التطبيق
window.addEventListener("load", () => {
    setTimeout(syncMedianOneSignalIdToFirebaseAuto, 3500);
    setTimeout(listenToGeoDevNotifications, 2000);
});

function syncMedianOneSignalIdToFirebaseAuto() {
    const isMedianApp = navigator.userAgent.toLowerCase().includes('median') || 
                        navigator.userAgent.toLowerCase().includes('gonative') || 
                        typeof window.median !== 'undefined';
    if (isMedianApp) {
        const bridge = window.median || window.gonative;
        if (bridge && bridge.onesignal && bridge.onesignal.register) {
            bridge.onesignal.register();
        }
        syncMedianOneSignalIdToFirestore();
    }
}
