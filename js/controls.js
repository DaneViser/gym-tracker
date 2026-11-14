// Data buttons: backup (exportBackup), restore, load starter; backup reminder card.

import { $ } from "./dom.js";
import { starterProgram } from "./starter.js";
import { program, replaceState, save, state, t } from "./state.js";
import { addDays, fmtLong, mondayOfIsoWeek, setViewMonday, thisMonday, viewMonday } from "./dates.js";
import { editing, render, toast } from "./render.js";
import { openWelcome } from "./welcome.js";
import { hasActivity, renderProfile } from "./profile.js";

// ======================================================================
// Controls
// ======================================================================

// Phones: open the share sheet (save to Files / Drive / send to yourself). Computers: download.
export async function exportBackup() {
  const fname = "gym-tracker-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  const json = JSON.stringify(state, null, 2);
  const done = () => { state.backupCount = (state.backupCount || (state.lastBackup ? 1 : 0)) + 1; state.lastBackup = Date.now(); save(); renderNag(); if ($("profile").classList.contains("show")) renderProfile(); toast(t("backupSaved"), "device-floppy"); };
  const touch = window.matchMedia && matchMedia("(pointer: coarse)").matches;
  if (touch && typeof File === "function" && navigator.canShare) {
    try {
      const file = new File([json], fname, { type: "application/json" });
      if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: fname }); done(); return; }
    } catch (e) { if (e && e.name === "AbortError") return; }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  a.download = fname;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  done();
}

// ======================================================================
// Backup reminder
// ======================================================================
export const DAY = 864e5;
export function firstActivity() {
  let first = null;
  Object.keys(state.weeks).forEach(wk => {
    const m = /^(\d{4})-W(\d{2})$/.exec(wk); if (!m) return;
    const w = state.weeks[wk];
    if (Object.values(w).some(hasActivity)) { const mon = mondayOfIsoWeek(+m[1], +m[2]); if (!first || mon < first) first = mon; }
  });
  return first;
}
// Show when: there is real data, and no backup yet after 2 weeks of use, or the last one is > 30 days old.
export function renderNag() {
  const now = Date.now();
  let show = false, text = "";
  if (state.onboarded && !(state.backupSnooze > now)) {
    const first = firstActivity();
    if (first) {
      if (!state.lastBackup) { show = now - first.getTime() >= 14 * DAY; text = t("nagNever"); }
      else { show = now - state.lastBackup >= 30 * DAY; text = t("nagOld", { d: fmtLong(new Date(state.lastBackup)) }); }
    }
  }
  $("nag").hidden = !show;
  if (show) $("nagText").textContent = text;
}

// Runs once at startup (called from main.js): connects buttons and other page events.
export function init() {
  $("helpBtn").addEventListener("click", () => openWelcome("guide"));
  $("prevWk").addEventListener("click", () => { setViewMonday(addDays(viewMonday, -7)); render(); });
  $("nextWk").addEventListener("click", () => { setViewMonday(addDays(viewMonday, 7)); render(); });
  $("todayBtn").addEventListener("click", () => { setViewMonday(thisMonday); render(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  $("templateBtn").addEventListener("click", () => {
    if (program().length && !confirm(t("replaceConfirm"))) return;
    state.program = starterProgram(); editing.clear(); save(); render(); renderProfile(); toast(t("starterLoaded"));
  });
  $("exportBtn").addEventListener("click", exportBackup);
  $("nagBackup").addEventListener("click", exportBackup);
  $("nagLater").addEventListener("click", () => { state.backupSnooze = Date.now() + 7 * DAY; save(); renderNag(); });
  $("importBtn").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!data || typeof data.weeks !== "object") throw new Error("bad file");
        if (!confirm(t("restoreConfirm"))) return;
        if (!Array.isArray(data.program)) data.program = starterProgram();
        data.onboarded = true; if (!data.name) data.name = state.name;
        replaceState(data); editing.clear(); save(); render(); renderProfile(); toast(t("restored"));
      } catch (err) { alert(t("badBackup")); }
      e.target.value = "";
    };
    r.readAsText(f);
  });
}
