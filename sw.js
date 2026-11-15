// Service worker: keeps a copy of the app on the phone so it opens without internet.
//
// How it serves files:
//   - The page, JS and CSS (and the manifest): NETWORK FIRST. Online -> always the newest version
//     (and the saved copy is refreshed). Offline or very slow (> 4 s) -> the saved copy.
//   - Icons (.png): CACHE FIRST, they rarely change.
//   - Google Fonts: served from cache, refreshed in the background.
//
// SHELL = files saved on install so the app works offline right away. When you ADD a new css/js
// file, add it here too (a missing file is skipped, it won't break install). When you change icons,
// bump CACHE (e.g. "gym-tracker-v3") so phones download the new ones. Code changes need no bump.
const CACHE = "gym-tracker-v2";
const SHELL = [
  "./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png",
  "css/tokens.css", "css/base.css", "css/sheets.css", "css/week.css", "css/workouts.css", "css/progress.css",
  "css/clock.css", "css/achievements.css", "css/profile.css", "css/notices.css", "css/timer.css", "css/calendar.css", "css/nutrition.css", "css/library.css", "css/responsive.css",
  "js/version.js", "js/dom.js", "js/icons.js", "js/i18n.js", "js/starter.js", "js/state.js", "js/dates.js", "js/data.js", "js/render.js",
  "js/timer.js", "js/progress.js", "js/welcome.js", "js/profile.js", "js/controls.js", "js/achievements.js",
  "js/clock.js", "js/offline.js", "js/sound.js", "js/calendar.js", "js/nutrition.js", "js/programs.js", "js/library.js", "js/main.js"
];
const INDEX = new URL("./", self.registration.scope).href;
const INDEX_PATH = new URL(INDEX).pathname;

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))) // one missing file must not break install
      .then(() => self.skipWaiting())
  );
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

  if (isPage) { event.respondWith(networkFirst(req, INDEX)); return; }
  if (sameOrigin && /\.(js|css|webmanifest)$/.test(url.pathname)) {
    event.respondWith(networkFirst(req, url.origin + url.pathname)); // key without ?query, so checks reuse it
    return;
  }
  if (sameOrigin) { event.respondWith(cacheFirst(req)); return; }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(staleWhileRevalidate(req, event));
  }
});

async function networkFirst(req, key) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(key);
  const network = fetch(req).then(res => {
    if (res.ok) cache.put(key, res.clone());
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
