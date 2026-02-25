const CACHE_NAME = "golf-dashboard-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(["/offline"])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      ),
      // Cache pages of existing clients (handles first-visit race condition)
      self.clients.matchAll({ type: "window" }).then((windowClients) =>
        caches.open(CACHE_NAME).then((cache) =>
          Promise.all(
            windowClients.map((client) => {
              const url = new URL(client.url);
              return fetch(url.pathname)
                .then((res) => {
                  if (res.ok) return cache.put(url.pathname, res);
                })
                .catch(() => {});
            })
          )
        )
      ),
    ]).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip API routes - let offline-queue handle failures
  if (url.pathname.startsWith("/api/")) return;

  // Static assets (JS/CSS bundles, icons, fonts): cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".webmanifest")
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Navigation requests & Next.js data: network-first, cache fallback
  if (event.request.mode === "navigate" || url.pathname.startsWith("/_next/data/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) =>
            cached || caches.match("/offline")
          )
        )
    );
    return;
  }

  // Other same-origin GET: network-first with cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
