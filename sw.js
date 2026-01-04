/* Television PWA service worker */
const CACHE_NAME = "television-pwa-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Never cache live media streams or cross-origin requests.
  const isMedia = /\.(m3u8|ts|mp4|m4s)(\?|$)/i.test(url.pathname);
  if (isMedia || url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;

    try {
      const fresh = await fetch(req);
      if (req.method === "GET" && fresh && fresh.ok) cache.put(req, fresh.clone());
      return fresh;
    } catch {
      return (await cache.match("./index.html")) || new Response("Offline", { status: 503 });
    }
  })());
});
