// Built-in programs as the user's workouts: STARTER (the original 4-day plan), programWorkouts(id),
// starterProgram(), and tr() (shows built-in names in the current language unless the user renamed them).
// The program data itself lives in programs.js.

import { lang } from "./state.js";
import { PROGRAMS } from "./programs.js";

export const STARTER = PROGRAMS[0].workouts; // "Strength for physical work" (ids upper1, lowerA, upper2, lowerB)
export const LI = () => lang === "sr" ? 1 : 0;

// A library program as plain workouts in the current language (what gets stored in state.program).
export function programWorkouts(pid) {
  const p = PROGRAMS.find(x => x.id === pid); if (!p) return [];
  const i = LI();
  return p.workouts.map(s => ({
    id: s.id, dow: s.dow, altDow: s.altDow, title: s.title[i], sub: s.sub[i],
    ex: s.ex.map(e => Object.assign({ id: e.id, name: e.name[i], sets: e.sets[i] }, e.optional ? { optional: true } : {}))
  }));
}
export const starterProgram = () => programWorkouts(PROGRAMS[0].id);

// Which library program the user's workouts came from (same workout ids), or null.
export function programIdOf(prog) {
  if (!Array.isArray(prog) || !prog.length) return null;
  const ids = prog.map(s => s.id).sort().join("|");
  const p = PROGRAMS.find(x => x.workouts.map(s => s.id).sort().join("|") === ids);
  return p ? p.id : null;
}

// Show built-in texts in the current language (only if the user hasn't changed the text).
// The same exercise id can appear in several programs with different texts, so each id keeps a list.
export const starterIndex = {};
const add = (k, src) => { (starterIndex[k] = starterIndex[k] || []).push(src); };
PROGRAMS.forEach(p => p.workouts.forEach(s => { add("w:" + s.id, s); s.ex.forEach(e => add("e:" + e.id, e)); }));
export function tr(kind, id, field, value) {
  for (const src of starterIndex[kind + ":" + id] || []) if (src[field] && src[field].includes(value)) return src[field][LI()];
  return value;
}
