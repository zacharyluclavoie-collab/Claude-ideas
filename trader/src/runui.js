/* ===== Run controls, speed HUD, made/lost bar, W–L, finished trades, failed/retried, run report, export/import, diagnostics ===== */
const fmtDur = s => { s = Math.max(0, Math.round(s)); const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return d ? `${d} d ${h} h` : h ? `${h} h ${m} m` : `${m} m` };
const fmtReal = ms => { const s = Math.round(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return h ? `${h} h ${m} m` : m ? `${m} m ${x} s` : `${x} s` };
const pxF = v => v == null ? "–" : v >= 1 ? v.toFixed(4) : v.toPrecision(4);
const wrS = (w, l) => w + l ? Math.round(100 * w / (w + l)) + "%" : "–";   // the one win-rate formula: wins ÷ (wins + losses), rounded to a whole %
const reasonN = r => { r = String(r || ""); if (r.startsWith("EMERGENCY")) return "emergency exit"; return ({ stop_loss: "stop-loss", take_profit_1: "first take-profit", take_profit_2: "second take-profit", trailing_stop: "trailing stop", time_stop: "held too long", stagnant: "not moving", writeoff_unsellable: "written off (could not sell)", stale_data: "no price data (closed at a haircut)" })[r] || r.replace(/_/g, " ") };
const DEMO_NOTE = "Demo market — not real prices. Past demo results do not predict real results.";

/* ---- Run panel ---- */
function buildRun() {
  const el = $h("h_run"); if (!el) return;
  const SP = [1, 15, 60, 300, 1000, 3000, 10000, 30000];
  el.innerHTML = `<div class="runtop"><div class="seg" id="rn_state"><button data-s="running">▶ Run</button><button data-s="paused">⏸ Pause</button><button data-s="nonew">No new trades</button></div><div class="clockbig"><b id="rn_clock">Day 1 · 00:00</b><span id="rn_date"></span></div></div>
    <div id="rn_emer" class="emerbar" hidden></div><div id="h_done" class="donebar" hidden></div>
    <div class="sub spdline" id="rn_speedline"></div>
    <div class="chips spdchips" id="rn_speed">${SP.map(s => `<button class="chip" data-v="${s}">${s >= 30000 ? "Max" : s.toLocaleString() + "x"}</button>`).join("")}</div>
    <div class="fullonly rununtil"><span><b>Run until</b></span><select id="rn_umode" aria-label="Run until"><option value="day">end of simulated Day</option><option value="for">for this many more days</option></select><input type="number" id="rn_un" min="1" max="365" value="14" inputmode="numeric" aria-label="Day number"><select id="rn_usell" aria-label="At the end"><option value="freeze">then freeze open coins</option><option value="sell">then sell every open coin</option></select><button class="chip" id="rn_uset">Set</button><button class="chip" id="rn_uoff">Off</button></div><div class="sub fullonly" id="rn_ustat"></div>
    <details class="fullonly hud" id="rn_hud"><summary>Speed and performance</summary><div class="kv" id="rn_hudkv"></div></details>
    <div class="fullonly chips runbtns"><button class="chip" id="rn_report">📋 Run report</button><button class="chip" id="rn_export">⬇ Export</button><button class="chip" id="rn_import">⬆ Import</button><input type="file" id="rn_file" accept=".json,application/json" hidden></div>
    <div class="fullonly actlog" id="rn_log"></div>`;
  $h("rn_state").onclick = e => { const b = e.target.closest("button"); if (!b) return; const s = b.dataset.s; if (CLK.state === "emergency" && s !== "paused") { emergencyResume(); return } if (s === "running" && CLK.done) { toast("The run reached its target. Change or turn off 'Run until' to keep going."); return } if (restoreWait) { toast("Choose Resume or Start over on the restore banner first."); return } setState(s) };
  $h("rn_speed").onclick = e => { const b = e.target.closest("button"); if (b) setSpeed(+b.dataset.v) };
  $h("rn_uset").onclick = () => { const n = Math.max(1, Math.min(365, +$h("rn_un").value || 14)), mode = $h("rn_usell").value; const g = $h("rn_umode").value === "day" ? CLK.g0 + n * 86400 : CLK.g + n * 86400; if (g <= CLK.g) { toast(`Day ${n} is already over. Pick a later day.`); return } const was = CLK.until; CLK.until = g; CLK.untilMode = mode; CLK.done = false; setLog("Run until", was ? untilLab(was) : "off", untilLab(g) + (mode === "sell" ? ", sell all" : ", freeze")); drawRun() };
  $h("rn_uoff").onclick = () => { if (!CLK.until) return; setLog("Run until", untilLab(CLK.until), "off"); CLK.until = 0; CLK.done = false; drawRun() };
  $h("rn_report").onclick = () => openReport(false);
  $h("rn_export").onclick = () => exportRun();
  $h("rn_import").onclick = () => $h("rn_file").click();
  $h("rn_file").onchange = e => { const f = e.target.files && e.target.files[0]; if (f) importRun(f) };
  drawRun(); drawActLog();
}
const untilLab = g => (g - CLK.g0) % 86400 === 0 ? `end of Day ${dayN(g) - 1}` : simLabel(g);
let emArm = 0;
function emergencyResume() { if (Date.now() - emArm > 4000) { emArm = Date.now(); toast("Tap Run again to resume after the emergency stop."); return } emArm = 0; setState("running", "resume after emergency") }
function drawRun() {
  if (!$h("rn_state")) return;
  document.querySelectorAll("#rn_state button").forEach(b => b.classList.toggle("on", b.dataset.s === CLK.state || (CLK.state === "emergency" && b.dataset.s === "paused")));
  document.querySelectorAll("#rn_speed .chip").forEach(b => b.classList.toggle("on", +b.dataset.v === CLK.speed));
  const live = isLive(); $h("rn_clock").textContent = live ? "Live prices · real time" : simLabel(SNAPT.g); $h("rn_date").textContent = live ? "" : " · " + dateLabel(SNAPT.g) + " (simulated)";
  const em = $h("rn_emer"); em.hidden = CLK.state !== "emergency"; if (!em.hidden) em.innerHTML = "🛑 <b>Emergency stop</b>: everything is frozen and nothing was sold. Tap <b>▶ Run</b> twice to continue.";
  const dn = $h("h_done"); dn.hidden = !CLK.done; if (CLK.done) dn.innerHTML = `✅ <b>Test complete — reached ${untilLab(CLK.until)}.</b> Everything is paused. <button class="chip" id="dn_rep">Open run report</button>`; const dr = $h("dn_rep"); if (dr) dr.onclick = () => openReport(false);
  const eff = effSpeed(), lim = limiting(), sel = CLK.speed >= 30000 ? "Max (30,000x)" : CLK.speed.toLocaleString() + "x";
  $h("rn_speedline").innerHTML = live ? "Live prices run in real time; the demo speed does not apply." :
    (CLK.state === "paused" || CLK.state === "emergency") && (CLK.g !== SNAPT.g || saving) ? `⏸ <b>Pausing…</b> finishing the current step and saving.` : CLK.state === "paused" || CLK.state === "emergency" ? `⏸ <b>Paused</b>: the simulated clock is stopped, nothing changes. Saved at ${simLabel(lastSaveG || SNAPT.g)}. Speed when running: ${sel}.` :
    `Demo speed: <b>${sel} selected</b> · <b>~${eff ? Math.round(eff).toLocaleString() : "…"}x actual</b>${lim ? ` <span class="lim">(${escH(lim)})</span>` : ""}${CLK.state === "nonew" ? " · <b>No new trades</b>: time runs and open coins can still be sold, nothing new is bought." : ""}${skipTo > CLK.g ? " · skipping ahead…" : ""}`;
  const us = $h("rn_ustat"); if (us) us.textContent = CLK.until ? `Target: ${untilLab(CLK.until)} (${CLK.untilMode === "sell" ? "sell every open coin" : "freeze open coins"} there). ${CLK.done ? "Reached." : "Now " + simLabel(CLK.g) + "."}` : "No target: runs until you pause it.";
  drawHud();
}
let tradeSpd = [];
function drawHud() {
  const el = $h("rn_hudkv"); if (!el) return; const t = totals(), n = t.wn + t.ln, now = performance.now(); tradeSpd.push([now, n]); while (tradeSpd.length > 2 && now - tradeSpd[0][0] > 10000) tradeSpd.shift();
  const tps = tradeSpd.length > 1 ? (tradeSpd[tradeSpd.length - 1][1] - tradeSpd[0][1]) / ((now - tradeSpd[0][0]) / 1000) : 0, watched = Object.values(R).reduce((a, r) => a + (r.scanned || 0), 0);
  const pz = CLK.state === "paused" || CLK.state === "emergency" || CLK.done; const kv = [["Selected speed", CLK.speed.toLocaleString() + "x"], ["Effective speed", pz ? "paused" : effSpeed() ? "~" + Math.round(effSpeed()).toLocaleString() + "x" : "–"], ["Frames a second", pz ? "paused" : fpsNow + " fps"], ["Simulated time", fmtDur(CLK.g - CLK.g0)], ["Real time running", fmtReal(CLK.realRun)], ["Trades a second", pz ? "paused" : tps.toFixed(1)], ["Coins watched", watched.toLocaleString()], ["Checks a minute", pz ? "paused" : Math.round(checkPerMin || 0).toLocaleString()], ["Limiting factor", limiting() || "none (running at the chosen speed)"]];
  el.innerHTML = kv.map(x => `<div><span>${x[0]}</span><b>${escH(x[1])}</b></div>`).join("");
}
function drawActLog() { const el = $h("rn_log"); if (!el) return; el.innerHTML = ACTLOG.slice(0, 3).map(l => `<div>${clock0(l.t)} · ${escH(l.msg)}</div>`).join("") }
function drawSetLog() { const el = $h("dg_set"); if (el) el.innerHTML = SETLOG.slice(0, 30).map(l => `<div>${clock0(l.t)} · ${escH(l.name)}${l.a ? " " + escH(l.a) + " →" : ""} ${escH(l.b)} <span class="sub">(${simLabel(l.g)})</span></div>`).join("") || "<div>No changes yet.</div>" }
const clock0 = t => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/* ---- W–L, "as of", made/lost bar, finished trades, failed/retried ---- */
function drawWL(t) {
  const el = $h("h_wl"); if (el) el.innerHTML = `<b class="g">${t.wn.toLocaleString()} W</b> — <b class="r">${t.ln.toLocaleString()} L</b> · ${wrS(t.wn, t.ln)} won`;
  const a = $h("h_asof"); if (a) a.textContent = isLive() ? "Live prices · " + DEMO_NOTE.replace("Demo market — not real prices. ", "Pretend money. ") : `As of simulated ${simLabel(SNAPT.g)} · ${DEMO_NOTE}`;
}
function drawSumbar() {
  const el = $h("sumbar"); if (!el) return; if (!Object.keys(R).length) { el.hidden = true; return } el.hidden = false; document.body.classList.add("hassum");
  const rows = dailyRows(), dk = isoDay(SNAPT.g), y = rows[dk] || { made: 0, lost: 0 }, pk = isoDay(SNAPT.g - 86400), py = dayN(SNAPT.g) > 1 ? rows[pk] : null, dN = dayN(SNAPT.g);
  el.innerHTML = `<div><span>Day ${dN} made</span><b class="g">${sg(cents(y.made))}</b></div><div><span>lost</span><b class="r">${sg(cents(y.lost))}</b></div><div><span>net today</span><b class="${y.made + y.lost >= 0 ? "g" : "r"}">${sg(cents(y.made + y.lost))}</b></div><div class="sb-y"><span>${dN > 1 ? "Day " + (dN - 1) + " net" : "yesterday"}</span><b class="${py && py.made + py.lost < 0 ? "r" : "g"}">${py ? sg(cents(py.made + py.lost)) : "–"}</b></div>`;
}
let finAll = false;
function drawFinished() {
  const el = $h("h_fin"); if (!el) return; const all = []; for (const [d, r] of Object.entries(R)) for (const c of r.tail || []) all.push(Object.assign({ desk: DN[d - 1] }, c));
  all.sort((a, b) => b.t - a.t); const L = all.slice(0, finAll ? 40 : 5);
  $h("h_fincount").textContent = all.length ? "newest first" : "";
  el.innerHTML = L.length ? L.map(c => { const pc = c.in ? c.pnl / c.in * 100 : 0, cl = c.pnl >= 0 ? "g" : "r"; return `<div class="fin"><div class="row"><span><b>${escH(c.sym)}</b> <span class="sub">${escH(c.desk)} · ${escH(reasonN(c.reason))}</span></span><b class="${cl}">${sg(c.pnl)} (${pc >= 0 ? "+" : ""}${pc.toFixed(1)}%)</b></div><div class="sub">${money(c.in || 0)} in → ${c.out != null ? money(c.out) : "–"} out · price ${pxF(c.entry)} → ${pxF(c.exit)} · ${simLabel(c.opened)} → ${simLabel(c.t)} (${fmtDur(c.t - c.opened)})</div></div>` }).join("") + (all.length > 5 ? `<button class="chip more" id="finmore">${finAll ? "Show less" : "Show more"}</button>` : "") : '<div class="sub">No finished trades yet.</div>';
  const b = $h("finmore"); if (b) b.onclick = () => { finAll = !finAll; touchHold = 0; drawFinished() };
}
function failTotals() { const z = { buyOk: 0, buyFail: 0, sellOk: 0, sellRev: 0, sellDrop: 0, sellOther: 0, burnBuy: 0, burnSell: 0, retryOk: 0, writeoff: 0 }, per = {}; for (const [d, r] of Object.entries(R)) { const f = Object.assign({}, z, r.fx || {}); per[d] = f; for (const k in z) z[k] += f[k] || 0 } return { z, per } }
function drawFailed() {
  const el = $h("h_fail"); if (!el) return; const { z, per } = failTotals(), sf = x => x.sellRev + x.sellDrop + x.sellOther;
  const row = (nm, x) => `<tr><td>${escH(nm)}</td><td>${(x.buyOk + x.buyFail).toLocaleString()}</td><td>${x.buyFail}</td><td>${(x.sellOk + sf(x)).toLocaleString()}</td><td>${sf(x)} <span class="sub">(${x.sellRev} rev · ${x.sellDrop} drop)</span></td><td>${x.retryOk}</td><td>${money(cents(x.burnBuy + x.burnSell))}</td></tr>`;
  el.innerHTML = `<div class="sub">Every buy and sell attempt. A failed buy is never a trade. A failed sell keeps the coin open and is retried; after repeated failures it is sold as an emergency or, if that keeps failing, written off (logged). Fees burned on failed attempts are already inside each desk's profit / loss.</div><div class="tblw"><table class="ftbl"><thead><tr><th></th><th>Buys tried</th><th>Buys failed</th><th>Sells tried</th><th>Sells failed</th><th>Retries that worked</th><th>Fees burned</th></tr></thead><tbody>${row("All desks", z)}${Object.entries(per).map(([d, x]) => row(DN[d - 1], x)).join("")}</tbody></table></div><div class="sub">Written off (could not sell): ${z.writeoff}</div>`;
}

/* ---- run report (on demand, and when the run reaches its target) ---- */
function reportData() {
  const t = totals(), n = t.wn + t.ln, rows = dailyRows(), { z } = failTotals(), desks = [];
  for (const [d, r] of Object.entries(R)) { const tl = (r.tail || []).slice(); desks.push({ name: DN[d - 1], pnl: cents(r.eq - r.start), eq: cents(r.eq), n: r.wn + r.ln, wr: wrS(r.wn, r.ln), best: r.best || null, worst: r.worst || null, tail: tl }) }
  let best = null, worst = null; for (const [d, r] of Object.entries(R)) { for (const c of [r.best, r.worst]) { if (!c) continue; const x = Object.assign({ desk: DN[d - 1] }, c); if (!best || x.pnl > best.pnl) best = x; if (!worst || x.pnl < worst.pnl) worst = x } }
  const keys = Object.keys(rows).sort(), days = keys.map(k => { const x = rows[k], g = Date.parse(k + "T00:00:00Z") / 1000; return { k, day: dayN(g), date: dateLabel(g), n: x.n, w: x.w, l: x.l, made: cents(x.made), lost: cents(x.lost), net: cents(x.made + x.lost), eod: DAYS[k] && DAYS[k].eod != null ? DAYS[k].eod : null } });
  return { t, n, z, desks, best, worst, days, start: cents(t.start), final: cents(t.eq), profit: cents(t.eq - t.start), pct: t.start ? (t.eq / t.start - 1) * 100 : 0, simFrom: CLK.g0, simTo: SNAPT.g, eff: effSpeedRun(), sel: CLK.speed };
}
function effSpeedRun() { return CLK.realRun > 1000 ? (CLK.g - CLK.g0) / (CLK.realRun / 1000) : 0 }
function summaryText() {
  const D = reportData(), sd = (D.simTo - D.simFrom) / 86400, aw = D.t.wn ? D.t.w / D.t.wn : 0, al = D.t.ln ? D.t.l / D.t.ln : 0;
  const L = ["PAPER TRADER — RUN SUMMARY",
    `Period: ${simLabel(D.simFrom)} (${dateLabel(D.simFrom)}) to ${simLabel(D.simTo)} (${dateLabel(D.simTo)}) (${sd.toFixed(2)} simulated days, ${fmtReal(CLK.realRun)} real, ${D.sel.toLocaleString()}x selected / ~${Math.round(D.eff).toLocaleString()}x actual)`,
    `Start: ${money(D.start)}  Final: ${money(D.final)}  Profit: ${sg(D.profit)} (${D.pct >= 0 ? "+" : ""}${D.pct.toFixed(2)}%)`,
    `Trades: ${D.n}  Win rate: ${wrS(D.t.wn, D.t.ln)}  Wins: ${D.t.wn} (${sg(cents(D.t.w))})  Losses: ${D.t.ln} (${sg(cents(D.t.l))})`,
    `Avg win: ${sg(cents(aw))}  Avg loss: ${sg(cents(al))}`,
    `Failed buys: ${D.z.buyFail}  Failed sells: ${D.z.sellRev + D.z.sellDrop + D.z.sellOther}  Fees burned: ${money(cents(D.z.burnBuy + D.z.burnSell))}`,
    `Open at the end: ${D.t.open} coins (${sg(cents(D.t.openPl))})`, "DESKS:"];
  for (const d of D.desks) L.push(`- ${d.name}: ${sg(d.pnl)} | ${d.n} trades | ${d.wr} win`);
  L.push("DAILY:"); for (const x of D.days) L.push(`- Day ${x.day} (${x.date}): ${x.n} trades, made ${sg(x.made)}, lost ${sg(x.lost)}, net ${sg(x.net)}, balance ${x.eod != null ? money(x.eod) : "(day not finished: " + money(D.final) + " now)"}`);
  L.push("NOTE: " + DEMO_NOTE); return L.join("\n");
}
function openReport(auto) {
  const el = $h("h_report"); if (!el) return; const D = reportData(), aw = D.t.wn ? D.t.w / D.t.wn : 0, al = D.t.ln ? D.t.l / D.t.ln : 0, sd = (D.simTo - D.simFrom) / 86400;
  const anomalies = DIAG.filter(x => x.kind === "invariant" || x.kind === "error").slice(0, 12), sellStreak = Object.values(R).reduce((a, r) => a + (r.pos || []).filter(p => p.att >= 2).length, 0);
  const tc = (c) => c ? `<b>${escH(c.sym)}</b> · ${escH(c.desk)} · price ${pxF(c.entry)} → ${pxF(c.exit)} · <b class="${c.pnl >= 0 ? "g" : "r"}">${sg(c.pnl)}</b> · ${escH(reasonN(c.reason))} · held ${fmtDur(c.t - c.opened)}` : "–";
  el.innerHTML = `<div class="rep"><div class="row"><h3>📋 Run report</h3><button class="chip" id="rp_close">Close</button></div>${auto ? '<div class="donebar">✅ Test complete. Everything is paused.</div>' : ""}<div class="sub">${DEMO_NOTE}</div>
    <h4>1 · Result</h4><div class="kv"><div><span>Final balance</span><b>${money(D.final)}</b></div><div><span>Profit</span><b class="${D.profit >= 0 ? "g" : "r"}">${sg(D.profit)} (${D.pct >= 0 ? "+" : ""}${D.pct.toFixed(2)}%)</b></div><div><span>Start balance</span><b>${money(D.start)}</b></div></div>
    <h4>2 · Period</h4><div class="sub">${simLabel(D.simFrom)} (${dateLabel(D.simFrom)}) → ${simLabel(D.simTo)} (${dateLabel(D.simTo)}) · ${sd.toFixed(2)} simulated days · ${fmtReal(CLK.realRun)} real · ${D.sel.toLocaleString()}x selected / ~${Math.round(D.eff).toLocaleString()}x actual (whole run)</div>
    <h4>3 · Trades</h4><div class="kv"><div><span>Trades</span><b>${D.n.toLocaleString()}</b></div><div><span>Win rate</span><b>${wrS(D.t.wn, D.t.ln)}</b></div><div><span>Win / loss size</span><b>${al < 0 ? (aw / -al).toFixed(2) + "x" : "–"}</b></div><div><span>Wins</span><b class="g">${D.t.wn} · ${sg(cents(D.t.w))}</b></div><div><span>Losses</span><b class="r">${D.t.ln} · ${sg(cents(D.t.l))}</b></div><div><span>Avg win / loss</span><b>${sg(cents(aw))} / ${sg(cents(al))}</b></div><div><span>Open now</span><b>${D.t.open} · ${sg(cents(D.t.openPl))}</b></div></div>
    <h4>4 · Desks</h4><div class="tblw"><table class="ftbl"><thead><tr><th>Desk</th><th>Profit</th><th>Balance</th><th>Trades</th><th>Win rate</th><th>Best</th><th>Worst</th></tr></thead><tbody>${D.desks.map(d => `<tr><td>${escH(d.name)}</td><td class="${d.pnl >= 0 ? "g" : "r"}">${sg(d.pnl)}</td><td>${money(d.eq)}</td><td>${d.n}</td><td>${d.wr}</td><td>${d.best ? sg(d.best.pnl) + " " + escH(d.best.sym) : "–"}</td><td>${d.worst ? sg(d.worst.pnl) + " " + escH(d.worst.sym) : "–"}</td></tr>`).join("")}</tbody></table></div>
    <h4>5 · Failed and retried</h4><div class="sub">Failed buys ${D.z.buyFail} · failed sells ${D.z.sellRev + D.z.sellDrop + D.z.sellOther} (${D.z.sellRev} reverted, ${D.z.sellDrop} dropped) · retries that worked ${D.z.retryOk} · fees burned ${money(cents(D.z.burnBuy + D.z.burnSell))} · written off ${D.z.writeoff}</div>
    <h4>6 · Best and worst coin</h4><div class="sub">Best: ${tc(D.best)}</div><div class="sub">Worst: ${tc(D.worst)}</div>
    <h4>7 · Day by day</h4><div class="tblw"><table class="ftbl"><thead><tr><th>Day</th><th>Trades</th><th>Won</th><th>Lost</th><th>Made</th><th>Lost $</th><th>Net</th><th>Balance at end</th></tr></thead><tbody>${D.days.map(x => `<tr><td>${x.day} <span class="sub">${x.date}</span></td><td>${x.n}</td><td>${x.w}</td><td>${x.l}</td><td class="g">${sg(x.made)}</td><td class="r">${sg(x.lost)}</td><td class="${x.net >= 0 ? "g" : "r"}">${sg(x.net)}</td><td>${x.eod != null ? money(x.eod) : "(running)"}</td></tr>`).join("")}</tbody><tfoot><tr><td>All</td><td>${D.days.reduce((a, x) => a + x.n, 0)}</td><td>${D.days.reduce((a, x) => a + x.w, 0)}</td><td>${D.days.reduce((a, x) => a + x.l, 0)}</td><td class="g">${sg(cents(D.days.reduce((a, x) => a + x.made, 0)))}</td><td class="r">${sg(cents(D.days.reduce((a, x) => a + x.lost, 0)))}</td><td>${sg(cents(D.days.reduce((a, x) => a + x.net, 0)))}</td><td></td></tr></tfoot></table></div><div class="sub">Made / lost / net = finished trades closed that simulated day. Balance at end also includes coins still open and fees on failed buys.</div>
    <h4>8 · Problems the app found</h4><div class="sub">${invBad ? `${invBad} snapshot${invBad > 1 ? "s" : ""} failed a check (of ${invOk + invBad}):` : `All ${invOk.toLocaleString()} snapshots passed every check.`}${anomalies.map(a => `<div>• ${escH(a.msg)} (${simLabel(a.g)})</div>`).join("")}${sellStreak ? `<div>• ${sellStreak} open coin(s) with repeated sell failures</div>` : ""}</div>
    <h4>9 · Actions</h4><div class="chips"><button class="chip" id="rp_json">Export JSON</button><button class="chip" id="rp_txt">Export summary (.txt)</button><button class="chip" id="rp_copy">Copy summary</button><button class="chip" id="rp_resume">Resume</button><button class="chip" id="rp_new">Start over</button></div><pre class="sumtxt" id="rp_pre" hidden></pre></div>`;
  el.hidden = false; document.body.classList.add("modal-open");
  $h("rp_close").onclick = () => { el.hidden = true; document.body.classList.remove("modal-open") };
  $h("rp_json").onclick = () => exportRun(); $h("rp_txt").onclick = () => download("paper-trader-summary.txt", summaryText(), "text/plain");
  $h("rp_copy").onclick = () => copyOut(summaryText());
  $h("rp_resume").onclick = () => { if (CLK.done) { toast("Target reached: change or turn off 'Run until' first."); return } $h("rp_close").click(); setState("running") };
  let arm = 0; $h("rp_new").onclick = e => { if (!arm) { arm = 1; e.target.textContent = "Tap again: delete this run"; setTimeout(() => { arm = 0; e.target.textContent = "Start over" }, 4000); return } startOver(capPick) };
}
function download(name, text, type) { try { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 2000); toast("Downloading " + name + " (if nothing happens, use Copy)") } catch (e) { copyOut(text) } }
function copyOut(text) { const pre = $h("rp_pre"); const done = ok => toast(ok ? "Copied" : "Could not copy: select the text below"); try { navigator.clipboard.writeText(text).then(() => done(true), () => { if (pre) { pre.hidden = false; pre.textContent = text } done(false) }) } catch (e) { if (pre) { pre.hidden = false; pre.textContent = text } done(false) } }
async function exportRun() {
  if (isLive()) { toast("Export is for demo runs."); return }
  const was = CLK.state; if (was === "running" || was === "nonew") setState("paused", "export");
  await new Promise(r => setTimeout(r, 900)); const desks = {}; for (let i = 1; i <= NDESK; i++) { try { desks[i] = await IDB.get("desk" + i) } catch (e) {} }
  let run = null; try { run = JSON.parse(localStorage.getItem(RUNK) || "null") } catch (e) {}
  const json = JSON.stringify({ app: "paper-trader", kind: "demo-run", version: 1, exportedAt: new Date().toISOString(), note: DEMO_NOTE, summary: summaryText(), run, desks });
  download("paper-trader-run.json", json, "application/json"); setLog("Export", "", `run at ${simLabel(CLK.g)} (${Math.round(json.length / 1024)} KB)`);
}
async function importRun(file) {
  try { const o = JSON.parse(await file.text()); if (!o || o.app !== "paper-trader" || !o.run || !o.desks) throw new Error("not a Paper Trader run file");
    if (o.run.nd && o.run.nd !== NDESK) { try { localStorage.setItem("pt_host_n", String(o.run.nd)) } catch (e) {} }
    await IDB.clear(); for (const [k, v] of Object.entries(o.desks)) if (v) await IDB.put("desk" + k, v);
    localStorage.setItem(RUNK, JSON.stringify(o.run)); toast("Imported: reloading…"); setTimeout(() => location.reload(), 600)
  } catch (e) { toast("Import failed: " + e.message); diag("storage", "import failed: " + e.message) }
}

/* ---- Diagnostics (Full view): checks, settings log, speed history, storage, errors ---- */
const SPDH = []; setInterval(() => { if (CLK.state === "running" || CLK.state === "nonew") { SPDH.unshift({ t: Date.now(), sel: CLK.speed, eff: Math.round(effSpeed()), fps: fpsNow, lim: limiting() }); if (SPDH.length > 30) SPDH.length = 30 } }, 10000);
function drawDiag() {
  const el = $h("dg_body"); if (!el || !$h("h_diag").open) return;
  const inv = DIAG.filter(x => x.kind === "invariant").slice(0, 15), st = DIAG.filter(x => x.kind === "storage" || x.kind === "day").slice(0, 12), er = DIAG.filter(x => x.kind === "error").slice(0, 10);
  el.innerHTML = `<h4>Checks on every snapshot</h4><div class="sub">${invOk.toLocaleString()} passed · ${invBad} failed. Checks: one clock for every desk; desk balances and profits add up to the totals to the cent; coins bought = won + lost + open on each desk; profit = won + lost + open − failed-buy fees + cash interest; trade counts and "trades today" never go down within a day; the daily table adds up to the total trades.</div>${inv.map(x => `<div class="dgx">${clock0(x.t)} · ${simLabel(x.g)} · ${escH(x.msg)}</div>`).join("") || '<div class="dgx">No failures.</div>'}
    <h4>Settings changes</h4><div id="dg_set"></div>
    <h4>Speed (every 10 s while running)</h4>${SPDH.map(x => `<div class="dgx">${clock0(x.t)} · ${x.sel.toLocaleString()}x selected · ~${x.eff.toLocaleString()}x actual · ${x.fps} fps${x.lim ? " · " + escH(x.lim) : ""}</div>`).join("") || '<div class="dgx">Not running yet.</div>'}
    <h4>Saving, restoring, day changes</h4>${st.map(x => `<div class="dgx">${clock0(x.t)} · ${escH(x.msg)}</div>`).join("") || '<div class="dgx">Nothing yet.</div>'}
    <h4>Errors</h4>${er.map(x => `<div class="dgx">${clock0(x.t)} · ${escH(x.msg)}</div>`).join("") || '<div class="dgx">None.</div>'}`;
  drawSetLog();
}
window.addEventListener("error", e => diag("error", "Master: " + (e.message || "script error")));

/* ---- Full Auto locks: visible, explained, and never silent ---- */
let lockToastAt = 0;
function lockedHit(e) { if (!FA) return; const lk = e.target.closest && e.target.closest(".fa-lock"); if (!lk) return; e.preventDefault(); e.stopPropagation(); if (Date.now() - lockToastAt > 900) { lockToastAt = Date.now(); toast("🔒 Locked by Full Auto — turn Full Auto off to change this by hand."); const lb = $h("fa_lockbar"); if (lb) { lb.classList.remove("shake"); void lb.offsetWidth; lb.classList.add("shake") } } }
["pointerdown", "mousedown", "click", "keydown", "input", "change"].forEach(t => document.addEventListener(t, lockedHit, true));
function confirmBox(title, html, ok) {
  return new Promise(res => { const el = $h("h_modal"); el.innerHTML = `<div class="rep small"><h3>${title}</h3><div class="sub">${html}</div><div class="chips" style="margin-top:12px"><button class="chip on" id="md_ok">${ok}</button><button class="chip" id="md_no">Cancel</button></div></div>`; el.hidden = false;
    const end = v => { el.hidden = true; res(v) }; $h("md_ok").onclick = () => end(true); $h("md_no").onclick = () => end(false) });
}

/* ---- start ---- */
buildRun(); drawRestore(); if (restoreWait) { CLK.state = "paused"; drawRun() }
document.body.classList.toggle("fullauto", FA);
$h("h_diag").addEventListener("toggle", drawDiag);
draw(); setInterval(() => { if (cur === 0) { draw(); mark() } }, 1000); setInterval(() => { if (cur !== 0) drawRun(); if ($h("h_diag").open) drawDiag() }, 1000);
window.addEventListener("pagehide", () => { if (lastSaveG) writeRun(lastSaveG) });
