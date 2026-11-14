// Profile sheet: computeStats(), renderProfile(), settings (name, language, theme), delete all.

import { $ } from "./dom.js";
import { tr } from "./starter.js";
import { KEY, esc, lang, program, replaceState, save, state, t } from "./state.js";
import { addDays, fmtLong, fmtNum, mondayOfIsoWeek, thisMonday, weekKey } from "./dates.js";
import { bestSet, filled, num, setsOf } from "./data.js";
import { editing, render, toast } from "./render.js";
import { openProgress } from "./progress.js";
import { openWelcome, setLang } from "./welcome.js";
import { renderAchievements } from "./achievements.js";
import { storageProtected } from "./offline.js";

// ======================================================================
// Profile
// ======================================================================
export function allSessionRecords() {
  const out = [];
  Object.keys(state.weeks).sort().forEach(wk => {
    const m = /^(\d{4})-W(\d{2})$/.exec(wk); if (!m) return;
    const monday = mondayOfIsoWeek(+m[1], +m[2]);
    for (const sid in state.weeks[wk]) out.push({ wk, monday, sid, s: state.weeks[wk][sid] });
  });
  return out;
}
export function hasActivity(s) {
  if (!s) return false;
  if (s.done || Object.values(s.ex || {}).some(Boolean)) return true;
  return Object.keys(s.sets || {}).some(k => filled(s.sets[k]).length) || Object.values(s.w || {}).some(v => String(v || "").trim());
}
export function computeStats() {
  const recs = allSessionRecords();
  const byId = {}; program().forEach(s => { byId[s.id] = s; });
  const thisKey = weekKey(thisMonday);
  let workouts = 0, workoutsWeek = 0, sets = 0, setsWeek = 0, volume = 0, firstDate = null;
  const doneWeeks = new Set();
  const exSeen = {}; // exercise id -> name (from program, or anything with data)
  program().forEach(s => s.ex.forEach(e => { if (!exSeen[e.id] && e.name) exSeen[e.id] = tr("e", e.id, "name", e.name); }));
  const prs = {};
  recs.forEach(({ wk, monday, sid, s }) => {
    if (!s) return;
    if (hasActivity(s) && (!firstDate || monday < firstDate)) firstDate = monday;
    if (s.done) { workouts++; doneWeeks.add(wk); if (wk === thisKey) workoutsWeek++; }
    const ids = new Set([...Object.keys(s.sets || {}), ...Object.keys(s.w || {})]);
    ids.forEach(exId => {
      const st = filled(setsOf(s, exId));
      sets += st.length; if (wk === thisKey) setsWeek += st.length;
      st.forEach(x => { const w = num(x.w), r = num(x.r); if (w != null && r != null && w > 0 && r > 0) volume += w * r; });
      const b = bestSet(st);
      if (b && num(b.w) != null && exSeen[exId]) {
        const w = num(b.w), cur = prs[exId];
        const date = addDays(monday, byId[sid] ? byId[sid].dow : 0);
        if (!cur || w > cur.w || (w === cur.w && (num(b.r) || 0) > (num(cur.set.r) || 0))) prs[exId] = { id: exId, w, set: b, date, name: exSeen[exId] };
      }
    });
  });
  // Week streaks: consecutive weeks with at least one finished workout.
  let best = 0, run = 0, prev = null;
  [...doneWeeks].sort().forEach(k => {
    const m = /^(\d{4})-W(\d{2})$/.exec(k), mon = mondayOfIsoWeek(+m[1], +m[2]);
    run = prev && Math.round((mon - prev) / 864e5) === 7 ? run + 1 : 1;
    best = Math.max(best, run); prev = mon;
  });
  let current = 0, wkMon = doneWeeks.has(thisKey) ? thisMonday : addDays(thisMonday, -7);
  while (doneWeeks.has(weekKey(wkMon))) { current++; wkMon = addDays(wkMon, -7); }
  const records = Object.values(prs).sort((a, b) => b.w - a.w).slice(0, 8);
  return { workouts, workoutsWeek, sets, setsWeek, volume, firstDate, current, best, records };
}

export function renderProfile() {
  const name = state.name || "";
  $("prAvatar").textContent = name ? name.trim().charAt(0).toUpperCase() : "👤";
  $("prName").textContent = name || t("profile");
  const s = computeStats();
  $("prSince").textContent = s.firstDate ? t("since", { d: fmtLong(s.firstDate) }) : t("noSince");

  const vol = s.volume >= 1000 ? fmtNum(s.volume / 1000) + " t" : fmtNum(s.volume) + " " + t("kg");
  const card = (label, value, sub) => '<div class="stat"><small>' + esc(label) + '</small><b>' + esc(value) + '</b><span class="sub">' + esc(sub) + '</span></div>';
  $("prStats").innerHTML =
    card(t("stWorkouts"), String(s.workouts), t("stWorkoutsSub", { n: s.workoutsWeek })) +
    card(t("stStreak"), (s.current ? "🔥 " : "") + s.current, t("stStreakSub", { n: s.best })) +
    card(t("stSets"), String(s.sets), t("stSetsSub", { n: s.setsWeek })) +
    card(t("stVolume"), vol, t("stVolumeSub"));
  $("prFun").textContent = s.volume >= 1500 ? t("funCars", { n: fmtNum(Math.round(s.volume / 1500 * 10) / 10) }) : s.volume > 0 ? t("funStart") : "";

  const recEl = $("prRecords"); recEl.innerHTML = "";
  if (!s.records.length) { recEl.innerHTML = '<p class="rec-empty"></p>'; recEl.firstChild.textContent = t("recordsEmpty"); }
  const medals = ["🥇", "🥈", "🥉"];
  s.records.forEach((r, i) => {
    const row = document.createElement("div"); row.className = "rec";
    row.innerHTML = '<span class="medal">' + (medals[i] || "🏅") + '</span><span class="rn"><b></b><small></small></span><span class="rv"></span>';
    row.querySelector(".rn b").textContent = r.name;
    row.querySelector(".rn small").textContent = fmtLong(r.date);
    row.querySelector(".rv").innerHTML = esc(fmtNum(r.w) + " " + t("kg")) + (String(r.set.r || "").trim() ? '<small>× ' + esc(String(r.set.r).trim()) + " " + esc(t("reps")) + '</small>' : "");
    row.style.cursor = "pointer";
    row.addEventListener("click", () => { closeProfile(); openProgress(null, r.id); });
    recEl.appendChild(row);
  });

  $("exportBtn").querySelector("small").textContent = t("backupD") + " · " +
    (state.lastBackup ? t("lastBackup", { d: fmtLong(new Date(state.lastBackup)) }) : t("lastBackupNever"));
  $("prStorage").textContent = storageProtected ? t("storageSafe") : t("storageMaybe");
  renderAchievements();
  const prof = state.profile || {};
  [...$("prSex").children].forEach(b => b.classList.toggle("on", b.dataset.v === (prof.sex || "x")));
  if (document.activeElement !== $("prBw")) $("prBw").value = prof.bw || "";
  $("prNameInput").value = name;
  [...$("prLang").children].forEach(b => b.classList.toggle("on", b.dataset.v === lang));
  let th = "auto"; try { th = localStorage.getItem("gymtracker.theme") || "auto"; } catch (e) {}
  [...$("prTheme").children].forEach(b => b.classList.toggle("on", b.dataset.v === th));
}
export function openProfile() { renderProfile(); $("profile").classList.add("show"); document.body.classList.add("modal-open"); }
export function closeProfile() { $("profile").classList.remove("show"); document.body.classList.remove("modal-open"); }

export function applyTheme(v) {
  if (v === "auto") { document.documentElement.removeAttribute("data-theme"); try { localStorage.removeItem("gymtracker.theme"); } catch (e) {} }
  else { document.documentElement.setAttribute("data-theme", v); try { localStorage.setItem("gymtracker.theme", v); } catch (e) {} }
}

// Runs once at startup (called from main.js): connects buttons and other page events.
export function init() {
  $("profileBtn").addEventListener("click", openProfile);
  $("hello").addEventListener("click", openProfile);
  $("prClose").addEventListener("click", closeProfile);
  $("profile").addEventListener("click", e => { if (e.target === $("profile")) closeProfile(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && $("profile").classList.contains("show") && !$("achModal").classList.contains("show") && !$("achSheet").classList.contains("show")) closeProfile(); });
  $("prNameSave").addEventListener("click", () => {
    const v = $("prNameInput").value.trim(); if (!v) { $("prNameInput").focus(); return; }
    state.name = v; save(); render(); renderProfile(); toast(t("nameSaved"));
  });
  $("prNameInput").addEventListener("keydown", e => { if (e.key === "Enter") $("prNameSave").click(); });
  $("prLang").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (b) setLang(b.dataset.v); });
  $("prTheme").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (b) { applyTheme(b.dataset.v); renderProfile(); } });
  $("prGuide").addEventListener("click", () => { closeProfile(); openWelcome("guide"); });
  $("wipeBtn").addEventListener("click", () => {
    if (!confirm(t("wipeConfirm"))) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    replaceState({}); editing.clear(); closeProfile(); render(); openWelcome("first");
  });
}
