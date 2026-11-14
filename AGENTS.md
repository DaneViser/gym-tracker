# Gym Tracker — guide for AI agents

Read this whole file before changing anything. It is short on purpose.

## What this is

A phone-first weekly gym tracker. Live at **https://daneviser.github.io/gym-tracker/**
(repo `DaneViser/gym-tracker`, branch `main`, hosted by GitHub Pages).

- **No build step, no framework, no npm, no backend, no database.**
- Everything is in **one file: `index.html`** (HTML + CSS + JS inside one IIFE).
- User data lives only in the browser's `localStorage` on each phone.
- Two languages: **English (`en`) and Serbian Latin script (`sr`)**. Never use Cyrillic.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app. ~1650 lines. |
| `sw.js` | Service worker: keeps a copy of the app on the phone so it works offline. |
| `manifest.webmanifest` | "Add to home screen" settings (name, colors, icons). |
| `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | App icons (orange square, white dumbbell). |
| `.gitignore` | Ignores `.claude/`. |
| `THIRD_PARTY_LICENSES.md` | License for the Tabler icons (MIT). Keep it when using their icons. |
| `AGENTS.md` / `CLAUDE.md` | This guide. `CLAUDE.md` just imports it. |

## Map of `index.html` (search for these markers; line numbers drift)

| Search for | What's there |
|---|---|
| `:root {` | Color tokens. Dark mode is defined **twice** (media query + `[data-theme="dark"]`); change both. |
| `/* exercises */`, `/* profile */`, `.timer {` | CSS for those areas. Phone breakpoint: `@media (max-width: 420px)`. |
| `<header class="top">` | Header: 📈 progress, ? guide, profile avatar. |
| `<main id="sessions">` | Workout cards are rendered into here by JS. |
| `<!-- Progress -->`, `<!-- Profile -->`, `<!-- Welcome / guide -->` | The three modal sheets. |
| `const I18N = {` | **All UI text**, `en:` block then `sr:` block. |
| `const STARTER = [` | Built-in 4-day program, each text as `[english, serbian]`. |
| `// State` | `KEY`, language detection, `t()`, loading/saving `state`. |
| `// Dates` | Week math (Monday-based ISO weeks), date formatting. |
| `// Week / set data` | `sessionData`, `setsOf`, `bestSet`, `lastSets`, `setText`. |
| `// Render` | `render()` → `renderSession()` → `renderTrackBody()` / `renderEditBody()` / `renderSetsPanel()`. |
| `// Rest timer` | Bottom timer bar. |
| `// Progress charts` | `entriesFor()`, `openProgress()`, `renderProgress()` (hand-made SVG, no chart library). |
| `// Welcome / guide / language` | First-visit flow, `setLang()`. |
| `// Profile` | `computeStats()`, `renderProfile()`, theme, delete-all. |
| `// Controls` | Remaining button handlers, backup export (`exportBackup`) / import. |
| `// Achievements` | `ICONS` (Tabler, MIT), `ACH` badge list, `achMetrics()`, `evalAch()`, own sheet (`#achSheet`, opened from the profile row `#achOpen`), detail sheet, `celebrate()` pop-ups, `checkPR()` new-record pop-up, men/women/general ladders (`LADDERS`), exercise-name matching (`LIFTS`, `LIFT_NAMES`). |
| `// Gym clock (header)` | Red LED-style clock above the header buttons (CSS: `/* gym clock`). |
| `// Backup reminder` | `renderNag()`: banner if no backup after 14 days of use, or last one > 30 days old. |
| `// Offline, storage protection, updates` | Service worker registration, `navigator.storage.persist()`, new-version check. |

## Offline and updates (read before deploying)

- `sw.js` serves `index.html` **network first** (online = newest version; offline or > 4 s = saved copy)
  and icons/manifest **cache first**.
- **Bump `APP_VERSION` in `index.html` on every deploy** (e.g. `"2026-11-20.1"`). Phones that have the
  app open compare it with the live file and show "New version — tap to refresh". Forgetting it is not
  harmful (the next fresh open still gets the new version), the bar just won't appear.
- **Bump `CACHE` in `sw.js`** (e.g. `"gym-tracker-v2"`) only when icons or the manifest change.
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

Also on `state`: `lastBackup` (ms timestamp of last backup), `backupSnooze` (ms; reminder hidden until then),
`profile: { sex: "m" | "f" | "x", bw: "80" }` (optional, for bench badges), and `achSeen: { badgeId: tierIndex }`
(highest tier already celebrated; bench badges use `"bench:m"` etc.). Achievements themselves are never stored:
they are recalculated from `weeks` + `program`, so changing thresholds is safe.

**Add an achievement**: add an entry to `ACH` (`id`, Tabler `icon` name present in `ICONS`, metric `m`,
`tiers`, `title`/`desc` as `[en, sr]`); compute the metric in `achMetrics()` if it is new. New icons: copy the
`d` paths from the same Tabler version (`@tabler/icons` 3.19.0, `icons/outline/<name>.svg`) and list the icon in
`THIRD_PARTY_LICENSES.md`. Only use icon sets with MIT/ISC-style licenses.
Every badge has exactly **6 tiers** (Bronze, Silver, Gold, Platinum, Diamond, Legend).

**Change badge thresholds**: edit `LADDERS` / the `tiers` arrays, then **bump `ACH_VERSION`** so phones
re-record their levels silently (otherwise shifted tiers can fire false pop-ups or skip real ones).
Strength ladders follow Strength Level's standards (strengthlevel.com, men 80 kg / women 60 kg bodyweight):
Bronze = Beginner, Silver = Novice, Gold = Intermediate, Platinum = Advanced, Diamond = Elite, Legend = one
step beyond Elite. Keep that mapping if you add lifts, and keep the source comment above `LADDERS` current.

Other keys: `gymtracker.lang` (`en`/`sr`), `gymtracker.theme` (`light`/`dark`, missing = auto).

**Never rename or reshape these fields without a migration.** Real people have data on their
phones; a breaking change silently loses their history. Add new optional fields instead, and
make code tolerate them missing (see how `setsOf()` falls back from `sets` to `w`).

## Rules

1. Keep it a single static `index.html`. No frameworks, bundlers, npm packages or CDNs for JS.
2. **Every visible string goes through `t("key")`** and must exist in **both** `I18N.en` and `I18N.sr`.
   Serbian = Latin script, ekavian, informal "ti" (e.g. "Dodaj trening", "Sačuvaj kopiju").
3. Put user-typed text into the page with `textContent`, or `esc()` when building HTML strings.
   Never inject raw user text with `innerHTML`.
4. Phone first: check at **375 px wide**, tap targets ≥ 40 px, inputs `font-size: 16px`
   (stops iPhone zoom), no horizontal scroll.
5. Use the color tokens (`var(--accent)` etc.), never hard-coded colors, so dark mode keeps working.
6. Wrap every `localStorage` call in `try/catch` (private mode can throw).
7. After changing data in an event handler: `save(); render();`.

## Common changes (recipes)

**Change or add UI text**: edit the key in `I18N.en` *and* `I18N.sr`. For static HTML use
`data-i18n="key"` (sets innerHTML), `data-i18n-ph` (placeholder) or `data-i18n-aria` (aria-label + title).
`applyStatic()` fills them in on load and on language change.

**Change the starter program**: edit `STARTER`. Each text is `[en, sr]`. Keep existing `id`s,
because saved ticks and sets are keyed by id. A new exercise needs a new unique id.
Users only get the new starter when they tap "Load starter program" in their profile.

**Add a profile stat**: compute it in `computeStats()`, add a `card(...)` in `renderProfile()`,
add its label keys to both languages.

**Change colors**: edit `:root` and **both** dark blocks. Also update `theme-color` metas and
`manifest.webmanifest` if you change the background.

**Change the icon**: replace the three PNGs (same names and sizes: 180, 192, 512 px).

## Test locally

Serve the folder (any static server). The one used so far, run from the repo folder:

```bash
node -e "const fs=require('fs'),p=require('path');const T={'.html':'text/html; charset=utf-8','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};require('http').createServer((q,s)=>{let f=decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/,'')||'index.html';f=p.basename(f);fs.readFile(f,(e,d)=>{s.writeHead(e?404:200,{'Content-Type':T[p.extname(f)]||'text/plain'});s.end(e?'not found':d)})}).listen(5173)"
```

Open http://localhost:5173 at a 375×812 viewport. Check both languages (profile → Language),
both themes, and the browser console for errors. To test with data, set
`localStorage.setItem('gymtracker.v1', JSON.stringify({...}))` and reload.
**Clear your test data afterwards** (`localStorage.clear()`).

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

`built` = live. Then confirm with `curl -s https://daneviser.github.io/gym-tracker/ | grep -c "<something you added>"`.
Phones may cache the old page for up to ~10 minutes.

## Before you finish, check

- [ ] `APP_VERSION` bumped in `index.html`.
- [ ] Both `en` and `sr` strings added for anything new.
- [ ] No console errors; works at 375 px; dark and light both readable.
- [ ] Old saved data still loads (don't break the data model).
- [ ] Test data cleared, changes committed and pushed, Pages build is `built`.
