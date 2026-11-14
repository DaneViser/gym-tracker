// Startup. Runs last, after every other file has loaded.
"use strict";

applyStatic();
render();
protectStorage();
checkAchievements();
if (!state.name || !state.onboarded) openWelcome("first");
