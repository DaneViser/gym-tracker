// First-visit welcome (name, starter or own program), how-to guide, setLang().

import { $ } from "./dom.js";
import { starterProgram } from "./starter.js";
import { save, setLangValue, state, t } from "./state.js";
import { applyStatic, render, toast } from "./render.js";
import { openProgress } from "./progress.js";
import { renderProfile } from "./profile.js";

// ======================================================================
// Welcome / guide / language
// ======================================================================
export let guideOnly = false, wMode = "first";
export function showStep(n) {
  $("step1").hidden = n !== 1; $("step2").hidden = n !== 2;
  [...$("stepdots").children].forEach((d, i) => d.classList.toggle("on", i === n - 1));
  $("stepdots").style.visibility = guideOnly ? "hidden" : "visible";
}
export function welcomeTexts() {
  $("wTitle").textContent = wMode === "name" ? t("changeName") : t("welcome");
  $("next1").textContent = wMode === "name" ? t("save") : t("next");
  $("finish").textContent = guideOnly ? t("gotIt") : t("letsGo");
  $("guideLead").textContent = guideOnly ? t("howLeadAgain") : t("howLead");
  if ($("nameErr").textContent) $("nameErr").textContent = t("nameErr");
}
export function openWelcome(mode) {
  wMode = mode; guideOnly = mode === "guide";
  $("programChoice").hidden = mode !== "first" || Array.isArray(state.program);
  $("nameInput").value = state.name || ""; $("nameErr").textContent = "";
  $("back2").hidden = guideOnly;
  welcomeTexts();
  showStep(guideOnly ? 2 : 1);
  $("welcome").classList.add("show"); document.body.classList.add("modal-open");
  if (!guideOnly) setTimeout(() => $("nameInput").focus(), 50);
}
export function closeWelcome() { $("welcome").classList.remove("show"); document.body.classList.remove("modal-open"); }

export function setLang(l) {
  setLangValue(l);
  try { localStorage.setItem("gymtracker.lang", l); } catch (e) {}
  applyStatic(); render();
  if ($("welcome").classList.contains("show")) welcomeTexts();
  if ($("progress").classList.contains("show")) openProgress(null);
  if ($("profile").classList.contains("show")) renderProfile();
}

// Runs once at startup (called from main.js): connects buttons and other page events.
export function init() {
  $("next1").addEventListener("click", () => {
    const name = $("nameInput").value.trim();
    if (!name) { $("nameErr").textContent = t("nameErr"); $("nameInput").focus(); return; }
    state.name = name;
    if (!$("programChoice").hidden) {
      const choice = document.querySelector('input[name="start"]:checked').value;
      state.program = choice === "template" ? starterProgram() : [];
    }
    if (!Array.isArray(state.program)) state.program = [];
    save(); render();
    if (wMode === "name") { closeWelcome(); toast(t("nameSaved")); return; }
    showStep(2);
  });
  $("nameInput").addEventListener("keydown", e => { if (e.key === "Enter") $("next1").click(); });
  $("back2").addEventListener("click", () => showStep(1));
  $("finish").addEventListener("click", () => { if (!guideOnly) { state.onboarded = true; save(); } closeWelcome(); });
  $("welcome").addEventListener("click", e => { if (e.target === $("welcome") && state.onboarded) closeWelcome(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && state.onboarded && $("welcome").classList.contains("show")) closeWelcome(); });
  $("langSeg").addEventListener("click", e => { const b = e.target.closest("button[data-lang]"); if (b) setLang(b.dataset.lang); });
}
