// Service worker registration (offline use), storage protection, new-version check.
"use strict";

// ======================================================================
// Offline, storage protection, updates
// ======================================================================
let storageProtected = null;
function protectStorage() {
  try {
    if (!navigator.storage || !navigator.storage.persist) return;
    navigator.storage.persisted().then(p => p || navigator.storage.persist()).then(p => { storageProtected = !!p; }).catch(() => {});
  } catch (e) {}
}
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
}
// When the app comes back to the screen, check (at most every 30 min) whether a newer version is live.
let lastCheck = Date.now();
async function checkForUpdate() {
  if (!navigator.onLine || Date.now() - lastCheck < 30 * 60 * 1000) return;
  lastCheck = Date.now();
  try {
    const live = await (await fetch("js/version.js?check=" + Date.now(), { cache: "no-store" })).text();
    const m = /const APP_VERSION = "([^"]+)"/.exec(live);
    if (m && m[1] !== APP_VERSION) $("updateBar").hidden = false;
  } catch (e) {}
}
document.addEventListener("visibilitychange", () => { if (!document.hidden) checkForUpdate(); });
$("updateBar").addEventListener("click", () => location.reload());
