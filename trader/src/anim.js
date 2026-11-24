/* ---- money animations: numbers slide smoothly to their new value; a short, soft color glow marks a real move ----
 * anim(id, value, format, flashMin): the element with that id shows `value`, animated from what it showed before. Works even when the
 * element is re-created by innerHTML (state is kept by id). Glow only when the change is at least `flashMin` (default $0.50, 0 = never)
 * and at most once every 4 seconds, so live prices ticking never make a number unreadable. Respects "reduce motion".
 */
const ANIM = {}, ANIM_RM = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion:reduce)").matches;
let animRaf = 0;
function anim(id, v, f, flashMin) {
  if (!isFinite(v)) return; let a = ANIM[id]; const fm = flashMin == null ? 0.5 : flashMin;
  if (!a) { a = ANIM[id] = { shown: v, from: v, to: v, t0: 0, f, dir: 0, flash: 0, base: v, lastFlash: 0 } }
  a.f = f;
  if (Math.abs(v - a.to) > 1e-9) {
    a.from = a.shown; a.to = v; a.t0 = performance.now();
    if (fm > 0 && Math.abs(v - a.base) >= fm && a.t0 - a.lastFlash > 4000) { a.dir = v > a.base ? 1 : -1; a.flash = a.t0 + 1200; a.lastFlash = a.t0; a.base = v }
  }
  const el = typeof document !== "undefined" && document.getElementById(id); if (el) el.textContent = f(a.shown);
  if (!animRaf) animRaf = requestAnimationFrame(animTick);
}
function animTick(n) {
  animRaf = 0; let busy = false;
  for (const id in ANIM) {
    const a = ANIM[id], el = document.getElementById(id); if (!el) continue;
    const k = ANIM_RM ? 1 : Math.max(0, Math.min(1, (n - a.t0) / 900)), e = 1 - Math.pow(1 - k, 3);
    a.shown = a.from + (a.to - a.from) * e; el.textContent = a.f(a.shown);
    const on = n < a.flash; el.classList.toggle("fl-up", on && a.dir > 0); el.classList.toggle("fl-dn", on && a.dir < 0);
    if (k < 1 || on) busy = true;
  }
  if (busy) animRaf = requestAnimationFrame(animTick);
}
