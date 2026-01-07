/* Television PWA service worker */
const CACHE_NAME = "television-pwa-v1";
const ASSETS = [
  "./",
  "./Television.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

// Install: cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - App shell: cache-first
// - Everything else: network-first (streams should come from network)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Cache-first for app shell files
  if (ASSETS.includes(url.pathname.replace(/^\//, "./")) || url.pathname.endsWith("/Television.html")) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // Network-first for the rest
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
