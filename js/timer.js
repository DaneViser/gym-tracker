// Rest timer bar at the bottom.
"use strict";

// ======================================================================
// Rest timer
// ======================================================================
let tEnd = 0, tTotal = 0, tTick = null;
const timerEl = $("timer");
const mmss = s => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
function stopTimer(finished) {
  clearInterval(tTick); tTick = null;
  timerEl.classList.remove("running"); $("tbar").style.width = "0";
  [...$("presets").children].forEach(b => b.classList.remove("stop"));
  if (finished) {
    timerEl.classList.add("finished"); $("tlabel").textContent = t("go"); $("tclock").textContent = "0:00";
    buzz([300, 150, 300, 150, 300]);
    setTimeout(() => { timerEl.classList.remove("finished"); $("tlabel").textContent = t("rest"); }, 3000);
  } else { $("tlabel").textContent = t("rest"); $("tclock").textContent = "0:00"; }
}
function tickTimer() {
  const left = Math.max(0, Math.round((tEnd - Date.now()) / 1000));
  $("tclock").textContent = mmss(left);
  $("tbar").style.width = ((tTotal - left) / tTotal * 100) + "%";
  if (left <= 0) stopTimer(true);
}
$("presets").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.classList.contains("stop")) { stopTimer(false); return; }
  stopTimer(false); timerEl.classList.remove("finished");
  tTotal = +b.dataset.s; tEnd = Date.now() + tTotal * 1000;
  b.classList.add("stop"); timerEl.classList.add("running"); $("tlabel").textContent = t("tapStop");
  buzz(20); tickTimer(); tTick = setInterval(tickTimer, 250);
});
document.addEventListener("visibilitychange", () => { if (!document.hidden && tTick) tickTimer(); });
