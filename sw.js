self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", event => {
  if (event.data?.type === "EXPIRY_ALERT") {
    self.registration.showNotification(event.data.title, {
      body: event.data.body,
      icon: "/icons/icon-192.png",
      data: { itemName: event.data.itemName }
    });
  }
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const client of list) {
        client.postMessage({
          type: "OPEN_ITEM",
          itemName: event.notification.data.itemName
        });
        client.focus();
        return;
      }
      return clients.openWindow("/index.html");
    })
  );
});

