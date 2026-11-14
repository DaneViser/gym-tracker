// Saved data: KEY, language detection, t() translator, loading/saving `state` (localStorage),
// theme on load, program()/sorted() helpers.
"use strict";

// ======================================================================
// State
// ======================================================================
const KEY = "gymtracker.v1";

const uid = p => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let lang = "en";
try { lang = localStorage.getItem("gymtracker.lang") || ""; } catch (e) {}
if (lang !== "en" && lang !== "sr") {
  const nav = (navigator.languages && navigator.languages[0]) || navigator.language || "en";
  lang = /^(sr|hr|bs|sh|cnr|me)\b/i.test(nav) ? "sr" : "en";
}
function t(k, v) {
  let s = I18N[lang][k]; if (s == null) s = I18N.en[k]; if (s == null) return k;
  return v ? String(s).replace(/\{(\w+)\}/g, (_, n) => v[n] != null ? v[n] : "") : s;
}

let state = null;
try { const raw = localStorage.getItem(KEY); if (raw) state = JSON.parse(raw); } catch (e) {}
if (!state || typeof state !== "object" || typeof state.weeks !== "object") state = { weeks: {} };
if (!Array.isArray(state.program) && Object.keys(state.weeks).length > 0) state.program = starterProgram();
function saveRaw() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
function save() { saveRaw(); scheduleAchCheck(); } // every change may unlock an achievement

try { const th = localStorage.getItem("gymtracker.theme"); if (th) document.documentElement.setAttribute("data-theme", th); } catch (e) {}

const program = () => Array.isArray(state.program) ? state.program : [];
const sorted = () => program().slice().sort((a, b) => a.dow - b.dow);
