// Saved data: KEY, language, t() translator, the `state` object and saving it to localStorage,
// normalizeState() (repairs damaged or old data), theme on load, program()/sorted() helpers.
//
// `state` is ONE object that never gets replaced (other files import it). To swap in different data
// (restore a backup, delete all) call replaceState(newData), which cleans it with normalizeState().

import { I18N } from "./i18n.js";
import { starterProgram } from "./starter.js";

export const KEY = "gymtracker.v1";

export const uid = p => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- language ----------
export let lang = "en";
export function setLangValue(l) { lang = l === "sr" ? "sr" : "en"; }
export function detectLang() {
  let l = "";
  try { l = localStorage.getItem("gymtracker.lang") || ""; } catch (e) {}
  if (l !== "en" && l !== "sr") {
    const nav = (typeof navigator !== "undefined" && ((navigator.languages && navigator.languages[0]) || navigator.language)) || "en";
    l = /^(sr|hr|bs|sh|cnr|me)\b/i.test(nav) ? "sr" : "en";
  }
  setLangValue(l);
}
export function t(k, v) {
  let s = I18N[lang][k]; if (s == null) s = I18N.en[k]; if (s == null) return k;
  return v ? String(s).replace(/\{(\w+)\}/g, (_, n) => v[n] != null ? v[n] : "") : s;
}

// ---------- data ----------
export const state = { weeks: {} };
export const isObj = v => v !== null && typeof v === "object" && !Array.isArray(v);
export const str = (v, max) => (typeof v === "string" ? v : v == null ? "" : String(v)).slice(0, max || 200);
export const dayNum = v => Number.isInteger(+v) && +v >= 0 && +v <= 6 && v !== "" && v !== null ? +v : null;

// Turn anything (old versions, hand-edited or half-broken backups) into a safe, well-formed state.
// Unknown extra fields are kept, so future versions don't lose data when an older app opens it.
export function normalizeState(raw) {
  const s = isObj(raw) ? Object.assign({}, raw) : {};
  // weeks: { "2026-W46": { workoutId: { done, ex:{}, w:{}, sets:{ exId:[{w,r}] } } } }
  const weeks = {};
  if (isObj(s.weeks)) for (const wk of Object.keys(s.weeks)) {
    if (!/^\d{4}-W\d{2}$/.test(wk) || !isObj(s.weeks[wk])) continue;
    const out = {};
    for (const sid of Object.keys(s.weeks[wk])) {
      const r = s.weeks[wk][sid];
      if (!isObj(r)) continue;
      const sets = {};
      if (isObj(r.sets)) for (const exId of Object.keys(r.sets)) {
        if (Array.isArray(r.sets[exId])) sets[exId] = r.sets[exId].filter(isObj).map(x => ({ w: str(x.w, 20), r: str(x.r, 20) }));
      }
      const w = {};
      if (isObj(r.w)) for (const exId of Object.keys(r.w)) w[exId] = str(r.w[exId], 20);
      const ex = {};
      if (isObj(r.ex)) for (const exId of Object.keys(r.ex)) ex[exId] = !!r.ex[exId];
      out[sid] = Object.assign({}, r, { done: !!r.done, ex, w, sets });
      if (r.doneAt != null && !(Number.isFinite(+r.doneAt) && +r.doneAt > 0)) delete out[sid].doneAt; // when it was ticked done (ms)
    }
    weeks[wk] = out;
  }
  s.weeks = weeks;
  // program: [{ id, dow, altDow, title, sub, ex:[{ id, name, sets, optional?, isNew? }] }]
  if (Array.isArray(s.program)) {
    const seen = new Set();
    s.program = s.program.filter(isObj).map(p => {
      let id = str(p.id, 80) || uid("w");
      if (seen.has(id)) id = uid("w"); seen.add(id);
      const dow = dayNum(p.dow) == null ? 0 : dayNum(p.dow);
      let altDow = dayNum(p.altDow); if (altDow === dow) altDow = null;
      const exSeen = new Set();
      const ex = (Array.isArray(p.ex) ? p.ex : []).filter(isObj).map(e => {
        let eid = str(e.id, 80) || uid("ex");
        if (exSeen.has(eid)) eid = uid("ex"); exSeen.add(eid);
        const o = Object.assign({}, e, { id: eid, name: str(e.name, 60), sets: str(e.sets, 30) });
        if (e.optional) o.optional = true; else delete o.optional;
        if (e.isNew) o.isNew = true; else delete o.isNew;
        return o;
      });
      return Object.assign({}, p, { id, dow, altDow, title: str(p.title, 40), sub: str(p.sub, 60), ex });
    });
  } else if (Object.keys(weeks).length > 0) {
    s.program = starterProgram(); // data from before custom workouts existed
  } else {
    delete s.program;            // brand new: the welcome screen lets them choose
  }
  s.name = str(s.name, 30).trim();
  if (!s.name) delete s.name;
  if (isObj(s.profile)) {
    s.profile = { sex: ["m", "f", "x"].includes(s.profile.sex) ? s.profile.sex : "x", bw: str(s.profile.bw, 6) };
  } else delete s.profile;
  for (const k of ["lastBackup", "backupSnooze", "backupCount", "achVersion"]) if (s[k] != null && !Number.isFinite(+s[k])) delete s[k];
  if (s.achSeen != null && !isObj(s.achSeen)) delete s.achSeen;
  if (isObj(s.nutrition)) { const n = s.nutrition; s.nutrition = { cm: str(n.cm, 6), age: str(n.age, 3), job: str(n.job, 12), sessions: str(n.sessions, 2), minutes: str(n.minutes, 3), goal: str(n.goal, 12) }; }
  else delete s.nutrition;
  return s;
}

export function replaceState(raw) {
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, normalizeState(raw));
}

// Load saved data. If it can't be read (corrupted JSON), keep a copy under another key
// instead of overwriting it with the next save, so it can still be recovered by hand.
export function loadState() {
  detectLang();
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
    replaceState(raw ? JSON.parse(raw) : {});
  } catch (e) {
    try { if (raw) localStorage.setItem(KEY + ".corrupt-" + Date.now(), raw); } catch (e2) {}
    replaceState({});
  }
  try { const th = localStorage.getItem("gymtracker.theme"); if (th) document.documentElement.setAttribute("data-theme", th); } catch (e) {}
}

// Saving. Other files hook in without import cycles: onSaved(fn) runs after each save (achievements),
// onSaveFailed(fn) runs when the browser refuses to store (storage full / blocked).
export const savedHooks = [], failHooks = [];
export const onSaved = fn => { savedHooks.push(fn); };
export const onSaveFailed = fn => { failHooks.push(fn); };
export function saveRaw() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
  catch (e) { failHooks.forEach(f => f(e)); return false; }
}
export function save() { if (saveRaw()) savedHooks.forEach(f => f()); }

export const program = () => Array.isArray(state.program) ? state.program : [];
export const sorted = () => program().slice().sort((a, b) => a.dow - b.dow);
