// Training calendar in the profile: a GitHub-style grid of days (columns = weeks, rows = Mon..Sun),
// coloured by how much you trained that day. Phones show 6 months, wider screens a full year.
// Tap a day to see what you did.

import { $ } from "./dom.js";
import { program, state, t, esc } from "./state.js";
import { addDays, fmtLong, locale, thisMonday, today, sameDay } from "./dates.js";
import { tr } from "./starter.js";
import { allSessionRecords, hasActivity } from "./profile.js";

const dayKey = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

// The real day a workout happened: the day it was ticked done (doneAt) if that falls in its week,
// otherwise its planned day. (Older data has no doneAt and simply uses the planned day.)
export function sessionDay(monday, rec, sess) {
  if (rec && rec.doneAt) {
    const d = new Date(rec.doneAt);
    if (d >= monday && d < addDays(monday, 7)) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  return addDays(monday, sess ? sess.dow : 0);
}

// { "2026-11-14": { done: 1, active: true, names: ["Upper 2"] }, … }
export function calendarDays() {
  const byId = {}; program().forEach(s => { byId[s.id] = s; });
  const days = {};
  for (const { monday, sid, s } of allSessionRecords()) {
    if (!s || !hasActivity(s)) continue;
    const sess = byId[sid], k = dayKey(sessionDay(monday, s, sess));
    const d = days[k] || (days[k] = { done: 0, active: false, names: [] });
    d.active = true;
    if (s.done) d.done++;
    d.names.push(sess ? (tr("w", sess.id, "title", sess.title) || t("untitled")) : t("deletedWorkout"));
  }
  return days;
}
// 0 = nothing, 1 = something logged, 2 = one workout done, 3 = two or more done
export const dayLevel = d => !d ? 0 : d.done >= 2 ? 3 : d.done === 1 ? 2 : d.active ? 1 : 0;

export function renderCalendar() {
  const el = $("prCalendar"); if (!el) return;
  const weeks = window.innerWidth < 560 ? 26 : 53;
  const start = addDays(thisMonday, -(weeks - 1) * 7);
  const days = calendarDays();
  const CELL = 10, STEP = 12, LEFT = 16, TOP = 13;
  const W = LEFT + weeks * STEP, H = TOP + 7 * STEP;
  const monthFmt = new Intl.DateTimeFormat(locale(), { month: "short" });
  const dayInitials = t("days").map(d => d.charAt(0));
  let svg = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(t("calTitle")) + '">';
  [0, 2, 4].forEach(r => { svg += '<text class="cal-t" x="0" y="' + (TOP + r * STEP + 8) + '">' + esc(dayInitials[r]) + "</text>"; });
  let trainingDays = 0, monthDays = 0, lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const monday = addDays(start, w * 7);
    if (monday.getMonth() !== lastMonth) { // month label where a new month starts (skip a cramped first one)
      if (w < weeks - 2 && !(w === 0 && monday.getDate() > 20)) svg += '<text class="cal-t" x="' + (LEFT + w * STEP) + '" y="9">' + esc(monthFmt.format(addDays(monday, 6))) + "</text>";
      lastMonth = monday.getMonth();
    }
    for (let r = 0; r < 7; r++) {
      const d = addDays(monday, r);
      if (d > today && !sameDay(d, today)) continue; // no future days
      const info = days[dayKey(d)], lvl = dayLevel(info);
      if (lvl) { trainingDays++; if (d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) monthDays++; }
      svg += '<rect class="l' + lvl + (sameDay(d, today) ? " today" : "") + '" data-d="' + dayKey(d) + '" x="' + (LEFT + w * STEP) + '" y="' + (TOP + r * STEP) + '" width="' + CELL + '" height="' + CELL + '" rx="2.5"></rect>';
    }
  }
  svg += "</svg>";
  el.innerHTML =
    '<div class="cal-head"><span></span><small></small></div>' + svg +
    '<div class="cal-foot"><span class="cal-info"></span><span class="cal-legend"><small></small>' +
    [0, 1, 2, 3].map(l => '<i class="l' + l + '"></i>').join("") + "<small></small></span></div>";
  el.querySelector(".cal-head span").textContent = t("calDays", { n: trainingDays }) + " · " + t("calMonth", { n: monthDays });
  el.querySelector(".cal-head small").textContent = t("calSub", { n: weeks === 26 ? 6 : 12 });
  const leg = el.querySelectorAll(".cal-legend small");
  leg[0].textContent = t("calLess"); leg[1].textContent = t("calMore");
  const infoEl = el.querySelector(".cal-info");
  infoEl.textContent = t("calTap");
  el.querySelector("svg").addEventListener("click", e => {
    const r = e.target.closest("rect[data-d]"); if (!r) return;
    el.querySelectorAll("rect.sel").forEach(x => x.classList.remove("sel")); r.classList.add("sel");
    const [y, m, d] = r.dataset.d.split("-").map(Number), info = days[r.dataset.d];
    infoEl.textContent = fmtLong(new Date(y, m - 1, d)) + ": " + (info ? info.names.join(", ") : t("calRest"));
  });
}
