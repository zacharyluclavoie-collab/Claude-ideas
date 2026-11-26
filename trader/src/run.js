/* ===== Run controller (Master): ONE simulated clock for every desk, real pause, save/restore, run-until, honest speed, checks =====
 * Demo market only (on live prices every desk runs on real time). The Master advances the global clock G; each desk simulates up to exactly G
 * and answers with a report taken at G. The screen is drawn only from a set of reports that are all at the same G (one snapshot), so every
 * number agrees with every other. Paused = G does not move, so nothing on screen changes. */
// same small IndexedDB store the desks use (desk frames share this page's storage)
const IDB={db:null,open(){return new Promise((res,rej)=>{try{const r=indexedDB.open("papertrader",1);r.onupgradeneeded=()=>r.result.createObjectStore("kv");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}})},
  async tx(mode,fn){const db=this.db||(this.db=await this.open());return new Promise((res,rej)=>{const t=db.transaction("kv",mode),st=t.objectStore("kv"),r=fn(st);t.oncomplete=()=>res(r&&"result" in r?r.result:true);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})},
  put(k,v){return this.tx("readwrite",st=>st.put(v,k))},get(k){return this.tx("readonly",st=>st.get(k))},del(k){return this.tx("readwrite",st=>st.delete(k))},clear(){return this.tx("readwrite",st=>st.clear())}};
const PEND = {}, ACK = {}, READY = {}, DIAG = [], SETLOG = [], ACTLOG = [], SPD = [];
let SNAPT = { g: CLK.g, real: Date.now() }, saving = null, lastSave = 0, skipTo = 0, budget = 0, stepAt = performance.now(), bootAt = Date.now(), waitN = 0, stepN = 0;
let restoreWait = !!window.__ptRestore, lastDayN = 0, maxTrades = 0, todayMax = {}, DAYS = (window.__ptRestore && RUNSV && RUNSV.days) || {}, fpsNow = 0, drawAt = 0, lastLim = "";
if (RUNSV && window.__ptRestore) { (RUNSV.setlog || []).forEach(x => SETLOG.push(x)); (RUNSV.actlog || []).forEach(x => ACTLOG.push(x)) }
function isLive() { return Object.values(R).some(r => r.live) }
function dayN(g) { return Math.floor((g - CLK.g0) / 86400) + 1 }
function isoDay(g) { return new Date(g * 1000).toISOString().slice(0, 10) }
function hhmm(g) { const s = ((g - HSIM0) % 86400 + 86400) % 86400; return String(Math.floor(s / 3600)).padStart(2, "0") + ":" + String(Math.floor(s % 3600 / 60)).padStart(2, "0") }
function simLabel(g) { return CLK.done && CLK.until && g >= CLK.until && (g - CLK.g0) % 86400 === 0 ? `End of Day ${dayN(g) - 1}` : `Day ${dayN(g)} · ${hhmm(g)}` }
function dateLabel(g) { return new Date(g * 1000).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" }) }
function stepQ(sp) { return sp >= 30000 ? 60 : sp >= 3000 ? 30 : sp >= 1000 ? 15 : 10 }
const clock = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
function diag(kind, msg) { DIAG.unshift({ t: Date.now(), g: CLK.g, kind, msg }); if (DIAG.length > 200) DIAG.length = 200; if (kind === "invariant" || kind === "error") drawDiag() }
function actLog(msg) { ACTLOG.unshift({ t: Date.now(), g: CLK.g, msg }); if (ACTLOG.length > 60) ACTLOG.length = 60; drawActLog() }
function setLog(name, a, b) { SETLOG.unshift({ t: Date.now(), g: CLK.g, name, a: String(a), b: String(b) }); if (SETLOG.length > 80) SETLOG.length = 80; drawSetLog(); drawDiag() }
function toast(msg) { const el = $h("htoast"); if (!el) return; el.textContent = msg; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 3200) }
const post = (d, o) => { const f = document.querySelectorAll(".hframe")[d - 1]; try { f.contentWindow.postMessage(o, "*") } catch (e) {} };
const readyDesks = () => { const a = []; for (let i = 1; i <= NDESK; i++) if (READY[i]) a.push(i); return a };

/* ---- reports in, snapshots out ---- */
function runIn(m) {
  if (m.err) { diag("error", `${DN[m.desk - 1]}: ${m.err}`); return }
  if (m.saved != null) saveAck(m);
  if (m.live) { R[m.desk] = m; SNAPT = { g: Date.now() / 1000, real: Date.now(), live: true }; return }
  if (m.vnow == null) return;
  PEND[m.desk] = m; if (m.ack != null) ACK[m.desk] = m.ack;
  if (m.ready && !READY[m.desk]) {
    READY[m.desk] = true; if (m.restored) diag("storage", `${DN[m.desk - 1]} restored at ${simLabel(m.vnow)}`); else if (window.__ptRestore) diag("storage", `${DN[m.desk - 1]} had no saved state: started fresh at ${simLabel(m.vnow)}`);
    if (m.vnow > CLK.g) { CLK.g = m.vnow; for (const d of readyDesks()) if (d !== m.desk) advance(d, CLK.g) }   // one clock: everyone moves to the latest saved time
    else if (m.vnow < CLK.g) advance(m.desk, CLK.g)
  }
  tryCommit();
}
function advance(d, g) { post(d, { ptcmd: "adv", v: g, stp: skipTo > CLK.g ? 30 : stepQ(CLK.speed) }) }
function tryCommit() { const ds = readyDesks(); if (!ds.length || !ds.every(d => PEND[d] && PEND[d].vnow === CLK.g)) return; commit(ds) }
function commit(ds) {
  for (const k of Object.keys(R)) if (!ds.includes(+k)) delete R[k];
  for (const d of ds) R[d] = PEND[d];
  SNAPT = { g: CLK.g, real: Date.now() };
  afterCommit();
  if (cur === 0) { drawAt = performance.now(); draw() }   // drawn in the same moment the snapshot lands: the screen never shows a mix of two snapshots
}

/* ---- the clock ---- */
function clkStep() {
  const n = performance.now(), dtReal = Math.min(n - stepAt, 500); stepAt = n;
  if (isLive() || restoreWait) { budget = 0; return }
  const ds = readyDesks(); if (!ds.length || (ds.length < NDESK && Date.now() - bootAt < 30000)) return;   // wait (30 s at most) for every desk to start
  const running = (CLK.state === "running" || CLK.state === "nonew") && !CLK.done;
  // each step is what the desks can finish in about 0.3 s, so Pause takes effect almost at once and the screen updates often
  const eff = effSpeed(), cap = Math.max(stepQ(CLK.speed) * 2, Math.min(CLK.speed * 0.5 + 60, eff ? eff * 0.3 : 600));
  if (running) { budget = Math.min(budget + CLK.speed * dtReal / 1000, cap) } else budget = 0;
  if (saving) return;
  if (!ds.every(d => ACK[d] >= CLK.g)) { if (running) waitN++; return }   // someone is still simulating
  stepN++;
  let target = CLK.g;
  if (skipTo > CLK.g) target = Math.min(skipTo, CLK.g + Math.max(600, (eff || 2000) * 0.3));
  else if (running) { const Q = stepQ(CLK.speed), k = Math.floor(budget / Q); if (!k) return; target = CLK.g + k * Q; budget -= k * Q }
  else return;
  const mid = HSIM0 + (Math.floor((CLK.g - HSIM0) / 86400) + 1) * 86400; if (target > mid) target = mid;   // stop exactly at every simulated midnight
  if (CLK.until && !CLK.done && target > CLK.until) target = CLK.until;
  if (target <= CLK.g) return;
  CLK.g = target; for (const d of ds) advance(d, target);
}
setInterval(clkStep, 16);
function afterCommit() {
  const t = totals(), trades = t.wn + t.ln, g = CLK.g, dN = dayN(g);
  if (CLK.state === "running" || CLK.state === "nonew") { SPD.push([performance.now(), g]); while (SPD.length > 2 && performance.now() - SPD[0][0] > 10000) SPD.shift() }
  // a new simulated day: every desk turns over at the same moment (one clock); the day that ended is written into the daily table
  if (!lastDayN) lastDayN = dN;
  if (dN > lastDayN) { const pd = isoDay(g - 1); DAYS[pd] = Object.assign(DAYS[pd] || {}, { eod: cents(t.eq) }); actLog(`New simulated day ${dN} (${dateLabel(g)}): daily counters reset. Day ${dN - 1} ended at ${money(t.eq)}`); diag("day", `Day ${dN - 1} closed at ${money(t.eq)}; "today" counters reset for Day ${dN}`); lastDayN = dN; todayMax = {} }
  checkInvariants(t, trades); histSample();
  if (CLK.until && !CLK.done && g >= CLK.until) finishRun();
  else if ((CLK.state === "running" || CLK.state === "nonew") && Date.now() - lastSave > 2500) doSave("auto");
}
function effSpeed() { if (SPD.length < 2) return 0; const a = SPD[0], b = SPD[SPD.length - 1]; return b[0] > a[0] ? (b[1] - a[1]) / ((b[0] - a[0]) / 1000) : 0 }
function limiting() {
  const eff = effSpeed(), sel = CLK.speed, sc = (Object.values(R)[0] || {}).simScale || "?";
  if (CLK.state === "paused" || CLK.state === "emergency" || CLK.done) return "";
  if (!eff || eff >= sel * 0.8) return "";
  const busy = waitN / Math.max(1, waitN + stepN); return `limited by computer speed: ${NDESK} desks share one browser thread, market size ${sc}×, ${fpsNow} fps${busy > 0.6 ? "" : " (also waiting on screen updates)"}`;
}
{ let fr = 0, t0 = performance.now(); const f = n => { fr++; if (n - t0 >= 1000) { fpsNow = Math.round(fr * 1000 / (n - t0)); fr = 0; t0 = n } requestAnimationFrame(f) }; requestAnimationFrame(f) }
setInterval(() => { waitN = Math.round(waitN * 0.5); stepN = Math.round(stepN * 0.5) }, 5000);

/* ---- run states ---- */
const STATEN = { running: "Running", nonew: "No new trades", paused: "Paused", emergency: "Emergency stop" };
function setState(st, why) {
  if (st === CLK.state) return; const old = CLK.state; CLK.state = st; setLog("Run state", STATEN[old], STATEN[st]);
  send("pause", st === "nonew");                       // soft pause: desks keep selling, buy nothing new
  if (isLive()) send("hold", st === "paused" || st === "emergency");   // live prices cannot be frozen; the desks stop working instead
  if (st === "paused" || st === "emergency") { SPD.length = 0; doSave(why || "pause") }
  if (st === "emergency") actLog("EMERGENCY STOP: everything frozen. Nothing was sold. Tap Resume (twice) to continue.");
  drawRun(); drawTicker(true); mark(); if (cur === 0) draw();
}
function setSpeed(v) { v = +v; if (!v || v === CLK.speed) { drawRun(); return } setLog("Demo speed", CLK.speed.toLocaleString() + "x", v.toLocaleString() + "x"); CLK.speed = v; SPD.length = 0; try { localStorage.setItem("pt_host_speed", String(v)) } catch (e) {} drawRun(); mark() }
function skip(sec) { if (isLive()) return; skipTo = Math.max(skipTo, CLK.g) + sec; setLog("Skip ahead", "", (sec / 3600) + " h"); actLog(`Skipping ahead ${sec >= 86400 ? sec / 86400 + " day" + (sec > 86400 ? "s" : "") : sec / 3600 + " hour"} (runs as fast as possible, then back to the chosen speed)`) }
function finishRun() {
  CLK.done = true; CLK.state = "paused"; setLog("Run state", "Running", "Paused (target reached)"); SPD.length = 0;
  const lab = (CLK.until - CLK.g0) % 86400 === 0 ? `Day ${dayN(CLK.until) - 1}` : simLabel(CLK.until);
  actLog(`Test complete: reached ${lab}. Everything is paused.${CLK.untilMode === "sell" ? " Every open coin is being sold at this moment's prices." : " Open coins were frozen as they are."}`);
  if (CLK.untilMode === "sell") send("closeall");
  setTimeout(() => { doSave("finish"); drawRun(); openReport(true) }, CLK.untilMode === "sell" ? 1500 : 200); drawRun(); drawTicker(true);
}

/* ---- saving (all desks at the same simulated moment) and restoring ---- */
let lastSaveG = 0;
function doSave(why) {
  if (saving || isLive()) return; const ds = readyDesks(); if (!ds.length || !ds.every(d => ACK[d] === CLK.g && (PEND[d] || {}).vnow === CLK.g)) { if (why !== "auto") setTimeout(() => doSave(why), 300); return }
  lastSave = Date.now(); saving = { g: CLK.g, need: new Set(ds), ok: true, why, t0: Date.now() }; const g = CLK.g;
  for (const d of ds) post(d, { ptcmd: "save", v: g });
  setTimeout(() => { if (saving && saving.g === g) finishSave(false, "a desk did not answer in 6 s") }, 6000);
}
function saveAck(m) { if (!saving || m.saved !== saving.g) return; if (!m.ok) { saving.ok = false; saving.err = m.saveErr || "save refused" } saving.need.delete(m.desk); if (!saving.need.size) finishSave(saving.ok) }
function finishSave(ok, err) { const sv = saving; saving = null; if (!sv) return; setTimeout(() => { if (cur === 0) draw() }, 0); if (ok) { lastSaveG = sv.g; writeRun(sv.g); window.__ptRestore = true; if (sv.why !== "auto") diag("storage", `saved at ${simLabel(sv.g)} (${sv.why}) in ${Date.now() - sv.t0} ms`) } else diag("storage", `save failed at ${simLabel(sv.g)}: ${err || sv.err}`) }
function writeRun(g) {
  const t = totals();
  try { localStorage.setItem(RUNK, JSON.stringify({ g, g0: CLK.g0, speed: CLK.speed, state: CLK.state, until: CLK.until, untilMode: CLK.untilMode, done: CLK.done, startedAt: CLK.startedAt, realRun: CLK.realRun, nd: NDESK, days: DAYS, savedAt: Date.now(), bal: cents(t.eq), start: cents(t.start), trades: t.wn + t.ln, setlog: SETLOG.slice(0, 40), actlog: ACTLOG.slice(0, 30) })) } catch (e) { diag("storage", "could not write the run summary: " + e.message) }
}
setInterval(() => { if (CLK.state === "running" || CLK.state === "nonew") CLK.realRun += 1000 }, 1000);
function startOver(cap) {
  try { localStorage.removeItem(RUNK); localStorage.removeItem("pt_host_hist2"); for (let i = 1; i <= 25; i++) { localStorage.setItem("d" + i + "_pt_cap", String(cap)); localStorage.setItem("d" + i + "_pt_reset_pending", "1") } } catch (e) {}
  const done = () => location.reload(); try { IDB.clear().then(done, done) } catch (e) { done() }
}
function drawRestore() {
  const el = $h("h_restore"); if (!el) return;
  if (!restoreWait || !RUNSV) { el.hidden = true; return } el.hidden = false;
  el.innerHTML = `💾 <b>Restored run</b> saved ${new Date(RUNSV.savedAt).toLocaleString()} — simulated ${simLabel(RUNSV.g)}, balance ${money(RUNSV.bal || 0)}, ${RUNSV.trades || 0} trades. Everything is paused until you choose. <span class="rbtns"><button id="rs_go" class="chip on">Resume</button><button id="rs_new" class="chip">Start over</button></span>`;
  $h("rs_go").onclick = () => { restoreWait = false; el.hidden = true; const st = RUNSV.state === "emergency" ? "paused" : (RUNSV.done ? "paused" : (RUNSV.state || "running")); CLK.state = "paused"; setState(st === "paused" ? "paused" : st, "resume"); setLog("Restore", "", "Resumed saved run"); drawRun() };
  let arm = 0; $h("rs_new").onclick = e => { if (!arm) { arm = 1; e.target.textContent = "Tap again: delete the saved run"; setTimeout(() => { arm = 0; e.target.textContent = "Start over" }, 4000); return } startOver(+(localStorage.getItem("d1_pt_cap") || 2000)) };
}

/* ---- checks that every snapshot must pass (shown in Diagnostics) ---- */
let invOk = 0, invBad = 0;
function checkInvariants(t, trades) {
  const rs = Object.entries(R), bad = [], c = v => Math.round(v * 100);
  if (rs.some(([, r]) => r.vnow !== CLK.g)) bad.push("one clock: a desk is not at the Master's time");
  let se = 0, sp = 0; for (const [, r] of rs) { se += c(r.eq); sp += c(r.eq) - c(r.start) } if (se !== c(t.eq)) bad.push(`desk balances add up to ${money(se / 100)}, total shows ${money(t.eq)}`); if (sp !== c(t.eq - t.start)) bad.push("desk profits do not add up to the total");
  for (const [d, r] of rs) {
    const nm = DN[d - 1], opened = r.buysOk, acc = r.wn + r.ln + r.open; if (opened != null && opened !== acc) bad.push(`${nm}: ${opened} coins bought, but ${r.wn} won + ${r.ln} lost + ${r.open} open = ${acc}`);
    const fx = r.fx || {}, pl = r.eq - r.start, parts = r.w + r.l + r.openPl - (fx.burnBuy || 0) + (r.yieldEarned || 0); if (Math.abs(pl - parts) > 0.011) bad.push(`${nm}: profit ${sg(pl)} vs won + lost + open − failed-buy fees + cash interest ${sg(parts)}`);
    const dk = isoDay(CLK.g), prev = todayMax[d]; if (prev && prev.day === dk && r.todayN < prev.n) bad.push(`${nm}: "trades today" went down ${prev.n} → ${r.todayN}`); todayMax[d] = { day: dk, n: r.todayN };
  }
  if (trades < maxTrades) bad.push(`total trades went down ${maxTrades} → ${trades}`); maxTrades = Math.max(maxTrades, trades);
  const daySum = Object.values(dailyRows()).reduce((a, x) => a + x.n, 0); if (daySum !== trades) bad.push(`daily table adds up to ${daySum} trades, total is ${trades}`);
  if (bad.length) { invBad++; for (const b of bad) diag("invariant", b) } else invOk++;
}
// per simulated day: each desk rounded to the cent first, then added up (the same rounding the header uses, so "today" agrees everywhere)
function dailyRows() { const m = {}; for (const r of Object.values(R)) for (const [d, x] of Object.entries(r.days || {})) { const y = m[d] || (m[d] = { n: 0, w: 0, l: 0, made: 0, lost: 0 }); y.n += x.n; y.w += x.w; y.l += x.l; y.made = cents(y.made + cents(x.made)); y.lost = cents(y.lost + cents(x.lost)) } return m }
