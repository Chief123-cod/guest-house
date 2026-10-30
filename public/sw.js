// Service Worker untuk Notifikasi HP Undangan Open House Kamar 201

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Listener saat menerima Push Notification dari server (Web Push)
self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Undangan Open House Kamar 201", body: event.data.text() };
    }
  }

  const title = data.title || "Open House Kamar 201";
  const options = {
    body: data.body || "Ada pembaruan terkait undangan Anda.",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || "open-house-notif",
    renotify: true,
    data: {
      url: data.url || "/",
      time: new Date().toISOString(),
    },
    actions: [
      { action: "open", title: "Buka Undangan" }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listener saat notifikasi di-klik di HP tamu
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Listener pesan langsung dari aplikasi web React (Local Trigger via Service Worker)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "TRIGGER_NOTIFICATION") {
    const { title, options } = event.data;
    const finalOptions = {
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      vibrate: [200, 100, 200],
      tag: options?.tag || "guest-alert",
      renotify: true,
      data: {
        url: options?.url || self.location.origin,
      },
      ...options,
    };
    self.registration.showNotification(title || "Open House Kamar 201", finalOptions);
  }
});
