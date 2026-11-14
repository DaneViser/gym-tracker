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
| `clock.css` | Red LED gym clock in the header. |
| `achievements.css` | Badge grid, medals, badge detail, targets chip + ⓘ tooltip, celebration pop-up. |
| `profile.css` | Profile sheet, settings rows, personal records. |
| `notices.css` | Backup reminder card, "new version" bar, toast. |
| `timer.css` | Rest timer bar. |
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
| `starter.js` | `STARTER` 4-day program (texts as `[en, sr]`), `starterProgram()`, `tr()`. |
| `state.js` | `state`, `loadState()`, `save()`, `replaceState()`, **`normalizeState()` (repairs old/broken data)**, `t()`, `esc()`, `uid()`, `lang`, `program()`, `onSaved()`/`onSaveFailed()` hooks. |
| `dates.js` | Week maths (Monday-based ISO weeks), date/number formatting, `viewMonday` + `setViewMonday()`. |
| `data.js` | `sessionData`, `setsOf`, `bestSet`, `lastSets`, `setText`, `num`, `plannedCount`. |
| `render.js` | `render()` → `renderSession()` → `renderTrackBody()` / `renderEditBody()` / `renderSetsPanel()`, `applyStatic()`, history squares, "+ Add workout", `toast()`, `buzz()`, swipe between weeks. |
| `timer.js` | Rest timer. |
| `progress.js` | `entriesFor()`, `openProgress()`, `renderProgress()` (hand-made SVG chart, no library). |
| `welcome.js` | First-visit flow, how-to guide, `setLang()`. |
| `profile.js` | `computeStats()`, `renderProfile()`, name/language/theme settings, delete all. |
| `controls.js` | `exportBackup()`, restore, load starter, backup reminder (`renderNag()`). |
| `achievements.js` | `ICONS` (Tabler, MIT), `LIFTS` name matching, `LADDERS` (researched standards), `ACH` badge list, `ACH_VERSION`, `ACH_CATS`, metrics, badge sheet + detail, `celebrate()`, `checkPR()`. |
| `clock.js` | Header clock. |
| `sound.js` | `SOUNDS` (made in code with Web Audio — no files), `playSound(kind)`, Sounds setting (off / timer / all, default timer). Tune a sound by editing its notes. |
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
      ex: [ { id: "bench", name: "…", sets: "3–4 × 6–10", optional?: true, isNew?: true } ] }
  ],
  weeks: {
    "2026-W46": {               // ISO week key from weekKey()
      "upper1": {               // keyed by workout id
        done: true,             // whole workout ticked
        ex:   { bench: true },  // exercise ticked
        sets: { bench: [ { w: "80", r: "8" }, … ] },  // strings, as typed
        w:    { bench: "85" }   // best weight, kept for older data/compat
      } } }
}
```

Also on `state`: `lastBackup` (ms timestamp), `backupCount`, `backupSnooze` (ms; reminder hidden until then),
`profile: { sex: "m" | "f" | "x", bw: "80" }` (optional, for strength badges), `achSeen: { badgeId: tierIndex }`
(highest tier already celebrated; strength badges use `"bench:m"` etc.) and `achVersion`. Achievements themselves
are never stored: they are recalculated from `weeks` + `program`.

Other keys: `gymtracker.lang` (`en`/`sr`), `gymtracker.theme` (`light`/`dark`, missing = auto), `gymtracker.sound` (`off`/`timer`/`all`, missing = timer).

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

**Change the starter program** (`js/starter.js`): edit `STARTER`. Each text is `[en, sr]`. Keep existing
`id`s, because saved ticks and sets are keyed by id. A new exercise needs a new unique id.
Users only get the new starter when they tap "Load starter program" in their profile.

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
- `e2e.js` (~1 min, needs Chrome/Edge): ~36 scenarios in a 375×812 frame — first visit, logging weird inputs,
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
