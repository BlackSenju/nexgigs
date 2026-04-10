// Custom service worker extensions for NexGigs
// This file is imported by next-pwa's generated sw.js

// Listen for push events
self.addEventListener("push", function (event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: "NexGigs",
      body: event.data.text(),
    };
  }

  const title = data.title || "NexGigs";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/icon-192.png",
    tag: data.tag || "nexgigs-notification",
    data: { link: data.link || "/dashboard" },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click — open the linked page
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const link = (event.notification.data && event.notification.data.link) || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // If app is already open, focus it and navigate
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) {
            client.navigate(link);
          }
          return;
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(link);
      }
    })
  );
});
