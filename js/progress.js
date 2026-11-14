// Progress chart sheet (📈): entriesFor(), openProgress(), renderProgress() — hand-made SVG chart.

import { $ } from "./dom.js";
import { tr } from "./starter.js";
import { esc, program, sorted, state, t } from "./state.js";
import { addDays, fmtLong, fmtNum, fmtShort, mondayOfIsoWeek, startOfWeek, weekKey } from "./dates.js";
import { bestSet, filled, num, setText, setsOf, setsText } from "./data.js";

// ======================================================================
// Progress charts
// ======================================================================
export function entriesFor(exId) {
  const byId = {}; program().forEach(s => { byId[s.id] = s; });
  const out = [];
  Object.keys(state.weeks).sort().forEach(wk => {
    const m = /^(\d{4})-W(\d{2})$/.exec(wk); if (!m) return;
    const monday = mondayOfIsoWeek(+m[1], +m[2]);
    const wd = state.weeks[wk];
    for (const sid in wd) {
      const st = filled(setsOf(wd[sid], exId)); if (!st.length) continue;
      const sess = byId[sid], b = bestSet(st);
      out.push({
        date: addDays(monday, sess ? sess.dow : 0), sets: st, best: b,
        w: b ? num(b.w) : null, r: b ? num(b.r) : null,
        workout: sess ? (tr("w", sess.id, "title", sess.title) || t("untitled")) : t("deletedWorkout")
      });
    }
  });
  return out.sort((a, b) => a.date - b.date);
}

export let pExId = null, pResize = null;
// sess: open with that workout's exercises preselected; preferId: open on this exercise.
export function openProgress(sess, preferId) {
  if (preferId) pExId = preferId;
  const sel = $("pSelect"); sel.innerHTML = "";
  const seen = new Set(); let firstWithData = null, firstInSess = null, any = false;
  sorted().forEach(s => {
    const items = s.ex.filter(e => e.name && !seen.has(e.id)); items.forEach(e => seen.add(e.id));
    if (!items.length) return;
    any = true;
    const og = document.createElement("optgroup"); og.label = tr("w", s.id, "title", s.title) || t("untitled");
    items.forEach(e => {
      const has = entriesFor(e.id).length > 0;
      const o = document.createElement("option"); o.value = e.id;
      o.textContent = tr("e", e.id, "name", e.name) + (has ? "" : t("noDataYet"));
      og.appendChild(o);
      if (has && !firstWithData) firstWithData = e.id;
      if (has && sess && !firstInSess && sess.ex.some(x => x.id === e.id)) firstInSess = e.id;
    });
    sel.appendChild(og);
  });
  const keep = pExId && [...sel.options].some(o => o.value === pExId) ? pExId : null;
  pExId = firstInSess || keep || firstWithData || (sel.options[0] && sel.options[0].value) || null;
  if (pExId) sel.value = pExId;
  sel.disabled = !any;
  $("progress").classList.add("show"); document.body.classList.add("modal-open");
  renderProgress();
  pResize = () => renderProgress(); window.addEventListener("resize", pResize);
}
export function closeProgress() { $("progress").classList.remove("show"); document.body.classList.remove("modal-open"); if (pResize) window.removeEventListener("resize", pResize); }

export function niceStep(range, target) { const raw = range / target, mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag; return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag; }

export function renderProgress() {
  const body = $("pBody"); body.innerHTML = "";
  if (!pExId) { body.innerHTML = '<div class="p-empty">' + t("nothing") + '</div>'; return; }
  const all = entriesFor(pExId);
  // Metric: weight if any weight was logged, otherwise reps (e.g. pull-ups).
  const useW = all.some(p => p.w != null);
  const val = p => useW ? p.w : p.r;
  const unit = useW ? (all.filter(p => /lb/i.test(p.best && p.best.w)).length > all.length / 2 ? "lb" : t("kg")) : t("reps");
  const byWeek = new Map();
  all.filter(p => val(p) != null).forEach(p => {
    const k = weekKey(startOfWeek(p.date)), cur = byWeek.get(k);
    if (!cur) byWeek.set(k, Object.assign({ count: 1 }, p));
    else { cur.count++; if (val(p) > val(cur)) Object.assign(cur, p, { count: cur.count }); }
  });
  const pts = [...byWeek.values()].sort((a, b) => a.date - b.date);
  if (!pts.length) { body.innerHTML = '<div class="p-empty">' + t("noLogs") + '</div>'; return; }

  const first = val(pts[0]), last = val(pts[pts.length - 1]), best = Math.max(...pts.map(val)), diff = last - first;
  const stats = document.createElement("div"); stats.className = "stats";
  const statHtml = (label, v, cls) => '<div class="stat"><small>' + esc(label) + '</small><b class="' + (cls || "") + '">' + v + '</b> <small class="u">' + esc(unit) + '</small></div>';
  stats.innerHTML = statHtml(t("latest"), fmtNum(last)) + statHtml(t("best"), fmtNum(best)) + statHtml(t("sinceStart"), (diff > 0 ? "+" : "") + fmtNum(diff), diff > 0 ? "up" : "");
  body.appendChild(stats);

  const wrap = document.createElement("div"); wrap.className = "chart-wrap"; body.appendChild(wrap);
  const W = Math.max(280, Math.round(wrap.clientWidth || 320)), H = 210, pad = { l: 38, r: 18, t: 22, b: 26 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const vals = pts.map(val);
  let lo = Math.min(...vals), hi = best;
  if (hi - lo < 1e-9) { lo -= useW ? 5 : 2; hi += useW ? 5 : 2; }
  const step = niceStep(hi - lo, 4);
  lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step; if (lo === hi) hi = lo + step;
  if (lo < 0 && Math.min(...vals) >= 0) lo = 0;
  const t0 = pts[0].date.getTime(), t1 = pts[pts.length - 1].date.getTime();
  const x = d => pts.length === 1 || t1 === t0 ? pad.l + iw / 2 : pad.l + (d.getTime() - t0) / (t1 - t0) * iw;
  const y = v => pad.t + (1 - (v - lo) / (hi - lo)) * ih;
  const NS = "http://www.w3.org/2000/svg";
  const mk = (tag, a, text) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (text != null) e.textContent = text; return e; };
  const svg = mk("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img",
    "aria-label": t("chartAria", { metric: useW ? t("weight") : t("repsCol"), n: pts.length, v: fmtNum(last) + " " + unit }) });
  for (let v = lo; v <= hi + step / 2; v += step) {
    svg.appendChild(mk("line", { class: "grid", x1: pad.l, x2: W - pad.r, y1: y(v), y2: y(v) }));
    svg.appendChild(mk("text", { class: "axis-t", x: pad.l - 8, y: y(v) + 4, "text-anchor": "end" }, fmtNum(v)));
  }
  const xIdx = pts.length === 1 ? [0] : pts.length < 5 ? [0, pts.length - 1] : [0, Math.floor((pts.length - 1) / 2), pts.length - 1];
  xIdx.forEach((i, k) => {
    const anchor = xIdx.length === 1 ? "middle" : k === 0 ? "start" : k === xIdx.length - 1 ? "end" : "middle";
    svg.appendChild(mk("text", { class: "axis-t", x: x(pts[i].date), y: H - 6, "text-anchor": anchor }, fmtShort(pts[i].date)));
  });
  if (pts.length > 1) {
    const d = pts.map((p, i) => (i ? "L" : "M") + x(p.date).toFixed(1) + " " + y(val(p)).toFixed(1)).join(" ");
    svg.appendChild(mk("path", { class: "area", d: d + " L" + x(pts[pts.length - 1].date).toFixed(1) + " " + (pad.t + ih) + " L" + x(pts[0].date).toFixed(1) + " " + (pad.t + ih) + " Z" }));
    svg.appendChild(mk("path", { class: "line", d }));
  }
  const xh = mk("line", { class: "xhair", y1: pad.t, y2: pad.t + ih, x1: -10, x2: -10, visibility: "hidden" }); svg.appendChild(xh);
  const rr = pts.length > 30 ? 3 : 4.5;
  const dots = pts.map(p => { const c = mk("circle", { class: "dot", cx: x(p.date), cy: y(val(p)), r: rr }); svg.appendChild(c); return c; });
  const lp = pts[pts.length - 1];
  const lbl = mk("text", { class: "lbl", x: x(lp.date), y: y(val(lp)) - 10, "text-anchor": pts.length === 1 ? "middle" : "end" }, fmtNum(val(lp)) + " " + unit);
  svg.appendChild(lbl);
  wrap.appendChild(svg);

  const tip = document.createElement("div"); tip.className = "tip"; wrap.appendChild(tip);
  let hl = -1;
  function show(i) {
    if (hl >= 0) { dots[hl].classList.remove("hl"); dots[hl].setAttribute("r", rr); }
    hl = i;
    if (i < 0) { tip.style.display = "none"; xh.setAttribute("visibility", "hidden"); lbl.setAttribute("visibility", "visible"); return; }
    const p = pts[i], scale = wrap.clientWidth / W;
    dots[i].classList.add("hl"); dots[i].setAttribute("r", 6.5);
    xh.setAttribute("x1", x(p.date)); xh.setAttribute("x2", x(p.date)); xh.setAttribute("visibility", "visible");
    lbl.setAttribute("visibility", "hidden");
    tip.innerHTML = "<b></b><br><span></span>";
    tip.querySelector("b").textContent = setText(p.best);
    tip.querySelector("span").textContent = fmtShort(p.date) + " · " + p.workout + (p.count > 1 ? " · " + t("bestOf", { n: p.count }) : "");
    tip.style.display = "block";
    const tw = tip.offsetWidth, cx = x(p.date) * scale;
    tip.style.left = Math.min(Math.max(cx, tw / 2), wrap.clientWidth - tw / 2) + "px";
    tip.style.top = (y(val(p)) * scale - 8) + "px";
  }
  function nearest(clientX) {
    const r = svg.getBoundingClientRect(), s = (clientX - r.left) * (W / r.width);
    let bi = 0, bd = Infinity; pts.forEach((p, i) => { const dd = Math.abs(x(p.date) - s); if (dd < bd) { bd = dd; bi = i; } }); return bi;
  }
  svg.addEventListener("pointermove", e => show(nearest(e.clientX)));
  svg.addEventListener("pointerdown", e => show(nearest(e.clientX)));
  svg.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") show(-1); });

  const hint = document.createElement("p"); hint.className = "p-hint";
  hint.textContent = pts.length === 1 ? t("hintOne") : t("hintMany");
  body.appendChild(hint);

  const tbl = document.createElement("table"); tbl.className = "hist-table";
  tbl.innerHTML = '<thead><tr><th></th><th></th><th class="v"></th></tr></thead><tbody></tbody>';
  const ths = tbl.querySelectorAll("th"); ths[0].textContent = t("date"); ths[1].textContent = t("workout"); ths[2].textContent = useW ? t("weight") : t("repsCol");
  const tb = tbl.querySelector("tbody");
  all.slice().reverse().forEach(p => {
    const tr_ = document.createElement("tr");
    tr_.innerHTML = '<td></td><td class="w"></td><td class="v"><b></b><small></small></td>';
    tr_.children[0].textContent = fmtLong(p.date);
    tr_.children[1].textContent = p.workout;
    tr_.querySelector("b").textContent = p.best ? setText(p.best) : "";
    if (p.sets.length > 1) tr_.querySelector("small").textContent = setsText(p.sets);
    tb.appendChild(tr_);
  });
  body.appendChild(tbl);
}

// Runs once at startup (called from main.js): connects buttons and other page events.
export function init() {
  $("pSelect").addEventListener("change", e => { pExId = e.target.value; renderProgress(); });
  $("pClose").addEventListener("click", closeProgress);
  $("progress").addEventListener("click", e => { if (e.target === $("progress")) closeProgress(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && $("progress").classList.contains("show")) closeProgress(); });
  $("progressBtn").addEventListener("click", () => openProgress(null));
}
