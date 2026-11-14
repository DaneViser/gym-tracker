// Red gym clock in the header.

import { $ } from "./dom.js";

// ======================================================================
// Gym clock (header)
// ======================================================================

// Runs once at startup (called from main.js): connects buttons and other page events.
export function init() {
  (function gymClock() {
    const pad = n => String(n).padStart(2, "0");
    function tick() {
      const d = new Date();
      $("mHM").textContent = pad(d.getHours()) + ":" + pad(d.getMinutes());
      $("mS").textContent = ":" + pad(d.getSeconds());
      $("mclock").setAttribute("aria-label", pad(d.getHours()) + ":" + pad(d.getMinutes()));
      setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    }
    tick();
  })();
}
