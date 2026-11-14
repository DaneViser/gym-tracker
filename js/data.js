// Reading week/session/set data: sessionData(), setsOf(), bestSet(), lastSets(), setText(), num().

import { program, state, t } from "./state.js";

// ======================================================================
// Week / set data
// ======================================================================
export function weekData(key, create) { if (!state.weeks[key] && create) state.weeks[key] = {}; return state.weeks[key] || {}; }
export function sessionData(key, sid, create) {
  const w = weekData(key, create);
  if (!w[sid] && create) w[sid] = { ex: {}, w: {}, sets: {}, done: false };
  const s = w[sid] || { ex: {}, w: {}, sets: {}, done: false };
  if (!s.sets) s.sets = {};
  if (!s.w) s.w = {};
  return s;
}
export function doneCount(key) { const w = state.weeks[key]; if (!w) return 0; return program().filter(s => w[s.id] && w[s.id].done).length; }

export const num = v => { const m = String(v == null ? "" : v).match(/-?\d+(?:[.,]\d+)?/); return m ? parseFloat(m[0].replace(",", ".")) : null; };
// Sets for an exercise in one session record; falls back to the old single-weight field.
export function setsOf(s, exId) {
  if (!s) return [];
  if (s.sets && Array.isArray(s.sets[exId])) return s.sets[exId];
  if (s.w && s.w[exId]) return [{ w: s.w[exId], r: "" }];
  return [];
}
export const filled = st => st.filter(x => String(x.w || "").trim() || String(x.r || "").trim());
// Best set: heaviest weight (ties -> more reps); if no weights, most reps.
export function bestSet(st) {
  const f = filled(st); if (!f.length) return null;
  const withW = f.filter(x => num(x.w) != null);
  if (withW.length) return withW.reduce((a, b) => (num(b.w) > num(a.w) || (num(b.w) === num(a.w) && (num(b.r) || 0) > (num(a.r) || 0))) ? b : a);
  const withR = f.filter(x => num(x.r) != null);
  if (withR.length) return withR.reduce((a, b) => num(b.r) > num(a.r) ? b : a);
  return f[0];
}
export function setText(x) {
  const w = String(x.w || "").trim(), r = String(x.r || "").trim();
  if (w && r) return w + "×" + r;
  if (w) return w;
  return r + " " + t("reps");
}
export const setsText = st => filled(st).map(setText).join(", ");
export function plannedCount(ex) { const m = String(ex.sets || "").match(/^\s*(\d+)/); const n = m ? +m[1] : 3; return Math.min(Math.max(n, 1), 8); }
export function lastSets(sid, exId, beforeKey) {
  const keys = Object.keys(state.weeks).filter(k => k < beforeKey).sort().reverse();
  for (const k of keys) { const st = filled(setsOf(state.weeks[k][sid], exId)); if (st.length) return st; }
  for (const k of keys) for (const sid2 in state.weeks[k]) { const st = filled(setsOf(state.weeks[k][sid2], exId)); if (st.length) return st; }
  return [];
}
