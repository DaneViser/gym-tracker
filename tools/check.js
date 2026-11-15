// Static checks + logic unit tests. No packages, no browser.   Run:  node tools/check.js
// Runs on every push in GitHub Actions (.github/workflows/checks.yml). Exit code 1 = something is wrong.
//
// What it checks:
//  1. every js/ module loads (catches syntax errors, wrong import/export names)
//  2. English and Serbian texts have the same keys and the same {placeholders}
//  3. every t("key") in the code and every data-i18n key in index.html exists
//  4. every $("id") in the code exists in index.html, and ids are unique
//  5. badges: 6 rising tiers (for men, women and general), valid icons, both languages
//  6. starter program texts in both languages, unique ids
//  7. every css/js file is linked/imported and listed in sw.js for offline use (and nothing missing)
//  8. APP_VERSION was bumped when code changed (compares with the previous commit on CI)
//  9. unit tests: week maths, number parsing, best set, exercise-name matching, plurals, data repair
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
let failures = 0, passes = 0;
const fail = (area, msg) => { failures++; console.log("  ✗ [" + area + "] " + msg); };
const ok = () => { passes++; };
const check = (area, cond, msg) => (cond ? ok() : fail(area, msg));
const eq = (area, got, want, msg) => check(area, JSON.stringify(got) === JSON.stringify(want), msg + " — got " + JSON.stringify(got) + ", want " + JSON.stringify(want));

const html = read("index.html");
const jsFiles = fs.readdirSync(path.join(ROOT, "js")).filter(f => f.endsWith(".js")).sort();
const cssFiles = fs.readdirSync(path.join(ROOT, "css")).filter(f => f.endsWith(".css")).sort();
const jsSrc = Object.fromEntries(jsFiles.map(f => [f, read("js/" + f)]));

// ---------------------------------------------------------------- 1. modules load
console.log("1. modules load");
const mod = {};
for (const f of jsFiles) {
  if (f === "main.js") continue; // main.js starts the app and needs a real page
  try { mod[f.replace(".js", "")] = await import(pathToFileURL(path.join(ROOT, "js", f)).href); ok(); }
  catch (e) { fail("load", f + ": " + e.message); }
}
if (failures) { console.log("\nModules don't load — fix that first."); process.exit(1); }
// main.js: at least check every name it imports is really exported
for (const m of jsSrc["main.js"].matchAll(/import \{([^}]+)\} from "\.\/(\w+)\.js"/g)) {
  for (const raw of m[1].split(",")) {
    const name = raw.trim().split(/\s+as\s+/)[0];
    check("load", name in mod[m[2]], "main.js imports '" + name + "' but js/" + m[2] + ".js doesn't export it");
  }
}
const { I18N } = mod.i18n, S = mod.state;

// Missing imports only crash when that code runs, so look for them here: a name another module exports,
// used in this file (as code, not inside a string/comment or after a dot), but not imported or declared here.
const owner = {};
for (const [f, s] of Object.entries(jsSrc)) for (const m of s.matchAll(/^export (?:async )?(?:function|const|let|var) ([\w$]+)/gm)) if (m[1] !== "init") owner[m[1]] = f;
const codeOnly = s => s.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(["'`])(?:\\.|(?!\1)[^\\\n])*\1/g, '""'); // drop comments and string contents
for (const [f, s] of Object.entries(jsSrc)) {
  const code = codeOnly(s), have = new Set();
  for (const m of s.matchAll(/^import \{([^}]+)\}/gm)) m[1].split(",").forEach(x => have.add(x.trim().split(/\s+as\s+/).pop()));
  for (const m of s.matchAll(/^(?:export )?(?:async )?(?:function|const|let|var) ([\w$]+)/gm)) have.add(m[1]);
  for (const [name, from] of Object.entries(owner)) {
    if (from === f || have.has(name)) continue;
    const re = name === "$" ? /(?<![\w$.])\$\(/ // "$" also appears in regexes, so only count $( calls
      : new RegExp("(?<![\\w$.])" + name + "(?![\\w$])(?!\\s*:)");
    if (re.test(code)) fail("load", f + " uses '" + name + "' from " + from + " but doesn't import it");
  }
}

// ---------------------------------------------------------------- 2. translations match
console.log("2. English / Serbian texts");
const enKeys = Object.keys(I18N.en).sort(), srKeys = Object.keys(I18N.sr).sort();
for (const k of enKeys) if (!(k in I18N.sr)) fail("i18n", "'" + k + "' missing in Serbian (sr)");
for (const k of srKeys) if (!(k in I18N.en)) fail("i18n", "'" + k + "' missing in English (en)");
const holders = s => [...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(",");
for (const k of enKeys) {
  const a = I18N.en[k], b = I18N.sr[k];
  if (b === undefined) continue;
  if (Array.isArray(a) || Array.isArray(b)) check("i18n", Array.isArray(a) && Array.isArray(b) && a.length === b.length, "'" + k + "' list lengths differ");
  else {
    check("i18n", typeof b === "string" && b.trim() !== "", "'" + k + "' is empty in Serbian");
    check("i18n", holders(a) === holders(b), "'" + k + "' placeholders differ: en {" + holders(a) + "} vs sr {" + holders(b) + "}");
    check("i18n", !/[Ѐ-ӿ]/.test(b), "'" + k + "' uses Cyrillic — Serbian must be Latin script");
  }
}

// ---------------------------------------------------------------- 3. every used key exists
console.log("3. text keys used in code / page");
for (const [f, s] of Object.entries(jsSrc)) for (const m of s.matchAll(/\bt\("([\w]+)"/g)) {
  if (m[1].endsWith("_")) check("keys", enKeys.some(k => k.startsWith(m[1])), f + ": no texts start with \"" + m[1] + "\" (used as t(\"" + m[1] + "\" + …))");
  else check("keys", m[1] in I18N.en, f + ": t(\"" + m[1] + "\") has no text");
}
// keys built from a list (t("nJob_" + key)) must exist for every item of that list
for (const [prefix, list] of [["nJob_", Object.keys(mod.nutrition.JOBS)], ["nGoal_", Object.keys(mod.nutrition.GOALS)], ["nGoalNote_", Object.keys(mod.nutrition.GOALS)], ["nWarn_", ["floor", "belowBmr"]]])
  for (const k of list) check("keys", (prefix + k) in I18N.en, "missing text '" + prefix + k + "'");
for (const m of html.matchAll(/data-i18n(?:-ph|-aria)?="(\w+)"/g)) check("keys", m[1] in I18N.en, "index.html: data-i18n key '" + m[1] + "' has no text");
for (const c of mod.achievements.ACH_CATS) check("keys", c.key in I18N.en, "achievement category key '" + c.key + "' has no text");

// ---------------------------------------------------------------- 4. element ids
console.log("4. element ids");
const ids = [...html.matchAll(/\sid="([\w-]+)"/g)].map(m => m[1]);
const dupIds = ids.filter((x, i) => ids.indexOf(x) !== i);
check("ids", dupIds.length === 0, "duplicate ids in index.html: " + dupIds.join(", "));
for (const [f, s] of Object.entries(jsSrc)) for (const m of s.matchAll(/\$\("([\w-]+)"\)/g)) check("ids", ids.includes(m[1]), f + ": $(\"" + m[1] + "\") — no element with that id in index.html");

// ---------------------------------------------------------------- 5. achievements
console.log("5. achievements");
const A = mod.achievements;
const achIds = A.ACH.map(a => a.id);
check("ach", new Set(achIds).size === achIds.length, "duplicate badge ids");
const rising = arr => Array.isArray(arr) && arr.length === 6 && arr.every((x, i) => typeof x === "number" && (i === 0 || x > arr[i - 1]));
for (const a of A.ACH) {
  for (const sex of ["m", "f", "x"]) {
    const tiers = typeof a.tiers === "function" ? a.tiers({ sex }) : a.tiers;
    check("ach", rising(tiers), a.id + " (" + sex + "): needs exactly 6 rising tiers, got " + JSON.stringify(tiers));
  }
  check("ach", a.icon in mod.icons.ICONS, a.id + ": icon '" + a.icon + "' is not in ICONS");
  for (const f of ["title", "desc"]) check("ach", Array.isArray(a[f]) && a[f].length === 2 && a[f].every(x => typeof x === "string" && x.trim()), a.id + ": " + f + " must be [english, serbian]");
  if (a.labels) check("ach", a.labels.length === 6 && a.labels.every(l => Array.isArray(l) && l.length === 2), a.id + ": labels must be 6 × [en, sr]");
}
for (const [id, l] of Object.entries(A.LADDERS)) for (const [sex, arr] of Object.entries(l)) check("ach", rising(arr), "LADDERS." + id + "." + sex + " must be 6 rising numbers");
for (const id of Object.keys(mod.icons.ICONS)) check("icons", read("THIRD_PARTY_LICENSES.md").includes(id), "icon '" + id + "' not listed in THIRD_PARTY_LICENSES.md");
// every icon name used anywhere must exist (data-icon="…" in the page/texts, icon("…") in code, icon: "…" in badges)
const noComments = s => s.replace(/\/\/[^\n]*/g, "");
const iconUses = [...html.matchAll(/data-icon=\\?"([\w-]+)/g), ...Object.values(jsSrc).flatMap(s => [...noComments(s).matchAll(/data-icon=\\?"([\w-]+)|icon\("([\w-]+)"|icon: "([\w-]+)"|icon\(i < 3 \? "([\w-]+)" : "([\w-]+)"/g)])]
  .flatMap(m => m.slice(1).filter(Boolean));
for (const n of new Set(iconUses)) check("icons", n in mod.icons.ICONS, "icon '" + n + "' is used but not in js/icons.js");
// no emojis: they look different on every phone (and some old ones show as boxes). Use icons instead.
const emoji = /\p{Extended_Pictographic}/u;
for (const [f, s] of [["index.html", html], ...Object.entries(jsSrc).map(([f, s]) => ["js/" + f, s]), ...cssFiles.map(f => ["css/" + f, read("css/" + f)])]) {
  s.split("\n").forEach((line, i) => { const m = line.match(emoji); if (m) fail("icons", f + ":" + (i + 1) + " contains an emoji (" + m[0] + ") — use an icon from js/icons.js"); });
}

// ---------------------------------------------------------------- 6. starter program
console.log("6. starter program");
const starterIds = new Set();
for (const w of mod.starter.STARTER) {
  check("starter", !starterIds.has(w.id), "duplicate workout id " + w.id); starterIds.add(w.id);
  check("starter", Number.isInteger(w.dow) && w.dow >= 0 && w.dow <= 6, w.id + ": dow must be 0..6");
  for (const f of ["title", "sub"]) check("starter", w[f].length === 2 && w[f].every(Boolean), w.id + "." + f + " must be [en, sr]");
  const exIds = new Set();
  for (const e of w.ex) {
    check("starter", !exIds.has(e.id), w.id + ": duplicate exercise id " + e.id); exIds.add(e.id);
    for (const f of ["name", "sets"]) check("starter", e[f].length === 2 && e[f].every(Boolean), w.id + "/" + e.id + "." + f + " must be [en, sr]");
  }
}

// ---------------------------------------------------------------- 7. files wired up
console.log("7. files linked and available offline");
const sw = read("sw.js");
const shell = [...sw.matchAll(/"((?:css|js)\/[\w-]+\.(?:css|js))"/g)].map(m => m[1]);
for (const f of cssFiles) {
  check("files", html.includes('href="css/' + f + '"'), "css/" + f + " is not linked in index.html");
  check("files", shell.includes("css/" + f), "css/" + f + " is missing from SHELL in sw.js (won't work offline)");
}
for (const m of html.matchAll(/href="(css\/[\w-]+\.css)"/g)) check("files", fs.existsSync(path.join(ROOT, m[1])), "index.html links " + m[1] + " but the file doesn't exist");
const imported = new Set(["main.js"]);
for (const s of Object.values(jsSrc)) for (const m of s.matchAll(/from "\.\/([\w-]+\.js)"/g)) imported.add(m[1]);
for (const f of jsFiles) {
  check("files", imported.has(f), "js/" + f + " is never imported (dead file?)");
  check("files", shell.includes("js/" + f), "js/" + f + " is missing from SHELL in sw.js (won't work offline)");
}
for (const f of shell) check("files", fs.existsSync(path.join(ROOT, f)), "sw.js SHELL lists " + f + " but it doesn't exist");
check("files", /<script type="module" src="js\/main\.js"><\/script>/.test(html), "index.html must load js/main.js as a module");

// ---------------------------------------------------------------- 8. version bumped
console.log("8. version bump");
try {
  const base = process.env.CHECK_BASE; // set on CI to the commit before the push
  const range = base && !/^0+$/.test(base) ? base + " HEAD" : "HEAD";
  const changed = execSync("git diff --name-only " + range, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().split("\n").filter(Boolean);
  const code = changed.filter(f => /^(js\/|css\/|index\.html$)/.test(f));
  if (code.length && !changed.includes("js/version.js")) {
    const msg = "code changed (" + code.slice(0, 3).join(", ") + (code.length > 3 ? ", …" : "") + ") but APP_VERSION in js/version.js was not bumped";
    if (process.env.CI) fail("version", msg); else console.log("  ! " + msg + " (reminder; fails on CI)");
  } else ok();
} catch (e) { console.log("  (skipped: not a git checkout)"); }

// ---------------------------------------------------------------- 9. unit tests
console.log("9. unit tests");
const D = mod.dates, DA = mod.data;
const day = (y, m, d) => new Date(y, m - 1, d);
eq("dates", D.weekKey(D.startOfWeek(day(2026, 1, 1))), "2026-W01", "1 Jan 2026 (Thu) is in 2026-W01");
eq("dates", D.weekKey(D.startOfWeek(day(2025, 12, 29))), "2026-W01", "29 Dec 2025 (Mon) starts 2026-W01");
eq("dates", D.weekKey(D.startOfWeek(day(2026, 12, 31))), "2026-W53", "2026 has a week 53");
eq("dates", D.weekKey(D.startOfWeek(day(2027, 1, 3))), "2026-W53", "3 Jan 2027 (Sun) is still 2026-W53");
eq("dates", D.weekKey(D.startOfWeek(day(2027, 1, 4))), "2027-W01", "4 Jan 2027 (Mon) is 2027-W01");
eq("dates", D.mondayOfIsoWeek(2026, 53).toDateString(), day(2026, 12, 28).toDateString(), "Monday of 2026-W53");
eq("dates", D.mondayOfIsoWeek(2027, 1).toDateString(), day(2027, 1, 4).toDateString(), "Monday of 2027-W01");
for (let i = 0; i < 400; i++) { // round-trip every week for ~8 years, incl. DST changes
  const mon = D.addDays(day(2024, 1, 1), i * 7), k = D.weekKey(mon), [y, w] = k.split("-W").map(Number);
  if (D.mondayOfIsoWeek(y, w).toDateString() !== mon.toDateString()) { fail("dates", "week round-trip broken at " + k); break; }
}
eq("dates", D.startOfWeek(day(2026, 11, 15)).toDateString(), day(2026, 11, 9).toDateString(), "Sunday belongs to the week starting Monday");

eq("data", DA.num("62,5"), 62.5, "comma decimals (Serbian style)");
eq("data", DA.num("80kg x6"), 80, "first number wins");
eq("data", DA.num("abc"), null, "text is not a number");
eq("data", DA.num(""), null, "empty is not a number");
eq("data", DA.num(null), null, "null is safe");
eq("data", DA.bestSet([{ w: "80", r: "8" }, { w: "85", r: "3" }, { w: "85", r: "5" }]), { w: "85", r: "5" }, "best set = heaviest, then most reps");
eq("data", DA.bestSet([{ w: "", r: "12" }, { w: "", r: "15" }]), { w: "", r: "15" }, "no weights → most reps");
eq("data", DA.bestSet([{ w: "", r: "" }]), null, "empty sets → none");
eq("data", DA.plannedCount({ sets: "3–4 × 6–10" }), 3, "planned sets from '3–4 × 6–10'");
eq("data", DA.plannedCount({ sets: "lots of sets" }), 3, "no number → 3 sets");
eq("data", DA.plannedCount({ sets: "20 × 1" }), 8, "capped at 8 rows");
eq("data", DA.plannedCount({}), 3, "missing sets text is safe");

eq("plank", A.secs("1:30"), 90, "1:30 = 90 s"); eq("plank", A.secs("90s"), 90, "'90s' = 90 s"); eq("plank", A.secs("45"), 45, "plain seconds");

S.setLangValue("en");
eq("i18n", S.t("doneCount", { a: 2, b: 5 }), "2/5 done", "placeholders filled");
eq("i18n", S.t("noSuchKey"), "noSuchKey", "unknown key returns the key (no crash)");
S.setLangValue("sr");
eq("i18n", [1, 2, 4, 5, 11, 12, 21, 22, 25].map(mod.i18n.setsWord), ["serija", "serije", "serije", "serija", "serija", "serija", "serija", "serije", "serija"], "Serbian plural for 'serija'");
S.setLangValue("en");

// sounds: which kinds may play in which mode
const SA = mod.sound.soundAllowed;
eq("sound", ["tap", "pop", "done", "fanfare", "timer"].map(k => [SA(k, "off"), SA(k, "timer"), SA(k, "all")]),
  [[false, false, true], [false, false, true], [false, false, true], [false, false, true], [false, true, true]], "sound rules (off / timer / all)");

// calorie calculator (worked out by hand with Mifflin-St Jeor)
const CN = mod.nutrition.calcNutrition;
// man 80 kg, 180 cm, 30 y, desk job, 4 × 60 min, keep: BMR 1780; ×1.2 = 2136; workouts 4×4×80×1/7 = 182.9 → 2318.9
eq("calories", (({ bmr, tdee, target, training, protein, fat, carbs }) => [bmr, tdee, target, training, protein, fat, carbs])(CN({ sex: "m", kg: 80, cm: 180, age: 30, job: "desk", sessions: 4, minutes: 60, goal: "keep" })),
  [1780, 2320, 2320, 180, 144, 72, 274], "man, desk job, 4 workouts, keep");
// woman 60 kg, 165 cm, 28 y, on feet, 3 × 45 min, lose 0.5: BMR 1330.25; ×1.375 + 77.1 = 1906.2; −550 = 1356 → 1360
eq("calories", (r => [r.bmr, r.tdee, r.target, r.protein, r.warnings])(CN({ sex: "f", kg: 60, cm: 165, age: 28, job: "feet", sessions: 3, minutes: 45, goal: "lose05" })),
  [1330, 1910, 1360, 120, []], "woman, on feet, 3 workouts, lose 0.5 kg/week");
eq("calories", (r => [r.target, r.warnings])(CN({ sex: "f", kg: 45, cm: 150, age: 60, job: "desk", sessions: 0, goal: "lose05" })),
  [1200, ["floor"]], "never below the safety floor");
eq("calories", CN({ sex: "m", kg: 80, cm: 180, age: 30, job: "physical", sessions: 4, goal: "keep" }).tdee > CN({ sex: "m", kg: 80, cm: 180, age: 30, job: "desk", sessions: 4, goal: "keep" }).tdee, true, "physical job burns more than desk job");
eq("calories", [CN({ kg: "abc", cm: 180, age: 30 }), CN({ kg: 80, cm: 180, age: 10 }), CN({ kg: 80, cm: 500, age: 30 }), CN({ kg: 80, cm: 180, age: 30, job: "pilot" })], [null, null, null, null], "nonsense inputs give no result");
eq("calories", CN({ kg: 80, cm: 180, age: 30 }).bmr, 1700, "general (no sex) uses the average formula");

// calendar: which day a workout lands on
const CAL = mod.calendar, mon = day(2026, 11, 9);
eq("calendar", CAL.sessionDay(mon, { doneAt: new Date(2026, 10, 12, 18, 30).getTime() }, { dow: 2 }).toDateString(), day(2026, 11, 12).toDateString(), "ticked on Thursday → shown on Thursday");
eq("calendar", CAL.sessionDay(mon, { doneAt: new Date(2026, 10, 20).getTime() }, { dow: 2 }).toDateString(), day(2026, 11, 11).toDateString(), "ticked in a later week → planned day");
eq("calendar", CAL.sessionDay(mon, {}, { dow: 5 }).toDateString(), day(2026, 11, 14).toDateString(), "old data without doneAt → planned day");
eq("calendar", [undefined, { done: 0, active: true }, { done: 1 }, { done: 3 }].map(CAL.dayLevel), [0, 1, 2, 3], "colour levels");

// exercise-name matching for the strength badges
const names = {
  "Bench press": "bench", "Bench press / mašina za grudi": "bench", "Incline bench press": null, "Bench dips": null,
  "Hip thrust on bench": "hipthrust", "Squat": "squat", "Čučanj": "squat", "Front squat": "squat", "Bulgarian split squat": null,
  "Goblet squat": null, "Deadlift": "deadlift", "Sumo deadlift": "deadlift", "Romanian deadlift": null, "Mrtvo dizanje": "deadlift",
  "Overhead press": "ohp", "Military press": "ohp", "Machine shoulder press": null, "Pull-ups": "pullups", "Zgibovi": "pullups",
  "Chin-ups": "pullups", "Assisted pull-ups": null, "Lat pulldown": null, "Dips": "dips", "Propadanja": "dips", "Push-ups": "pushups",
  "Sklekovi": "pushups", "Knee push-ups": null, "Plank": "plank", "Side plank": null, "Farmer's walk": "farmer",
  "Farmerski hod": "farmer", "Glute bridge": null, "Dead bug": null, "Face pulls": null
};
S.replaceState({ program: [{ id: "w", dow: 0, title: "x", ex: Object.keys(names).map((n, i) => ({ id: "e" + i, name: n, sets: "3" })) }] });
Object.keys(names).forEach((n, i) => eq("matching", A.liftOf("e" + i), names[n], "'" + n + "' counts as"));

// data repair (normalizeState)
const fixed = S.normalizeState({ weeks: [], program: "nope", name: 42, profile: "x" });
eq("repair", fixed.weeks, {}, "weeks that aren't an object become {}");
check("repair", !("program" in fixed), "invalid program with no history is dropped (welcome screen offers a new one)");
eq("repair", fixed.name, "42", "name is turned into text");
const fixed2 = S.normalizeState({
  weeks: { "2026-W10": { a: { done: 1, sets: { x: [{ w: 80, r: 5 }, null, "junk"] }, ex: "bad" } }, "not-a-week": {} },
  program: [{ id: "a", dow: 9, altDow: 9, ex: [{ id: "e1", name: "A" }, { id: "e1", name: "B" }, null] }, { id: "a" }, null],
  futureField: { keep: true }
});
eq("repair", Object.keys(fixed2.weeks), ["2026-W10"], "invalid week keys dropped");
eq("repair", fixed2.weeks["2026-W10"].a.sets.x, [{ w: "80", r: "5" }], "bad sets rows dropped, numbers become text");
eq("repair", fixed2.weeks["2026-W10"].a.ex, {}, "bad ticks object replaced");
eq("repair", fixed2.program.length, 2, "null workouts dropped");
check("repair", fixed2.program[0].id !== fixed2.program[1].id, "duplicate workout ids made unique");
eq("repair", fixed2.program[0].dow, 0, "impossible day becomes Monday");
eq("repair", fixed2.program[0].altDow, null, "impossible backup day removed");
eq("repair", fixed2.program[0].ex.length, 2, "null exercise dropped");
check("repair", fixed2.program[0].ex[0].id !== fixed2.program[0].ex[1].id, "duplicate exercise ids made unique");
eq("repair", fixed2.futureField, { keep: true }, "unknown fields kept (forward compatible)");
eq("repair", S.normalizeState({ weeks: { "2026-W01": { u: { done: true } } } }).program.length, 4, "history without a program gets the starter program");
const oldNew = S.normalizeState({ weeks: {}, program: [{ id: "w", dow: 1, ex: [{ id: "e", name: "Squat", sets: "3 × 5", isNew: true, optional: true }] }] }).program[0].ex[0];
check("repair", !("isNew" in oldNew) && oldNew.optional === true, "old 'new' tag removed from saved programs, other flags kept");
check("repair", JSON.stringify(mod.starter.starterProgram()).indexOf("isNew") < 0, "starter program has no 'new' tags");

// achievement metrics on a known history
S.replaceState({
  name: "T", onboarded: true, profile: { sex: "m", bw: "80" },
  program: [{ id: "u", dow: 5, title: "U", ex: [{ id: "bench", name: "Bench press", sets: "3" }] }, { id: "l", dow: 6, title: "L", ex: [{ id: "sq", name: "Squat", sets: "3" }] }],
  weeks: {
    "2026-W40": { u: { done: true, sets: { bench: [{ w: "90", r: "5" }] } }, l: { done: true, sets: { sq: [{ w: "120", r: "5" }] } } },
    "2026-W41": { u: { done: true, sets: { bench: [{ w: "100", r: "5" }] } } },
    "2026-W45": { u: { done: true, sets: { bench: [{ w: "95", r: "5" }] } } }
  }
});
const M = A.achMetrics();
eq("metrics", [M.workouts, M.records, M.weekend, M.comeback, M.perfect, M.bench, M.squat], [4, 1, 1, 1, 1, 100, 120], "workouts, records, weekend, comeback, perfect, best bench, best squat");
eq("metrics", Math.round(M.benchBw * 100) / 100, 1.25, "bench ÷ bodyweight");
const benchBadge = A.evalAch().find(r => r.a.id === "bench");
eq("metrics", benchBadge.level, 2, "100 kg bench for a man = Gold (Intermediate)");

// ---------------------------------------------------------------- summary
console.log("\n" + (failures ? "✗ " + failures + " problem(s), " : "✓ all good, ") + passes + " checks passed.");
process.exit(failures ? 1 : 0);
