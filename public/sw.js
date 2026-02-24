const CACHE_NAME = "frailin-v2"

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    ).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  if (!event.request.url.startsWith("http")) return
  if (event.request.url.includes("localhost")) return
  if (event.request.url.includes("/api/") || event.request.url.includes("/_next/")) return

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})

// Push notification received
self.addEventListener("push", (event) => {
  if (!event.data) return

  let data = {}
  try { data = event.data.json() } catch { data = { title: "Frailin Studio", body: event.data.text() } }

  const title = data.title || "Frailin Studio"
  const options = {
    body: data.body || "",
    icon: "/logo.png",
    badge: "/logo.png",
    tag: data.tag || "frailin-notification",
    renotify: true,
    data: { url: data.url || "/dashboard" },
    vibrate: [200, 100, 200],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Notification clicked → open dashboard
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/dashboard"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
