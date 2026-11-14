// Achievements: ICONS (Tabler, MIT), LIFTS name matching, LADDERS (researched standards), ACH badge
// list, ACH_VERSION, metrics, badge sheet + detail, celebration pop-ups, new-record pop-up.
"use strict";

// ======================================================================
// Achievements  (icons: Tabler Icons, MIT license, see THIRD_PARTY_LICENSES.md)
// ======================================================================
// Everything here is DERIVED from state.weeks / state.program, so old history counts.
// Only state.achSeen (highest tier already celebrated per badge) is stored, so we know what is new.
const ICONS = {
  "info-circle": "M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0 M12 9h.01 M11 12h1v4h1",
  "arrow-big-up-lines": "M9 12h-3.586a1 1 0 0 1 -.707 -1.707l6.586 -6.586a1 1 0 0 1 1.414 0l6.586 6.586a1 1 0 0 1 -.707 1.707h-3.586v3h-6v-3z M9 21h6 M9 18h6",
  stopwatch: "M5 13a7 7 0 1 0 14 0a7 7 0 0 0 -14 0z M14.5 10.5l-2.5 2.5 M17 8l1 -1 M14 3h-4",
  "arrows-vertical": "M8 7l4 -4l4 4 M8 17l4 4l4 -4 M12 3l0 18",
  "arrow-bar-to-up": "M12 10l0 10 M12 10l4 4 M12 10l-4 4 M4 4l16 0",
  "chevrons-up": "M7 11l5 -5l5 5 M7 17l5 -5l5 5",
  "chevrons-down": "M7 7l5 5l5 -5 M7 13l5 5l5 -5",
  walk: "M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0 M7 21l3 -4 M16 21l-2 -4l-3 -3l1 -6 M6 12l2 -3l4 -1l3 3l3 1",
  award: "M12 9m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0 M12 15l3.4 5.89l1.598 -3.233l3.598 .232l-3.4 -5.889 M6.802 12l-3.4 5.89l3.598 -.233l1.598 3.232l3.4 -5.889",
  barbell: "M2 12h1 M6 8h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2 M6 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1z M9 12h6 M15 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1z M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-2 M22 12h-1",
  "calendar-check": "M11.5 21h-5.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v6 M16 3v4 M8 3v4 M4 11h16 M15 19l2 2l4 -4",
  "device-floppy": "M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2 M12 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M14 4l0 4l-6 0l0 -4",
  flame: "M12 12c2 -2.96 0 -7 -1 -8c0 3.038 -1.773 4.741 -3 6c-1.226 1.26 -2 3.24 -2 5a6 6 0 1 0 12 0c0 -1.532 -1.056 -3.94 -2 -5c-1.786 3 -2.791 3 -4 2z",
  "list-check": "M3.5 5.5l1.5 1.5l2.5 -2.5 M3.5 11.5l1.5 1.5l2.5 -2.5 M3.5 17.5l1.5 1.5l2.5 -2.5 M11 6l9 0 M11 12l9 0 M11 18l9 0",
  lock: "M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6z M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0 M8 11v-4a4 4 0 1 1 8 0v4",
  refresh: "M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4 M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4",
  scale: "M7 20l10 0 M6 6l6 -1l6 1 M12 3l0 17 M9 12l-3 -6l-3 6a3 3 0 0 0 6 0 M21 12l-3 -6l-3 6a3 3 0 0 0 6 0",
  sparkles: "M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z",
  sun: "M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0 M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7",
  trophy: "M8 21l8 0 M12 17l0 4 M7 4l10 0 M17 4v8a5 5 0 0 1 -10 0v-8 M5 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M19 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
  truck: "M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5",
  weight: "M12 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0 M6.835 9h10.33a1 1 0 0 1 .984 .821l1.637 9a1 1 0 0 1 -.984 1.179h-13.604a1 1 0 0 1 -.984 -1.179l1.637 -9a1 1 0 0 1 .984 -.821z"
};
const icon = n => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + ICONS[n] + '"/></svg>';
const TIER_COLORS = ["#c47a3d", "#9aa5b1", "#e8a90c", "#38bdd1", "#8b6cf0", "#e5484d"]; // bronze → legend
const kgTxt = v => fmtNum(v) + " " + t("kg");
const tonTxt = v => v >= 1000 ? fmtNum(v / 1000) + " t" : fmtNum(v) + " " + t("kg");
const ratioTxt = v => (Math.round(v * 100) / 100).toLocaleString(locale(), { maximumFractionDigits: 2 }) + "×";
const plates = n => lang === "sr" ? n + (n === 1 ? " ploča" : n < 5 ? " ploče" : " ploča") + " po strani" : n + (n === 1 ? " plate" : " plates") + " per side";

// Which exercises count for each lift badge: starter ids + common names (EN and SR).
// reps: true = measured by best reps in one set (bodyweight moves), otherwise heaviest weight.
// Variants that would inflate numbers (incline, split squat, Romanian, assisted, machine…) are excluded.
const LIFTS = {
  bench: { inc: /bench|benč|potisak (sa|na) (ravnoj )?klup/i, exc: /incline|decline|kos[aoi]|close.?grip|dip|hip|thrust|trast/i },
  squat: { inc: /squat|čučanj|cucanj/i, exc: /split|bugar|bulgar|goblet|hack|jump|skok/i },
  deadlift: { inc: /deadlift|mrtvo dizanje/i, exc: /romanian|rumunsk|rdl|stiff|single.?leg|jednoj nozi/i },
  ohp: { inc: /overhead press|\bohp\b|military press|potisak iznad glave|vojnički potisak/i, exc: /machine|mašin|seated|sedeći|sede/i },
  pullups: { inc: /pull.?ups?|chin.?ups?|zgib/i, exc: /assist|asist|band|gum[ae]|negativ|lat|pulldown|mašin|machine/i, reps: true },
  dips: { inc: /\bdips?\b|propadanj|razboj/i, exc: /bench dip|assist|asist|mašin|machine|klup/i, reps: true },
  farmer: { inc: /farmer|farmersk/i, exc: /^$/ },
  hipthrust: { inc: /hip.?thrust|hip trast|potisak kuk/i, exc: /machine|mašin|single|jednoj|band|gum[ae]|bridge|most/i },
  plank: { inc: /plank|izdržaj/i, exc: /side|bočn|reverse|obrnut/i, time: true },
  pushups: { inc: /push.?ups?|sklek/i, exc: /knee|kolen|incline|kos[aoi]|wall|zid|assist|asist/i, reps: true }
};
// Seconds from "90", "90s" or "1:30".
function secs(v) {
  const s = String(v == null ? "" : v).trim();
  const m = /^(\d+):(\d{1,2})$/.exec(s);
  return m ? +m[1] * 60 + +m[2] : num(s);
}
function liftOf(exId) {
  let name = exId;
  program().forEach(s => s.ex.forEach(e => { if (e.id === exId) name += " " + (e.name || ""); }));
  for (const k in LIFTS) if (LIFTS[k].inc.test(name) && !LIFTS[k].exc.test(name)) return k;
  return null;
}

// Strength ladders, researched Nov 2026 from Strength Level's standards (strengthlevel.com, millions of
// logged lifts; men at 80 kg bodyweight, women at 60 kg). Tier mapping for every lift:
//   Bronze = Beginner (stronger than 5% of lifters)   Silver = Novice (20%)   Gold = Intermediate (50%)
//   Platinum = Advanced (80%)   Diamond = Elite (95%)   Legend = beyond Elite (one more step, ~top 1%)
// Values rounded to loadable weights. "x" (general) sits between the men's and women's numbers.
// Weights in kg (1-rep max), pull-ups/dips/push-ups in reps, farmer's walk in kg per hand.
const LADDERS = {
  bench:    { m: [55, 75, 100, 125, 150, 180],   f: [20, 30, 47.5, 65, 87.5, 110],  x: [37.5, 52.5, 72.5, 95, 120, 145] },
  benchBw:  { m: [0.7, 0.95, 1.25, 1.55, 1.9, 2.25], f: [0.3, 0.5, 0.8, 1.1, 1.45, 1.8], x: [0.5, 0.7, 1, 1.3, 1.65, 2] },
  squat:    { m: [75, 100, 130, 170, 205, 245],  f: [32.5, 50, 72.5, 100, 130, 160], x: [55, 75, 100, 135, 165, 200] },
  deadlift: { m: [90, 120, 155, 195, 240, 285],  f: [40, 60, 85, 115, 150, 185],   x: [65, 90, 120, 155, 195, 235] },
  ohp:      { m: [35, 47.5, 62.5, 80, 97.5, 115], f: [15, 22.5, 30, 42.5, 55, 67.5], x: [25, 35, 47.5, 60, 75, 90] },
  pullups:  { m: [1, 7, 13, 21, 29, 40],         f: [1, 3, 6, 12, 20, 28],         x: [1, 5, 10, 16, 24, 34] },
  dips:     { m: [3, 10, 20, 31, 42, 55],        f: [1, 3, 9, 19, 29, 38],         x: [2, 6, 15, 25, 35, 46] },
  pushups:  { m: [6, 20, 38, 60, 84, 110],       f: [1, 7, 18, 32, 47, 62],        x: [3, 13, 28, 46, 65, 85] },
  farmer:   { m: [10, 20, 35, 57.5, 80, 100],    f: [5, 10, 20, 32.5, 47.5, 60],   x: [7.5, 15, 27.5, 45, 65, 80] },
  hipthrust: { m: [55, 95, 150, 210, 285, 360],  f: [35, 62.5, 100, 147.5, 200, 250], x: [45, 80, 125, 180, 240, 300] },
  // Plank (seconds, same for everyone): college norms put the median around 80–100 s and the top 25%
  // above ~2 min; Diamond ≈ top 5%, Legend ≈ top 1%.
  plank:    { x: [30, 60, 90, 120, 210, 300] }
};
const secTxt = v => v >= 60 ? Math.floor(v / 60) + ":" + String(Math.round(v % 60)).padStart(2, "0") + " min" : fmtNum(v) + " s";
const ladder = id => M => LADDERS[id][M.sex] || LADDERS[id].x;
const repsTxt = v => fmtNum(v) + " " + (lang === "en" && v === 1 ? "rep" : t("reps"));
// Shown on lift badges so people know what to name an exercise for it to count.
const LIFT_NAMES = {
  bench: "Bench press", squat: ["Squat, Front squat", "Čučanj, Squat"], deadlift: ["Deadlift, Sumo deadlift", "Mrtvo dizanje, Deadlift"],
  ohp: ["Overhead press, Military press", "Potisak iznad glave, Military press"], pullups: ["Pull-ups, Chin-ups", "Zgibovi, Pull-ups"],
  dips: ["Dips", "Propadanja, Dips"], farmer: ["Farmer's walk / carry", "Farmerski hod, Farmer's walk"],
  plank: ["Plank (not side plank)", "Plank, Izdržaj (ne bočni plank)"], pushups: ["Push-ups", "Sklekovi, Push-ups"],
  hipthrust: ["Hip thrust (barbell; not glute bridge)", "Hip thrust, Potisak kukovima (sa šipkom; ne glute bridge)"]
};
const perHandTxt = v => fmtNum(v) + " " + t("kg") + " " + (lang === "sr" ? "po ruci" : "per hand");

// title/desc: [english, serbian]; tiers: thresholds (or a function of the metrics); m: metric name.
const ACH = [
  // Habit badges: at ~4 workouts a week, Legend means roughly 2–3 years of steady training.
  { id: "workouts", icon: "barbell", m: "workouts", tiers: [1, 10, 50, 150, 300, 500], title: ["Workouts", "Treninzi"], desc: ["Workouts finished: {n}", "Završeni treninzi: {n}"],
    labels: [["first one", "prvi"], ["~3 weeks", "~3 nedelje"], ["~3 months", "~3 meseca"], ["~9 months", "~9 meseci"], ["~1.5 years", "~1,5 godina"], ["~2.5 years", "~2,5 godine"]] },
  { id: "streak", icon: "flame", m: "streak", tiers: [2, 4, 8, 13, 26, 52], title: ["On fire", "U plamenu"], desc: ["Most weeks in a row with a workout: {n}", "Najviše nedelja zaredom sa treningom: {n}"],
    labels: [["", ""], ["a month", "mesec dana"], ["2 months", "2 meseca"], ["a quarter", "tromesečje"], ["half a year", "pola godine"], ["a full year", "cela godina"]] },
  { id: "perfect", icon: "calendar-check", m: "perfect", tiers: [1, 4, 12, 26, 39, 52], title: ["Perfect week", "Savršena nedelja"], desc: ["Weeks with every planned workout done: {n}", "Nedelje sa svim planiranim treninzima: {n}"] },
  { id: "sets", icon: "list-check", m: "sets", tiers: [50, 250, 1000, 2500, 5000, 10000], title: ["Set machine", "Mašina za serije"], desc: ["Sets logged: {n}", "Upisane serije: {n}"] },
  { id: "volume", icon: "truck", m: "volume", tiers: [1000, 10000, 50000, 100000, 250000, 500000], fmt: tonTxt, title: ["Heavy hauler", "Teška kategorija"], desc: ["Total weight lifted: {n}", "Ukupno podignuto: {n}"],
    labels: [["≈ a small car", "≈ mali auto"], ["≈ a city bus", "≈ gradski autobus"], ["≈ a tank", "≈ tenk"], ["≈ a blue whale", "≈ plavi kit"], ["≈ a jumbo jet", "≈ džambo džet"], ["≈ a fully loaded A380", "≈ pun Airbus A380"]] },
  { id: "records", icon: "trophy", m: "records", tiers: [1, 10, 25, 50, 100, 200], title: ["Record breaker", "Obarač rekorda"], desc: ["Personal records broken: {n}", "Oboreni lični rekordi: {n}"] },
  { id: "bench", icon: "award", m: "bench", tiers: ladder("bench"), fmt: kgTxt, plates: true, sexNote: true, title: ["Bench press", "Bench press"], desc: ["Best bench press: {n}", "Najbolji bench press: {n}"] },
  { id: "benchBw", icon: "scale", m: "benchBw", tiers: ladder("benchBw"), fmt: ratioTxt, sexNote: true, needsBw: true, title: ["Bench vs bodyweight", "Bench naspram težine"], desc: ["Best bench ÷ your body weight: {n}", "Najbolji bench ÷ tvoja težina: {n}"] },
  { id: "squat", icon: "weight", m: "squat", tiers: ladder("squat"), fmt: kgTxt, plates: true, sexNote: true, title: ["Squat", "Čučanj"], desc: ["Best squat: {n}", "Najbolji čučanj: {n}"] },
  { id: "deadlift", icon: "weight", m: "deadlift", tiers: ladder("deadlift"), fmt: kgTxt, plates: true, sexNote: true, title: ["Deadlift", "Mrtvo dizanje"], desc: ["Best deadlift: {n}", "Najbolje mrtvo dizanje: {n}"] },
  { id: "hipthrust", icon: "arrow-big-up-lines", m: "hipthrust", tiers: ladder("hipthrust"), fmt: kgTxt, plates: true, sexNote: true, title: ["Hip thrust", "Hip thrust"], desc: ["Best barbell hip thrust: {n}", "Najbolji hip thrust sa šipkom: {n}"] },
  { id: "ohp", icon: "arrow-bar-to-up", m: "ohp", tiers: ladder("ohp"), fmt: kgTxt, sexNote: true, title: ["Overhead press", "Potisak iznad glave"], desc: ["Best standing overhead press: {n}", "Najbolji potisak iznad glave iz stajanja: {n}"] },
  { id: "pullups", icon: "chevrons-up", m: "pullups", tiers: ladder("pullups"), fmt: repsTxt, sexNote: true, title: ["Pull-ups", "Zgibovi"], desc: ["Most pull-ups in one set (no assistance): {n}", "Najviše zgibova u jednoj seriji (bez pomoći): {n}"] },
  { id: "dips", icon: "chevrons-down", m: "dips", tiers: ladder("dips"), fmt: repsTxt, sexNote: true, title: ["Dips", "Propadanja"], desc: ["Most dips in one set: {n}", "Najviše propadanja u jednoj seriji: {n}"] },
  { id: "pushups", icon: "arrows-vertical", m: "pushups", tiers: ladder("pushups"), fmt: repsTxt, sexNote: true, title: ["Push-ups", "Sklekovi"], desc: ["Most push-ups in one set (full push-ups): {n}", "Najviše sklekova u jednoj seriji (pravi sklekovi): {n}"] },
  { id: "plank", icon: "stopwatch", m: "plank", tiers: ladder("plank"), fmt: secTxt, title: ["Plank", "Plank"], desc: ["Longest plank hold: {n}. Log seconds in the second box (e.g. 60 or 1:30).", "Najduži plank: {n}. Upiši sekunde u drugo polje (npr. 60 ili 1:30)."] },
  { id: "farmer", icon: "walk", m: "farmer", tiers: ladder("farmer"), fmt: perHandTxt, sexNote: true, title: ["Farmer's walk", "Farmerski hod"], desc: ["Heaviest weight carried in one hand: {n}. Log the weight of one hand.", "Najveća težina u jednoj ruci: {n}. Upiši težinu jedne ruke."] },
  { id: "weekend", icon: "sun", m: "weekend", tiers: [1, 4, 12, 26, 39, 52], title: ["Weekend warrior", "Vikend ratnik"], desc: ["Weeks with both Saturday and Sunday done: {n}", "Nedelje sa odrađenom i subotom i nedeljom: {n}"] },
  { id: "comeback", icon: "refresh", m: "comeback", tiers: [1, 2, 3, 4, 5, 6], title: ["Comeback", "Povratak"], desc: ["Times you came back after 3+ weeks off: {n}. Falling off happens; coming back is what counts.", "Povratci posle 3+ nedelje pauze: {n}. Pauze se dešavaju, bitno je da se vratiš."] },
  { id: "backup", icon: "device-floppy", m: "backup", tiers: [1, 3, 6, 12, 24, 52], title: ["Safe keeper", "Čuvar podataka"], desc: ["Backups saved: {n}", "Sačuvane kopije: {n}"],
    labels: [["", ""], ["", ""], ["", ""], ["≈ monthly for a year", "≈ mesečno godinu dana"], ["", ""], ["≈ weekly for a year", "≈ nedeljno godinu dana"]] }
];
// Bump when thresholds change: everyone's "already celebrated" levels are re-recorded silently,
// so a re-shuffled ladder never fires false pop-ups or swallows real ones.
const ACH_VERSION = 2;
const ACH_CATS = [{ id: "strength", icon: "💪", key: "catStrength" }, { id: "habit", icon: "🔥", key: "catHabit" }];
const achCat = a => a.sexNote || a.m === "plank" ? "strength" : "habit";

const monOf = wk => { const m = /^(\d{4})-W(\d{2})$/.exec(wk); return mondayOfIsoWeek(+m[1], +m[2]); };
const heaviest = st => Math.max(-Infinity, ...st.map(x => num(x.w)).filter(v => v != null && v > 0));

function achMetrics() {
  const st = computeStats();
  const byId = {}; program().forEach(s => { byId[s.id] = s; });
  const dowOf = sid => byId[sid] ? byId[sid].dow : 0;
  const recs = allSessionRecords().sort((a, b) => a.wk < b.wk ? -1 : a.wk > b.wk ? 1 : dowOf(a.sid) - dowOf(b.sid));
  const doneBy = {}, bestW = {}, liftCache = {}, lift = {};
  Object.keys(LIFTS).forEach(k => { lift[k] = 0; });
  let records = 0;
  recs.forEach(({ wk, sid, s }) => {
    if (!s) return;
    if (s.done) (doneBy[wk] = doneBy[wk] || new Set()).add(sid);
    new Set([...Object.keys(s.sets || {}), ...Object.keys(s.w || {})]).forEach(exId => {
      const st2 = filled(setsOf(s, exId));
      if (!(exId in liftCache)) liftCache[exId] = liftOf(exId);
      const l = liftCache[exId];
      if (l && (LIFTS[l].reps || LIFTS[l].time)) { // bodyweight moves: best reps (or seconds) in one set
        function read(x) {
          if (!LIFTS[l].time) return num(x.r);
          const fromR = secs(x.r);                     // seconds belong in the second box…
          if (fromR != null) return fromR;
          return /[:s]/i.test(x.w || "") ? secs(String(x.w).replace(/s$/i, "")) : null; // …but accept "1:30" / "60s" in the first
        }
        const r = Math.max(-Infinity, ...st2.map(read).filter(v => v != null && v > 0));
        if (isFinite(r)) lift[l] = Math.max(lift[l], r);
      }
      const w = heaviest(st2);
      if (!isFinite(w)) return;
      if (bestW[exId] != null && w > bestW[exId]) records++; // beat an earlier best
      bestW[exId] = Math.max(bestW[exId] || 0, w);
      if (l && !LIFTS[l].reps) lift[l] = Math.max(lift[l], w);
    });
  });
  const active = [...new Set(recs.filter(r => hasActivity(r.s)).map(r => r.wk))].sort();
  let comeback = 0;
  for (let i = 1; i < active.length; i++) if ((monOf(active[i]) - monOf(active[i - 1])) / DAY >= 28) comeback++;
  let perfect = 0, weekend = 0;
  const plan = program();
  Object.keys(doneBy).forEach(wk => {
    const d = doneBy[wk];
    if (plan.length && plan.every(p => d.has(p.id))) perfect++;
    const dows = new Set([...d].map(dowOf));
    if (dows.has(5) && dows.has(6)) weekend++;
  });
  const p = state.profile || {}, bw = num(p.bw);
  return {
    workouts: st.workouts, streak: st.best, perfect, sets: st.sets, volume: st.volume, records, weekend, comeback,
    backup: state.backupCount || (state.lastBackup ? 1 : 0), ...lift,
    benchBw: bw && lift.bench ? lift.bench / bw : 0, hasBw: !!bw, sex: p.sex || "x"
  };
}

function evalAch() {
  const M = achMetrics(), L = LI();
  return ACH.map(a => {
    const tiers = typeof a.tiers === "function" ? a.tiers(M) : a.tiers;
    const v = M[a.m] || 0;
    let level = -1;
    tiers.forEach((th, i) => { if (v >= th - 1e-9) level = i; });
    if (a.needsBw && !M.hasBw) level = -1;
    return { a, tiers, v, level, M, title: a.title[L] };
  });
}
const tierColor = (r, i) => r.tiers.length === 1 ? TIER_COLORS[2] : TIER_COLORS[Math.min(i, TIER_COLORS.length - 1)];
const tierName = (r, i) => r.tiers.length === 1 ? t("unlockedOne") : t("tierNames")[Math.min(i, 5)];
const fmtA = (r, v) => (r.a.fmt || fmtNum)(v);
function medalHtml(r, size) {
  const locked = r.level < 0;
  return '<span class="medal' + (locked ? " locked" : "") + (size ? " " + size : "") + '"' +
    (locked ? "" : ' style="--c:' + tierColor(r, r.level) + '"') + '>' + icon(r.a.icon) +
    (locked ? '<span class="lk">' + icon("lock") + '</span>' : "") + '</span>';
}

function renderAchievements() {
  const list = evalAch();
  const got = list.filter(r => r.level >= 0);
  $("achCount").textContent = got.length + "/" + list.length;
  // Compact row in the profile: best 4 medals + count.
  $("achEntrySub").textContent = t("achSub", { a: got.length, b: list.length });
  $("achPrev").innerHTML = got.slice().sort((a, b) => b.level - a.level).slice(0, 4).map(r => medalHtml(r, "tiny")).join("") ||
    medalHtml(list[0], "tiny");
  // Two categories: Strength (badges with men/women targets, plus plank) and Consistency (everything else).
  const wrap = $("achGrid"); wrap.innerHTML = "";
  const grids = {};
  ACH_CATS.forEach(c => {
    const inCat = list.filter(r => achCat(r.a) === c.id);
    const h = document.createElement("h3"); h.className = "ach-cat";
    h.innerHTML = '<span></span><span class="ach-count"></span>';
    h.firstChild.textContent = c.icon + " " + t(c.key);
    h.lastChild.textContent = inCat.filter(r => r.level >= 0).length + "/" + inCat.length;
    const g = document.createElement("div"); g.className = "ach-grid";
    wrap.appendChild(h); wrap.appendChild(g);
    grids[c.id] = g;
  });
  list.forEach(r => {
    const g = grids[achCat(r.a)];
    const next = r.tiers[r.level + 1];
    const noBw = r.a.needsBw && !r.M.hasBw;
    const b = document.createElement("button");
    b.type = "button"; b.className = "ach";
    b.innerHTML = medalHtml(r) + '<span class="at"></span><span class="as"></span>' +
      (next != null && !noBw && r.tiers.length > 1 ? '<span class="ab"><i style="width:' + Math.max(0, Math.min(100, r.v / next * 100)).toFixed(0) + '%"></i></span>' : "");
    b.querySelector(".at").textContent = r.title;
    b.querySelector(".as").textContent = r.level >= 0 ? tierName(r, r.level) : noBw ? "—" : r.tiers.length === 1 ? "🔒" : fmtA(r, r.v) + " / " + fmtA(r, next);
    b.addEventListener("click", () => openAch(r.a.id));
    g.appendChild(b);
  });
}

function openAch(id) {
  const r = evalAch().find(x => x.a.id === id); if (!r) return;
  const L = LI(), el = $("achDetail"), noBw = r.a.needsBw && !r.M.hasBw;
  const names = LIFT_NAMES[r.a.m];
  // Which targets are active (men / women / general) as a chip; the ⓘ explains where to change it
  // (shown on hover with a mouse, on tap/focus on phones).
  const chip = '<div class="tchip"><span class="tc-l"></span><button type="button" class="tc-i">' + icon("info-circle") +
    '</button><span class="tc-tip" role="tooltip"></span></div>';
  el.innerHTML = medalHtml(r, "big") + '<h2 id="achMTitle"></h2><p class="ad"></p>' +
    (noBw ? '<p class="note2"></p>' : r.a.sexNote ? chip : "") + '<ul class="tiers"></ul>' + (names ? '<p class="note names"></p>' : "");
  if (names) el.querySelector(".names").textContent = t("countsAs", { n: Array.isArray(names) ? names[L] : names }) + " " +
    (r.a.m === "plank" ? t("plankStd") : t("liftStd"));
  else if (r.a.m === "benchBw") {
    const p = document.createElement("p"); p.className = "note"; p.textContent = t("liftStd"); el.appendChild(p);
  }
  el.querySelector("h2").textContent = r.title;
  el.querySelector(".ad").textContent = r.a.desc[L].replace("{n}", fmtA(r, r.v));
  if (noBw) el.querySelector(".note2").textContent = t("needBw");
  else if (r.a.sexNote) {
    const c = el.querySelector(".tchip"), b = c.querySelector(".tc-i");
    c.querySelector(".tc-l").textContent = t({ m: "targetsM", f: "targetsF", x: "targetsX" }[r.M.sex]);
    c.querySelector(".tc-tip").textContent = t("targetsTip");
    b.setAttribute("aria-label", t("targetsTip"));
    b.addEventListener("click", e => { e.stopPropagation(); c.classList.toggle("open"); b.setAttribute("aria-expanded", c.classList.contains("open")); });
  }
  const ul = el.querySelector(".tiers");
  r.tiers.forEach((th, i) => {
    const got = i <= r.level, single = r.tiers.length === 1;
    const li = document.createElement("li"); if (got) li.className = "got";
    li.innerHTML = '<span class="dot"></span><span class="tn"><span class="tl"></span><small></small></span><span class="ts"></span>';
    li.querySelector(".dot").style.background = tierColor(r, i);
    li.querySelector(".tl").textContent = single ? r.title : tierName(r, i) + " · " + fmtA(r, th);
    // Plate label only when the weight is exactly bar (20) + 20 kg plates on each side.
    const plateN = r.a.plates && th > 20 && (th - 20) % 40 === 0 ? (th - 20) / 40 : 0;
    li.querySelector("small").textContent = r.a.labels ? r.a.labels[i][L] : plateN ? plates(plateN) : "";
    li.querySelector(".ts").textContent = got ? "✓" : single || noBw ? "🔒" : t("toGo", { v: fmtA(r, th - r.v) });
    ul.appendChild(li);
  });
  $("achModal").classList.add("show"); document.body.classList.add("modal-open");
}
function closeAch() {
  $("achModal").classList.remove("show");
  if (!document.querySelector(".modal.show")) document.body.classList.remove("modal-open");
}
$("achClose").addEventListener("click", closeAch);
// Tapping anywhere outside an open ⓘ tooltip closes it.
document.addEventListener("click", e => {
  document.querySelectorAll(".tchip.open").forEach(c => {
    if (!c.contains(e.target)) { c.classList.remove("open"); c.querySelector(".tc-i").setAttribute("aria-expanded", "false"); }
  });
});
$("achModal").addEventListener("click", e => { if (e.target === $("achModal")) closeAch(); });

// Achievements sheet (opened from the profile row or by tapping an "unlocked" pop-up)
function openAchSheet() { renderAchievements(); $("achSheet").classList.add("show"); document.body.classList.add("modal-open"); }
function closeAchSheet() {
  $("achSheet").classList.remove("show");
  if (!document.querySelector(".modal.show")) document.body.classList.remove("modal-open");
}
$("achOpen").addEventListener("click", openAchSheet);
$("achSClose").addEventListener("click", closeAchSheet);
$("achSheet").addEventListener("click", e => { if (e.target === $("achSheet")) closeAchSheet(); });
// Escape closes only the top-most sheet: detail → achievements → profile.
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if ($("achModal").classList.contains("show")) closeAch();
  else if ($("achSheet").classList.contains("show")) closeAchSheet();
});

// Pop-up card at the top for new records and unlocked badges (queued, one at a time).
const celebQ = []; let celebBusy = false, celebTimer = null;
function celebrate(item) { celebQ.push(item); if (!celebBusy) nextCeleb(); }
function nextCeleb() {
  const c = $("celebrate"), item = celebQ.shift();
  if (!item) { celebBusy = false; c.hidden = true; return; }
  celebBusy = true;
  c.innerHTML = item.html;
  c.onclick = () => { clearTimeout(celebTimer); c.hidden = true; if (item.ach) { openAchSheet(); openAch(item.ach); } setTimeout(nextCeleb, 200); };
  c.hidden = false; c.style.animation = "none"; void c.offsetWidth; c.style.animation = "";
  buzz([30, 60, 30, 60, 80]);
  celebTimer = setTimeout(() => { c.hidden = true; setTimeout(nextCeleb, 250); }, 3400);
}

var achTimer = null; // var: save() may run before this line in edge cases
function scheduleAchCheck() { clearTimeout(achTimer); achTimer = setTimeout(checkAchievements, 700); }
// Bench badges are tracked per ladder (men / women / general), so switching never loses or fakes progress.
const seenKey = r => r.a.sexNote ? r.a.id + ":" + r.M.sex : r.a.id;
function markSeenSilently(filter) {
  state.achSeen = state.achSeen || {};
  evalAch().filter(filter).forEach(r => { const k = seenKey(r); state.achSeen[k] = Math.max(state.achSeen[k] != null ? state.achSeen[k] : -1, r.level); });
}
function checkAchievements() {
  if (!state.onboarded) return;
  // First run (or after an update): remember current levels silently, no flood of pop-ups.
  // Same after the badge thresholds were changed (ACH_VERSION bump).
  if (!state.achSeen || state.achVersion !== ACH_VERSION) {
    state.achSeen = {}; markSeenSilently(() => true); state.achVersion = ACH_VERSION; saveRaw(); return;
  }
  const list = evalAch();
  let changed = false;
  list.forEach(r => {
    const k = seenKey(r);
    // A badge this phone has never tracked (added in an app update): record it silently.
    if (!(k in state.achSeen)) { state.achSeen[k] = r.level; changed = true; return; }
    const seen = state.achSeen[k] != null ? state.achSeen[k] : -1;
    if (r.level <= seen) return;
    state.achSeen[k] = r.level; changed = true;
    const sub = r.tiers.length === 1 ? r.a.desc[LI()].replace("{n}", "") : tierName(r, r.level) + " · " + fmtA(r, r.tiers[r.level]);
    celebrate({ ach: r.a.id, html: medalHtml(r, "small") + '<span class="ct"><small>' + esc(t("achUnlocked")) + '</small><b>' + esc(r.title) + '</b><span>' + esc(sub) + '</span></span>' });
  });
  if (changed) { saveRaw(); if ($("profile").classList.contains("show") || $("achSheet").classList.contains("show")) renderProfile(); }
}

// New personal record while logging sets (heavier than anything logged before for this exercise).
const prShown = {};
function bestWeightExcept(exId, key, sid) {
  let best = null;
  for (const wk in state.weeks) for (const s2 in state.weeks[wk]) {
    if (wk === key && s2 === sid) continue;
    const w = heaviest(filled(setsOf(state.weeks[wk][s2], exId)));
    if (isFinite(w) && (best == null || w > best)) best = w;
  }
  return best;
}
function checkPR(key, sess, ex, cur) {
  const w = heaviest(filled(cur));
  if (!isFinite(w)) return;
  const k = key + ":" + sess.id + ":" + ex.id;
  let prev = bestWeightExcept(ex.id, key, sess.id);
  if (prev == null) return; // first time logging this exercise: nothing to beat yet
  prev = Math.max(prev, prShown[k] || 0); // a record earlier in this same session counts too
  if (w <= prev) return;
  prShown[k] = w;
  const name = tr("e", ex.id, "name", ex.name) || t("unnamedEx");
  celebrate({ html: '<span class="medal small" style="--c:' + TIER_COLORS[2] + '">' + icon("trophy") + '</span>' +
    '<span class="ct"><small>' + esc(t("newRecord")) + '</small><b>' + esc(name + ": " + kgTxt(w)) + '</b><span>' + esc(t("wasPrev", { v: kgTxt(prev) })) + '</span></span>' });
}

// Profile settings for bench targets
$("prSex").addEventListener("click", e => {
  const b = e.target.closest("button[data-v]"); if (!b) return;
  state.profile = Object.assign({}, state.profile, { sex: b.dataset.v });
  markSeenSilently(r => r.a.sexNote); // switching ladders is not an achievement (entering body weight still celebrates)
  save(); renderProfile();
});
$("prBwSave").addEventListener("click", () => {
  const n = num($("prBw").value);
  state.profile = Object.assign({}, state.profile, { bw: n && n >= 25 && n <= 350 ? String(n) : "" });
  save(); renderProfile(); toast(t("saved"));
});
$("prBw").addEventListener("keydown", e => { if (e.key === "Enter") $("prBwSave").click(); });
