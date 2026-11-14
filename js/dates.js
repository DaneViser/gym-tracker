// Week maths (Monday-based ISO weeks) and date/number formatting.
"use strict";

// ======================================================================
// Dates
// ======================================================================
function startOfWeek(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function isoWeek(d) {
  const u = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  u.setUTCDate(u.getUTCDate() + 4 - (u.getUTCDay() || 7));
  const y0 = new Date(Date.UTC(u.getUTCFullYear(), 0, 1));
  return { year: u.getUTCFullYear(), week: Math.ceil(((u - y0) / 86400000 + 1) / 7) };
}
function weekKey(monday) { const w = isoWeek(monday); return w.year + "-W" + String(w.week).padStart(2, "0"); }
function mondayOfIsoWeek(year, week) { return addDays(startOfWeek(new Date(year, 0, 4)), (week - 1) * 7); }
const locale = () => lang === "sr" ? "sr-Latn-RS" : undefined;
const fmtShort = d => new Intl.DateTimeFormat(locale(), { day: "numeric", month: "short" }).format(d);
const fmtLong = d => new Intl.DateTimeFormat(locale(), { day: "numeric", month: "short", year: "numeric" }).format(d);
const fmtNum = n => (Math.round(n * 10) / 10).toLocaleString(locale(), { maximumFractionDigits: 1 });
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const today = new Date();
const thisMonday = startOfWeek(today);
let viewMonday = new Date(thisMonday);
