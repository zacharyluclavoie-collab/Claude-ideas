/* ===== Run controls, ONE speed number, money dashboard, W–L, made/lost bar, finished trades, failed/retried, money features,
 * run report (reconciled to the cent), export/import, diagnostics. Everything reads the one snapshot object SNAP (cents). ===== */
const endDate = g => (CLK.done && g === CLK.until && (g - CLK.g0) % 86400 === 0) ? dateLabel(g - 1) + ", 24:00" : dateLabel(g);
const fmtDur = s => { s = Math.max(0, Math.round(s)); const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return d ? `${d} d ${h} h` : h ? `${h} h ${m} m` : `${m} m` };
const fmtReal = ms => { const s = Math.round(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return h ? `${h} h ${m} m` : m ? `${m} m ${x} s` : `${x} s` };
const pxF = v => v == null ? "–" : v >= 1 ? v.toFixed(4) : v.toPrecision(4);
const wrS = (w, l) => w + l ? Math.round(100 * w / (w + l)) + "%" : "–";   // the one win-rate formula: wins ÷ (wins + losses), rounded to a whole %
const reasonN = r => { r = String(r || ""); if (r.startsWith("EMERGENCY")) return "emergency exit"; return ({ stop_loss: "stop-loss", take_profit_1: "first take-profit", take_profit_2: "second take-profit", trailing_stop: "trailing stop", time_stop: "held too long", stagnant: "not moving", writeoff_unsellable: "written off (could not sell)", write_off: "written off", hard_exit: "hard exit (sell at any price)", stale_data: "no price data (closed at a haircut)" })[r] || r.replace(/_/g, " ") };
const DEMO_NOTE = "Demo market — not real prices. Past demo results do not predict real results.";
const clock0 = t => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const untilLab = g => (g - CLK.g0) % 86400 === 0 ? `end of Day ${dayN(g) - 1}` : simLabel(g);
const isOff = () => CLK.state === "nonew";
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
let emArm = 0;
function emergencyResume() { if (Date.now() - emArm > 4000) { emArm = Date.now(); toast("Tap Run again to resume after the emergency stop."); return } emArm = 0; setState("running", "resume after emergency") }
function drawRun() {
  if (!$h("rn_state")) return;
  document.querySelectorAll("#rn_state button").forEach(b => b.classList.toggle("on", b.dataset.s === CLK.state || (CLK.state === "emergency" && b.dataset.s === "paused")));
  document.querySelectorAll("#rn_speed .chip").forEach(b => b.classList.toggle("on", +b.dataset.v === CLK.speed));
  const live = isLive(); $h("rn_clock").textContent = live ? "Live prices · real time" : simLabel(SNAPT.g); $h("rn_date").textContent = live ? "" : " · " + endDate(SNAPT.g) + " (simulated)";
  const em = $h("rn_emer"); em.hidden = CLK.state !== "emergency"; if (!em.hidden) em.innerHTML = "🛑 <b>Emergency stop</b>: everything is frozen and nothing was sold. Tap <b>▶ Run</b> twice to continue.";
  const rec = SNAP ? reconcile(SNAP) : { unexplained: 0 }, dn = $h("h_done"); dn.hidden = !CLK.done; if (CLK.done) dn.innerHTML = rec.unexplained === 0 ? `✅ <b>Test complete — reached ${untilLab(CLK.until)}.</b> Everything is paused and the report reconciles to the cent. <button class="chip" id="dn_rep">Open run report</button>` : `⚠️ <b>Reached ${untilLab(CLK.until)}, but the report does NOT reconcile</b> (unexplained ${SG$(rec.unexplained)}). <button class="chip" id="dn_rep">Open run report</button>`; const dr = $h("dn_rep"); if (dr) dr.onclick = () => openReport(false);
  const lim = limiting(), sel = CLK.speed >= 30000 ? "Max (30,000x)" : CLK.speed.toLocaleString() + "x", sl = $h("rn_speedline"); sl.dataset.spd = SPEEDV.id;
  sl.innerHTML = live ? "Live prices run in real time; the demo speed does not apply." :
    (CLK.state === "paused" || CLK.state === "emergency") && (CLK.g !== SNAPT.g || saving) ? `⏸ <b>Pausing…</b> finishing the current step and saving.` : CLK.state === "paused" || CLK.state === "emergency" ? `⏸ <b>Paused</b>: the simulated clock is stopped, nothing changes. ${SID ? `Save #${SID} at ${simLabel(lastSaveG || SNAPT.g)}. ` : ""}Speed when running: ${sel}.` :
    `Demo speed: <b>${sel} selected</b> · <b>${speedText()} actual</b> <span class="sub">(10 s average, as of ${clock0(SPEEDV.at)})</span>${lim ? ` <span class="lim">(${escH(lim)})</span>` : ""}${isOff() ? " · <b>No new trades</b>: scanners off; open coins are still watched and sold." : ""}${skipTo > CLK.g ? " · skipping ahead…" : ""}`;
  const us = $h("rn_ustat"); if (us) us.textContent = CLK.until ? `Target: ${untilLab(CLK.until)} (${CLK.untilMode === "sell" ? "sell every open coin" : "freeze open coins"} there). ${CLK.done ? "Reached." : "Now " + simLabel(CLK.g) + "."}` : "No target: runs until you pause it.";
  drawHud();
}
let tradeSpd = [], checkSpd = [];
function drawHud() {
  const el = $h("rn_hudkv"); if (!el) return; el.dataset.spd = SPEEDV.id; const t = totals(), n = t.wn + t.ln, now = performance.now(), pz = CLK.state === "paused" || CLK.state === "emergency" || CLK.done || restoreWait;
  tradeSpd.push([now, n]); while (tradeSpd.length > 2 && now - tradeSpd[0][0] > 10000) tradeSpd.shift(); checkSpd.push([now, t.scanned]); while (checkSpd.length > 2 && now - checkSpd[0][0] > 10000) checkSpd.shift();
  const rate = (a, per) => a.length > 1 ? (a[a.length - 1][1] - a[0][1]) / ((now - a[0][0]) / 1000) * per : 0, sv = v => v == null ? "–" : "~" + Math.round(v).toLocaleString() + "x";
  const kv = [["Actual speed (10 s)", pz ? "paused" : speedText() + " · " + clock0(SPEEDV.at)], ["1 min ago", pz ? "–" : sv(SPEEDV.v1m)], ["5 min ago", pz ? "–" : sv(SPEEDV.v5m)], ["Whole-run average", sv(SPEEDV.run)], ["Selected speed", CLK.speed.toLocaleString() + "x"], ["Frames a second", pz ? "paused" : fpsNow + " fps"], ["Simulated time", fmtDur(SNAPT.g - CLK.g0)], ["Real time running", fmtReal(CLK.realRun)], ["Trades closed a second", pz ? "paused" : rate(tradeSpd, 1).toFixed(1)], ["Coins checked a minute", pz ? "paused" : isOff() ? "Off (No new trades: scanners off)" : Math.round(rate(checkSpd, 60)).toLocaleString()], ["Coins watched", Object.values(R).reduce((a, r) => a + (r.scanned || 0), 0).toLocaleString()], ["Limiting factor", limiting() || "none (running at the chosen speed)"]];
  el.innerHTML = kv.map(x => `<div><span>${x[0]}</span><b>${escH(x[1])}</b></div>`).join("");
}
function drawActLog() { const el = $h("rn_log"); if (!el) return; el.innerHTML = ACTLOG.slice(0, 3).map(l => `<div>${clock0(l.t)} · ${escH(l.msg)}</div>`).join("") }
function drawSetLog() { const el = $h("dg_set"); if (el) el.innerHTML = SETLOG.slice(0, 40).map(l => `<div class="dgx">${clock0(l.t)} · ${simLabel(l.g)} · <b>${escH(l.name)}</b>${l.a ? " " + escH(l.a) + " →" : ""} ${escH(l.b)}</div>`).join("") || "<div>No changes yet.</div>" }

/* ---- the money dashboard (Money 9): the numbers that matter more than the balance ---- */
function metrics(sn) {
  sn = sn || SNAP; if (!sn) return null; const t = sn.tot, n = t.wn + t.ln, rows = dayRows(sn), done = rows.filter(r => r.eod != null || r.n), byNet = done.slice().sort((a, b) => b.net - a.net);
  return { n, exp: n ? (t.w + t.l) / n : 0, pf: t.l ? t.w / -t.l : null, dd: DD.max, ddPct: DD.pct, ddFrom: DD.from, ddTo: DD.to, feesPct: t.w ? (t.bb + t.bs) / t.w * 100 : 0, woPct: t.l ? t.wo / t.l * 100 : 0, best: byNet[0] || null, worst: byNet[byNet.length - 1] || null, woN: t.woN, wo: t.wo, fees: t.bb + t.bs };
}
function drawDash() {
  const el = $h("h_dash"); if (!el || !SNAP) return; const m = metrics(); el.dataset.snap = SNAP.id;
  const desk = Object.entries(SNAP.desks).map(([d, x]) => { const n = x.wn + x.ln; return `<span>${escH(DN[d - 1])} <b class="${(x.w + x.l) >= 0 ? "g" : "r"}">${n ? SG$(Math.round((x.w + x.l) / n)) : "–"}</b></span>` }).join(" · ");
  el.innerHTML = `<div class="kv"><div title="Average profit or loss of a finished trade"><span>Expectancy a trade</span><b class="${m.exp >= 0 ? "g" : "r"}">${SG$(Math.round(m.exp))}</b></div><div title="Money won ÷ money lost on finished trades"><span>Profit factor</span><b>${m.pf == null ? "–" : m.pf.toFixed(2)}</b></div><div title="Biggest fall of the total balance from a high"><span>Max drawdown</span><b class="r">${m.dd ? "−" + D$(m.dd) + " (" + m.ddPct.toFixed(2) + "%)" : "$0.00"}</b><span>${m.dd ? simLabel(m.ddFrom) + " → " + simLabel(m.ddTo) : ""}</span></div><div title="Fees burned on failed buys and sells ÷ money won"><span>Fees burned / gross profit</span><b>${m.feesPct.toFixed(1)}%</b></div><div title="Loss on written-off coins ÷ all money lost"><span>Write-off loss / gross losses</span><b>${m.woPct.toFixed(1)}%</b><span>${m.woN} written off</span></div><div><span>Best / worst day</span><b>${m.best ? SG$(m.best.net) + " / " + SG$(m.worst.net) : "–"}</b><span>${m.best ? "Day " + m.best.day + " / Day " + m.worst.day : ""}</span></div></div><div class="sub" style="margin-top:6px">Expectancy by desk: ${desk}</div>`;
}
// one status line per desk: today's expectancy and what the money features are doing to its size
function deskStatus(i, r, x) {
  const n = x.todayN, e = n ? (x.todayMade + x.todayLost) / n : null, mo = r.money || {}, bits = [];
  if (mo.step) bits.push(mo.step.lab); if (MONEY.smart && (ALLOC[i] || 1) !== 1) bits.push(`allocation ${ALLOC[i]}x`); if (mo.bank && mo.bank.day === SNAP.dk) bits.push(`banked at ${hhmm(mo.bank.at)}`); if (mo.ftcUntil > SNAP.g) bits.push(`cost control until ${hhmm(mo.ftcUntil)}`); if (MONEY.tournament) bits.push(MODEN[r.mode] || r.mode);
  return `<br><span class="dstat">${escH(DN[i - 1])} today: ${e == null ? "no finished trades" : "expectancy " + SG$(Math.round(e)) + "/trade"}${bits.length ? " — " + bits.map(escH).join(", ") : ""}</span>`;
}

/* ---- W–L, made/lost bar, finished trades, failed/retried (all from the one snapshot) ---- */
function drawWL(t) {
  const el = $h("h_wl"), m = metrics(); if (el) { el.dataset.snap = SNAP ? SNAP.id : ""; el.innerHTML = `<b class="g">${t.wn.toLocaleString()} W</b> — <b class="r">${t.ln.toLocaleString()} L</b> · ${wrS(t.wn, t.ln)} won${m && m.n ? ` · <span title="Average profit of a finished trade">expectancy <b class="${m.exp >= 0 ? "g" : "r"}">${SG$(Math.round(m.exp))}</b></span> · <span title="Money won ÷ money lost">profit factor <b>${m.pf == null ? "–" : m.pf.toFixed(2)}</b></span>` : ""}` }
  const a = $h("h_asof"); if (a) a.textContent = isLive() ? "Live prices · pretend money." : `As of simulated ${simLabel(SNAPT.g)} (snapshot #${SNAP ? SNAP.id : 0}) · ${DEMO_NOTE}`;
}
function drawSumbar() {
  const el = $h("sumbar"); if (!el) return; if (!SNAP || !Object.keys(R).length) { el.hidden = true; return } el.hidden = false; document.body.classList.add("hassum"); el.dataset.snap = SNAP.id;
  const t = SNAP.tot, dN = dayN(SNAP.g), rows = dayRows(SNAP), prev = dN > 1 ? rows.find(r => r.day === dN - 1) : null;
  el.innerHTML = `<div><span>Day ${dN} made</span><b class="g">${SG$(t.todayMade)}</b></div><div><span>lost</span><b class="r">${SG$(t.todayLost)}</b></div><div><span>net today</span><b class="${t.todayMade + t.todayLost >= 0 ? "g" : "r"}">${SG$(t.todayMade + t.todayLost)}</b></div><div class="sb-y"><span>${prev ? "Day " + prev.day + " net" : "previous day"}</span><b class="${prev && prev.net < 0 ? "r" : "g"}">${prev ? SG$(prev.net) : "No previous day yet"}</b></div>`;
}
let finAll = false;
function drawFinished() {
  const el = $h("h_fin"); if (!el) return; const all = []; for (const [d, r] of Object.entries(R)) for (const c of r.tail || []) all.push(Object.assign({ desk: DN[d - 1] }, c));
  all.sort((a, b) => b.t - a.t); const L = all.slice(0, finAll ? 40 : 5); $h("h_fincount").textContent = all.length ? "newest first" : "";
  el.innerHTML = L.length ? L.map(c => { const pc = c.in ? c.pnl / c.in * 100 : 0, cl = c.pnl >= 0 ? "g" : "r"; return `<div class="fin"><div class="row"><span><b>${escH(c.sym)}</b> <span class="sub">${escH(c.desk)} · ${escH(reasonN(c.reason))}</span></span><b class="${cl}">${sg(c.pnl)} (${pc >= 0 ? "+" : ""}${pc.toFixed(1)}%)</b></div><div class="sub">${money(c.in || 0)} in → ${c.out != null ? money(c.out) : "–"} out · price ${pxF(c.entry)} → ${pxF(c.exit)} · ${simLabel(c.opened)} → ${simLabel(c.t)} (${fmtDur(c.t - c.opened)})</div></div>` }).join("") + (all.length > 5 ? `<button class="chip more" id="finmore">${finAll ? "Show less" : "Show more"}</button>` : "") : '<div class="sub">No finished trades yet.</div>';
  const b = $h("finmore"); if (b) b.onclick = () => { finAll = !finAll; touchHold = 0; drawFinished() };
}
function failTotals() { const z = { buyOk: 0, buyFail: 0, sellOk: 0, sellRev: 0, sellDrop: 0, sellOther: 0, retryOk: 0, writeoff: 0, burnC: 0 }, per = {}; for (const [d, r] of Object.entries(R)) { const f = Object.assign({ buyOk: 0, buyFail: 0, sellOk: 0, sellRev: 0, sellDrop: 0, sellOther: 0, retryOk: 0, writeoff: 0 }, r.fx || {}), x = SNAP && SNAP.desks[d]; f.burnC = x ? x.bb + x.bs : 0; per[d] = f; for (const k in z) z[k] += f[k] || 0 } return { z, per } }
function drawFailed() {
  const el = $h("h_fail"); if (!el) return; const { z, per } = failTotals(), sf = x => x.sellRev + x.sellDrop + x.sellOther;
  const row = (nm, x) => `<tr><td>${escH(nm)}</td><td>${(x.buyOk + x.buyFail).toLocaleString()}</td><td>${x.buyFail}</td><td>${(x.sellOk + sf(x)).toLocaleString()}</td><td>${sf(x)} <span class="sub">(${x.sellRev} rev · ${x.sellDrop} drop)</span></td><td>${x.retryOk}</td><td>${D$(x.burnC)}</td></tr>`;
  el.innerHTML = `<div class="sub">Every buy and sell attempt. A failed buy is never a trade. A failed sell keeps the coin open; the write-off ladder${MONEY.ladder ? " (on)" : " (off)"} widens the price limit, then sells at any price, then alerts the Risk manager, before a write-off. Fees burned are inside each desk's profit.</div><div class="tblw"><table class="ftbl"><thead><tr><th></th><th>Buys tried</th><th>Buys failed</th><th>Sells tried</th><th>Sells failed</th><th>Retries that worked</th><th>Fees burned</th></tr></thead><tbody>${row("All desks", z)}${Object.entries(per).map(([d, x]) => row(DN[d - 1], x)).join("")}</tbody></table></div><div class="sub">Written off (could not sell): ${z.writeoff}</div>`;
}

/* ---- money features panel (Part 3): every toggle, its default, and what it does ---- */
const MONEYD = [["ladder", "on", "Write-off ladder: after failed sell #2 allow more slippage, after #4 sell at any price, after #6 alert the Risk manager; write off only after that. Only protects."], ["prebuy", "off", "Pre-buy sellability check: a coin that looks like coins we could not sell gets half size (1 match) or is skipped (2+). On top of the scam checks, never instead."], ["ftc", "off", "Failed-sell cost control: a desk whose sells fail more than 20% in an hour buys nothing new for 30 min (selling never stops); failed sells retry after 1, 5, 15 min."], ["bank", "off", "Bank the day: when a desk's finished trades made the target today, its new buys are half size and take profit sooner until midnight. Never blocks a sell."], ["memory", "off", "Coin pattern memory: coins like past winners get one extra committee vote, like past losers need one more. Every influenced decision is logged."], ["cold", "off", "Cold-desk size steps: new-trade size full / half / quarter by the desk's last 50 trades. Wins over Smart allocation when both are on."], ["smart", "off", "Smart allocation: each midnight the 2 best desks by 3-day expectancy size up (max 2x), the worst sizes down 25% (floor 25%)."], ["tournament", "off", "Mode tournament: each desk runs a different mode; each midnight the worst desk copies the best mode; desk 1 stays on Lots of trades as the control."]];
function buildMoney() {
  const el = $h("h_money"); if (!el) return;
  el.innerHTML = `<div class="sub">Each feature is off until a clean A/B test proves it (Part 4). The ladder is on: it only protects. The dashboard and the exit-reason breakdown always measure. Nothing here can buy a coin that failed the scam checks, hide a loss, or leave fees or write-offs out of the profit.</div>` +
    MONEYD.map(([k, def, txt]) => `<div class="mny"><div class="row"><b>${escH(MONEYN[k])}</b><span class="chips" data-mk="${k}"><button class="chip ${MONEY[k] ? "on" : ""}" data-v="1">On</button><button class="chip ${MONEY[k] ? "" : "on"}" data-v="0">Off</button></span></div><div class="sub">${escH(txt)} <i>Default: ${def}.</i></div>${k === "ladder" ? `<div class="mrow"><label for="mn_slip">Extra slippage after 2 failed sells</label><input type="range" id="mn_slip" min="0.5" max="5" step="0.5" value="${MONEY.slipPlus}"><b id="mn_slip_v">+${MONEY.slipPlus}%</b></div>` : ""}${k === "bank" ? `<div class="mrow"><label for="mn_bank">Day target per desk</label><input type="range" id="mn_bank" min="25" max="500" step="25" value="${MONEY.bankTarget}"><b id="mn_bank_v">$${MONEY.bankTarget}</b></div>` : ""}</div>`).join("");
  el.querySelectorAll("[data-mk]").forEach(g => g.onclick = e => { const b = e.target.closest("button"); if (!b) return; setMoney(g.dataset.mk, b.dataset.v === "1") });
  const sl = $h("mn_slip"); if (sl) { sl.oninput = () => $h("mn_slip_v").textContent = "+" + sl.value + "%"; sl.onchange = () => setMoney("slipPlus", +sl.value) }
  const bk = $h("mn_bank"); if (bk) { bk.oninput = () => $h("mn_bank_v").textContent = "$" + bk.value; bk.onchange = () => setMoney("bankTarget", +bk.value) }
}

/* ---- run report: everything from one report snapshot, reconciled to the cent ---- */
function exitTable() { const g = {}, per = {}; for (const [d, r] of Object.entries(R)) for (const [k, e] of Object.entries(r.exits || {})) { const a = g[k] || (g[k] = { n: 0, w: 0, pnl: 0 }); a.n += e.n; a.w += e.w; a.pnl += Math.round(e.pnl * 100); const b = (per[k] || (per[k] = {}))[d] = { n: e.n, w: e.w, pnl: Math.round(e.pnl * 100) } } return { g, per } }
function audits() { const out = []; for (const [d, r] of Object.entries(R)) for (const a of r.audits || []) out.push(Object.assign({ desk: DN[d - 1] }, a)); return out.sort((a, b) => a.t - b.t) }
function tournamentTable() {
  const rows = [], pool = {}; for (const [day, ml] of Object.entries(MODELOG)) for (const [d, mode] of Object.entries(ml)) { const y = ((R[d] || {}).dayc || {})[day]; if (!y) continue; rows.push({ day, n: dayN(Date.parse(day + "T00:00:00Z") / 1000), desk: DN[d - 1], mode, t: y.n, w: y.w, pnl: y.made + y.lost }); const p = pool[mode] || (pool[mode] = { n: 0, w: 0, pnl: 0 }); p.n += y.n; p.w += y.w; p.pnl += y.made + y.lost }
  const ranked = Object.entries(pool).filter(([, p]) => p.n >= 30).sort((a, b) => b[1].pnl / b[1].n - a[1].pnl / a[1].n);
  return { rows: rows.sort((a, b) => a.n - b.n || a.desk.localeCompare(b.desk)), pool, verdict: ranked.length >= 2 ? `${MODEN[ranked[0][0]] || ranked[0][0]} made the most per trade: ${SG$(Math.round(ranked[0][1].pnl / ranked[0][1].n))} over ${ranked[0][1].n} trades (next: ${MODEN[ranked[1][0]] || ranked[1][0]} ${SG$(Math.round(ranked[1][1].pnl / ranked[1][1].n))} over ${ranked[1][1].n}).` + (["runner", "tight"].some(v => (pool[v] || { n: 0 }).n > 0 && pool[v].n < 100) ? " Runner / Tight: fewer than 100 trades each, not enough trades to call them." : "") : "Not enough trades to call it (30+ trades per mode needed)." };
}
function reportData() {
  const sn = SNAP, t = sn.tot, n = t.wn + t.ln, rows = dayRows(sn), m = metrics(sn), rec = reconcile(sn), { z } = failTotals(), desks = [];
  for (const [d, x] of Object.entries(sn.desks)) { const r = R[d] || {}, nn = x.wn + x.ln; desks.push({ name: DN[d - 1], pnl: x.eq - x.start, eq: x.eq, n: nn, wr: wrS(x.wn, x.ln), exp: nn ? (x.w + x.l) / nn : 0, best: r.best || null, worst: r.worst || null }) }
  let best = null, worst = null; for (const [d, r] of Object.entries(R)) for (const c of [r.best, r.worst]) { if (!c) continue; const x = Object.assign({ desk: DN[d - 1] }, c); if (!best || x.pnl > best.pnl) best = x; if (!worst || x.pnl < worst.pnl) worst = x }
  return { sn, t, n, rows, m, rec, z, desks, best, worst, start: t.start, final: t.eq, profit: t.eq - t.start, pct: t.start ? (t.eq / t.start - 1) * 100 : 0, simFrom: CLK.g0, simTo: sn.g, sel: CLK.speed, effRun: SPEEDV.run, ex: exitTable(), aud: audits(), tour: tournamentTable() };
}
function summaryText() {
  const D = reportData(), sd = (D.simTo - D.simFrom) / 86400, aw = D.t.wn ? D.t.w / D.t.wn : 0, al = D.t.ln ? D.t.l / D.t.ln : 0, on = Object.entries(MONEY).filter(([k, v]) => v === true).map(([k]) => MONEYN[k] || k);
  const L = ["PAPER TRADER — RUN SUMMARY",
    `Period: ${simLabel(D.simFrom)} (${dateLabel(D.simFrom)}) to ${simLabel(D.simTo)} (${endDate(D.simTo)}) (${sd.toFixed(2)} simulated days, ${fmtReal(CLK.realRun)} real, ${D.sel.toLocaleString()}x selected / ~${Math.round(D.effRun).toLocaleString()}x actual)`,
    `Start: ${D$(D.start)}  Final: ${D$(D.final)}  Profit: ${SG$(D.profit)} (${D.pct >= 0 ? "+" : ""}${D.pct.toFixed(2)}%)`,
    `Trades: ${D.n}  Win rate: ${wrS(D.t.wn, D.t.ln)}  Wins: ${D.t.wn} (${SG$(D.t.w)})  Losses: ${D.t.ln} (${SG$(D.t.l)})`,
    `Avg win: ${SG$(Math.round(aw))}  Avg loss: ${SG$(Math.round(al))}  Expectancy: ${SG$(Math.round(D.m.exp))}/trade  Profit factor: ${D.m.pf == null ? "–" : D.m.pf.toFixed(2)}`,
    `Max drawdown: ${D.m.dd ? "-" + D$(D.m.dd) + " (" + D.m.ddPct.toFixed(2) + "%, " + simLabel(D.m.ddFrom) + " to " + simLabel(D.m.ddTo) + ")" : "$0.00"}`,
    `Failed buys: ${D.z.buyFail}  Failed sells: ${D.z.sellRev + D.z.sellDrop + D.z.sellOther}  Fees burned: ${D$(D.t.bb + D.t.bs)}  Write-offs: ${D.t.woN} (${SG$(D.t.wo)})`,
    `Open at the end: ${D.t.openN} coins (${SG$(D.t.openPl)})`,
    `Reconciliation: realised ${SG$(D.rec.realised)} + open ${SG$(D.rec.open)} + failed-buy fees ${SG$(D.rec.bb)} + interest ${SG$(D.rec.y)} + rounding $0.00 = ${SG$(D.rec.total)}; unexplained ${SG$(D.rec.unexplained)}`,
    `Money features on: ${on.length ? on.join(", ") : "none"}. Market seed: ${CLK.seed}. Checks: ${invOk} passed, ${WARN.inv} failures.`, "DESKS:"];
  for (const d of D.desks) L.push(`- ${d.name}: ${SG$(d.pnl)} | ${d.n} trades | ${d.wr} win | expectancy ${SG$(Math.round(d.exp))}`);
  L.push("DAILY:"); for (const x of D.rows) L.push(`- Day ${x.day} (${x.date}): ${x.n} trades, made ${SG$(x.made)}, lost ${SG$(x.lost)}, net ${SG$(x.net)}, balance ${x.eod != null ? D$(x.eod) : "(day not finished: " + D$(x.now) + " now)"}${x.notes ? " — " + x.notes : ""}`);
  L.push("NOTE: " + DEMO_NOTE); return L.join("\n");
}
function openReport(auto) {
  applyNext(); const el = $h("h_report"); if (!el || !SNAP) return; const D = reportData(), sn = D.sn, aw = D.t.wn ? D.t.w / D.t.wn : 0, al = D.t.ln ? D.t.l / D.t.ln : 0, sd = (D.simTo - D.simFrom) / 86400, m = D.m;
  const anomalies = DIAG.filter(x => x.kind === "invariant" || x.kind === "error").slice(0, 20), tc = c => c ? `<b>${escH(c.sym)}</b> · ${escH(c.desk)} · price ${pxF(c.entry)} → ${pxF(c.exit)} · <b class="${c.pnl >= 0 ? "g" : "r"}">${sg(c.pnl)}</b> · ${escH(reasonN(c.reason))} · held ${fmtDur(c.t - c.opened)}` : "–";
  const rec = D.rec, woRate = D.n ? D.t.woN / D.n * 1000 : 0, on = Object.entries(MONEY).filter(([, v]) => v === true).map(([k]) => MONEYN[k] || k);
  const exRows = Object.entries(D.ex.g).sort((a, b) => b[1].n - a[1].n).map(([k, e]) => `<tr><td>${escH(reasonN(k))}</td><td>${e.n}</td><td>${wrS(e.w, e.n - e.w)}</td><td>${SG$(Math.round(e.pnl / e.n))}</td><td class="${e.pnl >= 0 ? "g" : "r"}">${SG$(e.pnl)}</td><td class="sub">${Object.entries(D.ex.per[k] || {}).map(([d, x]) => `${escH(DN[d - 1])} ${x.n} · ${SG$(x.pnl)}`).join("; ")}</td></tr>`).join("");
  const memG = {}; for (const r of Object.values(R)) for (const [k, x] of Object.entries(r.memG || {})) { const y = memG[k] || (memG[k] = { n: 0, w: 0, pnl: 0 }); y.n += x.n; y.w += x.w; y.pnl += Math.round(x.pnl * 100) }
  const memLine = MONEY.memory || (memG.liked || memG.disliked) ? ["liked", "disliked", "none"].map(k => { const x = memG[k] || { n: 0, w: 0, pnl: 0 }; return `${k === "none" ? "not influenced" : "memory " + k}: ${x.n} trades, ${wrS(x.w, x.n - x.w)} won, ${x.n ? SG$(Math.round(x.pnl / x.n)) : "–"}/trade` }).join(" · ") + (memG.liked && memG.none && memG.liked.n && memG.none.n && memG.liked.pnl / memG.liked.n < memG.none.pnl / memG.none.n ? " — memory-liked trades did WORSE than uninfluenced ones: keep it off." : "") : "off";
  const flat = Object.values(SNAP.desks).reduce((a, x) => a + x.flat, 0), ftc = Object.entries(R).map(([d, r]) => [DN[d - 1], (r.money || {}).ftcN || 0]).filter(x => x[1]);
  const tour = D.tour;
  el.innerHTML = `<div class="rep"><div class="row"><h3>📋 Run report</h3><button class="chip" id="rp_close">Close</button></div>${auto ? `<div class="donebar">${rec.unexplained === 0 ? "✅ Test complete. Everything is paused. The report reconciles to the cent." : "⚠️ Target reached, but the report does not reconcile (see below)."}</div>` : ""}<div class="sub">${DEMO_NOTE} Snapshot #${sn.id}, ${simLabel(sn.g)}. Money features on: ${on.length ? escH(on.join(", ")) : "none"}. Market seed ${CLK.seed}.</div>
    <h4>1 · Result</h4><div class="kv"><div><span>Final balance</span><b>${D$(D.final)}</b></div><div><span>Profit</span><b class="${D.profit >= 0 ? "g" : "r"}">${SG$(D.profit)} (${D.pct >= 0 ? "+" : ""}${D.pct.toFixed(2)}%)</b></div><div><span>Start balance</span><b>${D$(D.start)}</b></div></div>
    <h4>2 · Period</h4><div class="sub">${simLabel(D.simFrom)} (${dateLabel(D.simFrom)}) → ${simLabel(D.simTo)} (${endDate(D.simTo)}) · ${sd.toFixed(2)} simulated days · ${fmtReal(CLK.realRun)} real · ${D.sel.toLocaleString()}x selected / ~${Math.round(D.effRun).toLocaleString()}x actual (whole run)</div>
    <h4>3 · Trades and the money dashboard</h4><div class="kv"><div><span>Trades</span><b>${D.n.toLocaleString()}</b></div><div><span>Win rate</span><b>${wrS(D.t.wn, D.t.ln)}</b></div><div><span>Expectancy</span><b class="${m.exp >= 0 ? "g" : "r"}">${SG$(Math.round(m.exp))}/trade</b></div><div><span>Wins</span><b class="g">${D.t.wn} · ${SG$(D.t.w)}</b></div><div><span>Losses</span><b class="r">${D.t.ln} · ${SG$(D.t.l)}</b></div><div><span>Avg win / loss</span><b>${SG$(Math.round(aw))} / ${SG$(Math.round(al))}</b></div><div><span>Profit factor</span><b>${m.pf == null ? "–" : m.pf.toFixed(2)}</b></div><div><span>Max drawdown</span><b>${m.dd ? "−" + D$(m.dd) + " (" + m.ddPct.toFixed(2) + "%)" : "$0.00"}</b><span>${m.dd ? simLabel(m.ddFrom) + " → " + simLabel(m.ddTo) : ""}</span></div><div><span>Fees burned / gross profit</span><b>${m.feesPct.toFixed(1)}%</b></div><div><span>Write-off loss / gross losses</span><b>${m.woPct.toFixed(1)}%</b></div><div><span>Best / worst day</span><b>${m.best ? SG$(m.best.net) + " / " + SG$(m.worst.net) : "–"}</b><span>${m.best ? "Day " + m.best.day + " / Day " + m.worst.day : ""}</span></div><div><span>Open now</span><b>${D.t.openN} · ${SG$(D.t.openPl)}</b></div></div>
    <h4>4 · Reconciliation</h4><table class="ftbl recon"><tbody><tr><td>Realised: finished trades (= sum of daily nets)</td><td>${SG$(rec.realised)}</td></tr><tr><td>Open positions profit / loss</td><td>${SG$(rec.open)}</td></tr><tr><td>Fees burned on failed buys</td><td>${SG$(rec.bb)}</td></tr><tr><td>Cash interest</td><td>${SG$(rec.y)}</td></tr><tr><td>Rounding</td><td>$0.00</td></tr><tr><td><b>Total profit</b></td><td><b>${SG$(rec.total)}</b></td></tr><tr><td>Unexplained</td><td class="${rec.unexplained ? "r" : ""}"><b>${SG$(rec.unexplained)}</b></td></tr></tbody></table><div class="sub">Fees burned on failed sells (${D$(rec.bs)}) are inside the trades' results. Money is kept in whole cents everywhere, so rounding is always $0.00. Report reconciles: <b>${rec.unexplained === 0 ? "YES" : "NO"}</b>.</div>
    <h4>5 · Desks</h4><div class="tblw"><table class="ftbl"><thead><tr><th>Desk</th><th>Profit</th><th>Balance</th><th>Trades</th><th>Win rate</th><th>Expectancy</th><th>Best</th><th>Worst</th></tr></thead><tbody>${D.desks.map(d => `<tr><td>${escH(d.name)}</td><td class="${d.pnl >= 0 ? "g" : "r"}">${SG$(d.pnl)}</td><td>${D$(d.eq)}</td><td>${d.n}</td><td>${d.wr}</td><td>${SG$(Math.round(d.exp))}</td><td>${d.best ? sg(d.best.pnl) + " " + escH(d.best.sym) : "–"}</td><td>${d.worst ? sg(d.worst.pnl) + " " + escH(d.worst.sym) : "–"}</td></tr>`).join("")}</tbody></table></div>
    <h4>6 · Results by exit reason</h4><div class="tblw"><table class="ftbl"><thead><tr><th>Exit</th><th>Trades</th><th>Won</th><th>Avg</th><th>Total</th><th>By desk</th></tr></thead><tbody>${exRows}</tbody></table></div>
    <h4>7 · Failed, retried and written off</h4><div class="sub">Failed buys ${D.z.buyFail} · failed sells ${D.z.sellRev + D.z.sellDrop + D.z.sellOther} (${D.z.sellRev} reverted, ${D.z.sellDrop} dropped, ${D.z.sellOther} other) · retries that worked ${D.z.retryOk} · fees burned ${D$(D.t.bb + D.t.bs)} · written off ${D.t.woN} (${woRate.toFixed(1)} per 1,000 trades), write-off loss ${SG$(D.t.wo)}</div>${D.aud.filter(a => /writeoff/.test(a.reason)).map(a => `<div class="audit"><b>${escH(a.sym)}</b> · ${escH(a.desk)} · bought ${D$(Math.round(a.in * 100))} at ${pxF(a.entry)} (${simLabel(a.opened)}) · ${a.attempts.length} failed sells: ${a.attempts.map(x => `${hhmm(x.t)} ${x.type} (${x.step})`).join(", ")} · fees burned trying ${D$(Math.round(a.burned * 100))} · rule: ${escH(a.rule)} · final loss <b class="r">${sg(a.loss)}</b></div>`).join("") || '<div class="sub">No coin was written off.</div>'}
    <h4>8 · Day by day</h4><div class="tblw"><table class="ftbl"><thead><tr><th>Day</th><th>Trades</th><th>W / L</th><th>Made</th><th>Lost</th><th>Net (closed)</th><th>Open P/L change</th><th>Failed-buy fees</th><th>Interest</th><th>End balance</th><th>Notes</th></tr></thead><tbody>${D.rows.map(x => `<tr><td>${x.day} <span class="sub">${x.date}</span></td><td>${x.n}</td><td>${x.w} / ${x.l}</td><td class="g">${SG$(x.made)}</td><td class="r">${SG$(x.lost)}</td><td class="${x.net >= 0 ? "g" : "r"}">${SG$(x.net)}</td><td>${x.eod != null ? SG$(x.dOpen) : "–"}</td><td>${x.eod != null ? SG$(x.dBb) : "–"}</td><td>${x.eod != null ? SG$(x.dY) : "–"}</td><td>${x.eod != null ? D$(x.eod) : "(now " + D$(x.now) + ")"}</td><td class="sub" style="white-space:normal">${escH(x.notes)}</td></tr>`).join("")}</tbody><tfoot><tr><td>All</td><td>${D.rows.reduce((a, x) => a + x.n, 0)}</td><td>${D.rows.reduce((a, x) => a + x.w, 0)} / ${D.rows.reduce((a, x) => a + x.l, 0)}</td><td class="g">${SG$(D.rows.reduce((a, x) => a + x.made, 0))}</td><td class="r">${SG$(D.rows.reduce((a, x) => a + x.lost, 0))}</td><td>${SG$(D.rows.reduce((a, x) => a + x.net, 0))}</td><td colspan="5"></td></tr></tfoot></table></div><div class="sub">End balance = previous end + net of trades closed that day + change in open positions' profit/loss − fees on failed buys + interest. Each row is checked to the cent.</div>
    <h4>9 · Money features</h4><div class="sub">${MONEY.smart || ALLOCLOG.length ? `<div>Smart allocation: flat sizing would have made <b>≈${SG$(flat)}</b> on the finished trades vs <b>${SG$(rec.realised)}</b> with the sizes used (estimate: each trade's result scaled back to normal size; network fees do not scale, so this is approximate). ${ALLOCLOG.slice(-14).map(a => `<br>${simLabel(a.g)}: ${escH(a.msg)}`).join("")}</div>` : "<div>Smart allocation: off.</div>"}
      <div>Mode tournament: ${Object.keys(MODELOG).length ? escH(tour.verdict) : "off."}</div>${Object.keys(MODELOG).length ? `<div class="tblw"><table class="ftbl"><thead><tr><th>Day</th><th>Desk</th><th>Mode</th><th>Trades</th><th>Won</th><th>Expectancy</th><th>Profit</th></tr></thead><tbody>${tour.rows.map(r => `<tr><td>${r.n}</td><td>${escH(r.desk)}</td><td>${escH(MODEN[r.mode] || r.mode)}</td><td>${r.t}</td><td>${wrS(r.w, r.t - r.w)}</td><td>${r.t ? SG$(Math.round(r.pnl / r.t)) : "–"}</td><td>${SG$(r.pnl)}</td></tr>`).join("")}</tbody></table></div><div class="sub">Note: each desk trades a different chain, so a mode's result is mixed with its desk's market.</div>` : ""}
      <div>Failed-sell cost control: ${MONEY.ftc ? (ftc.length ? ftc.map(x => `${escH(x[0])} ${x[1]} time${x[1] > 1 ? "s" : ""} (30 min each)`).join(", ") : "never triggered") + ". Fees burned during vs outside those hours are not measured separately." : "off."}</div>
      <div>Bank the day: ${MONEY.bank ? (Object.values(R).reduce((a, r) => a + ((r.money || {}).bankLog || []).length, 0) + " triggers (each listed in the day table with the profit at trigger time).") : "off."}</div>
      <div>Coin pattern memory: ${escH(memLine)}</div>
      <div>Pre-buy sellability check: ${MONEY.prebuy ? Object.values(R).reduce((a, r) => a + (r.preSkip || 0), 0) + " coins skipped, " + Object.values(R).reduce((a, r) => a + (r.preHalf || 0), 0) + " bought at half size." : "off."}</div>
      <div>Cold-desk size steps: ${MONEY.cold ? Object.entries(R).map(([d, r]) => `${escH(DN[d - 1])} ${((r.money || {}).coldLog || []).length} step changes, now ${escH(((r.money || {}).step || {}).lab || "full size")}`).join(" · ") : "off."}</div></div>
    <h4>10 · Best and worst coin</h4><div class="sub">Best: ${tc(D.best)}</div><div class="sub">Worst: ${tc(D.worst)}</div>
    <h4>11 · Settings changes during the run</h4><div class="sub">${SETLOG.length ? SETLOG.slice().reverse().map(l => `${simLabel(l.g)} · ${escH(l.name)}${l.a ? " " + escH(l.a) + " →" : ""} ${escH(l.b)}`).join("<br>") : "None."}</div>
    <h4>12 · Anomalies detected</h4><div class="sub">${WARN.inv ? `<b class="r">${WARN.inv} check failure${WARN.inv > 1 ? "s" : ""}</b> (in ${invBad} snapshot${invBad > 1 ? "s" : ""}; ${invOk.toLocaleString()} passed):` : `All ${invOk.toLocaleString()} snapshots passed every check.`}${anomalies.map(a => `<div>• ${escH(a.msg)} (${simLabel(a.g)})</div>`).join("")}${restoreCheck ? `<div>• Last restore (save #${restoreCheck.sid}): ${restoreCheck.ok ? "verified" : "did NOT match: " + escH(restoreCheck.diff.join("; "))}</div>` : ""}</div>
    <h4>Actions</h4><div class="chips"><button class="chip" id="rp_json">Export JSON</button><button class="chip" id="rp_txt">Export summary (.txt)</button><button class="chip" id="rp_copy">Copy summary</button><button class="chip" id="rp_resume">Resume</button><button class="chip" id="rp_new">Start over</button></div><pre class="sumtxt" id="rp_pre" hidden></pre></div>`;
  el.hidden = false; document.body.classList.add("modal-open");
  $h("rp_close").onclick = () => { el.hidden = true; document.body.classList.remove("modal-open") };
  $h("rp_json").onclick = () => exportRun(); $h("rp_txt").onclick = () => download("paper-trader-summary.txt", summaryText(), "text/plain");
  $h("rp_copy").onclick = () => copyOut(summaryText());
  $h("rp_resume").onclick = () => { if (CLK.done) { toast("Target reached: change or turn off 'Run until' first."); return } $h("rp_close").click(); setState("running") };
  let arm = 0; $h("rp_new").onclick = e => { if (!arm) { arm = 1; e.target.textContent = "Tap again: delete this run"; setTimeout(() => { arm = 0; e.target.textContent = "Start over" }, 4000); return } startOver(capPick) };
}
async function download(name, text, type) {   // web link: the viewer's own save prompt (plain downloads are blocked there); laptop version: a normal download
  let dl = null; try { if (typeof claude !== "undefined" && claude && typeof claude.use === "function") dl = await claude.use("downloads") } catch (e) { dl = null }
  if (dl) { try { await dl.save({ filename: name, data: new Blob([text], { type }) }); toast("Saved " + name); setLog("Export", "", name); return } catch (e) { const c = e && e.code; if (c === "declined") { toast("Not saved"); return } if (c === "rate_limited") { toast("A save prompt is already open"); return } if (c !== "unavailable" && c !== "not_granted" && c !== "capability_disabled" && c !== "capability_removed") { toast("Could not save (" + (c || "error") + "): use Copy"); diag("storage", "export: " + (c || e)); return } } }
  try { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 2000); toast("Downloading " + name + " (if nothing happens, use Copy summary)") } catch (e) { copyOut(text) } }
function copyOut(text) { const pre = $h("rp_pre"); const done = ok => toast(ok ? "Copied" : "Could not copy: select the text below"); try { navigator.clipboard.writeText(text).then(() => done(true), () => { if (pre) { pre.hidden = false; pre.textContent = text } done(false) }) } catch (e) { if (pre) { pre.hidden = false; pre.textContent = text } done(false) } }
async function exportRun() {
  if (isLive()) { toast("Export is for demo runs."); return }
  const was = CLK.state; if (was === "running" || was === "nonew") setState("paused", "export");
  await new Promise(r => setTimeout(r, 1200)); let run = null; try { run = JSON.parse(localStorage.getItem(RUNK) || "null") } catch (e) {}
  const desks = {}; for (let i = 1; i <= NDESK; i++) { try { desks[i] = await IDB.get("desk" + i + (run && run.sid ? "#" + run.sid : "")) } catch (e) {} }
  const json = JSON.stringify({ app: "paper-trader", kind: "demo-run", version: 2, exportedAt: new Date().toISOString(), note: DEMO_NOTE, summary: summaryText(), settingsLog: SETLOG, money: MONEY, run, desks });
  download("paper-trader-run.json", json, "application/json"); setLog("Export", "", `save #${run && run.sid} at ${simLabel(CLK.g)} (${Math.round(json.length / 1024)} KB)`);
}
async function importRun(file) {
  try { const o = JSON.parse(await file.text()); if (!o || o.app !== "paper-trader" || !o.run || !o.desks) throw new Error("not a Paper Trader run file");
    leaving = true; CLK.state = "paused"; await new Promise(r => setTimeout(r, 200));
    if (o.run.nd && o.run.nd !== NDESK) { try { localStorage.setItem("pt_host_n", String(o.run.nd)) } catch (e) {} }
    await IDB.clear(); for (const [k, v] of Object.entries(o.desks)) if (v) await IDB.put("desk" + k + (o.run.sid ? "#" + o.run.sid : ""), v);
    localStorage.setItem(RUNK, JSON.stringify(o.run)); toast("Imported: reloading…"); setTimeout(() => location.reload(), 600)
  } catch (e) { leaving = false; toast("Import failed: " + e.message); diag("storage", "import failed: " + e.message) }
}

/* ---- Diagnostics (Full view) ---- */
const SPDH = []; setInterval(() => { if (CLK.state === "running" || CLK.state === "nonew") { SPDH.unshift({ t: Date.now(), sel: CLK.speed, eff: Math.round(SPEEDV.val), id: SPEEDV.id, fps: fpsNow, lim: limiting() }); if (SPDH.length > 30) SPDH.length = 30 } }, 10000);
function drawDiag() {
  const el = $h("dg_body"), badge = $h("dg_badge"); if (badge) { badge.textContent = WARN.inv ? `Invariant failures: ${WARN.inv}` : `${invOk.toLocaleString()} checks passed, 0 failed`; badge.className = "dgbadge " + (WARN.inv ? "bad" : "ok") }
  if (!el || !$h("h_diag").open) return;
  const inv = DIAG.filter(x => x.kind === "invariant").slice(0, 25), st = DIAG.filter(x => x.kind === "storage" || x.kind === "day").slice(0, 14), er = DIAG.filter(x => x.kind === "error").slice(0, 10), rec = SNAP ? reconcile(SNAP) : null;
  el.innerHTML = `<h4>Checks on every snapshot</h4><div class="sub"><b class="${WARN.inv ? "r" : "g"}">Invariant failures: ${WARN.inv}</b> · snapshots passed: ${invOk.toLocaleString()} · snapshots with a failure: ${invBad}. Checked every time: one clock; desk balances, profits and fees add up to the totals in cents; global trades today = sum of desks and only moves by trades closed (or resets at midnight); coins bought = won + lost + open; profit = won + lost + open − failed-buy fees + interest; report reconciles${rec ? ` (now: ${rec.unexplained === 0 ? "YES" : "NO, unexplained " + SG$(rec.unexplained)})` : ""}; daily table has every day and each end balance follows from the day before; trade counts never go down; bottom bar and main panel show the same snapshot; every speed display shows the same measurement.${restoreCheck ? ` Last restore: ${restoreCheck.ok ? "verified" : "NOT matching"}.` : ""}</div>${inv.map(x => `<div class="dgx">${clock0(x.t)} · ${simLabel(x.g)} · ${escH(x.msg)}</div>`).join("") || '<div class="dgx">No failures.</div>'}
    <h4>Settings changes</h4><div id="dg_set"></div>
    <h4>Speed (every 10 s while running)</h4>${SPDH.map(x => `<div class="dgx">${clock0(x.t)} · ${x.sel.toLocaleString()}x selected · ~${x.eff.toLocaleString()}x actual (measurement #${x.id}) · ${x.fps} fps${x.lim ? " · " + escH(x.lim) : ""}</div>`).join("") || '<div class="dgx">Not running yet.</div>'}
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
buildRun(); buildMoney(); drawRestore(); if (restoreWait) { CLK.state = "paused"; drawRun() }
if (tabBlocked) showTabBlock("blocked");
document.body.classList.toggle("fullauto", FA);
$h("h_diag").addEventListener("toggle", drawDiag);
draw(); setInterval(() => { if (cur === 0) { applyNext(); draw(); mark() } }, 1000); setInterval(() => { if (cur !== 0) drawRun(); drawDiag() }, 1000);
window.addEventListener("pagehide", () => { if (!leaving && !readOnly) doSave("page hidden") });
document.addEventListener("visibilitychange", () => { if (document.hidden && !leaving && !readOnly && !restoreWait && !isLive()) doSave("page hidden") });   // the last complete save is what a reload restores
