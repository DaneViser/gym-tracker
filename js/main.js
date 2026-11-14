// Startup — the only file index.html loads. Importing it pulls in every other module.
// Order: load saved data → connect every screen's buttons (init) → draw → background jobs → welcome.

import { loadState, state, onSaved, onSaveFailed, t } from "./state.js";
import { applyStatic, render, toast, init as initRender } from "./render.js";
import { init as initTimer } from "./timer.js";
import { init as initProgress } from "./progress.js";
import { openWelcome, init as initWelcome } from "./welcome.js";
import { init as initProfile } from "./profile.js";
import { init as initControls } from "./controls.js";
import { checkAchievements, scheduleAchCheck, init as initAchievements } from "./achievements.js";
import { init as initClock } from "./clock.js";
import { protectStorage, init as initOffline } from "./offline.js";

loadState();

// The same order the screens were wired up in before (matters for the Escape key handlers).
initRender(); initTimer(); initProgress(); initWelcome(); initProfile(); initControls(); initAchievements(); initClock(); initOffline();

onSaved(scheduleAchCheck); // every saved change may unlock an achievement
let warnedSave = false;     // tell the user (once) if the phone refuses to save
onSaveFailed(() => { if (!warnedSave) { warnedSave = true; toast(t("saveFailed")); } });

applyStatic();
render();
protectStorage();
checkAchievements();
if (!state.name || !state.onboarded) openWelcome("first");
window.__gym = { ready: true }; // lets the automated browser tests know startup finished
