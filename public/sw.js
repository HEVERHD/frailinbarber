const CACHE_NAME = "frailin-v2"

self.addEventListener("install", (event) => {
  // Clear old caches on install
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

  // Never cache in development
  if (event.request.url.includes("localhost")) return

  // Never cache API calls or Next.js internals
  if (event.request.url.includes("/api/") || event.request.url.includes("/_next/")) return

  // Network-first for pages
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
