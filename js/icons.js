// All icons in the app: Tabler Icons (MIT license, @tabler/icons 3.19.0, see THIRD_PARTY_LICENSES.md).
// Use icon("name") in JS to get an <svg>, or put <i data-icon="name"></i> in HTML / texts and
// applyIcons() (called by applyStatic) fills it in. To add one: copy the path d="…" values from
// icons/outline/<name>.svg of the same Tabler version, add it below and to THIRD_PARTY_LICENSES.md.
// No emojis in the app: they look different on every phone. tools/check.js enforces this.

export const ICONS = {
  "alert-triangle": "M12 9v4 M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z M12 16h.01",
  "arrow-bar-to-up": "M12 10l0 10 M12 10l4 4 M12 10l-4 4 M4 4l16 0",
  "arrow-big-up-lines": "M9 12h-3.586a1 1 0 0 1 -.707 -1.707l6.586 -6.586a1 1 0 0 1 1.414 0l6.586 6.586a1 1 0 0 1 -.707 1.707h-3.586v3h-6v-3z M9 21h6 M9 18h6",
  "arrow-down": "M12 5l0 14 M18 13l-6 6 M6 13l6 6",
  "arrow-up": "M12 5l0 14 M18 11l-6 -6 M6 11l6 -6",
  "arrows-vertical": "M8 7l4 -4l4 4 M8 17l4 4l4 -4 M12 3l0 18",
  award: "M12 9m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0 M12 15l3.4 5.89l1.598 -3.233l3.598 .232l-3.4 -5.889 M6.802 12l-3.4 5.89l3.598 -.233l1.598 3.232l3.4 -5.889",
  barbell: "M2 12h1 M6 8h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2 M6 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1z M9 12h6 M15 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1z M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-2 M22 12h-1",
  calendar: "M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z M16 3v4 M8 3v4 M4 11h16 M11 15h1 M12 15v3",
  "calendar-check": "M11.5 21h-5.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v6 M16 3v4 M8 3v4 M4 11h16 M15 19l2 2l4 -4",
  car: "M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5",
  "chart-line": "M4 19l16 0 M4 15l4 -6l4 2l4 -5l4 4",
  check: "M5 12l5 5l10 -10",
  "chevron-left": "M15 6l-6 6l6 6",
  "chevron-right": "M9 6l6 6l-6 6",
  "chevrons-down": "M7 7l5 5l5 -5 M7 13l5 5l5 -5",
  "chevrons-up": "M7 11l5 -5l5 5 M7 17l5 -5l5 5",
  "circle-check": "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M9 12l2 2l4 -4",
  "device-floppy": "M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2 M12 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M14 4l0 4l-6 0l0 -4",
  "device-mobile": "M6 5a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-14z M11 4h2 M12 17v.01",
  "dots-vertical": "M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0 M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0 M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0",
  flame: "M12 12c2 -2.96 0 -7 -1 -8c0 3.038 -1.773 4.741 -3 6c-1.226 1.26 -2 3.24 -2 5a6 6 0 1 0 12 0c0 -1.532 -1.056 -3.94 -2 -5c-1.786 3 -2.791 3 -4 2z",
  "gender-female": "M12 9m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0 M12 14v7 M9 18h6",
  "gender-male": "M10 14m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0 M19 5l-5.4 5.4 M19 5h-5 M19 5v5",
  "hand-stop": "M8 13v-7.5a1.5 1.5 0 0 1 3 0v6.5 M11 5.5v-2a1.5 1.5 0 1 1 3 0v8.5 M14 5.5a1.5 1.5 0 0 1 3 0v6.5 M17 7.5a1.5 1.5 0 0 1 3 0v8.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7a69.74 69.74 0 0 1 -.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47",
  "info-circle": "M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0 M12 9h.01 M11 12h1v4h1",
  "list-check": "M3.5 5.5l1.5 1.5l2.5 -2.5 M3.5 11.5l1.5 1.5l2.5 -2.5 M3.5 17.5l1.5 1.5l2.5 -2.5 M11 6l9 0 M11 12l9 0 M11 18l9 0",
  lock: "M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6z M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0 M8 11v-4a4 4 0 1 1 8 0v4",
  medal: "M12 4v3m-4 -3v6m8 -6v6 M12 18.5l-3 1.5l.5 -3.5l-2 -2l3 -.5l1.5 -3l1.5 3l3 .5l-2 2l.5 3.5z",
  pencil: "M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4 M13.5 6.5l4 4",
  refresh: "M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4 M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4",
  scale: "M7 20l10 0 M6 6l6 -1l6 1 M12 3l0 17 M9 12l-3 -6l-3 6a3 3 0 0 0 6 0 M21 12l-3 -6l-3 6a3 3 0 0 0 6 0",
  "share-2": "M8 9h-1a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-8a2 2 0 0 0 -2 -2h-1 M12 14v-11 M9 6l3 -3l3 3",
  "shield-check": "M11.46 20.846a12 12 0 0 1 -7.96 -14.846a12 12 0 0 0 8.5 -3a12 12 0 0 0 8.5 3a12 12 0 0 1 -.09 7.06 M15 19l2 2l4 -4",
  sparkles: "M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z",
  stopwatch: "M5 13a7 7 0 1 0 14 0a7 7 0 0 0 -14 0z M14.5 10.5l-2.5 2.5 M17 8l1 -1 M14 3h-4",
  sun: "M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0 M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7",
  "tools-kitchen-2": "M19 3v12h-5c-.023 -3.681 .184 -7.406 5 -12zm0 12v6h-1v-3m-10 -14v17m-3 -17v3a3 3 0 1 0 6 0v-3",
  trophy: "M8 21l8 0 M12 17l0 4 M7 4l10 0 M17 4v8a5 5 0 0 1 -10 0v-8 M5 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M19 9m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
  truck: "M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M5 17h-2v-11a1 1 0 0 1 1 -1h9v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5",
  user: "M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0 M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2",
  walk: "M13 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0 M7 21l3 -4 M16 21l-2 -4l-3 -3l1 -6 M6 12l2 -3l4 -1l3 3l3 1",
  weight: "M12 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0 M6.835 9h10.33a1 1 0 0 1 .984 .821l1.637 9a1 1 0 0 1 -.984 1.179h-13.604a1 1 0 0 1 -.984 -1.179l1.637 -9a1 1 0 0 1 .984 -.821z",
  x: "M18 6l-12 12 M6 6l12 12"
};

// cls: extra CSS class, e.g. "i" for an inline icon that sits in a line of text.
export const icon = (n, cls) => '<svg' + (cls ? ' class="' + cls + '"' : "") + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + ICONS[n] + '"/></svg>';

// Fill every <i data-icon="…"> inside root (default: whole page) with its icon.
export function applyIcons(root) {
  (root || document).querySelectorAll("[data-icon]").forEach(el => {
    if (el.dataset.iconDone === el.dataset.icon) return;
    el.innerHTML = icon(el.dataset.icon); el.dataset.iconDone = el.dataset.icon;
  });
}
