// Sounds, made in code with the Web Audio API (no sound files, nothing to license, works offline).
// playSound(kind) plays one of SOUNDS if the user's Sounds setting allows it:
//   "off" = never · "timer" = only the rest-timer beeps · "all" = every sound (default).
// Browsers only allow audio after a tap, so the audio engine is unlocked on the first tap (init()).
// Tune a sound by changing its notes below: [frequency Hz, start s, length s, waveform, volume 0..1].

const SETTING_KEY = "gymtracker.sound";
const MODES = ["off", "timer", "all"];

export const SOUNDS = { // exported so tools can render previews
  // tiny quiet "tick" for ordinary buttons (only in "All" mode), like a phone keyboard click
  tap: [[1500, 0, 0.035, "sine", 0.09, 1100]],
  // soft "pop" when ticking an exercise: quick falling sine
  pop: [[880, 0, 0.07, "sine", 0.22, 520]],
  // two-note chime when a workout is done
  done: [[784, 0, 0.16, "triangle", 0.22], [1175, 0.11, 0.26, "triangle", 0.2]],
  // small rising fanfare for a new record or badge
  fanfare: [[523, 0, 0.11, "triangle", 0.2], [659, 0.09, 0.11, "triangle", 0.2], [784, 0.18, 0.11, "triangle", 0.2], [1047, 0.27, 0.34, "triangle", 0.22]],
  // rest timer finished: three clear beeps
  timer: [[988, 0, 0.14, "sine", 0.32], [988, 0.24, 0.14, "sine", 0.32], [1319, 0.48, 0.3, "sine", 0.34]]
};

export function getSoundMode() {
  let m = null;
  try { m = localStorage.getItem(SETTING_KEY); } catch (e) {}
  return MODES.includes(m) ? m : "all";
}
export function setSoundMode(m) {
  if (!MODES.includes(m)) return;
  try { localStorage.setItem(SETTING_KEY, m); } catch (e) {}
}
// Pure rule (unit-tested): may this kind of sound play in this mode?
export const soundAllowed = (kind, mode) => mode === "all" || (mode === "timer" && kind === "timer");

export const soundLog = []; // last sounds requested — lets the automated tests check which sounds fired
let ctx = null;

// Create/resume the audio engine. Must happen during a tap at least once (browser rule).
export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch (e) { return null; }
}

// force: play even if the setting says no (used for the preview when choosing a setting).
export function playSound(kind, force) {
  const notes = SOUNDS[kind];
  if (!notes || (!force && !soundAllowed(kind, getSoundMode()))) return false;
  soundLog.push(kind); if (soundLog.length > 30) soundLog.shift();
  const ac = unlockAudio();
  if (!ac) return false;
  try {
    const t0 = ac.currentTime + 0.01;
    for (const [freq, at, len, wave, vol, slideTo] of notes) {
      const osc = ac.createOscillator(), gain = ac.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, t0 + at);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + at + len);
      // quick fade in/out so notes don't click
      gain.gain.setValueAtTime(0.0001, t0 + at);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + at + len);
      osc.connect(gain).connect(ac.destination);
      osc.start(t0 + at); osc.stop(t0 + at + len + 0.02);
    }
    return true;
  } catch (e) { return false; }
}

// Which taps get the "tap" tick. Buttons whose action already has its own sound are left out, so you
// never hear two sounds at once: ticking an exercise (pop), the Sounds setting (plays a preview).
const TAPPABLE = "button, summary, .s-head, [role='button']";
const OWN_SOUND = "#prSound button";
let lastTap = 0;

// Runs once at startup (called from main.js): unlock audio on the first tap anywhere, tap ticks.
export function init() {
  const unlock = () => { if (unlockAudio() && ctx.state === "running") document.removeEventListener("pointerdown", unlock); };
  document.addEventListener("pointerdown", unlock);
  document.addEventListener("click", e => {
    const el = e.target.closest && e.target.closest(TAPPABLE);
    if (!el || el.matches(OWN_SOUND) || el.disabled || e.target.closest(".daycheck")) return; // day box: chime / un-tick tap
    const now = Date.now(); if (now - lastTap < 40) return; // no machine-gun clicks
    lastTap = now;
    playSound("tap");
  }, true);
  // un-ticking an exercise or a workout: a tap (ticking plays the pop / chime instead)
  document.addEventListener("change", e => {
    if (e.target.type === "checkbox" && !e.target.checked && e.target.closest(".session")) playSound("tap");
  }, true);
}
