// service-worker.js

// Service Worker 설치
self.addEventListener("install", (event) => {
  console.log("Service Worker installing.");
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener("activate", (event) => {
  console.log("Service Worker activated.");
});

// Push 이벤트 처리
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.log("Push 이벤트이지만 데이터가 없습니다.");
    return;
  }

  try {
    const data = event.data.json();

    const options = {
      body: data.body,
      vibrate: [200, 100, 200],
      data: {
        url: data.url,
      },
      badge: "/favicon-96x96.png",
      actions: [
        {
          action: "open",
          title: "열기",
        },
        {
          action: "close",
          title: "닫기",
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (error) {
    console.error("Push 이벤트 처리 중 오류:", error);
  }
});

// 알림 클릭 이벤트 처리
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  // 알림 클릭 시 해당 URL로 이동
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      const hadWindowToFocus = clientList.some((client) => {
        if (client.url === event.notification.data.url) {
          return client.focus();
        }
        return false;
      });

      if (!hadWindowToFocus) {
        clients
          .openWindow(event.notification.data.url)
          .then((windowClient) => windowClient && windowClient.focus());
      }
    })
  );
});
