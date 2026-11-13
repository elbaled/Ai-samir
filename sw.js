/* GeoDev Studio Pro Service Worker v1.0 */
const CACHE_NAME = "geodev-pro-v1";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

// استقبال أوامر عرض الإشعارات من التطبيق
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, body, url } = event.data;
    self.registration.showNotification(title || "GeoDev Studio Pro", {
      body: body || "",
      icon: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
      badge: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
      vibrate: [200, 100, 200],
      data: { url: url || "./index.html" }
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
      if (clients.openWindow) return clients.openWindow("./index.html");
    })
  );
});
