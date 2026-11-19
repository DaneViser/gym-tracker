# Gym Tracker — guide for AI agents

Read this whole file before changing anything. It is short on purpose.

## What this is

A phone-first weekly gym tracker. Live at **https://daneviser.github.io/gym-tracker/**
(repo `DaneViser/gym-tracker`, branch `main`, hosted by GitHub Pages).

- **No build step, no framework, no npm packages, no backend, no database.** Edit a file, push, it's live.
- Plain HTML + CSS + JavaScript **ES modules**, split into small files by area (see below).
- **Every push runs automatic checks on GitHub** (see "Tests"). Run them locally before pushing.
- User data lives only in the browser's `localStorage` on each phone.
- Two languages: **English (`en`) and Serbian Latin script (`sr`)**. Never use Cyrillic.

## Files

| File | What it is |
|---|---|
| `index.html` | Page structure only (header, sheets, templates). Loads the CSS files and `js/main.js`. |
| `css/*.css` | Styles, one file per area (table below). |
| `js/*.js` | Code, one file per feature (table below). |
| `sw.js` | Service worker: keeps a copy of the app on the phone so it works offline. |
| `manifest.webmanifest` | "Add to home screen" settings (name, colors, icons). |
| `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | App icons (orange square, white dumbbell). |
| `tools/serve.js` | Local test server: `node tools/serve.js` → http://localhost:5173 (modules don't work from file://) |
| `tools/check.js` | Static checks + unit tests (no browser). `node tools/check.js` |
| `tools/e2e.js`, `tools/e2e/` | Browser tests in headless Chrome (`tests.js` = the scenarios). `node tools/e2e.js` |
| `.github/workflows/checks.yml` | Runs both on every push. |
| `package.json` | Only marks the project as ES modules and lists the commands. No dependencies. |
| `THIRD_PARTY_LICENSES.md` | License for the Tabler icons (MIT). Keep it when using their icons. |
| `AGENTS.md` / `CLAUDE.md` | This guide. `CLAUDE.md` just imports it. |

### CSS files (loaded in this order; later files win ties)

| File | What's in it |
|---|---|
| `tokens.css` | Colour variables. Dark mode is defined **twice** (media query + `[data-theme="dark"]`); change both. |
| `base.css` | html/body, layout, header, `.icon-btn`, shared controls (`.pill`, `.linkbtn`, `.field`, `.txt`, `.sel`), info sections, `.note`, stat cards. |
| `sheets.css` | Bottom sheets / modals (`.modal`, `.sheet`, `.p-top`, `.p-close`), `.seg` toggles, welcome guide. |
| `week.css` | Week bar: navigation, progress bar, last-8-weeks squares. |
| `workouts.css` | Workout cards, exercise rows, sets panel, edit mode, "+ Add workout". |
| `progress.css` | Progress chart sheet. |
| `achievements.css` | Badge grid, medals, badge detail, targets chip + ⓘ tooltip, celebration pop-up. |
| `profile.css` | Profile sheet, settings rows, personal records. |
| `notices.css` | Backup reminder card, "new version" bar, toast. |
| `timer.css` | Rest timer bar. |
| `calendar.css` | Training calendar. |
| `nutrition.css` | Calorie calculator sheet. |
| `library.css` | Program library sheet (goal chips, program cards, program detail). |
| `weight.css` | Body weight log + section headings in the calorie sheet. |
| `responsive.css` | Phone overrides (`max-width: 420px`). **Must stay the last stylesheet.** |

Modern CSS nesting and variables work in all current browsers, so use them freely in new CSS (no SCSS / build needed).

### JS files (ES modules)

`index.html` loads only `js/main.js`; every file `import`s what it uses from other files (look at the top of a
file to see its dependencies) and `export`s its own functions. Rules that keep this safe:

- **Top level = definitions only.** Anything that touches the page or storage (event listeners, reading
  localStorage) goes inside the file's `export function init()`, which `main.js` calls once at startup.
  This is why every module can also be loaded in Node for the tests.
- **You can't reassign another file's variable.** Use its setter: `replaceState(data)` (state.js),
  `setLangValue()` (state.js), `setViewMonday()` (dates.js). `state` is one object — mutate it, never replace it.
- New import? Add the name to the `import { … }` line at the top. `node tools/check.js` tells you if one is wrong.

| File | What's in it |
|---|---|
| `main.js` | Startup: `loadState()`, every file's `init()`, first `render()`, welcome. The only file index.html loads. |
| `version.js` | `APP_VERSION` — **bump on every deploy**. |
| `dom.js` | `$()` = `document.getElementById`. |
| `icons.js` | `ICONS` (all Tabler icons, MIT), `icon(name, cls)` → `<svg>`, `applyIcons()` fills `<i data-icon="name">`. |
| `i18n.js` | `I18N` — **all UI text**, `en:` block then `sr:` block; `setsWord()` (Serbian plurals). |
| `programs.js` | **Program library data** (no imports): `PROGRAMS` (ready-made programs, texts as `[en, sr]`), `X` (exercise names by id), `REFS` (research sources shown in the app). Rules at the top of the file. |
| `starter.js` | `STARTER` (= first program, the original 4-day plan), `programWorkouts(id)`, `starterProgram()`, `programIdOf()`, `tr()` (built-in texts in the current language, for every program). |
| `library.js` | Program library sheet: list + goal filter, detail, `openPrograms()`, `useProgram(id)`. Opened from Profile → Programs, the empty week and the first visit. |
| `state.js` | `state`, `loadState()`, `save()`, `replaceState()`, **`normalizeState()` (repairs old/broken data)**, `t()`, `esc()`, `uid()`, `lang`, `program()`, `onSaved()`/`onSaveFailed()` hooks. |
| `dates.js` | Week maths (Monday-based ISO weeks), date/number formatting, `viewMonday` + `setViewMonday()`. |
| `data.js` | `sessionData`, `setsOf`, `bestSet`, `lastSets`, `setText`, `num`, `plannedCount`, `repRange()` + `nextTarget()` (the "try 82.5" next-time suggestion: double progression). |
| `render.js` | `render()` → `renderSession()` → `renderTrackBody()` / `renderEditBody()` / `renderSetsPanel()`, `applyStatic()`, history squares, "+ Add workout", `toast()`, `buzz()`, swipe between weeks. |
| `timer.js` | Rest timer. |
| `progress.js` | `entriesFor()`, `openProgress()`, `renderProgress()` (hand-made SVG chart, no library). |
| `welcome.js` | First-visit flow, how-to guide, `setLang()`. |
| `profile.js` | `computeStats()`, `renderProfile()`, name/language/theme settings, delete all. |
| `controls.js` | `exportBackup()`, restore, backup reminder (`renderNag()`). |
| `achievements.js` | `LIFTS` name matching, `LADDERS` (researched standards), `ACH` badge list, `ACH_VERSION`, `ACH_CATS`, metrics, badge sheet + detail, `celebrate()`, `checkPR()`. |
| `calendar.js` | Training calendar in the profile (GitHub-style day grid), `sessionDay()` (real day via `doneAt`), `calendarDays()`. |
| `weight.js` | Body weight log at the top of the calorie sheet: `addWeighIn()`, chart, `bwTrend()` (4-week slope), `bwAdvice()` (kcal change vs. the calculator goal). Newest weigh-in is copied to `profile.bw`. |
| `nutrition.js` | Calorie calculator sheet; `calcNutrition()` = pure maths (Mifflin-St Jeor, job factor, workouts as MET, goal), sources in the file header. |
| `sound.js` | `SOUNDS` (made in code with Web Audio — no files), `playSound(kind)`, Sounds setting (off / timer / all, default all). Tune a sound by editing its notes. |
| `offline.js` | Service worker registration, `navigator.storage.persist()`, new-version check. |
**Adding a new JS file:** import it from the file(s) that use it (and call its `init()` from `main.js` if it
has one); **adding a CSS file:** add its `<link>` to `index.html`. Either way, add it to `SHELL` in `sw.js`
(so it works offline). `node tools/check.js` fails if you forget any of these.

## Offline and updates (read before deploying)

- `sw.js` serves the page, JS and CSS **network first** (online = newest; offline or > 4 s = saved copy)
  and icons **cache first**.
- **Bump `APP_VERSION` in `js/version.js` on every deploy** (e.g. `"2026-11-20.1"`). Phones that have the
  app open compare it with the live file and show "New version — tap to refresh". Forgetting it is not
  harmful (the next fresh open still gets the new version), the bar just won't appear.
- **Bump `CACHE` in `sw.js`** (e.g. `"gym-tracker-v3"`) only when icons change.
- Service workers do not run in every embedded preview browser. Test offline in real Chrome/Edge
  (DevTools → Application → Service workers → "Offline").

## Data model (localStorage key `gymtracker.v1`)

```js
state = {
  name: "Dane",                 // shown in header/profile
  onboarded: true,              // welcome flow finished
  program: [                    // the user's workouts (editable)
    { id: "upper1", dow: 1, altDow: null,   // dow: 0=Mon … 6=Sun; altDow = optional backup day
      title: "Upper 1", sub: "…",
      ex: [ { id: "bench", name: "…", sets: "3–4 × 6–10", optional?: true } ] }
  ],
  weeks: {
    "2026-W46": {               // ISO week key from weekKey()
      "upper1": {               // keyed by workout id
        done: true,             // whole workout ticked
        ex:   { bench: true },  // exercise ticked
        sets: { bench: [ { w: "80", r: "8" }, … ] },  // strings, as typed
        w:    { bench: "85" },  // best weight, kept for older data/compat
        doneAt: 1763197200000  // optional: when it was ticked done (ms) — the calendar uses it for the real day
      } } }
}
```

Also on `state`: `lastBackup` (ms timestamp), `backupCount`, `backupSnooze` (ms; reminder hidden until then),
`profile: { sex: "m" | "f" | "x", bw: "80" }` (optional, for strength badges), `achSeen: { badgeId: tierIndex }`
(highest tier already celebrated; strength badges use `"bench:m"` etc.), `achVersion`, and
`nutrition: { cm, age, job, sessions, minutes, goal }` (calorie calculator inputs; body weight lives in `profile.bw`), and
`bwLog: [{ d: "2026-11-15", kg: "80.4" }]` (body weight log, local dates, one per day, sorted). Achievements themselves
are never stored: they are recalculated from `weeks` + `program`.

Other keys: `gymtracker.lang` (`en`/`sr`), `gymtracker.theme` (`light`/`dark`, missing = auto), `gymtracker.sound` (`off`/`timer`/`all`, missing = all).

**Never rename or reshape these fields without a migration.** Real people have data on their
phones; a breaking change silently loses their history. Add new optional fields instead, and
make code tolerate them missing (see how `setsOf()` falls back from `sets` to `w`).

## Rules

1. No frameworks, bundlers, npm packages or CDNs for JS. Keep files small and on one topic.
2. **Every visible string goes through `t("key")`** and must exist in **both** `I18N.en` and `I18N.sr`.
   Serbian = Latin script, ekavian, informal "ti" (e.g. "Dodaj trening", "Sačuvaj kopiju").
3. Put user-typed text into the page with `textContent`, or `esc()` when building HTML strings.
   Never inject raw user text with `innerHTML`.
4. Phone first: check at **375 px wide**, tap targets ≥ 40 px, inputs `font-size: 16px`
   (stops iPhone zoom), no horizontal scroll.
5. Use the colour tokens (`var(--accent)` etc.), never hard-coded colours, so dark mode keeps working.
6. Wrap every `localStorage` call in `try/catch` (private mode can throw).
7. After changing data in an event handler: `save(); render();`.
8. Never put page or storage access at the top level of a module — put it in `init()`.
9. **No emojis** anywhere (they look different on every phone). Use icons: `icon("name", "i")` in JS for an
   inline icon, `<i data-icon="name"></i>` in index.html or inside a translated text. `check.js` enforces this.

## Common changes (recipes)

**Change or add UI text** (`js/i18n.js`): edit the key in `I18N.en` *and* `I18N.sr`. For static HTML use
`data-i18n="key"` (sets innerHTML), `data-i18n-ph` (placeholder) or `data-i18n-aria` (aria-label + title).
`applyStatic()` fills them in on load and on language change.

**Change or add a ready-made program** (`js/programs.js`): edit `PROGRAMS` (read the rules at the top of the file).
Each text is `[en, sr]`; build exercises with `e(id, "3 × 8–12")` (name from `X`, Serbian sets made automatically)
and workouts with `w(id, dow, title, sub, [...])`.
- **Workout ids** must be unique across all programs and **never change** (saved ticks are keyed by them).
- **Exercise ids** are shared: the same movement always uses the same id (`squat`, `bench`, `hipthrust`…) so charts
  and strength badges carry over when someone switches programs. A different movement gets a new id in `X`.
- Give every program research `refs` (keys of `REFS`) and a `how` (how to progress). Keep it evidence-based.
- Users only get changes when they pick the program again (Profile → Programs). `check.js` checks ids, text
  lengths, both languages and that English and Serbian names count for the same badge.

**Add a profile stat** (`js/profile.js`): compute it in `computeStats()`, add a `card(...)` in
`renderProfile()`, add its label keys to both languages.

**Add an achievement** (`js/achievements.js`): add an entry to `ACH` (`id`, Tabler `icon` name present in
`ICONS`, metric `m`, `tiers`, `title`/`desc` as `[en, sr]`); compute the metric in `achMetrics()` if it is new.
Badges with men/women targets (`sexNote: true`) and plank go in the Strength category, everything else in
Consistency (`achCat()`). Every badge has exactly **6 tiers** (Bronze, Silver, Gold, Platinum, Diamond, Legend).
New icons go in `js/icons.js`: copy the `d` paths from the same Tabler version (`@tabler/icons` 3.19.0,
`icons/outline/<name>.svg`, browse them at tabler.io/icons) and list the icon in `THIRD_PARTY_LICENSES.md`.
Only use MIT/ISC-style icon sets.

**Change badge thresholds**: edit `LADDERS` / the `tiers` arrays, then **bump `ACH_VERSION`** so phones
re-record their levels silently (otherwise shifted tiers can fire false pop-ups or skip real ones).
Strength ladders follow Strength Level's standards (strengthlevel.com, men 80 kg / women 60 kg bodyweight):
Bronze = Beginner, Silver = Novice, Gold = Intermediate, Platinum = Advanced, Diamond = Elite, Legend = one
step beyond Elite. Keep that mapping if you add lifts, and keep the source comment above `LADDERS` current.

**Change colours** (`css/tokens.css`): edit `:root` and **both** dark blocks. Also update `theme-color`
metas in `index.html` and `manifest.webmanifest` if you change the background.

**Change the icon**: replace the three PNGs (same names and sizes: 180, 192, 512 px), bump `CACHE` in `sw.js`.

## Tests (run before every push)

```bash
node tools/check.js
```

```bash
node tools/e2e.js
```

- `check.js` (seconds, no browser): every module loads, English/Serbian keys and `{placeholders}` match, every
  `t("key")` / `data-i18n` / `$("id")` exists, badges have 6 rising tiers, files are linked and in `SHELL`,
  `APP_VERSION` bumped, plus unit tests (week maths incl. week 53, number parsing, best set, exercise-name
  matching, Serbian plurals, data repair, badge metrics).
- `e2e.js` (~1 min, needs Chrome/Edge): ~45 scenarios in a 375×812 frame — first visit, logging weird inputs,
  editing, deleting, corrupted / malformed / very old saved data, storage full, backup round-trip and bad
  restore files, HTML injection in names, Serbian on every screen, long names, swipe, timer, 3 years of data
  (speed). Every scenario also fails on any JavaScript error or sideways scrolling.
  `node tools/e2e.js --watch` then open the printed URL to watch it run in a normal browser.
- **When you add a feature, add a scenario** in `tools/e2e/tests.js` (copy a similar one).
- GitHub runs both on every push (`.github/workflows/checks.yml`); a red ✗ in the repo = read the log.

To try the app by hand: `node tools/serve.js`, open http://localhost:5173 at 375×812, check both languages
(profile → Language), both themes, and the console. Clear test data afterwards (`localStorage.clear()`).
Stop only your own server process when done.

## Deploy (push = publish)

Pushing to `main` publishes the site automatically in about a minute.

```bash
git add -A
git commit -m "Short description of the change"
git push
```

On the owner's Windows PC the GitHub CLI is at `C:\Program Files\GitHub CLI\gh.exe`
(may not be on PATH). Check the Pages build finished:

```bash
"/c/Program Files/GitHub CLI/gh.exe" api repos/DaneViser/gym-tracker/pages/builds/latest --jq .status
```

`built` = live. Then confirm with `curl -s https://daneviser.github.io/gym-tracker/js/version.js`.
Phones may cache the old page for up to ~10 minutes.

## Before you finish, check

- [ ] `node tools/check.js` and `node tools/e2e.js` both pass.
- [ ] `APP_VERSION` bumped in `js/version.js`.
- [ ] Both `en` and `sr` strings added for anything new.
- [ ] New files added to `index.html` **and** `SHELL` in `sw.js`.
- [ ] No console errors; works at 375 px; dark and light both readable.
- [ ] Old saved data still loads (don't break the data model).
- [ ] Test data cleared, changes committed and pushed, Pages build is `built`.
