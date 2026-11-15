// Program library sheet: list of ready-made programs (filter by goal), detail view, "Use this program".
// Data is in programs.js; programWorkouts() (starter.js) turns a program into the user's workouts.

import { $ } from "./dom.js";
import { PROGRAMS, REFS } from "./programs.js";
import { LI, programIdOf, programWorkouts } from "./starter.js";
import { esc, program, save, state, t } from "./state.js";
import { editing, render, toast } from "./render.js";
import { icon } from "./icons.js";

export const GOALS = ["all", "strength", "muscle", "fatloss", "health", "home"];
const LEVELS = { beginner: "lvBeginner", intermediate: "lvIntermediate", advanced: "lvAdvanced" };
const goalKey = g => "g" + g[0].toUpperCase() + g.slice(1);
let goal = "all";

const L = arr => arr[LI()];
const meta = p => [t("pgDays", { n: p.workouts.length }), t("pgMins", { m: p.mins }), t(LEVELS[p.level])];

function renderList() {
  $("pgChips").innerHTML = GOALS.map(g => '<button type="button" class="pg-chip' + (g === goal ? " on" : "") + '" data-g="' + g + '" aria-pressed="' + (g === goal) + '">' + esc(t(goalKey(g))) + "</button>").join("");
  const cur = programIdOf(program());
  const list = PROGRAMS.filter(p => goal === "all" || p.goals.includes(goal));
  $("pgCards").innerHTML = list.map(p =>
    '<button type="button" class="pg-card' + (p.id === cur ? " cur" : "") + '" data-pid="' + p.id + '">' +
      '<span class="pg-t"><b>' + esc(L(p.title)) + "</b>" + (p.id === cur ? '<em class="pg-cur">' + esc(t("pgCurrent")) + "</em>" : "") + "</span>" +
      '<span class="pg-meta">' + meta(p).map(esc).join(" · ") + "</span>" +
      '<span class="pg-d">' + esc(L(p.desc)) + "</span>" +
      icon("chevron-right", "chev-r") +
    "</button>").join("");
}

function renderDetail(pid) {
  const p = PROGRAMS.find(x => x.id === pid); if (!p) return;
  const days = t("days");
  const week = p.workouts.map(s =>
    '<div class="pg-day"><div class="pg-dh"><span class="pg-dow">' + esc(days[s.dow]) + "</span><b>" + esc(L(s.title)) + "</b><small>" + esc(L(s.sub)) + "</small></div>" +
    "<ul>" + s.ex.map(e => "<li><span>" + esc(L(e.name)) + (e.optional ? ' <i class="pg-opt">' + esc(t("optional")) + "</i>" : "") + "</span><b>" + esc(L(e.sets)) + "</b></li>").join("") + "</ul></div>").join("");
  const refs = p.refs.map(k => REFS[k]).filter(Boolean).map(([cite, what]) => "<li><b>" + esc(L(what)) + "</b><small>" + esc(cite) + "</small></li>").join("");
  $("pgDetail").innerHTML =
    '<button type="button" class="linkbtn pg-back" id="pgBack">' + icon("chevron-left") + "<span>" + esc(t("pgBack")) + "</span></button>" +
    "<h3 class=\"pg-h\">" + esc(L(p.title)) + "</h3>" +
    '<p class="pg-meta">' + meta(p).map(esc).join(" · ") + "</p>" +
    '<p class="pg-desc">' + esc(L(p.desc)) + "</p>" +
    '<h4 class="pg-sub">' + esc(t("pgWeek")) + "</h4>" + week +
    '<h4 class="pg-sub">' + esc(t("pgHow")) + '</h4><p class="pg-how">' + esc(L(p.how)) + "</p>" +
    '<h4 class="pg-sub">' + esc(t("pgBased")) + '</h4><ul class="pg-refs">' + refs + "</ul>" +
    '<div class="pg-use"><button type="button" class="pill primary wide" id="pgUse" data-pid="' + p.id + '">' + esc(t("pgUse")) + "</button></div>";
  $("pgList").hidden = true; $("pgDetail").hidden = false;
  $("progs").querySelector(".sheet").scrollTop = 0;
}

function showList() { $("pgDetail").hidden = true; $("pgList").hidden = false; renderList(); }

export function openPrograms() {
  showList();
  $("progs").classList.add("show"); document.body.classList.add("modal-open");
  $("progs").querySelector(".sheet").scrollTop = 0;
}
function closePrograms() {
  $("progs").classList.remove("show");
  if (!document.querySelector(".modal.show")) document.body.classList.remove("modal-open");
}

export function useProgram(pid) {
  const p = PROGRAMS.find(x => x.id === pid); if (!p) return;
  if (program().length && !confirm(t("pgReplace", { p: L(p.title) }))) return;
  state.program = programWorkouts(pid); // history in state.weeks is untouched
  editing.clear(); save(); render();
  document.querySelectorAll(".modal.show").forEach(m => m.classList.remove("show"));
  document.body.classList.remove("modal-open");
  window.scrollTo({ top: 0 });
  toast(t("pgLoaded", { p: L(p.title) }));
}

// Runs once at startup (called from main.js).
export function init() {
  $("templateBtn").addEventListener("click", openPrograms);
  $("pgClose").addEventListener("click", closePrograms);
  $("progs").addEventListener("click", e => {
    if (e.target === $("progs")) return closePrograms();
    const chip = e.target.closest(".pg-chip"); if (chip) { goal = chip.dataset.g; renderList(); return; }
    const cardEl = e.target.closest(".pg-card"); if (cardEl) { renderDetail(cardEl.dataset.pid); return; }
    if (e.target.closest("#pgBack")) { showList(); return; }
    const use = e.target.closest("#pgUse"); if (use) useProgram(use.dataset.pid);
  });
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape" || !$("progs").classList.contains("show")) return;
    if (!$("pgDetail").hidden) showList(); else closePrograms();
  });
  document.addEventListener("click", e => { if (e.target.closest("#emptyProgs")) openPrograms(); }); // button in the empty week
}
