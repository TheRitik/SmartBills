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
      data: { itemKey: event.data.itemName }
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
          itemKey: event.notification.data.itemKey
        });
        client.focus();
        return;
      }
      return clients.openWindow(`/index.html?item=${itemKey}`);
    })
  );
});

