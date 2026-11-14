// Service worker registration (offline use), storage protection, new-version check.

import { APP_VERSION } from "./version.js";
import { $ } from "./dom.js";

// ======================================================================
// Offline, storage protection, updates
// ======================================================================
export let storageProtected = null;
export function protectStorage() {
  try {
    if (!navigator.storage || !navigator.storage.persist) return;
    navigator.storage.persisted().then(p => p || navigator.storage.persist()).then(p => { storageProtected = !!p; }).catch(() => {});
  } catch (e) {}
}

// When the app comes back to the screen, check (at most every 30 min) whether a newer version is live.
export let lastCheck = Date.now();
export async function checkForUpdate() {
  if (!navigator.onLine || Date.now() - lastCheck < 30 * 60 * 1000) return;
  lastCheck = Date.now();
  try {
    const live = await (await fetch("js/version.js?check=" + Date.now(), { cache: "no-store" })).text();
    const m = /const APP_VERSION = "([^"]+)"/.exec(live);
    if (m && m[1] !== APP_VERSION) $("updateBar").hidden = false;
  } catch (e) {}
}

// Runs once at startup (called from main.js): connects buttons and other page events.
export function init() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) checkForUpdate(); });
  $("updateBar").addEventListener("click", () => location.reload());
}
