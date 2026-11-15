// Browser test scenarios — run inside headless Chrome by tools/e2e.js (see runner.html).
// Each test boots the real app in a 375×812 frame with prepared saved data, acts like a user,
// and checks the result. After EVERY test we also check: no JavaScript errors and no sideways scrolling.

const KEY = "gymtracker.v1";
const frame = document.getElementById("app");
const report = (type, data) => fetch("/__report", { method: "POST", body: JSON.stringify(Object.assign({ type }, data)) });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
function assert(cond, msg) { if (!cond) throw new Error(msg); }
function assertEq(got, want, msg) { if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(msg + ": got " + JSON.stringify(got) + ", want " + JSON.stringify(want)); }

// ---------- helpers ----------
let app; // current app context
async function boot({ storage = {}, lang = "en", rawState, confirmAnswer = true, reopen = false } = {}) {
  if (!reopen) localStorage.clear(); // reopen: keep everything, like closing and reopening the app
  if (lang) localStorage.setItem("gymtracker.lang", lang);
  if (rawState !== undefined) localStorage.setItem(KEY, rawState);
  else if (storage) localStorage.setItem(KEY, JSON.stringify(storage));
  frame.src = "/?e2e=" + Date.now();
  await new Promise(r => { frame.onload = r; });
  const w = frame.contentWindow;
  const errors = [], alerts = [];
  w.addEventListener("error", e => errors.push(e.message));
  w.addEventListener("unhandledrejection", e => errors.push("unhandled promise: " + (e.reason && e.reason.message || e.reason)));
  for (let i = 0; i < 100 && !(w.__gym && w.__gym.ready); i++) await sleep(50);
  assert(w.__gym && w.__gym.ready, "app did not finish starting (startup crashed?)");
  w.confirm = () => app.confirmAnswer;
  w.alert = m => alerts.push(m);
  w.navigator.vibrate = () => true;
  const d = w.document;
  app = {
    w, d, errors, alerts, confirmAnswer,
    $: id => d.getElementById(id),
    q: s => d.querySelector(s), qa: s => [...d.querySelectorAll(s)],
    click(el) { assert(el, "element to click not found"); if (el.click) el.click(); else el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }, // SVG shapes have no .click()
    type(el, v, { change = true } = {}) { assert(el, "input not found"); el.value = v; el.dispatchEvent(new w.Event("input", { bubbles: true })); if (change) el.dispatchEvent(new w.Event("change", { bubbles: true })); },
    key(k, el) { (el || d).dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true })); },
    shown: id => d.getElementById(id).classList.contains("show"),
    stored: () => JSON.parse(w.localStorage.getItem(KEY) || "null"),
    text: el => (el ? el.textContent : "")
  };
  return app;
}
async function onboard(name = "Dane", start = "template") {
  assert(app.shown("welcome"), "welcome should be open");
  app.type(app.$("nameInput"), name, { change: false });
  app.click(app.q('input[name="start"][value="' + start + '"]'));
  app.click(app.$("next1")); app.click(app.$("finish"));
  await sleep(50);
}
function noSideScroll(where) {
  const de = app.d.documentElement;
  assert(de.scrollWidth <= app.w.innerWidth + 1, "page scrolls sideways (" + de.scrollWidth + "px > " + app.w.innerWidth + "px) " + where);
}
const card = sid => app.q('.session[data-sid="' + sid + '"]');
const exRow = (sid, i = 0) => app.qa('.session[data-sid="' + sid + '"] .exw')[i];
function openCard(sid) { const c = card(sid); if (!c.classList.contains("open")) app.click(c.querySelector(".s-head")); }
function logSets(sid, exIndex, rows) {
  openCard(sid);
  let r = exRow(sid, exIndex);
  if (!r.querySelector(".sets-panel")) { app.click(r.querySelector(".setbtn")); r = exRow(sid, exIndex); }
  rows.forEach(([w, reps], i) => {
    let row = exRow(sid, exIndex).querySelectorAll(".setrow")[i];
    if (!row) { app.click(exRow(sid, exIndex).querySelector('[data-a="add"]')); row = exRow(sid, exIndex).querySelectorAll(".setrow")[i]; }
    const [wi, ri] = row.querySelectorAll("input");
    app.type(wi, w); app.type(ri, reps);
  });
}
const weekOf = (offset = 0) => { // ISO key for this week + offset weeks
  const d = new Date(); d.setDate(d.getDate() - (d.getDay() + 6) % 7 + offset * 7);
  const u = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); u.setUTCDate(u.getUTCDate() + 4 - (u.getUTCDay() || 7));
  const y0 = new Date(Date.UTC(u.getUTCFullYear(), 0, 1));
  return u.getUTCFullYear() + "-W" + String(Math.ceil(((u - y0) / 864e5 + 1) / 7)).padStart(2, "0");
};
// An onboarded user with the (English) starter program, taken straight from the app's own code.
const { starterProgram } = await import("/js/starter.js");
const starterUser = extra => Object.assign({ name: "Dane", onboarded: true, weeks: {}, program: starterProgram() }, extra);

// =====================================================================================
// First visit
// =====================================================================================
test("first visit: welcome shows, empty and spaces-only names are refused", async () => {
  await boot({ storage: null });
  assert(app.shown("welcome"), "welcome not shown on first visit");
  app.click(app.$("next1"));
  assert(app.text(app.$("nameErr")).length > 0, "empty name accepted");
  app.type(app.$("nameInput"), "     ", { change: false }); app.click(app.$("next1"));
  assert(!app.$("step1").hidden, "spaces-only name accepted");
  await onboard("Dane");
  assert(!app.shown("welcome"), "welcome still open after finishing");
  assertEq(app.qa(".session").length, 4, "starter program has 4 workouts");
  assertEq(app.stored().name, "Dane", "name saved");
});

test("first visit: tapping outside or Escape can't skip the welcome", async () => {
  await boot({ storage: null });
  app.click(app.$("welcome")); app.key("Escape");
  assert(app.shown("welcome"), "welcome could be dismissed without a name");
});

test("first visit: 'build my own' starts empty and lets you add a workout", async () => {
  await boot({ storage: null });
  await onboard("Ana", "empty");
  assertEq(app.qa(".session").length, 0, "should start with no workouts");
  assert(app.q(".empty-state"), "empty-state hint missing");
  app.click(app.$("addWorkout"));
  assert(app.q(".edit-head"), "new workout should open in edit mode");
  app.click(app.q('[data-a="done"]'));
  assert(app.text(app.q(".s-title h2")).includes("Untitled") , "blank title should become 'Untitled workout'");
});

test("names with HTML/script are shown as plain text (no code injection)", async () => {
  await boot({ storage: null });
  const evil = '<img src=x onerror="window.top.__pwned=1">';
  await onboard(evil.slice(0, 30));
  openCard("upper1");
  app.click(app.q('.session[data-sid="upper1"] [data-a="edit"]'));
  app.type(app.q('.edit-head [data-f="title"]'), '<b id="inj">x</b>', { change: false });
  app.type(app.q('.ex-edit [data-f="name"]'), '<svg onload="window.top.__pwned=2">', { change: false });
  app.click(app.q('.session[data-sid="upper1"] [data-a="done"]'));
  app.click(app.$("profileBtn")); app.click(app.$("progressBtn"));
  await sleep(100);
  assert(!window.__pwned, "injected code ran");
  assert(!app.d.getElementById("inj"), "injected HTML element was created");
  assert(!app.q("#hello img") && app.text(app.$("hello")).includes("<img"), "name should appear as text");
});

// =====================================================================================
// Logging sets
// =====================================================================================
test("logging sets: auto-tick, 'same as last time', weird inputs don't break anything", async () => {
  await boot({ storage: starterUser({ weeks: { [weekOf(-1)]: { upper2: { done: true, ex: {}, w: {}, sets: { bench: [{ w: "70", r: "8" }, { w: "70", r: "8" }, { w: "70", r: "6" }] } } } } }) });
  logSets("upper2", 0, [["abc", "x"], ["-5", "0"], ["62,5", "8"]]);
  logSets("upper2", 0, [["1e9", "🏋️"], ["", ""], ["999999999999", "5"]]);
  logSets("upper2", 0, [["a".repeat(40), "1".repeat(40)]]);
  const st = app.stored().weeks[weekOf(0)].upper2.sets.bench;
  assert(st.length >= 3, "sets were not saved");
  app.click(exRow("upper2").querySelector(".pill.small")); // "Same as last time"
  assertEq(app.stored().weeks[weekOf(0)].upper2.sets.bench.map(x => x.w), ["70", "70", "70"], "'same as last time' should copy last week");
  assert(exRow("upper2").classList.contains("checked"), "exercise should tick itself when all sets are filled");
  app.click(app.$("progressBtn")); await sleep(50);
  assert(app.q(".chart-wrap svg"), "chart should render");
});

test("ticking every exercise completes the workout; un-ticking and day box work", async () => {
  await boot({ storage: starterUser() });
  openCard("lowerA");
  // tap the next unticked box on screen each time (the card redraws after every tap, like for a real finger)
  for (let i = 0; i < 20; i++) { const cb = app.qa('.session[data-sid="lowerA"] .ex input[type=checkbox]').find(c => !c.checked); if (!cb) break; app.click(cb); }
  assert(card("lowerA").classList.contains("done"), "workout should be done when all required exercises are ticked");
  const dc = card("lowerA").querySelector(".daycheck input");
  app.click(dc); assert(!app.stored().weeks[weekOf(0)].lowerA.done, "day box should un-complete");
  for (let i = 0; i < 25; i++) app.click(card("lowerA").querySelector(".daycheck input")); // frantic tapping
  assertEq(app.stored().weeks[weekOf(0)].lowerA.done, true, "after odd number of taps it should be done");
});

test("rest timer: start, switch, stop, and it counts down", async () => {
  await boot({ storage: starterUser() });
  app.click(app.q('#presets button[data-s="90"]'));
  app.click(app.q('#presets button[data-s="60"]')); // switch while running
  await sleep(1300);
  assert(/^0:5[89]$/.test(app.text(app.$("tclock"))), "timer should count down from 1:00, shows " + app.text(app.$("tclock")));
  app.click(app.q("#presets button.stop"));
  assertEq(app.text(app.$("tclock")), "0:00", "stop should reset");
});

// =====================================================================================
// Editing workouts
// =====================================================================================
test("editing: reorder at the edges, remove all exercises, same day as backup day", async () => {
  await boot({ storage: starterUser() });
  openCard("upper1");
  app.click(app.q('.session[data-sid="upper1"] [data-a="edit"]'));
  app.click(app.qa('.session[data-sid="upper1"] [data-a="up"]')[0]); // first "up" is disabled → nothing
  const n = app.qa('.session[data-sid="upper1"] .ex-edit').length;
  for (let i = 0; i < n + 3; i++) { const del = app.q('.session[data-sid="upper1"] [data-a="del"]'); if (del) app.click(del); }
  assertEq(app.qa('.session[data-sid="upper1"] .ex-edit').length, 0, "all exercises should be removable");
  const dow = app.q('.session[data-sid="upper1"] [data-f="dow"]'); app.type(dow, "3");
  const alt = app.q('.session[data-sid="upper1"] [data-f="altDow"]'); app.type(alt, "3");
  app.click(app.q('.session[data-sid="upper1"] [data-a="done"]'));
  const w = app.stored().program.find(p => p.id === "upper1");
  assertEq([w.dow, w.altDow, w.ex.length], [3, null, 0], "backup day equal to main day must be cleared");
  openCard("upper1");
  assert(app.q('.session[data-sid="upper1"] .empty-ex'), "empty workout should explain how to add exercises");
});

test("deleting a workout keeps its history visible in the progress chart", async () => {
  await boot({ storage: starterUser({ weeks: { [weekOf(-1)]: { upper1: { done: true, ex: {}, w: {}, sets: { bench: [{ w: "80", r: "5" }] } } } } }) });
  openCard("upper1");
  app.click(app.q('.session[data-sid="upper1"] [data-a="edit"]'));
  app.click(app.q('.session[data-sid="upper1"] [data-a="delw"]'));
  assert(!card("upper1"), "workout should be deleted");
  app.click(app.$("progressBtn")); await sleep(50);
  assert(app.text(app.$("pBody")).includes("Deleted workout") || app.qa(".hist-table tbody tr").length > 0, "history of a deleted workout should still show");
});

test("cancelling a delete keeps everything", async () => {
  await boot({ storage: starterUser(), confirmAnswer: false });
  openCard("upper1");
  app.click(app.q('.session[data-sid="upper1"] [data-a="edit"]'));
  app.click(app.q('.session[data-sid="upper1"] [data-a="delw"]'));
  assert(card("upper1"), "workout deleted although the user said Cancel");
  app.click(app.$("profileBtn")); app.click(app.$("wipeBtn"));
  assertEq(app.stored().name, "Dane", "data wiped although the user said Cancel");
});

// =====================================================================================
// Broken / old / hostile saved data
// =====================================================================================
test("corrupted saved data: app still starts, and the broken copy is kept for recovery", async () => {
  await boot({ rawState: '{"weeks": {"2026-W01": {"upper1": {"done": tr' });
  assert(app.shown("welcome"), "should fall back to a fresh start");
  const kept = Object.keys(localStorage).filter(k => k.startsWith(KEY + ".corrupt-"));
  assertEq(kept.length, 1, "broken data should be kept under " + KEY + ".corrupt-*");
});

test("malformed data shapes (wrong types everywhere) don't crash", async () => {
  await boot({ rawState: JSON.stringify({ name: { x: 1 }, onboarded: true, weeks: { "2026-W46": "x", [weekOf(0)]: { upper1: { sets: "no", ex: [1], w: null } } },
    program: [{ id: 5, dow: "Tuesday", ex: "none" }, null, { title: "OK", ex: [{ name: null }, 7] }], profile: [], achSeen: "x", lastBackup: "yesterday" }) });
  assert(app.qa(".session").length === 2, "the 2 usable workouts should render");
  app.click(app.$("profileBtn")); app.click(app.$("achOpen")); app.click(app.$("achSClose")); app.click(app.$("prClose"));
  app.click(app.$("progressBtn")); app.click(app.$("pClose"));
});

test("data from the very first version (no program, old single weights) still works", async () => {
  await boot({ storage: { weeks: { [weekOf(-1)]: { upper2: { ex: { bench: true }, w: { bench: "80" }, done: true } } } } });
  assert(app.shown("welcome") && app.$("programChoice").hidden, "old users only get asked their name");
  app.type(app.$("nameInput"), "Old", { change: false }); app.click(app.$("next1")); app.click(app.$("finish"));
  assertEq(app.qa(".session").length, 4, "starter program restored for old data");
  openCard("upper2");
  assert(app.text(exRow("upper2").querySelector(".setbtn")).includes("80"), "last week's 80 kg should show as a hint");
});

test("storage full / blocked: the user is warned instead of silently losing data", async () => {
  await boot({ storage: starterUser() });
  app.w.Storage.prototype.setItem = function () { throw new DOMException("full", "QuotaExceededError"); };
  openCard("upper1");
  app.click(app.q('.session[data-sid="upper1"] .ex input[type=checkbox]'));
  await sleep(50);
  assert(app.$("toast").classList.contains("show") && /save|čuva/i.test(app.text(app.$("toast"))), "no warning shown when saving fails: '" + app.text(app.$("toast")) + "'");
});

// =====================================================================================
// Backups
// =====================================================================================
function restoreFile(text, name = "backup.json") {
  const dt = new app.w.DataTransfer();
  dt.items.add(new app.w.File([text], name, { type: "application/json" }));
  const inp = app.$("importFile"); inp.files = dt.files;
  inp.dispatchEvent(new app.w.Event("change", { bubbles: true }));
  return sleep(150);
}
test("backup → restore round trip gives back exactly the same workouts and sets", async () => {
  const weeks = { [weekOf(-2)]: { upper1: { done: true, ex: { bench: true }, w: { bench: "85" }, sets: { bench: [{ w: "85", r: "5" }] } } } };
  await boot({ storage: starterUser({ weeks }) });
  let blob = null; app.w.URL.createObjectURL = b => { blob = b; return "blob:test"; };
  app.click(app.$("profileBtn")); app.click(app.$("exportBtn")); await sleep(100);
  assert(blob, "backup file was not created");
  const text = await blob.text();
  assertEq(app.stored().backupCount, 1, "backup should be counted");
  app.click(app.$("wipeBtn")); await sleep(50);
  assert(app.shown("welcome"), "wipe should show welcome");
  await onboard("Temp", "empty");
  await restoreFile(text);
  assertEq(app.stored().weeks[weekOf(-2)].upper1.sets.bench, [{ w: "85", r: "5" }], "sets not restored");
  assertEq(app.stored().name, "Dane", "name not restored");
  assertEq(app.qa(".session").length, 4, "workouts not restored");
});

test("restoring a wrong file is refused with a message (not JSON, an array, someone's photo)", async () => {
  await boot({ storage: starterUser() });
  app.click(app.$("profileBtn"));
  await restoreFile("this is not json");
  await restoreFile("[1,2,3]");
  await restoreFile("\x89PNG\r\n\x1a\n binary junk", "photo.png");
  await restoreFile('{"hello":"world"}');
  assertEq(app.alerts.length, 4, "each bad file should show a message");
  assertEq(app.stored().name, "Dane", "data must stay untouched after bad restores");
});

test("restoring a backup with broken pieces repairs what it can", async () => {
  await boot({ storage: starterUser() });
  await restoreFile(JSON.stringify({ name: "Rest", weeks: { [weekOf(0)]: { x: { sets: { y: "nope" } } } }, program: [{ id: "x", title: "Mine", ex: [{ id: "y", name: "Row" }] }, "junk"] }));
  assertEq(app.qa(".session").length, 1, "the valid workout should be restored");
  assertEq(app.text(app.$("hello")).trim(), "Hey, Rest", "name should be restored");
});

// =====================================================================================
// Profile, settings, achievements
// =====================================================================================
test("body weight: nonsense values are ignored, a real one is kept", async () => {
  await boot({ storage: starterUser() });
  app.click(app.$("profileBtn"));
  for (const v of ["abc", "-80", "0", "1000", "8"]) { app.type(app.$("prBw"), v, { change: false }); app.click(app.$("prBwSave")); assertEq(app.stored().profile.bw, "", "'" + v + "' should be ignored"); }
  app.type(app.$("prBw"), "82,5", { change: false }); app.click(app.$("prBwSave"));
  assertEq(app.stored().profile.bw, "82.5", "82,5 should be saved as 82.5");
});

test("name change: empty name refused, long name doesn't break the layout", async () => {
  await boot({ storage: starterUser() });
  app.click(app.$("profileBtn"));
  app.type(app.$("prNameInput"), "   ", { change: false }); app.click(app.$("prNameSave"));
  assertEq(app.stored().name, "Dane", "blank name should not be saved");
  app.type(app.$("prNameInput"), "Maksimilijanaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", { change: false }); app.click(app.$("prNameSave"));
  noSideScroll("with a very long name (profile)");
  app.click(app.$("prClose")); noSideScroll("with a very long name (main screen)");
});

test("achievements: sheet, categories, detail, ⓘ tooltip, men/women switch is silent", async () => {
  const weeks = {};
  for (let i = 1; i <= 6; i++) weeks[weekOf(-i)] = { upper1: { done: true, ex: {}, w: {}, sets: { bench: [{ w: String(80 + i * 2.5), r: "5" }], pullups: [{ w: "", r: "12" }] } } };
  await boot({ storage: starterUser({ weeks }) });
  app.click(app.$("profileBtn")); app.click(app.$("achOpen"));
  assertEq(app.qa(".ach").length, 20, "20 badges");
  assertEq(app.qa(".ach-cat").length, 2, "2 categories");
  app.click(app.qa(".ach").find(b => app.text(b.querySelector(".at")) === "Bench press"));
  assert(app.shown("achModal"), "detail should open");
  app.click(app.q(".tc-i")); assert(app.q(".tchip.open"), "ⓘ should open on tap");
  app.click(app.q("#achDetail h2")); assert(!app.q(".tchip.open"), "ⓘ should close on outside tap");
  app.key("Escape"); assert(!app.shown("achModal") && app.shown("achSheet"), "Escape closes only the top sheet");
  app.key("Escape"); app.key("Escape"); app.key("Escape"); app.key("Escape"); // spam Escape with nothing open
  app.click(app.$("profileBtn"));
  for (const s of ["f", "m", "x", "f"]) app.click(app.q('#prSex [data-v="' + s + '"]'));
  await sleep(900);
  assert(app.$("celebrate").hidden, "switching men/women must not trigger pop-ups");
});

test("new personal record pop-up appears, and only once per record", async () => {
  await boot({ storage: starterUser({ weeks: { [weekOf(-1)]: { upper2: { done: true, ex: {}, w: {}, sets: { bench: [{ w: "80", r: "5" }] } } } } }) });
  logSets("upper2", 0, [["85", "5"]]);
  assert(!app.$("celebrate").hidden && /record/i.test(app.text(app.$("celebrate"))), "record pop-up missing");
  const shownText = app.text(app.$("celebrate"));
  app.click(app.$("celebrate")); await sleep(300);
  logSets("upper2", 0, [["85", "6"]]); await sleep(50);
  assert(app.$("celebrate").hidden || app.text(app.$("celebrate")) !== shownText, "same record celebrated twice");
});

test("Serbian everywhere: no missing texts on any screen", async () => {
  await boot({ storage: starterUser(), lang: "sr" });
  const screens = [() => {}, () => app.click(app.$("profileBtn")), () => app.click(app.$("achOpen")), () => { app.click(app.$("achSClose")); app.click(app.$("prClose")); app.click(app.$("progressBtn")); }, () => { app.click(app.$("pClose")); app.click(app.$("helpBtn")); }];
  for (const show of screens) {
    show();
    const txt = app.d.body.innerText;
    const raw = txt.match(/\b[a-z]+[A-Z][A-Za-z]+\b/g) || []; // camelCase leftovers = untranslated keys
    assert(raw.length === 0, "untranslated keys visible: " + raw.slice(0, 5).join(", "));
    noSideScroll("in Serbian");
  }
  assert(/Ponedeljak|Uto|Nedelja|nedelj/i.test(app.d.body.innerText), "Serbian text not shown");
});

test("switching language and theme while editing doesn't lose anything", async () => {
  await boot({ storage: starterUser() });
  logSets("upper2", 0, [["90", "3"]]);
  openCard("upper1"); app.click(app.q('.session[data-sid="upper1"] [data-a="edit"]'));
  app.click(app.$("profileBtn")); app.click(app.q('#prLang [data-v="sr"]')); app.click(app.q('#prTheme [data-v="dark"]')); app.click(app.q('#prLang [data-v="en"]')); app.click(app.q('#prTheme [data-v="auto"]')); app.click(app.$("prClose"));
  assert(app.q('.session[data-sid="upper1"] .edit-head'), "edit mode should survive a language switch");
  assertEq(app.stored().weeks[weekOf(0)].upper2.sets.bench[0], { w: "90", r: "3" }, "logged set lost");
});

// =====================================================================================
// Weeks, layout, performance
// =====================================================================================
test("week navigation far into the past/future and across new year works", async () => {
  await boot({ storage: starterUser() });
  const titles = new Set();
  for (let i = 0; i < 70; i++) { app.click(app.$("nextWk")); titles.add(app.text(app.$("wkTitle"))); }
  assertEq(titles.size, 70, "every week should have its own title");
  for (let i = 0; i < 140; i++) app.click(app.$("prevWk"));
  app.click(app.$("todayBtn"));
  assert(app.text(app.$("wkTitle")).startsWith("This week"), "'Jump to this week' should come back");
});

test("phone layout: nothing scrolls sideways on any screen", async () => {
  const weeks = {}; weeks[weekOf(0)] = { upper2: { done: false, ex: {}, w: {}, sets: { bench: [{ w: "100", r: "5" }] } } };
  await boot({ storage: starterUser({ name: "Aleksandraaaaaaaaaaaaaaaaaaaa", weeks, profile: { sex: "f", bw: "60" } }) });
  noSideScroll("main screen");
  logSets("upper2", 0, [["100", "5"]]); noSideScroll("sets panel");
  openCard("upper1"); app.click(app.q('.session[data-sid="upper1"] [data-a="edit"]')); noSideScroll("edit mode");
  app.click(app.$("progressBtn")); noSideScroll("progress"); app.click(app.$("pClose"));
  app.click(app.$("profileBtn")); noSideScroll("profile");
  for (const b of app.qa(".pr-btn")) { // the › must sit next to its text, not drop onto its own line
    const c = b.querySelector(".chev-r").getBoundingClientRect(), tx = b.firstElementChild.getBoundingClientRect();
    assert(Math.abs((c.top + c.bottom) / 2 - (tx.top + tx.bottom) / 2) < 20, "› arrow wrapped onto its own line in '" + b.textContent.trim().slice(0, 30) + "'");
  }
  app.click(app.$("achOpen")); noSideScroll("achievements");
  app.click(app.qa(".ach")[6]); noSideScroll("badge detail");
});

test("3 years of heavy training data stays fast", async () => {
  const weeks = {}, ids = ["bench", "pullups", "row", "sidedelt", "facepull", "mpress"];
  for (let i = 0; i < 156; i++) {
    const wk = weekOf(-i), rec = {};
    for (const sid of ["upper1", "lowerA", "upper2", "lowerB"]) {
      const sets = {}; ids.forEach((e, j) => { sets[e] = [1, 2, 3, 4].map(k => ({ w: String(40 + j * 5 + (156 - i) * 0.5), r: String(5 + k) })); });
      rec[sid] = { done: true, ex: {}, w: {}, sets };
    }
    weeks[wk] = rec;
  }
  const t0 = performance.now();
  await boot({ storage: starterUser({ weeks }) });
  const tBoot = performance.now() - t0;
  const t1 = performance.now();
  app.click(app.$("profileBtn")); app.click(app.$("achOpen"));
  const tAch = performance.now() - t1;
  app.click(app.$("achSClose")); app.click(app.$("prClose"));
  const t2 = performance.now(); app.click(app.$("progressBtn")); const tChart = performance.now() - t2;
  report("log", { text: "3 years of data: start " + Math.round(tBoot) + " ms, profile+badges " + Math.round(tAch) + " ms, chart " + Math.round(tChart) + " ms" });
  assert(tBoot < 4000 && tAch < 1500 && tChart < 1500, "too slow");
});

// =====================================================================================
// More ways to poke at it
// =====================================================================================
test("rest timer actually finishes (green 'Go!'), then resets itself", async () => {
  await boot({ storage: starterUser() });
  const b = app.q('#presets button[data-s="60"]'); b.dataset.s = "1"; // 1-second timer for the test
  app.click(b); await sleep(1500);
  assert(app.$("timer").classList.contains("finished"), "timer should show the finished state");
  await sleep(3200);
  assert(!app.$("timer").classList.contains("finished"), "finished state should clear after 3 s");
});

test("swiping left/right changes the week; swiping in the sets boxes doesn't", async () => {
  await boot({ storage: starterUser() });
  const swipe = (el, dx) => {
    const T = (x) => new app.w.Touch({ identifier: 1, target: el, clientX: x, clientY: 300 });
    el.dispatchEvent(new app.w.TouchEvent("touchstart", { touches: [T(200)], changedTouches: [T(200)], bubbles: true }));
    el.dispatchEvent(new app.w.TouchEvent("touchend", { touches: [], changedTouches: [T(200 + dx)], bubbles: true }));
  };
  const before = app.text(app.$("wkTitle"));
  swipe(app.$("sessions"), -150);
  assert(app.text(app.$("wkTitle")) !== before, "swipe left should go to next week");
  swipe(app.$("sessions"), 150);
  assertEq(app.text(app.$("wkTitle")), before, "swipe right should come back");
  logSets("upper2", 0, [["50", "5"]]);
  swipe(exRow("upper2").querySelector(".setrow input"), -150);
  assertEq(app.text(app.$("wkTitle")), before, "swiping on an input must not change week");
});

test("backup reminder: shows after 2 weeks, 'Later' hides it, and it stays hidden after reopening", async () => {
  const old = { [weekOf(-3)]: { upper1: { done: true, ex: { bench: true }, w: {}, sets: {} } } };
  await boot({ storage: starterUser({ weeks: old }) });
  assert(!app.$("nag").hidden, "reminder should show (3 weeks of use, never backed up)");
  app.click(app.$("nagLater"));
  assert(app.$("nag").hidden, "'Later' should hide it");
  const saved = app.stored();
  await boot({ storage: saved });
  assert(app.$("nag").hidden, "reminder came back right after reopening");
});

test("very long exercise names and set texts don't break the layout", async () => {
  await boot({ storage: starterUser() });
  openCard("upper1"); app.click(app.q('.session[data-sid="upper1"] [data-a="edit"]'));
  app.type(app.q('.ex-edit [data-f="name"]'), "Supercalifragilisticexpialidociousbenchpressvariation", { change: false });
  app.type(app.q('.ex-edit [data-f="sets"]'), "999999999999999999999999999999", { change: false });
  noSideScroll("in edit mode with long names");
  app.click(app.q('.session[data-sid="upper1"] [data-a="done"]'));
  openCard("upper1"); app.click(exRow("upper1").querySelector(".setbtn"));
  noSideScroll("long names, card open with sets panel");
  assert(exRow("upper1").querySelectorAll(".setrow").length <= 8, "a silly sets text must not create more than 8 rows");
});

test("set rows: can't go below 1, can add many, removing keeps the rest", async () => {
  await boot({ storage: starterUser() });
  logSets("upper2", 0, [["60", "10"], ["65", "8"]]);
  for (let i = 0; i < 10; i++) app.click(exRow("upper2").querySelector('.sets-panel [data-a="rm"]'));
  assertEq(exRow("upper2").querySelectorAll(".setrow").length, 1, "should stop at 1 row");
  assertEq(app.stored().weeks[weekOf(0)].upper2.sets.bench, [{ w: "60", r: "10" }], "first set should remain");
  for (let i = 0; i < 12; i++) app.click(exRow("upper2").querySelector('.sets-panel [data-a="add"]'));
  assertEq(exRow("upper2").querySelectorAll(".setrow").length, 13, "should allow adding rows");
});

test("tapping an 'achievement unlocked' pop-up opens that badge", async () => {
  await boot({ storage: starterUser() });
  openCard("lowerA");
  for (let i = 0; i < 20; i++) { const cb = app.qa('.session[data-sid="lowerA"] .ex input[type=checkbox]').find(c => !c.checked); if (!cb) break; app.click(cb); }
  for (let i = 0; i < 40 && app.$("celebrate").hidden; i++) await sleep(100);
  assert(!app.$("celebrate").hidden, "first finished workout should unlock a badge");
  app.click(app.$("celebrate"));
  assert(app.shown("achSheet") && app.shown("achModal"), "tapping the pop-up should open the badge");
});

test("theme and language choices survive closing and reopening the app", async () => {
  await boot({ storage: starterUser() });
  app.click(app.$("profileBtn")); app.click(app.q('#prTheme [data-v="light"]')); app.click(app.q('#prLang [data-v="sr"]'));
  await boot({ reopen: true, storage: null, lang: null });
  assertEq(app.d.documentElement.getAttribute("data-theme"), "light", "theme not remembered");
  assert(app.text(app.$("wkTitle")).startsWith("Ove nedelje"), "language not remembered");
  localStorage.removeItem("gymtracker.theme");
});

test("'Clear ticks' clears only this week's workout", async () => {
  await boot({ storage: starterUser({ weeks: { [weekOf(-1)]: { upper1: { done: true, ex: { bench: true }, w: {}, sets: {} } } } }) });
  openCard("upper1"); app.click(app.q('.session[data-sid="upper1"] .ex input[type=checkbox]'));
  app.click(app.q('.session[data-sid="upper1"] [data-a="clear"]'));
  assert(!app.stored().weeks[weekOf(0)].upper1, "this week's ticks should be gone");
  assert(app.stored().weeks[weekOf(-1)].upper1.done, "last week must stay untouched");
});

test("20 workouts, double-tapping '+ Add workout', two workouts on the same day", async () => {
  await boot({ storage: starterUser() });
  for (let i = 0; i < 16; i++) app.click(app.$("addWorkout"));
  app.qa('[data-a="done"]').forEach(b => b.isConnected && b.click());
  assertEq(app.qa(".session").length, 20, "should have 20 workouts");
  noSideScroll("with 20 workouts");
  const todays = app.qa(".session.today").length;
  assert(todays >= 1, "today's workouts should be highlighted");
  app.click(app.$("profileBtn")); app.click(app.$("achOpen")); app.click(app.$("achSClose")); app.click(app.$("prClose"));
});

test("help guide opened with '?' closes with Escape, the X-less backdrop, or 'Got it'", async () => {
  await boot({ storage: starterUser() });
  app.click(app.$("helpBtn")); assert(app.shown("welcome"), "guide should open");
  app.key("Escape"); assert(!app.shown("welcome"), "Escape should close the guide");
  app.click(app.$("helpBtn")); app.click(app.$("welcome")); assert(!app.shown("welcome"), "tapping outside should close the guide");
  app.click(app.$("helpBtn")); app.click(app.$("finish")); assert(!app.shown("welcome"), "'Got it' should close the guide");
});

test("sounds: 'All' is the default and plays every sound, 'Timer' only beeps for the timer, 'Off' is silent", async () => {
  await boot({ storage: starterUser({ weeks: { [weekOf(-1)]: { upper2: { done: true, ex: {}, w: {}, sets: { bench: [{ w: "80", r: "5" }] } } } } }) });
  localStorage.removeItem("gymtracker.sound");
  const log = app.w.__gym.soundLog;
  const finishTimer = async () => { const b = app.q('#presets button[data-s="60"]'); b.dataset.s = "1"; app.click(b); await sleep(1400); b.dataset.s = "60"; };
  // default = all
  app.click(app.$("progressBtn")); assert(log.includes("tap"), "default should be 'All' (button should tick)"); app.click(app.$("pClose"));
  // timer only
  app.click(app.$("profileBtn")); app.click(app.q('#prSound [data-v="timer"]')); app.click(app.$("prClose"));
  log.length = 0;
  openCard("lowerA"); app.click(app.q('.session[data-sid="lowerA"] .ex input[type=checkbox]'));
  await finishTimer();
  assertEq(log.slice(), ["timer"], "'Timer' mode should only beep for the timer");
  // all
  app.click(app.$("profileBtn")); app.click(app.q('#prSound [data-v="all"]')); app.click(app.$("prClose"));
  assertEq(localStorage.getItem("gymtracker.sound"), "all", "setting not saved");
  log.length = 0;
  openCard("lowerA");
  for (let i = 0; i < 20; i++) { const cb = app.qa('.session[data-sid="lowerA"] .ex input[type=checkbox]').find(c => !c.checked); if (!cb) break; app.click(cb); }
  logSets("upper2", 0, [["85", "5"]]); // new record
  await sleep(100);
  assert(log.includes("pop"), "tick should pop: " + log.join(","));
  assert(log.includes("done"), "finished workout should chime: " + log.join(","));
  assert(log.includes("fanfare"), "record should play a fanfare: " + log.join(","));
  // ordinary buttons tick; ticking an exercise pops WITHOUT an extra tick
  app.click(app.$("celebrate")); app.key("Escape"); app.key("Escape"); await sleep(60);
  log.length = 0; app.click(app.$("progressBtn")); assertEq(log.slice(), ["tap"], "a button should tick");
  app.click(app.$("pClose")); await sleep(60);
  log.length = 0; openCard("upper1"); await sleep(60); log.length = 0;
  app.click(app.q('.session[data-sid="upper1"] .ex input[type=checkbox]')); assertEq(log.slice(), ["pop"], "ticking should only pop");
  await sleep(60); log.length = 0; app.click(app.q('.session[data-sid="upper1"] .ex input[type=checkbox]')); assertEq(log.slice(), ["tap"], "un-ticking should tap");
  // off
  app.click(app.$("celebrate")); app.key("Escape"); app.key("Escape"); app.key("Escape");
  app.click(app.$("profileBtn")); app.click(app.q('#prSound [data-v="off"]')); app.click(app.$("prClose"));
  log.length = 0;
  openCard("upper1"); app.click(app.q('.session[data-sid="upper1"] .ex input[type=checkbox]'));
  await finishTimer();
  assertEq(log.slice(), [], "'Off' must be silent");
  localStorage.removeItem("gymtracker.sound");
});

test("training calendar: past workouts coloured, tap shows the day, today lights up when ticked", async () => {
  // last week: Upper 1 done on its day (Tue); Lower A (Wed or Thu) ticked on Thursday → must show on Thursday
  const lastMon = new Date(); lastMon.setHours(0, 0, 0, 0); lastMon.setDate(lastMon.getDate() - (lastMon.getDay() + 6) % 7 - 7);
  const thu = new Date(lastMon); thu.setDate(thu.getDate() + 3); thu.setHours(19);
  const key = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const tue = new Date(lastMon); tue.setDate(tue.getDate() + 1);
  await boot({ storage: starterUser({ weeks: { [weekOf(-1)]: { upper1: { done: true, ex: {}, w: {}, sets: {} }, lowerA: { done: true, doneAt: thu.getTime(), ex: {}, w: {}, sets: {} } } } }) });
  app.click(app.$("profileBtn"));
  assert(app.q('#prCalendar rect[data-d="' + key(tue) + '"]').classList.contains("l2"), "Tuesday (planned day) should be coloured");
  assert(app.q('#prCalendar rect[data-d="' + key(thu) + '"]').classList.contains("l2"), "Thursday (the day it was ticked) should be coloured");
  const wed = new Date(lastMon); wed.setDate(wed.getDate() + 2);
  assert(app.q('#prCalendar rect[data-d="' + key(wed) + '"]').classList.contains("l0"), "Wednesday should be empty (done on Thursday instead)");
  app.click(app.q('#prCalendar rect[data-d="' + key(thu) + '"]'));
  assert(app.text(app.q(".cal-info")).includes("Lower A"), "tapping a day should show what was done");
  assert(/Training days: 2/.test(app.text(app.q(".cal-head"))), "should count 2 training days: " + app.text(app.q(".cal-head")));
  noSideScroll("calendar");
  app.click(app.$("prClose"));
  // tick any workout done today → today's square lights up
  openCard("upper1"); app.click(card("upper1").querySelector(".daycheck input"));
  app.click(app.$("profileBtn"));
  assert(!app.q("#prCalendar rect.today").classList.contains("l0"), "today should light up after finishing a workout");
});

test("calorie calculator: prefilled weight, correct numbers, goal changes, bad input, remembered", async () => {
  await boot({ storage: starterUser({ profile: { sex: "m", bw: "80" } }) });
  app.click(app.$("nutriBtn"));
  assert(app.shown("nutri"), "calculator should open");
  assertEq(app.$("nKg").value, "80", "weight should come from the profile");
  assert(app.q(".n-empty"), "should ask for height and age first");
  app.type(app.$("nCm"), "180"); app.type(app.$("nAge"), "30");
  app.type(app.$("nJob"), "desk"); app.type(app.$("nSessions"), "4"); app.type(app.$("nMinutes"), "60"); app.type(app.$("nGoal"), "keep");
  assertEq(app.text(app.q(".n-main b")), "2,320", "maintenance calories for the test man");
  assert(/Protein/.test(app.text(app.$("nOut"))) && /144 g/.test(app.text(app.$("nOut"))), "protein should be 144 g");
  app.type(app.$("nGoal"), "lose05");
  assertEq(app.text(app.q(".n-main b")), "1,770", "500-ish kcal less to lose 0.5 kg/week");
  assert(app.q(".n-warn"), "should warn that this is below resting burn");
  app.type(app.$("nAge"), "abc");
  assert(app.q(".n-empty"), "nonsense age should show the fill-in message, not a number");
  app.type(app.$("nAge"), "30"); app.type(app.$("nKg"), "85,5");
  noSideScroll("calorie calculator");
  app.key("Escape"); assert(!app.shown("nutri"), "Escape should close it");
  assertEq(app.stored().profile.bw, "85.5", "weight typed here should update the profile");
  await boot({ reopen: true, storage: null, lang: null });
  app.click(app.$("nutriBtn"));
  assertEq([app.$("nCm").value, app.$("nAge").value, app.$("nGoal").value], ["180", "30", "lose05"], "inputs should be remembered");
});

test("calorie calculator in Serbian, for women, and switching men/women there is silent", async () => {
  await boot({ storage: starterUser({ profile: { sex: "m", bw: "60" }, nutrition: { cm: "165", age: "28", job: "feet", sessions: "3", minutes: "45", goal: "lose05" } }), lang: "sr" });
  app.click(app.$("nutriBtn"));
  app.click(app.q('#nSex [data-v="f"]'));
  assertEq(app.text(app.q(".n-main b")), "1.360", "woman's number (Serbian uses a dot for thousands)");
  assert(/Proteini/.test(app.text(app.$("nOut"))), "result should be in Serbian");
  await sleep(900);
  assert(app.$("celebrate").hidden, "changing men/women must not trigger badge pop-ups");
  assertEq(app.stored().profile.sex, "f", "choice should be shared with the profile");
});

test("no emojis anywhere, and every icon actually draws (both languages, every screen)", async () => {
  const weeks = { [weekOf(-1)]: { upper1: { done: true, ex: {}, w: {}, sets: { bench: [{ w: "100", r: "5" }], pullups: [{ w: "", r: "12" }] } } } };
  for (const lang of ["en", "sr"]) {
    await boot({ storage: starterUser({ weeks, profile: { sex: "f", bw: "60" }, lastBackup: Date.now() - 40 * 864e5 }), lang });
    const visit = [
      () => {}, () => { logSets("upper2", 0, [["50", "5"]]); }, () => { openCard("upper1"); app.click(app.q('.session[data-sid="upper1"] [data-a="edit"]')); },
      () => app.click(app.$("progressBtn")), () => { app.click(app.$("pClose")); app.click(app.$("profileBtn")); },
      () => app.click(app.$("achOpen")), () => app.click(app.qa(".ach").find(b => b.querySelector(".tc-i") || true)),
      () => { app.click(app.$("achClose")); app.click(app.qa(".ach")[0]); }, () => { app.key("Escape"); app.key("Escape"); app.click(app.$("prClose")); app.click(app.$("helpBtn")); },
      () => { app.click(app.$("finish")); app.$("updateBar").hidden = false; app.qa("details.info").forEach(d => { d.open = true; }); },
      () => { app.click(app.$("nutriBtn")); app.type(app.$("nCm"), "180"); app.type(app.$("nAge"), "30"); }
    ];
    for (const step of visit) {
      step();
      const m = app.d.body.innerText.match(/\p{Extended_Pictographic}/u);
      assert(!m, "emoji visible (" + lang + "): " + (m && m[0]));
      const empty = app.qa("[data-icon]").filter(el => !el.querySelector("svg") && el.offsetParent !== null);
      assert(empty.length === 0, "icon placeholder without an icon: " + empty.map(e => e.dataset.icon).join(", "));
      const broken = app.qa("svg path").filter(p => !p.getAttribute("d") || p.getAttribute("d") === "undefined");
      assert(broken.length === 0, broken.length + " icon(s) with no drawing (unknown icon name?)");
    }
  }
});

// =====================================================================================
// run
// =====================================================================================
for (const t of tests) {
  const t0 = performance.now();
  try {
    await t.fn();
    if (app) {
      assert(app.errors.length === 0, "JavaScript errors: " + app.errors.join(" | "));
      noSideScroll("(end of test)");
    }
    await report("pass", { name: t.name, ms: Math.round(performance.now() - t0) });
  } catch (e) {
    await report("fail", { name: t.name, error: (e && e.message) + (app && app.errors.length ? "\nJS errors: " + app.errors.join(" | ") : "") });
  }
  app = null;
}
localStorage.clear();
await report("done", {});
