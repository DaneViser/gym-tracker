// Body weight log (top of the calorie sheet): weigh-ins, small chart, trend, calorie advice.
// Stored as state.bwLog = [{ d: "2026-11-15", kg: "80.4" }] (sorted by date, one per day). The newest
// weigh-in is also copied to state.profile.bw (strength badges and the calculator use it).
// bwTrend() and bwAdvice() are pure maths (unit-tested in tools/check.js).

import { $ } from "./dom.js";
import { esc, save, state, t } from "./state.js";
import { fmtNum, fmtShort } from "./dates.js";
import { num } from "./data.js";
import { icon } from "./icons.js";
import { GOALS } from "./nutrition.js";

export const BW_LIMITS = [20, 400];
const DAY = 864e5;
export const dayKey = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const toDate = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const log = () => Array.isArray(state.bwLog) ? state.bwLog : [];

// Trend over the last 4 weeks: least-squares slope in kg per week. null until there are 3+ weigh-ins over 10+ days.
export function bwTrend(entries, now = new Date()) {
  const from = now.getTime() - 28 * DAY;
  const pts = entries.map(e => ({ t: toDate(e.d).getTime(), kg: num(e.kg) })).filter(p => p.kg != null && p.t >= from && p.t <= now.getTime() + DAY);
  if (pts.length < 3) return null;
  const days = (pts[pts.length - 1].t - pts[0].t) / DAY;
  if (days < 10) return null;
  const mx = pts.reduce((a, p) => a + p.t, 0) / pts.length, my = pts.reduce((a, p) => a + p.kg, 0) / pts.length;
  let sxy = 0, sxx = 0; pts.forEach(p => { sxy += (p.t - mx) * (p.kg - my); sxx += (p.t - mx) ** 2; });
  return { perWeek: sxx ? sxy / sxx * 7 * DAY : 0, days, n: pts.length };
}
// Compare the trend with the calculator goal (kg per week). 7700 kcal ≈ 1 kg; changes are kept gentle (100–300 kcal).
export function bwAdvice(trend, goal = "keep") {
  if (!trend || trend.days < 14 || !(goal in GOALS)) return null;
  const diff = GOALS[goal] - trend.perWeek; // kg/week still missing (+ = should gain more / lose less)
  if (Math.abs(diff) < 0.15) return { kind: "ok" };
  const kcal = Math.min(300, Math.max(100, Math.round(Math.abs(diff) * 7700 / 7 / 50) * 50));
  return { kind: diff > 0 ? "more" : "less", kcal };
}

// Save a weigh-in for a day (replaces that day's entry). Returns false for impossible values.
export function addWeighIn(kg, d = new Date()) {
  const v = num(kg);
  if (v == null || v < BW_LIMITS[0] || v > BW_LIMITS[1]) return false;
  const k = dayKey(d), val = String(Math.round(v * 10) / 10);
  const list = log().filter(e => e.d !== k); list.push({ d: k, kg: val }); list.sort((a, b) => a.d < b.d ? -1 : 1);
  state.bwLog = list;
  if (list[list.length - 1].d === k) state.profile = Object.assign({ sex: "x" }, state.profile, { bw: val });
  return true;
}

function chart(entries) {
  const pts = entries.slice(-60).map(e => ({ t: toDate(e.d), kg: num(e.kg) })).filter(p => p.kg != null);
  if (pts.length < 2) return "";
  const W = 320, H = 120, pl = 34, pr = 12, pt = 12, pb = 20;
  let lo = Math.min(...pts.map(p => p.kg)), hi = Math.max(...pts.map(p => p.kg));
  if (hi - lo < 2) { const m = (hi + lo) / 2; lo = m - 1; hi = m + 1; }
  const t0 = pts[0].t.getTime(), t1 = pts[pts.length - 1].t.getTime();
  const x = d => t1 === t0 ? pl + (W - pl - pr) / 2 : pl + (d.getTime() - t0) / (t1 - t0) * (W - pl - pr);
  const y = v => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);
  const line = pts.map((p, i) => (i ? "L" : "M") + x(p.t).toFixed(1) + " " + y(p.kg).toFixed(1)).join(" ");
  return '<svg class="bw-chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(t("bwChartAria", { n: pts.length })) + '">' +
    '<line class="grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(hi) + '" y2="' + y(hi) + '"/>' +
    '<line class="grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(lo) + '" y2="' + y(lo) + '"/>' +
    '<text class="axis-t" x="' + (pl - 6) + '" y="' + (y(hi) + 4) + '" text-anchor="end">' + fmtNum(hi) + "</text>" +
    '<text class="axis-t" x="' + (pl - 6) + '" y="' + (y(lo) + 4) + '" text-anchor="end">' + fmtNum(lo) + "</text>" +
    '<path class="line" d="' + line + '"/>' +
    pts.map(p => '<circle class="dot" cx="' + x(p.t).toFixed(1) + '" cy="' + y(p.kg).toFixed(1) + '" r="' + (pts.length > 30 ? 2.5 : 3.5) + '"/>').join("") +
    '<text class="axis-t" x="' + pl + '" y="' + (H - 4) + '">' + esc(fmtShort(pts[0].t)) + "</text>" +
    '<text class="axis-t" x="' + (W - pr) + '" y="' + (H - 4) + '" text-anchor="end">' + esc(fmtShort(pts[pts.length - 1].t)) + "</text></svg>";
}

export function renderWeight() {
  const entries = log(), out = $("bwOut");
  const todays = entries.find(e => e.d === dayKey(new Date()));
  $("bwIn").placeholder = todays ? fmtNum(num(todays.kg)) : t("bwPh");
  if (!entries.length) { out.innerHTML = '<p class="bw-tip"></p>'; out.firstChild.textContent = t("bwTip"); return; }
  const trend = bwTrend(entries);
  const goal = (state.nutrition && state.nutrition.goal) || "keep";
  const adv = bwAdvice(trend, goal);
  const sign = v => (v > 0 ? "+" : v < 0 ? "−" : "") + fmtNum(Math.abs(v));
  let html = chart(entries) + '<p class="bw-trend"></p>';
  if (adv) html += '<p class="note2 bw-adv"></p>';
  html += '<ul class="bw-list">' + entries.slice(-5).reverse().map(e =>
    '<li><span>' + esc(fmtShort(toDate(e.d))) + "</span><b>" + esc(fmtNum(num(e.kg))) + " " + esc(t("kg")) + "</b>" +
    '<button type="button" class="bw-del" data-d="' + esc(e.d) + '" aria-label="' + esc(t("bwDelete")) + '" title="' + esc(t("bwDelete")) + '">' + icon("x") + "</button></li>").join("") + "</ul>";
  out.innerHTML = html;
  out.querySelector(".bw-trend").textContent = trend
    ? t("bwTrend", { v: sign(Math.round(trend.perWeek * 10) / 10), u: t("kg") })
    : t("bwNeedMore");
  if (adv) out.querySelector(".bw-adv").textContent = adv.kind === "ok"
    ? t("bwOk", { g: t("nGoal_" + goal) })
    : t(adv.kind === "less" ? "bwLess" : "bwMore", { k: adv.kcal, g: t("nGoal_" + goal) });
}

function saveWeighIn() {
  if (!addWeighIn($("bwIn").value)) { $("bwIn").focus(); $("bwErr").textContent = t("bwErr", { lo: BW_LIMITS[0], hi: BW_LIMITS[1] }); return; }
  $("bwErr").textContent = ""; $("bwIn").value = "";
  save(); renderWeight();
  // keep the calculator's weight in step with the newest weigh-in
  const last = state.bwLog[state.bwLog.length - 1];
  if ($("nKg").value !== last.kg && state.profile && state.profile.bw === last.kg) { $("nKg").value = last.kg; $("nKg").dispatchEvent(new Event("input")); }
}

// Runs once at startup (called from main.js).
export function init() {
  $("bwSave").addEventListener("click", saveWeighIn);
  $("bwIn").addEventListener("keydown", e => { if (e.key === "Enter") saveWeighIn(); });
  $("bwOut").addEventListener("click", e => {
    const b = e.target.closest(".bw-del"); if (!b) return;
    state.bwLog = log().filter(x => x.d !== b.dataset.d); save(); renderWeight();
  });
  $("nGoal").addEventListener("change", renderWeight); // advice follows the goal
}
