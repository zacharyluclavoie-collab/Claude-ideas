/* ---- money animations: numbers change at once to the real value (no counting through in-between numbers); a short, soft color glow marks a real move ----
 * anim(id, value, format, flashMin): the element with that id shows `value`, animated from what it showed before. Works even when the
 * element is re-created by innerHTML (state is kept by id). Glow only when the change is at least `flashMin` (default $0.50, 0 = never)
 * and at most once every 4 seconds, so live prices ticking never make a number unreadable. Respects "reduce motion".
 */
const ANIM = {}, ANIM_RM = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion:reduce)").matches;
let animRaf = 0;
function anim(id, v, f, flashMin) {   // shows the new value at once (never a made-up in-between number), with a short soft glow on a real move
  if (!isFinite(v)) return; let a = ANIM[id]; const fm = flashMin == null ? 0.5 : flashMin;
  if (!a) { a = ANIM[id] = { shown: v, to: v, f, dir: 0, flash: 0, base: v, lastFlash: 0 } }
  a.f = f; a.shown = a.to = v; const n = performance.now();
  if (fm > 0 && Math.abs(v - a.base) >= fm && n - a.lastFlash > 4000) { a.dir = v > a.base ? 1 : -1; a.flash = n + 1200; a.lastFlash = n; a.base = v }
  const el = typeof document !== "undefined" && document.getElementById(id); if (el) el.textContent = f(v);
  if (!animRaf && a.flash > n) animRaf = requestAnimationFrame(animTick);
}
function animTick(n) {
  animRaf = 0; let busy = false;
  for (const id in ANIM) { const a = ANIM[id], el = document.getElementById(id); if (!el) continue; const on = !ANIM_RM && n < a.flash; el.classList.toggle("fl-up", on && a.dir > 0); el.classList.toggle("fl-dn", on && a.dir < 0); if (on) busy = true }
  if (busy) animRaf = requestAnimationFrame(animTick);
}
