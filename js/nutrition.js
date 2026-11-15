// Calorie calculator (header button with the fork & knife; the body weight log above it is weight.js). calcNutrition() is pure maths (unit-tested);
// the rest is the sheet. Inputs are saved in state.nutrition; body weight is shared with the profile (state.profile.bw).
//
// How the estimate is made (standard, widely used formulas — an estimate, not medical advice):
//  - Resting burn (BMR): Mifflin-St Jeor 1990: 10×kg + 6.25×cm − 5×age + 5 (men) / −161 (women).
//    "General" (no sex chosen) uses the average of the two (−78).
//  - Daily life: BMR × job factor: mostly sitting 1.2, on your feet 1.375, physical work 1.55
//    (the usual activity multipliers, applied to the day without the gym).
//  - Workouts: weight training ≈ 5 MET (Compendium of Physical Activities 2011: 3.5 moderate … 6 vigorous).
//    Extra burn per session = (MET − 1) × kg × hours, spread over the week.
//  - Goal: about 7700 kcal per kg of body weight change, spread over 7 days.
//  - Never below 1500 (men) / 1200 (women) / 1350 (general) kcal — common safety floors.
//  - Protein 1.8 g/kg (2.0 g/kg when losing; research range 1.6–2.2), fat 0.9 g/kg, carbs = the rest.
//    Water ≈ 35 ml per kg.

import { $ } from "./dom.js";
import { state, save, t, esc, program } from "./state.js";
import { locale } from "./dates.js";
import { markSeenSilently } from "./achievements.js";
import { renderWeight } from "./weight.js";

export const JOBS = { desk: 1.2, feet: 1.375, physical: 1.55 };
export const GOALS = { lose05: -0.5, lose025: -0.25, keep: 0, gain025: 0.25, gain05: 0.5 };
const MET = 5, KCAL_PER_KG = 7700;
const FLOOR = { m: 1500, f: 1200, x: 1350 };
export const LIMITS = { kg: [30, 250], cm: [120, 230], age: [14, 90] };

// Returns null when an input is missing or out of range.
export function calcNutrition({ sex = "x", kg, cm, age, job = "desk", sessions = 0, minutes = 60, goal = "keep" }) {
  kg = +kg; cm = +cm; age = +age; sessions = +sessions; minutes = +minutes;
  const inRange = (v, [lo, hi]) => Number.isFinite(v) && v >= lo && v <= hi;
  if (!inRange(kg, LIMITS.kg) || !inRange(cm, LIMITS.cm) || !inRange(age, LIMITS.age)) return null;
  if (!(job in JOBS) || !(goal in GOALS)) return null;
  sessions = Math.min(Math.max(sessions || 0, 0), 14); minutes = Math.min(Math.max(minutes || 0, 0), 300);
  const sexAdj = sex === "m" ? 5 : sex === "f" ? -161 : -78;
  const bmr = 10 * kg + 6.25 * cm - 5 * age + sexAdj;
  const training = sessions * (MET - 1) * kg * (minutes / 60) / 7;
  const tdee = bmr * JOBS[job] + training;
  let target = tdee + GOALS[goal] * KCAL_PER_KG / 7;
  const warnings = [];
  const floor = FLOOR[sex] || FLOOR.x;
  if (target < floor) { target = floor; warnings.push("floor"); }
  if (target < bmr) warnings.push("belowBmr");
  const r10 = v => Math.round(v / 10) * 10;
  target = r10(target);
  const protein = Math.round(kg * (GOALS[goal] < 0 ? 2.0 : 1.8));
  const fat = Math.round(kg * 0.9);
  const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));
  return { bmr: r10(bmr), tdee: r10(tdee), target, training: r10(training), protein, fat, carbs, water: Math.round(kg * 0.035 * 10) / 10, warnings };
}

// ---------- the sheet ----------
const fmtInt = n => Math.round(n).toLocaleString(locale());
const numIn = v => { const n = parseFloat(String(v || "").replace(",", ".")); return Number.isFinite(n) ? n : NaN; };
function inputs() {
  const n = state.nutrition || {};
  return {
    sex: (state.profile && state.profile.sex) || "x",
    kg: state.profile && state.profile.bw ? state.profile.bw : "",
    cm: n.cm || "", age: n.age || "", job: n.job || "desk",
    sessions: n.sessions != null && n.sessions !== "" ? n.sessions : String(program().length),
    minutes: n.minutes || "60", goal: n.goal || "keep"
  };
}

function fillForm() {
  const v = inputs();
  $("nKg").value = v.kg; $("nCm").value = v.cm; $("nAge").value = v.age;
  $("nJob").innerHTML = Object.keys(JOBS).map(k => '<option value="' + k + '">' + esc(t("nJob_" + k)) + "</option>").join("");
  $("nGoal").innerHTML = Object.keys(GOALS).map(k => '<option value="' + k + '">' + esc(t("nGoal_" + k)) + "</option>").join("");
  $("nSessions").innerHTML = [0, 1, 2, 3, 4, 5, 6, 7].map(n => '<option value="' + n + '">' + n + "</option>").join("");
  $("nMinutes").innerHTML = [30, 45, 60, 75, 90, 120].map(n => '<option value="' + n + '">' + n + " min</option>").join("");
  $("nJob").value = v.job; $("nGoal").value = v.goal; $("nSessions").value = String(Math.min(+v.sessions || 0, 7)); $("nMinutes").value = String(v.minutes);
  [...$("nSex").children].forEach(b => b.classList.toggle("on", b.dataset.v === v.sex));
}

function readForm() {
  state.nutrition = { cm: $("nCm").value.trim(), age: $("nAge").value.trim(), job: $("nJob").value, sessions: $("nSessions").value, minutes: $("nMinutes").value, goal: $("nGoal").value };
  const kg = numIn($("nKg").value);
  if (kg >= LIMITS.kg[0] && kg <= LIMITS.kg[1]) state.profile = Object.assign({ sex: "x" }, state.profile, { bw: String(kg) }); // shared with the profile
  save();
}

function renderResult() {
  const v = inputs(), out = $("nOut");
  const res = calcNutrition({ sex: v.sex, kg: numIn($("nKg").value), cm: numIn($("nCm").value), age: numIn($("nAge").value), job: $("nJob").value, sessions: $("nSessions").value, minutes: $("nMinutes").value, goal: $("nGoal").value });
  if (!res) {
    out.innerHTML = '<p class="n-empty"></p>';
    out.firstChild.textContent = t("nFill", { kg: LIMITS.kg.join("–"), cm: LIMITS.cm.join("–"), age: LIMITS.age.join("–") });
    return;
  }
  const goal = $("nGoal").value;
  const macro = (label, g, kcalPerG, cls) => '<div class="stat ' + cls + '"><small>' + esc(label) + "</small><b>" + fmtInt(g) + " g</b><span class=\"sub\">" + fmtInt(g * kcalPerG) + " kcal</span></div>";
  out.innerHTML =
    '<div class="n-main"><small>' + esc(t("nEat")) + "</small><b>" + fmtInt(res.target) + "</b><span>" + esc(t("nPerDay")) + "</span><em></em></div>" +
    '<div class="stats n-macros">' + macro(t("nProtein"), res.protein, 4, "p") + macro(t("nFat"), res.fat, 9, "f") + macro(t("nCarbs"), res.carbs, 4, "c") + "</div>" +
    '<div class="pr-list n-rows">' +
      '<div class="pr-row"><span>' + esc(t("nTdee")) + "</span><b>" + fmtInt(res.tdee) + " kcal</b></div>" +
      '<div class="pr-row"><span>' + esc(t("nBmr")) + "</span><b>" + fmtInt(res.bmr) + " kcal</b></div>" +
      '<div class="pr-row"><span>' + esc(t("nTraining")) + "</span><b>+" + fmtInt(res.training) + " kcal</b></div>" +
      '<div class="pr-row"><span>' + esc(t("nWater")) + "</span><b>~" + res.water.toLocaleString(locale()) + " L</b></div>" +
    "</div>" + res.warnings.map(w => '<p class="note2 n-warn"></p>').join("");
  out.querySelector(".n-main em").textContent = t("nGoalNote_" + goal);
  out.querySelectorAll(".n-warn").forEach((p, i) => { p.textContent = t("nWarn_" + res.warnings[i]); });
}

export function openNutrition() {
  fillForm(); renderResult(); renderWeight();
  $("nutri").classList.add("show"); document.body.classList.add("modal-open");
}
function closeNutrition() {
  $("nutri").classList.remove("show");
  if (!document.querySelector(".modal.show")) document.body.classList.remove("modal-open");
}

// Runs once at startup (called from main.js).
export function init() {
  $("nutriBtn").addEventListener("click", openNutrition);
  $("nClose").addEventListener("click", closeNutrition);
  $("nutri").addEventListener("click", e => { if (e.target === $("nutri")) closeNutrition(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && $("nutri").classList.contains("show")) closeNutrition(); });
  ["nKg", "nCm", "nAge"].forEach(id => $(id).addEventListener("input", () => { readForm(); renderResult(); }));
  ["nJob", "nGoal", "nSessions", "nMinutes"].forEach(id => $(id).addEventListener("change", () => { readForm(); renderResult(); }));
  $("nSex").addEventListener("click", e => { // same setting as Profile → Strength milestones
    const b = e.target.closest("button[data-v]"); if (!b) return;
    state.profile = Object.assign({ bw: "" }, state.profile, { sex: b.dataset.v });
    markSeenSilently(r => r.a.sexNote); // switching targets is not an achievement (same as in the profile)
    save();
    [...$("nSex").children].forEach(x => x.classList.toggle("on", x === b));
    renderResult();
  });
}
