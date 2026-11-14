// Week maths (Monday-based ISO weeks) and date/number formatting.

import { lang } from "./state.js";

// ======================================================================
// Dates
// ======================================================================
export function startOfWeek(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; }
export function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function isoWeek(d) {
  const u = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  u.setUTCDate(u.getUTCDate() + 4 - (u.getUTCDay() || 7));
  const y0 = new Date(Date.UTC(u.getUTCFullYear(), 0, 1));
  return { year: u.getUTCFullYear(), week: Math.ceil(((u - y0) / 86400000 + 1) / 7) };
}
export function weekKey(monday) { const w = isoWeek(monday); return w.year + "-W" + String(w.week).padStart(2, "0"); }
export function mondayOfIsoWeek(year, week) { return addDays(startOfWeek(new Date(year, 0, 4)), (week - 1) * 7); }
export const locale = () => lang === "sr" ? "sr-Latn-RS" : undefined;
export const fmtShort = d => new Intl.DateTimeFormat(locale(), { day: "numeric", month: "short" }).format(d);
export const fmtLong = d => new Intl.DateTimeFormat(locale(), { day: "numeric", month: "short", year: "numeric" }).format(d);
export const fmtNum = n => (Math.round(n * 10) / 10).toLocaleString(locale(), { maximumFractionDigits: 1 });
export const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const today = new Date();
export const thisMonday = startOfWeek(today);
export let viewMonday = new Date(thisMonday); // the week shown on screen; change it with setViewMonday()
export function setViewMonday(d) { viewMonday = startOfWeek(d); }
