// Main screen: render(), workout cards, exercise rows, sets panel, edit mode, history squares,
// '+ Add workout', toast/vibration, swipe between weeks.

import { $ } from "./dom.js";
import { setsWord } from "./i18n.js";
import { tr } from "./starter.js";
import { esc, lang, program, save, sorted, state, t, uid } from "./state.js";
import { addDays, fmtShort, isoWeek, sameDay, setViewMonday, thisMonday, today, viewMonday, weekKey } from "./dates.js";
import { bestSet, doneCount, filled, lastSets, plannedCount, sessionData, setsOf, setsText, weekData } from "./data.js";
import { timerBusy } from "./timer.js";
import { openProgress } from "./progress.js";
import { renderNag } from "./controls.js";
import { checkPR, liftOf } from "./achievements.js";
import { applyIcons, icon } from "./icons.js";

// ======================================================================
// Render
// ======================================================================

export const openState = {}, openSets = {};
export const editing = new Set();

export function applyStatic() {
  document.documentElement.lang = lang === "sr" ? "sr-Latn" : "en";
  document.querySelectorAll("[data-i18n]").forEach(el => { el.innerHTML = t(el.dataset.i18n); });
  applyIcons(); // icons in the page and inside translated texts (<i data-icon>)
  document.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll("[data-i18n-aria]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); el.title = t(el.dataset.i18nAria); });
  [...$("langSeg").children].forEach(b => b.classList.toggle("on", b.dataset.lang === lang));
  if (!timerBusy()) $("tlabel").textContent = t("rest");
}

export function render() {
  const key = weekKey(viewMonday), w = isoWeek(viewMonday), isThisWeek = sameDay(viewMonday, thisMonday);
  $("hello").innerHTML = state.name ? esc(t("hello", { name: state.name })) + " " + icon("hand-stop", "i") : "";
  if (state.name) $("avatarInitial").textContent = state.name.trim().charAt(0).toUpperCase(); else $("avatarInitial").innerHTML = icon("user");
  $("wkTitle").textContent = isThisWeek ? t("thisWeek", { w: w.week }) : t("weekOf", { w: w.week, y: w.year });
  $("wkRange").textContent = fmtShort(viewMonday) + " – " + fmtShort(addDays(viewMonday, 6));
  const total = program().length, n = doneCount(key);
  $("count").textContent = n + "/" + total;
  $("bar").firstElementChild.style.width = (total ? n / total * 100 : 0) + "%";
  $("bar").classList.toggle("full", total > 0 && n === total);
  renderHistory(key);
  renderNag();

  const container = $("sessions");
  container.innerHTML = "";
  if (!total) { container.innerHTML = '<div class="empty-state">' + t("noWorkouts") + '</div>'; return; }
  const todayDow = (today.getDay() + 6) % 7;
  sorted().forEach(sess => container.appendChild(renderSession(sess, key, isThisWeek, todayDow)));
}

export function renderSession(sess, key, isThisWeek, todayDow) {
  const sd = sessionData(key, sess.id, false);
  const D = t("days");
  const hasAlt = sess.altDow != null && sess.altDow !== sess.dow;
  const isToday = isThisWeek && (todayDow === sess.dow || (hasAlt && todayDow === sess.altDow && !sd.done));
  const openKey = key + ":" + sess.id;
  if (openState[openKey] === undefined) openState[openKey] = isToday;
  const isEditing = editing.has(sess.id);
  const open = openState[openKey] || isEditing;
  const title = tr("w", sess.id, "title", sess.title) || t("untitled");
  const sub = tr("w", sess.id, "sub", sess.sub);

  const date = addDays(viewMonday, sess.dow);
  const el = document.createElement("article");
  el.className = "session" + (isToday ? " today" : "") + (sd.done ? " done" : "") + (open ? " open" : "");
  el.dataset.sid = sess.id;

  const required = sess.ex.filter(e => !e.optional);
  const checkedReq = required.filter(e => sd.ex[e.id]).length;
  const dayB = hasAlt ? D[sess.dow].charAt(0) + "/" + D[sess.altDow].charAt(0) : D[sess.dow];
  const daySmall = hasAlt ? date.getDate() + "/" + addDays(viewMonday, sess.altDow).getDate() : fmtShort(date);
  const flex = hasAlt ? '<span class="tag">' + esc(t("orDay", { a: D[sess.dow], b: D[sess.altDow] })) + '</span>' : "";

  el.innerHTML =
    '<div class="s-head" role="button" tabindex="0" aria-expanded="' + open + '">' +
      '<div class="s-day"><b>' + esc(dayB) + '</b><small>' + esc(daySmall) + '</small></div>' +
      '<div class="s-title"><h2>' + esc(title) + flex + '</h2>' +
      '<p>' + (sub ? esc(sub) + " · " : "") + esc(t("doneCount", { a: checkedReq, b: required.length })) + '</p></div>' +
      '<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>' +
      '<label class="daycheck" title="' + esc(t("markDone")) + '"><input type="checkbox" aria-label="' + esc(t("markDone")) + '"' + (sd.done ? " checked" : "") + '><span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg></span></label>' +
    '</div><div class="s-body"></div>';

  const body = el.querySelector(".s-body");
  if (isEditing) renderEditBody(body, sess); else renderTrackBody(body, sess, key, sd);

  const head = el.querySelector(".s-head");
  const toggle = () => { if (isEditing) return; openState[openKey] = !openState[openKey]; render(); };
  head.addEventListener("click", e => { if (e.target.closest(".daycheck")) return; toggle(); });
  head.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  const dc = el.querySelector(".daycheck input");
  dc.addEventListener("click", e => e.stopPropagation());
  dc.addEventListener("change", e => {
    const s = sessionData(key, sess.id, true);
    s.done = e.target.checked;
    if (s.done) toast(t("toastDone"), "circle-check");
    save(); render();
  });
  return el;
}

export function maybeCompleteSession(key, sess) {
  const s = sessionData(key, sess.id, true);
  const req = sess.ex.filter(x => !x.optional);
  if (req.length && req.every(x => s.ex[x.id]) && !s.done) { s.done = true; toast(t("toastDone"), "circle-check"); return true; }
  return false;
}

export function renderTrackBody(body, sess, key, sd) {
  if (!sess.ex.length) {
    const empty = document.createElement("div"); empty.className = "empty-ex"; empty.textContent = t("noExercises"); body.appendChild(empty);
  }
  sess.ex.forEach(ex => {
    const wrap = document.createElement("div");
    const checked = !!sd.ex[ex.id];
    wrap.className = "exw" + (checked ? " checked" : "");
    const inputId = key + "-" + sess.id + "-" + ex.id;
    const setsKey = key + ":" + sess.id + ":" + ex.id;
    wrap.innerHTML =
      '<div class="ex"><label class="main" for="' + esc(inputId) + '">' +
        '<input type="checkbox" id="' + esc(inputId) + '"' + (checked ? " checked" : "") + '>' +
        '<span><span class="name"></span><br><span class="meta"></span></span>' +
      '</label><button class="setbtn" type="button"><b></b><small></small></button></div>';
    const nm = wrap.querySelector(".name");
    nm.textContent = tr("e", ex.id, "name", ex.name) || t("unnamedEx");
    if (ex.isNew) nm.dataset.new = t("newTag");
    const meta = wrap.querySelector(".meta");
    meta.textContent = [tr("e", ex.id, "sets", ex.sets), ex.optional ? t("optional") : ""].filter(Boolean).join(" · ");
    if (ex.optional) meta.classList.add("opt");

    const btn = wrap.querySelector(".setbtn");
    const last = lastSets(sess.id, ex.id, key);
    function updateBtn() {
      const st = filled(setsOf(sessionData(key, sess.id, false), ex.id));
      const b = bestSet(st);
      btn.classList.toggle("logged", !!st.length);
      btn.classList.toggle("open", !!openSets[setsKey]);
      if (st.length) {
        if (b) btn.querySelector("b").textContent = String(b.w || "").trim() || (String(b.r || "").trim() + "×"); else btn.querySelector("b").innerHTML = icon("check", "i");
        btn.querySelector("small").textContent = st.length + " " + setsWord(st.length);
      } else {
        btn.querySelector("b").textContent = "+";
        const lb = bestSet(last);
        btn.querySelector("small").textContent = lb && String(lb.w || "").trim() ? t("last", { v: String(lb.w).trim() }) : t("log");
      }
      btn.setAttribute("aria-expanded", !!openSets[setsKey]);
    }
    updateBtn();
    btn.addEventListener("click", () => { openSets[setsKey] = !openSets[setsKey]; render(); });

    wrap.querySelector("input[type=checkbox]").addEventListener("change", e => {
      buzz(15);
      const s = sessionData(key, sess.id, true);
      s.ex[ex.id] = e.target.checked;
      maybeCompleteSession(key, sess);
      save(); render();
    });

    if (openSets[setsKey]) wrap.appendChild(renderSetsPanel(sess, ex, key, last, updateBtn, wrap));
    body.appendChild(wrap);
  });

  const foot = document.createElement("div");
  foot.className = "s-foot";
  foot.innerHTML = '<small></small><div class="acts"><button class="linkbtn" type="button" data-a="clear"></button>' +
    '<button class="pill" type="button" data-a="prog">' + icon("chart-line") + '</button><button class="pill" type="button" data-a="edit"></button></div>';
  foot.querySelector("small").textContent = t("footHint");
  foot.querySelector('[data-a="clear"]').textContent = t("clearTicks");
  foot.querySelector('[data-a="edit"]').innerHTML = icon("pencil", "i") + " " + esc(t("edit"));
  const pb = foot.querySelector('[data-a="prog"]'); pb.setAttribute("aria-label", t("progressFor")); pb.title = t("progressFor");
  pb.addEventListener("click", () => openProgress(sess));
  foot.querySelector('[data-a="clear"]').addEventListener("click", () => {
    if (!confirm(t("clearConfirm", { t: tr("w", sess.id, "title", sess.title) || t("untitled") }))) return;
    delete weekData(key, true)[sess.id]; save(); render();
  });
  foot.querySelector('[data-a="edit"]').addEventListener("click", () => { editing.add(sess.id); render(); });
  body.appendChild(foot);
}

export function renderSetsPanel(sess, ex, key, last, updateBtn, wrap) {
  const panel = document.createElement("div");
  panel.className = "sets-panel";
  const sd = sessionData(key, sess.id, false);
  let cur = setsOf(sd, ex.id).map(x => ({ w: x.w || "", r: x.r || "" }));
  const count = Math.max(cur.length, cur.length ? 0 : Math.max(plannedCount(ex), last.length));
  while (cur.length < count) cur.push({ w: "", r: "" });

  function persist() {
    const s = sessionData(key, sess.id, true);
    s.sets[ex.id] = cur.map(x => ({ w: String(x.w).trim(), r: String(x.r).trim() }));
    const b = bestSet(s.sets[ex.id]);
    if (b && String(b.w || "").trim()) s.w[ex.id] = String(b.w).trim(); else delete s.w[ex.id];
    save();
  }

  if (last.length) {
    const lr = document.createElement("div"); lr.className = "last";
    lr.innerHTML = '<span></span><button class="pill small" type="button"></button>';
    lr.querySelector("span").textContent = t("lastTime", { s: setsText(last) });
    lr.querySelector("button").textContent = t("sameAsLast");
    lr.querySelector("button").addEventListener("click", () => {
      cur = last.map(x => ({ w: x.w || "", r: x.r || "" }));
      persist(); autoTick(); render();
    });
    panel.appendChild(lr);
  }

  const rowsEl = document.createElement("div");
  panel.appendChild(rowsEl);
  function phW(i) { return (last[i] && String(last[i].w || "").trim()) || (i > 0 && String(cur[i - 1].w || "").trim()) || t("kg"); }
  const timed = liftOf(ex.id) === "plank"; // plank: second box is seconds, not reps
  const rUnit = timed ? "s" : t("reps");
  function phR(i) { return (last[i] && String(last[i].r || "").trim()) || (i > 0 && String(cur[i - 1].r || "").trim()) || rUnit; }
  function drawRows() {
    rowsEl.innerHTML = "";
    cur.forEach((x, i) => {
      const row = document.createElement("div");
      row.className = "setrow" + ((String(x.w).trim() || String(x.r).trim()) ? " filled" : "");
      row.innerHTML = '<span class="sn"></span>' +
        '<span class="numwrap"><input type="text" inputmode="decimal" data-k="w"><span class="unit"></span></span>' +
        '<span class="x">×</span>' +
        '<span class="numwrap"><input type="text" inputmode="numeric" data-k="r"><span class="unit"></span></span>';
      row.querySelector(".sn").textContent = t("set", { n: i + 1 });
      const [wi, ri] = row.querySelectorAll("input");
      const units = row.querySelectorAll(".unit");
      units[0].textContent = t("kg"); units[1].textContent = rUnit;
      wi.value = x.w; ri.value = x.r;
      wi.placeholder = phW(i); ri.placeholder = phR(i);
      wi.setAttribute("aria-label", t("set", { n: i + 1 }) + " " + t("weight"));
      ri.setAttribute("aria-label", t("set", { n: i + 1 }) + " " + t("repsCol"));
      [wi, ri].forEach(inp => {
        inp.addEventListener("input", () => {
          cur[i][inp.dataset.k] = inp.value;
          row.classList.toggle("filled", !!(String(cur[i].w).trim() || String(cur[i].r).trim()));
          persist(); updateBtn();
          const next = rowsEl.children[i + 1];
          if (next) { const ni = next.querySelectorAll("input"); ni[0].placeholder = phW(i + 1); ni[1].placeholder = phR(i + 1); }
        });
        inp.addEventListener("change", () => { checkPR(key, sess, ex, cur); if (autoTick()) render(); });
      });
      rowsEl.appendChild(row);
    });
  }
  // Tick the exercise once every set row has something in it.
  function autoTick() {
    const s = sessionData(key, sess.id, true);
    if (s.ex[ex.id] || !cur.length || filled(cur).length !== cur.length) return false;
    s.ex[ex.id] = true; buzz(15);
    wrap.classList.add("checked");
    const cb = wrap.querySelector(".ex input[type=checkbox]"); if (cb) cb.checked = true;
    maybeCompleteSession(key, sess);
    save(); return true;
  }
  drawRows();

  const br = document.createElement("div"); br.className = "btnrow";
  br.innerHTML = '<button class="pill" type="button" data-a="rm"></button><button class="pill" type="button" data-a="add"></button>';
  br.querySelector('[data-a="rm"]').textContent = t("removeSet");
  br.querySelector('[data-a="add"]').textContent = t("addSet");
  br.querySelector('[data-a="add"]').addEventListener("click", () => {
    cur.push({ w: "", r: "" }); persist(); drawRows(); updateBtn();
    const ins = rowsEl.lastElementChild.querySelectorAll("input"); ins[0].focus();
  });
  br.querySelector('[data-a="rm"]').addEventListener("click", () => {
    if (cur.length <= 1) return;
    cur.pop(); persist(); drawRows(); updateBtn();
  });
  panel.appendChild(br);
  return panel;
}

export function daySelect(value, withNone) {
  let h = withNone ? '<option value="">' + esc(t("noOtherDay")) + '</option>' : "";
  t("daysLong").forEach((d, i) => { h += '<option value="' + i + '"' + (value === i ? " selected" : "") + '>' + esc(d) + '</option>'; });
  return h;
}

export function renderEditBody(body, sess) {
  const headEl = document.createElement("div");
  headEl.className = "edit-head";
  headEl.innerHTML =
    '<label class="field"><span></span><input class="txt" data-f="title" maxlength="40"></label>' +
    '<label class="field"><span></span><input class="txt" data-f="sub" maxlength="60"></label>' +
    '<div class="row2">' +
      '<label class="field"><span></span><select class="sel" data-f="dow">' + daySelect(sess.dow, false) + '</select></label>' +
      '<label class="field"><span></span><select class="sel" data-f="altDow">' + daySelect(sess.altDow == null ? null : sess.altDow, true) + '</select></label>' +
    '</div>';
  const labels = headEl.querySelectorAll(".field > span");
  labels[0].textContent = t("workoutName"); labels[1].textContent = t("desc"); labels[2].textContent = t("day"); labels[3].textContent = t("altDay");
  const ti = headEl.querySelector('[data-f="title"]'), su = headEl.querySelector('[data-f="sub"]');
  ti.placeholder = t("workoutNamePh"); su.placeholder = t("descPh");
  ti.value = tr("w", sess.id, "title", sess.title) || ""; su.value = tr("w", sess.id, "sub", sess.sub) || "";
  ti.addEventListener("input", () => { sess.title = ti.value; save(); });
  su.addEventListener("input", () => { sess.sub = su.value; save(); });
  headEl.querySelector('[data-f="dow"]').addEventListener("change", e => { sess.dow = +e.target.value; if (sess.altDow === sess.dow) sess.altDow = null; save(); render(); });
  headEl.querySelector('[data-f="altDow"]').addEventListener("change", e => { sess.altDow = e.target.value === "" ? null : +e.target.value; if (sess.altDow === sess.dow) sess.altDow = null; save(); render(); });
  body.appendChild(headEl);

  sess.ex.forEach((ex, i) => {
    const row = document.createElement("div");
    row.className = "ex-edit";
    row.innerHTML =
      '<div class="fields"><input class="txt" data-f="name" maxlength="60">' +
        '<div class="sub"><input class="txt" data-f="sets" maxlength="30"><label class="optlbl"><input type="checkbox" class="chk" data-f="optional"><span></span></label></div></div>' +
      '<div class="ctrls"><button class="mini" type="button" data-a="up"' + (i === 0 ? " disabled" : "") + '>' + icon("arrow-up") + '</button>' +
        '<button class="mini" type="button" data-a="down"' + (i === sess.ex.length - 1 ? " disabled" : "") + '>' + icon("arrow-down") + '</button>' +
        '<button class="mini del" type="button" data-a="del">' + icon("x") + '</button></div>';
    const nameI = row.querySelector('[data-f="name"]'), setsI = row.querySelector('[data-f="sets"]'), optI = row.querySelector('[data-f="optional"]');
    nameI.placeholder = t("exNamePh"); nameI.setAttribute("aria-label", t("exNamePh"));
    setsI.placeholder = t("setsPh"); setsI.setAttribute("aria-label", t("setsPh"));
    row.querySelector(".optlbl span").textContent = t("optionalLbl");
    row.querySelector('[data-a="up"]').setAttribute("aria-label", t("moveUp"));
    row.querySelector('[data-a="down"]').setAttribute("aria-label", t("moveDown"));
    row.querySelector('[data-a="del"]').setAttribute("aria-label", t("removeEx"));
    nameI.value = tr("e", ex.id, "name", ex.name) || ""; setsI.value = tr("e", ex.id, "sets", ex.sets) || ""; optI.checked = !!ex.optional;
    nameI.addEventListener("input", () => { ex.name = nameI.value; save(); });
    setsI.addEventListener("input", () => { ex.sets = setsI.value; save(); });
    optI.addEventListener("change", () => { ex.optional = optI.checked; save(); });
    row.querySelector('[data-a="up"]').addEventListener("click", () => { move(sess.ex, i, -1); save(); render(); });
    row.querySelector('[data-a="down"]').addEventListener("click", () => { move(sess.ex, i, 1); save(); render(); });
    row.querySelector('[data-a="del"]').addEventListener("click", () => {
      const nm = tr("e", ex.id, "name", ex.name);
      if (nm && !confirm(t("removeConfirm", { n: nm }))) return;
      sess.ex.splice(i, 1); save(); render();
    });
    body.appendChild(row);
  });

  const foot = document.createElement("div");
  foot.className = "edit-foot";
  foot.innerHTML = '<button class="pill wide" type="button" data-a="add"></button>' +
    '<div class="bottom"><button class="pill danger" type="button" data-a="delw"></button><button class="pill primary" type="button" data-a="done"></button></div>';
  foot.querySelector('[data-a="add"]').textContent = t("addExercise");
  foot.querySelector('[data-a="delw"]').textContent = t("deleteWorkout");
  foot.querySelector('[data-a="done"]').textContent = t("done");
  foot.querySelector('[data-a="add"]').addEventListener("click", () => {
    sess.ex.push({ id: uid("ex"), name: "", sets: "" }); save(); render();
    const rows = document.querySelectorAll('.session[data-sid="' + sess.id + '"] .ex-edit [data-f="name"]');
    if (rows.length) rows[rows.length - 1].focus();
  });
  foot.querySelector('[data-a="delw"]').addEventListener("click", () => {
    if (!confirm(t("deleteConfirm", { t: tr("w", sess.id, "title", sess.title) || t("untitled") }))) return;
    state.program = program().filter(s => s.id !== sess.id); editing.delete(sess.id); save(); render();
  });
  foot.querySelector('[data-a="done"]').addEventListener("click", () => {
    sess.ex = sess.ex.filter(e => (e.name || "").trim() || (e.sets || "").trim());
    sess.ex.forEach(e => { e.name = (e.name || "").trim(); e.sets = (e.sets || "").trim(); });
    sess.title = (sess.title || "").trim() || t("untitled");
    sess.sub = (sess.sub || "").trim();
    editing.delete(sess.id); save(); render();
  });
  body.appendChild(foot);
}
export function move(arr, i, d) { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; }

export function renderHistory(curKey) {
  const h = $("history");
  h.innerHTML = '<span class="hlabel"></span>';
  h.firstChild.textContent = t("last8");
  const total = program().length;
  for (let i = 7; i >= 0; i--) {
    const m = addDays(thisMonday, -7 * i), k = weekKey(m), n = doneCount(k);
    const ratio = total ? n / total : 0;
    const lvl = !n ? "" : ratio >= 1 ? " l4" : ratio >= .66 ? " l3" : ratio >= .33 ? " l2" : " l1";
    const b = document.createElement("button");
    b.className = "wk" + lvl + (k === curKey ? " cur" : "");
    b.textContent = n || "";
    b.title = t("weekTip", { w: isoWeek(m).week, n, t: total });
    b.addEventListener("click", () => { setViewMonday(m); render(); });
    h.appendChild(b);
  }
}

export function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
export let toastTimer;
// ic: icon name shown before the message (default: a check mark).
export function toast(msg, ic = "check") {
  buzz([40, 60, 40]);
  const el = $("toast"); el.innerHTML = icon(ic, "i") + " " + esc(msg); el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
}

// Swipe between weeks
export let sx = 0, sy = 0, st0 = 0;

// Runs once at startup (called from main.js): connects buttons and other page events.
export function init() {
  $("addWorkout").addEventListener("click", () => {
    if (!Array.isArray(state.program)) state.program = [];
    const used = new Set(program().map(s => s.dow));
    let dow = (today.getDay() + 6) % 7;
    for (let i = 0; i < 7 && used.has(dow); i++) dow = (dow + 1) % 7;
    const sess = { id: uid("w"), dow, altDow: null, title: "", sub: "", ex: [{ id: uid("ex"), name: "", sets: "" }] };
    state.program.push(sess); editing.add(sess.id); save(); render();
    const el = document.querySelector('.session[data-sid="' + sess.id + '"]');
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); const ti = el.querySelector('[data-f="title"]'); if (ti) ti.focus({ preventScroll: true }); }
  });
  [document.querySelector(".weekbar"), $("sessions")].forEach(z => {
    z.addEventListener("touchstart", e => { const p = e.touches[0]; sx = p.clientX; sy = p.clientY; st0 = Date.now(); }, { passive: true });
    z.addEventListener("touchend", e => {
      if (e.target.closest("input, select, textarea, .edit-head, .ex-edit, .sets-panel")) return;
      const p = e.changedTouches[0], dx = p.clientX - sx, dy = p.clientY - sy;
      if (Date.now() - st0 < 600 && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) { setViewMonday(addDays(viewMonday, dx < 0 ? 7 : -7)); buzz(10); render(); }
    }, { passive: true });
  });
}
