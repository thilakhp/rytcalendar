// Minimal service worker: exists to satisfy PWA installability and to speed
// up repeat loads of our own static assets. It deliberately does NOT cache
// pages, Server Actions, or any Supabase-backed data — this app is
// cloud-backed, and showing cached data as if it were current would be
// actively misleading.
const CACHE_NAME = "ryt-shell-v1";
const APP_SHELL = ["/icon-192", "/icon-512"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        APP_SHELL.map((url) => cache.add(url).catch(() => undefined)),
      ),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isOwnOrigin = url.origin === self.location.origin;
  const isCacheableStaticAsset =
    isOwnOrigin && (url.pathname.startsWith("/_next/static/") || APP_SHELL.includes(url.pathname));

  if (event.request.method !== "GET" || !isCacheableStaticAsset) {
    return; // everything else goes straight to the network
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    }),
  );
});
