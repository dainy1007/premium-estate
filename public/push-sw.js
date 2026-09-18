self.addEventListener("push", event => {
  let data = { title: "백조현대부동산 새 상담 문의", body: "새로운 상담 문의가 접수되었습니다.", url: "/admin/inquiries" };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch {}
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: "/favicon.ico",
    tag: `new-inquiry-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || "/admin/inquiries" }
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "/admin/inquiries";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const client of list) {
      if ("focus" in client) { client.navigate(url); return client.focus(); }
    }
    return clients.openWindow ? clients.openWindow(url) : undefined;
  }));
});
