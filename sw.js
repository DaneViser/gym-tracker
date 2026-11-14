// Service worker: keeps a copy of the app on the phone so it opens without internet.
//
// How it serves files:
//   - The page itself (index.html): NETWORK FIRST. Online -> always the newest version
//     (and the saved copy is refreshed). Offline or very slow (> 4 s) -> the saved copy.
//   - Icons / manifest (same site): CACHE FIRST, they rarely change.
//   - Google Fonts: served from cache, refreshed in the background.
//
// When you change icons or the manifest, bump CACHE (e.g. "gym-tracker-v2") so phones
// download the new ones. Changes to index.html need no bump.
const CACHE = "gym-tracker-v1";
const SHELL = ["./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
const INDEX = new URL("./", self.registration.scope).href;
const INDEX_PATH = new URL(INDEX).pathname;

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isPage = req.mode === "navigate" || (sameOrigin && (url.pathname === INDEX_PATH || url.pathname.endsWith("/index.html")));

  if (isPage) { event.respondWith(networkFirst(req)); return; }
  if (sameOrigin) { event.respondWith(cacheFirst(req)); return; }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(staleWhileRevalidate(req, event));
  }
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(INDEX);
  const network = fetch(req).then(res => {
    if (res.ok) cache.put(INDEX, res.clone());
    return res;
  });
  if (!cached) return network;
  const slow = new Promise(resolve => setTimeout(() => resolve(cached), 4000));
  return Promise.race([network.catch(() => cached), slow]);
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req, event) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  const refresh = fetch(req).then(res => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; }).catch(() => hit);
  if (hit) { event.waitUntil(refresh); return hit; }
  return refresh;
}
