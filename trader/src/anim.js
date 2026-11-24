/* ---- money animations: numbers count smoothly to their new value and flash green/red when they move ----
 * anim(id, value, format): the element with that id shows `value`, animated from what it showed before. Works even when the
 * element is re-created by innerHTML (state is kept by id). Respects "reduce motion".
 */
const ANIM = {}, ANIM_RM = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion:reduce)").matches;
let animRaf = 0;
function anim(id, v, f) {
  if (!isFinite(v)) return; let a = ANIM[id];
  if (!a) { a = ANIM[id] = { shown: v, from: v, to: v, t0: 0, f, dir: 0, flash: 0 } }
  a.f = f;
  if (Math.abs(v - a.to) > 1e-9) { a.from = a.shown; a.to = v; a.t0 = performance.now(); if (Math.abs(v - a.from) >= 0.005) { a.dir = v > a.from ? 1 : -1; a.flash = a.t0 + 900 } }
  const el = typeof document !== "undefined" && document.getElementById(id); if (el) el.textContent = f(a.shown);
  if (!animRaf) animRaf = requestAnimationFrame(animTick);
}
function animTick(n) {
  animRaf = 0; let busy = false;
  for (const id in ANIM) {
    const a = ANIM[id], el = document.getElementById(id); if (!el) continue;
    const k = ANIM_RM ? 1 : Math.max(0, Math.min(1, (n - a.t0) / 650)), e = 1 - Math.pow(1 - k, 3);
    a.shown = a.from + (a.to - a.from) * e; el.textContent = a.f(a.shown);
    const on = n < a.flash; el.classList.toggle("fl-up", on && a.dir > 0); el.classList.toggle("fl-dn", on && a.dir < 0);
    if (k < 1 || on) busy = true;
  }
  if (busy) animRaf = requestAnimationFrame(animTick);
}
