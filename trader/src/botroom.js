/* Bot room: a live view of the bots in every desk talking to each other.
   Every message is a real decision a desk's engine just made (core.js talk()). Routine messages are sampled so they can be read;
   the counters show all the work. Animations run only while the room is on screen. */
const BOT = { scout: ["🔭", "Scanner", "coins checked"], filter: ["🧹", "Scam filter", "fakes skipped"], agents: ["🤖", "Agents", "coins judged"], security: ["🛡️", "Security", "safety checks"],
  committee: ["🗳️", "Committee", "votes"], risk: ["⚖️", "Risk manager", "decisions"], trader: ["⚡", "Trader", "orders"], watcher: ["👀", "Watcher", "alerts"],
  launch: ["🚀", "Launch Scout"], trend: ["🧭", "Trend Follower"], rider: ["🏄", "Momentum Rider"], dip: ["🎯", "Pullback Buyer"], breakout: ["📈", "Volume Breakout"], quality: ["💎", "Quality Buyers"],
  whale: ["🐋", "Whale Flow"], gem: ["💠", "Gem Hunter"], reversal: ["🔄", "Dip Reversal"], range: ["📦", "Range Breaker"] };
const CORE_BOTS = ["scout", "filter", "agents", "security", "committee", "risk", "trader", "watcher"];
const AG_IDS = ["launch", "trend", "rider", "dip", "breakout", "quality", "whale", "gem", "reversal", "range"];
const KCOL = { buy: "var(--g)", win: "var(--g)", loss: "var(--r)", no: "var(--mut)", warn: "var(--y)", ok: "var(--accent)", info: "var(--accent2)" };
const brQ = [], brLog = [], brLast = {}, brAgents = new Set(), brRate = [];
let brMiniT = 0, brFilter = "all", brDesk = 0, brBot = "", brLayoutKey = "", brPos = {}, brShown = 0;
const botName = id => (BOT[id] || ["🤖", id])[1], botIcon = id => (BOT[id] || ["🤖"])[0];
const isAgent = id => AG_IDS.includes(id);
const deskTag = d => { const a = (AREAS[(d - 1) % 5] || ""); return `<span class="cb cb-${a.split(" ")[0].toLowerCase()}">${["SOL", "BASE", "BSC", "ARB", "ALL"][(d - 1) % 5]}${d > 5 ? " " + (Math.floor((d - 1) / 5) + 1) : ""}</span>` };
const isTrade = m => m.k === "buy" || m.k === "win" || m.k === "loss" || m.a === "watcher" || (m.a === "trader" && m.k === "warn");

function brIn(m) {   // a desk report arrived
  if (m.ags) for (const [id] of m.ags) if (!brAgents.has(id) && BOT[id]) { brAgents.add(id); brLayoutKey = "" }
  if (!m.talk || !m.talk.length) return;
  for (const x of m.talk) brQ.push(Object.assign({ d: m.desk, rt: Date.now() }, x));
  // too many waiting: keep a fair mix of trades and the checks behind them
  if (brQ.length > 36) { const keep = brQ.filter(isTrade).slice(-14), rest = brQ.filter(x => !isTrade(x)).slice(-(36 - keep.length)); brQ.length = 0; brQ.push(...[...keep, ...rest].sort((a, b) => a.rt - b.rt || a.i - b.i)) }
}
// work counters: sum of every bot's real work over all desks (the engine counts sampled-out messages too)
function brCounts() { const c = {}; let checks = 0; for (const r of Object.values(R)) { checks += r.checks || 0; const tc = r.tc || {}; for (const k in tc) { const id = isAgent(k) ? "agents" : k; c[id] = (c[id] || 0) + tc[k] } } c.scout = checks; return c }
function brTotal() { let n = 0; for (const r of Object.values(R)) for (const k in (r.tc || {})) n += r.tc[k]; return n }
setInterval(() => { brRate.push([Date.now(), brTotal()]); while (brRate.length > 61) brRate.shift() }, 1000);
const brPerMin = () => { if (brRate.length < 2) return 0; const a = brRate[0], b = brRate[brRate.length - 1]; return b[0] > a[0] ? Math.max(0, (b[1] - a[1]) / (b[0] - a[0]) * 60000) : 0 };

// layout: bots on a ring in the order a coin travels through them
function brLayout() {
  const ags = AG_IDS.filter(id => brAgents.has(id)), order = ["scout", "filter", "agents", ...ags, "security", "committee", "risk", "trader", "watcher"], key = order.join(",");
  if (key === brLayoutKey) return; brLayoutKey = key; brPos = {};
  const n = order.length, cx = 180, cy = 172, rx = 146, ry = 134;
  order.forEach((id, i) => { const a = -Math.PI / 2 - Math.PI * 0.62 + i / n * Math.PI * 2; brPos[id] = [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] });
  const svg = $h("br_svg"); if (!svg) return;
  const line = (a, b) => brPos[a] && brPos[b] ? `<line x1="${brPos[a][0].toFixed(1)}" y1="${brPos[a][1].toFixed(1)}" x2="${brPos[b][0].toFixed(1)}" y2="${brPos[b][1].toFixed(1)}"/>` : "";
  const edges = [];   // the ring itself shows the order a coin travels in; messages fly across it
  svg.innerHTML = `<defs><radialGradient id="br_core" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="var(--accent)" stop-opacity=".35"/><stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/></radialGradient></defs>
    <circle cx="${cx}" cy="${cy}" r="92" fill="url(#br_core)" class="br-coreglow"/>
    <g class="br-edges"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>${edges.map(e => line(...e)).join("")}</g><g id="br_zaps"></g>
    <text x="${cx}" y="${cy - 6}" text-anchor="middle" class="br-big" id="br_rate">–</text><text x="${cx}" y="${cy + 14}" text-anchor="middle" class="br-cap">bot actions a minute</text>
    <text x="${cx}" y="${cy + 32}" text-anchor="middle" class="br-cap2" id="br_trades"></text>
    ${order.map(id => { const [x, y] = brPos[id], ag = isAgent(id); return `<g class="br-node${ag ? " ag" : ""}" id="brn_${id}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})" data-b="${id}"><circle class="br-ring" r="${ag ? 15 : 19}"/><circle class="br-disc" r="${ag ? 15 : 19}"/><text class="br-ico" y="${ag ? 5 : 6}" text-anchor="middle">${botIcon(id)}</text><text class="br-lab" y="${ag ? 27 : 31}" text-anchor="middle">${escH(ag ? botName(id).split(" ")[0] : botName(id))}</text></g>` }).join("")}
    <g id="br_dots"></g>`;
}
function brZap(m) {   // a message flies from one bot to the other
  const A = brPos[m.a] || brPos[isAgent(m.a) ? "agents" : ""], B = brPos[m.b] || brPos[isAgent(m.b) ? "agents" : ""], g = $h("br_dots"), z = $h("br_zaps"); if (!A || !B || !g || A === B) return;
  const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, qx = mx + (180 - mx) * 0.35, qy = my + (172 - my) * 0.35, col = KCOL[m.k] || "var(--accent)", ns = "http://www.w3.org/2000/svg";
  const path = document.createElementNS(ns, "path"); path.setAttribute("d", `M${A[0]},${A[1]} Q${qx},${qy} ${B[0]},${B[1]}`); path.setAttribute("class", "br-zap"); path.style.stroke = col; z.appendChild(path); setTimeout(() => path.remove(), 1100);
  const halo = document.createElementNS(ns, "circle"), dot = document.createElementNS(ns, "circle"); halo.setAttribute("r", "9"); halo.setAttribute("class", "br-halo"); dot.setAttribute("r", "4.2"); halo.style.fill = dot.style.fill = col; g.append(halo, dot);
  const nodeA = $h("brn_" + (brPos[m.a] ? m.a : "agents")), nodeB = $h("brn_" + (brPos[m.b] ? m.b : "agents"));
  if (nodeA) { nodeA.classList.remove("talk"); nodeA.getBoundingClientRect(); nodeA.classList.add("talk"); setTimeout(() => nodeA.classList.remove("talk"), 700) }
  const t0 = performance.now(), dur = 760;
  (function step(now) { const u = Math.min(1, (now - t0) / dur), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, x = (1 - e) * (1 - e) * A[0] + 2 * (1 - e) * e * qx + e * e * B[0], y = (1 - e) * (1 - e) * A[1] + 2 * (1 - e) * e * qy + e * e * B[1];
    dot.setAttribute("cx", x.toFixed(1)); dot.setAttribute("cy", y.toFixed(1)); halo.setAttribute("cx", x.toFixed(1)); halo.setAttribute("cy", y.toFixed(1));
    if (u < 1) requestAnimationFrame(step); else { dot.remove(); halo.remove(); if (nodeB) { nodeB.classList.add("got"); setTimeout(() => nodeB.classList.remove("got"), 500) } } })(t0);
}
const brAgo = rt => { const s = Math.round((Date.now() - rt) / 1000); return s < 3 ? "now" : s < 60 ? s + "s" : Math.round(s / 60) + "m" };
const brMatch = m => (!brDesk || m.d === brDesk) && (!brBot || m.a === brBot || (brBot === "agents" && isAgent(m.a))) && (brFilter === "all" || (brFilter === "trades" ? isTrade(m) : !isTrade(m)));
function brRow(m, fresh) {
  const to = m.b ? `<span class="bto">→ ${escH(isAgent(m.b) ? botName(m.b) : botName(m.b))}</span>` : "";
  return `<div class="bm k-${m.k}${fresh ? " fresh" : ""}"><span class="bav">${botIcon(m.a)}</span><div class="bbody"><div class="bhead"><b>${escH(botName(m.a))}</b>${to}${deskTag(m.d)}<span class="btime" data-rt="${m.rt}">${brAgo(m.rt)}</span></div><div class="btext">${m.s ? `<b class="bsym">${escH(m.s)}</b> ` : ""}${escH(m.x)}</div></div></div>`;
}
function brDrawChat() { const el = $h("br_chat"); if (!el) return; const L = brLog.filter(brMatch).slice(0, 40); el.innerHTML = L.length ? L.map(m => brRow(m, false)).join("") : `<div class="sub" style="padding:14px 4px">Waiting for the bots… (messages appear as soon as the desks start scanning)</div>` }
function brShow(m) {   // one message goes on screen
  brLog.unshift(m); if (brLog.length > 160) brLog.length = 160; brLast[isAgent(m.a) ? "agents" : m.a] = m; brShown++;
  const vis = cur === -1 && !document.hidden;
  if (vis) { brZap(m); const el = $h("br_chat"); if (el && brMatch(m) && !touchBusy()) { if (el.firstElementChild && el.firstElementChild.classList.contains("sub")) el.innerHTML = ""; el.insertAdjacentHTML("afterbegin", brRow(m, true)); while (el.children.length > 40) el.lastElementChild.remove() } }
  const mini = $h("br_mini_list"), rn = Date.now();   // Master preview: one new line at a time, slow enough to read
  if (mini && cur === 0 && rn - brMiniT > 1300 && !touchBusy()) { brMiniT = rn; if (mini.firstElementChild && mini.firstElementChild.classList.contains("sub")) mini.innerHTML = "";
    mini.insertAdjacentHTML("afterbegin", `<div class="bmini k-${m.k}"><span>${botIcon(m.a)}</span><span class="bmt"><b>${escH(botName(m.a))}</b>${m.s ? " · " + escH(m.s) : ""}: ${escH(m.x)}</span></div>`); while (mini.children.length > 3) mini.lastElementChild.remove() }
}
let brTouch = 0; document.addEventListener("pointerdown", () => brTouch = Date.now(), true); const touchBusy = () => Date.now() - brTouch < 600;
(function drip() {   // spread each second's messages out so they can be read and the dots do not pile up
  const m = brQ.shift(); if (m) brShow(m);
  setTimeout(drip, Math.max(180, Math.min(900, 1000 / Math.max(1, brQ.length))));
})();
function brDrawBots() {
  const el = $h("br_bots"); if (!el) return; const c = brCounts();
  if (!el.firstElementChild) el.innerHTML = CORE_BOTS.map(id => `<button class="bcard" data-b="${id}"><span class="bci">${botIcon(id)}</span><b>${botName(id)}</b><span class="bcn num" id="bcn_${id}">0</span><span class="bcl">${BOT[id][2]}</span><span class="bcx" id="bcx_${id}">…</span></button>`).join("");
  for (const id of CORE_BOTS) { const n = $h("bcn_" + id), x = $h("bcx_" + id), m = brLast[id]; if (n) n.textContent = (c[id] || 0).toLocaleString(); if (x) x.textContent = m ? (m.s ? m.s + ": " : "") + m.x : "…"; }
  el.querySelectorAll(".bcard").forEach(b => b.classList.toggle("on", b.dataset.b === brBot));
}
function brDraw() {
  brLayout(); const ds = Object.values(R), open = ds.reduce((a, r) => a + (r.open || 0), 0), bots = 8 + brAgents.size - 1;
  const rate = $h("br_rate"); if (rate) rate.textContent = Math.round(brPerMin()).toLocaleString();
  const sp = ds.filter(r => !r.live).map(r => r.speed || 1), fast = sp.length ? Math.max(...sp) : 1, tr = $h("br_trades"); if (tr) tr.textContent = `${open} coin${open === 1 ? "" : "s"} watched now${fast > 1 ? " · demo " + fast.toLocaleString() + "× speed" : ""}`;
  const sub = $h("br_sub"); if (sub) sub.textContent = ds.length ? `${ds.length} desk${ds.length > 1 ? "s" : ""} · ${bots} kinds of bots in each · ${(brCounts().scout || 0).toLocaleString()} coins checked` : "Starting the desks…";
  brDrawBots(); document.querySelectorAll("#br_chat .btime").forEach(t => t.textContent = brAgo(+t.dataset.rt));
}
function brBuild() {
  const f = $h("br_f"); if (!f) return;
  f.innerHTML = [["all", "Everything"], ["trades", "Buys & sells"], ["checks", "Checks & votes"]].map(x => `<button class="chip${brFilter === x[0] ? " on" : ""}" data-f="${x[0]}">${x[1]}</button>`).join("");
  const dd = $h("br_d"); if (dd) dd.innerHTML = `<button class="chip on" data-d="0">All desks</button>` + DN.map((n, i) => `<button class="chip" data-d="${i + 1}">${escH(n)}</button>`).join("");
  f.onclick = e => { const b = e.target.closest("button"); if (!b) return; brFilter = b.dataset.f; f.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); brDrawChat() };
  if (dd) dd.onclick = e => { const b = e.target.closest("button"); if (!b) return; brDesk = +b.dataset.d; dd.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); brDrawChat() };
  $h("br_bots").onclick = e => { const b = e.target.closest(".bcard"); if (!b) return; brBot = brBot === b.dataset.b ? "" : b.dataset.b; brDrawBots(); brDrawChat(); const h = $h("br_bot_note"); if (h) h.textContent = brBot ? `Showing only ${botName(brBot)}. Tap it again to see every bot.` : "" };
  const mo = $h("br_open"); if (mo) mo.onclick = () => show(-1);
  brLayout(); brDrawChat();
}
brBuild(); setInterval(() => { if (cur === -1 && !document.hidden) brDraw() }, 1000);
