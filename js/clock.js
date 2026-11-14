// Red gym clock in the header.
"use strict";

// ======================================================================
// Gym clock (header)
// ======================================================================
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
