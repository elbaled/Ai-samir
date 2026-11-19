/* GeoDev Service Worker v6.0 */
const CACHE_NAME = "geodev-v6";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// استقبال أوامر عرض الإشعارات من التطبيق
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, body, url } = event.data;
    self.registration.showNotification(title || "GeoDev", {
      body: body || "",
      icon: "/GEO_DEV_AI/icon-192.png",
      badge: "/GEO_DEV_AI/icon-192.png",
      vibrate: [200, 100, 200],
      data: { url: url || "/GEO_DEV_AI/index.html" }
    });
  }
});

// عند الضغط على الإشعار يفتح التطبيق مباشرة
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/GEO_DEV_AI/index.html");
    })
  );
});
