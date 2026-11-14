// Built-in 4-day starter program in both languages: STARTER, starterProgram(), tr() (shows starter
// names in the current language unless the user renamed them).
"use strict";

// Starter program, in both languages. Stored workouts keep plain strings;
// if a stored string still equals a starter default, it is shown in the current language.
const STARTER = [
  { id: "upper1", dow: 1, altDow: null, title: ["Upper 1", "Gornji 1"], sub: ["Push, pull, shoulder health", "Guranje, vučenje, zdravlje ramena"], ex: [
    { id: "bench", name: ["Bench press / machine chest press", "Bench press / mašina za grudi"], sets: ["3–4 × 6–10", "3–4 × 6–10"] },
    { id: "mpress", name: ["Machine shoulder press", "Potisak za ramena na mašini"], sets: ["3 × 8–10", "3 × 8–10"] },
    { id: "pullups", name: ["Pull-ups", "Zgibovi"], sets: ["lots of sets", "puno serija"] },
    { id: "row", name: ["Row (cable / machine)", "Veslanje (sajla / mašina)"], sets: ["3 × 10–12", "3 × 10–12"] },
    { id: "sidedelt", name: ["Side delt raises", "Lateralna podizanja"], sets: ["3 × 12–15", "3 × 12–15"] },
    { id: "facepull", name: ["Face pulls", "Face pull"], sets: ["3 × 15", "3 × 15"], isNew: true },
    { id: "biceps", name: ["Biceps", "Biceps"], sets: ["1–2 exercises", "1–2 vežbe"], optional: true },
    { id: "triceps", name: ["Triceps", "Triceps"], sets: ["1–2 exercises", "1–2 vežbe"], optional: true },
    { id: "grip1", name: ["Farmer's carry (replaces forearms)", "Farmerski hod (umesto podlaktica)"], sets: ["3 × 30 m", "3 × 30 m"], isNew: true }
  ]},
  { id: "lowerA", dow: 2, altDow: 3, title: ["Lower A", "Donji A"], sub: ["Strength day", "Dan snage"], ex: [
    { id: "squat", name: ["Squat", "Čučanj"], sets: ["3–4 × 5–8", "3–4 × 5–8"] },
    { id: "rdl", name: ["Romanian deadlift", "Rumunsko mrtvo dizanje"], sets: ["3 × 8", "3 × 8"] },
    { id: "bss", name: ["Bulgarian split squat", "Bugarski čučanj"], sets: ["3 × 8 / side", "3 × 8 / strana"], isNew: true },
    { id: "legcurlA", name: ["Leg curls", "Pregib nogu (leg curl)"], sets: ["3 × 10–12", "3 × 10–12"] },
    { id: "farmer", name: ["Farmer's carry, heavy", "Farmerski hod, teško"], sets: ["4 × 30–40 m", "4 × 30–40 m"], isNew: true },
    { id: "deadbug", name: ["Dead bug or Pallof press", "Dead bug ili Pallof potisak"], sets: ["3 × 8–10 / side", "3 × 8–10 / strana"], isNew: true }
  ]},
  { id: "upper2", dow: 5, altDow: null, title: ["Upper 2", "Gornji 2"], sub: ["Standing press, rotation", "Potisak iz stajanja, rotacija"], ex: [
    { id: "bench", name: ["Bench press / machine chest press", "Bench press / mašina za grudi"], sets: ["3–4 × 6–10", "3–4 × 6–10"] },
    { id: "ohp", name: ["Standing overhead press (DB or barbell)", "Potisak iznad glave iz stajanja (bučice ili šipka)"], sets: ["3 × 6–8", "3 × 6–8"], isNew: true },
    { id: "pullups", name: ["Pull-ups", "Zgibovi"], sets: ["lots of sets", "puno serija"] },
    { id: "row", name: ["Row (cable / machine)", "Veslanje (sajla / mašina)"], sets: ["3 × 10–12", "3 × 10–12"] },
    { id: "sidedelt", name: ["Side delt raises", "Lateralna podizanja"], sets: ["3 × 12–15", "3 × 12–15"] },
    { id: "facepull", name: ["Face pulls", "Face pull"], sets: ["3 × 15", "3 × 15"], isNew: true },
    { id: "landmine", name: ["Landmine rotations", "Landmine rotacije"], sets: ["3 × 8 / side", "3 × 8 / strana"], isNew: true },
    { id: "biceps", name: ["Biceps", "Biceps"], sets: ["1–2 exercises", "1–2 vežbe"], optional: true },
    { id: "triceps", name: ["Triceps", "Triceps"], sets: ["1–2 exercises", "1–2 vežbe"], optional: true },
    { id: "grip2", name: ["Plate pinch carry (replaces forearms)", "Nošenje ploča štipanjem (umesto podlaktica)"], sets: ["3 × 30 m", "3 × 30 m"], isNew: true }
  ]},
  { id: "lowerB", dow: 6, altDow: null, title: ["Lower B", "Donji B"], sub: ["Work simulation day", "Dan simulacije posla"], ex: [
    { id: "deadlift", name: ["Trap bar or conventional deadlift", "Mrtvo dizanje (trap šipka ili klasično)"], sets: ["3 × 5", "3 × 5"], isNew: true },
    { id: "sandbag", name: ["Sandbag / KB floor to shoulder", "Džak / girja od poda do ramena"], sets: ["4 × 5 / side", "4 × 5 / strana"], isNew: true },
    { id: "swings", name: ["Kettlebell swings", "Zamasi girjom"], sets: ["3 × 15", "3 × 15"], isNew: true },
    { id: "legext", name: ["Leg extensions + leg curls", "Opružanje + pregib nogu"], sets: ["2–3 × 12 each", "2–3 × 12 svaka"], optional: true },
    { id: "suitcase", name: ["Suitcase carry", "Nošenje kofera (jednom rukom)"], sets: ["3 × 30 m / side", "3 × 30 m / strana"], isNew: true },
    { id: "backext", name: ["Back extensions", "Hiperekstenzije"], sets: ["3 × 12–15", "3 × 12–15"], isNew: true },
    { id: "sideplank", name: ["Side plank", "Bočni plank"], sets: ["3 × 30–45 s / side", "3 × 30–45 s / strana"], isNew: true }
  ]}
];
const LI = () => lang === "sr" ? 1 : 0;
function starterProgram() {
  const i = LI();
  return STARTER.map(s => ({
    id: s.id, dow: s.dow, altDow: s.altDow, title: s.title[i], sub: s.sub[i],
    ex: s.ex.map(e => Object.assign({ id: e.id, name: e.name[i], sets: e.sets[i] }, e.isNew ? { isNew: true } : {}, e.optional ? { optional: true } : {}))
  }));
}
// Show starter defaults in the current language (only if the user hasn't changed the text).
const starterIndex = {};
STARTER.forEach(s => { starterIndex["w:" + s.id] = s; s.ex.forEach(e => { starterIndex["e:" + e.id] = e; }); });
function tr(kind, id, field, value) {
  const src = starterIndex[kind + ":" + id];
  if (!src || !src[field]) return value;
  return src[field].includes(value) ? src[field][LI()] : value;
}
