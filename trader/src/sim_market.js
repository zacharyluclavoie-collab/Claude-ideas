/* ============================ realistic synthetic market (NOT real data) ============================
 * Every token owns a constant-product pool (quote reserve q in USD, token reserve b). Organic flow, whales,
 * insiders, dev actions and OUR OWN trades all move that pool, so price impact, liquidity and price are consistent.
 * Hype dynamics, not hand-drawn price paths, create pumps and fades. Most launches fail. Hidden ground truth
 * (rug, honeypot, ...) is only used for the demo's reveal labels and for the security-feed model.
 * Fixed assumptions are listed in MODEL_NOTES and shown in the app.
 */
// demo coin names: built from the token number only (no random draws, so the market itself is unchanged)
const _NA = ["PEPE", "DOGE", "WIF", "BONK", "MOON", "FROG", "CAT", "SHIB", "NEKO", "BASED", "CHAD", "GIGA", "TURBO", "MOG", "POPCAT", "SLERF", "WOJAK", "BRETT", "TOSHI", "MIGGLES", "PONKE", "BOME", "MEW", "GOAT", "PNUT", "HAMSTER", "BEAR", "BULL", "LAMBO", "ROCKET", "APE", "PANDA", "OTTER", "DUCK", "SNEK", "KOALA", "TIGER", "WHALE", "PUP", "ZEUS"];
const _NB = ["", "AI", "INU", "X", "COIN", "KING", "DAO", "2", "PRO", "LORD", "BABY", "MAX", "SUN", "GPT", "WIF", "FI"];
const simName = n => { const a = _NA[(n * 7 + 3) % _NA.length], b = _NB[Math.floor(n / _NA.length + n * 3) % _NB.length]; const r = n >= 640 ? String(Math.floor(n / 640) + 1) : ""; return (b === "BABY" ? "BABY" + a : a + b) + r };
const KIND_LABEL = { dud: "dud", modest: "short pump", runner: "runner", moon: "moonshot", dead: "dead pool", rug_i: "rug pull", rug_s: "slow rug",
  honey: "honeypot", stealth: "stealth honeypot", est: "established" };
const SCAM_KINDS = new Set(["rug_i", "rug_s", "honey", "stealth"]);
const MODEL_NOTES = [
  "Most new tokens fade: about half are duds, about a fifth are rugs or honeypots, only a few percent run for days.",
  "Prices move through a real constant-product pool, including your own buys and sells.",
  "Fills are late: the price drifts against you while your order lands, and larger buys can be sandwiched.",
  "Scam tokens fake activity (inflated trades, few unique buyers). The security feed misses some scams and flags some good tokens.",
  "Insiders sell into rallies, so early pumps usually give some back.",
  "Established tokens have no built-in edge: returns there are a random walk with occasional hype waves.",
];
const MK_KAPPA = { dud: 0.18, modest: 0.12, runner: 0.09, moon: 0.07, rug_i: 0.12, rug_s: 0.12, honey: 0.12, stealth: 0.10, dead: 0.10 };
const MK_RING = 1500;
const mkIdx = g => ((g % MK_RING) + MK_RING) % MK_RING;
// archetype table: w=share of launches, A=peak turnover per hour (x liquidity), rise/fall in minutes, s=flow bias while rising/falling
const MK_ARCH = {
  dead:   { w: 0.075, A: [0.0, 0.1], rise: [5, 20], fall: [30, 90], sUp: 0.02, sDn: -0.05 },
  dud:    { w: 0.500, A: [0.6, 6.0], rise: [8, 35], fall: [45, 220], sUp: 0.12, sDn: -0.10 },
  modest: { w: 0.140, A: [1.5, 9.0], rise: [30, 150], fall: [150, 700], sUp: 0.15, sDn: -0.05 },
  runner: { w: 0.032, A: [2.5, 11.0], rise: [120, 500], fall: [1200, 3500], sUp: 0.17, sDn: -0.035 },
  moon:   { w: 0.006, A: [3.0, 14.0], rise: [300, 1000], fall: [3000, 9000], sUp: 0.20, sDn: -0.05 },
  rug_i:  { w: 0.115, A: [1.0, 9.0], rise: [10, 60], fall: [90, 300], sUp: 0.14, sDn: -0.08 },
  rug_s:  { w: 0.075, A: [1.0, 9.0], rise: [20, 90], fall: [90, 300], sUp: 0.14, sDn: -0.09 },
  honey:  { w: 0.040, A: [2.0, 6.0], rise: [20, 120], fall: [200, 600], sUp: 0.10, sDn: -0.02 },
  stealth:{ w: 0.017, A: [2.0, 7.0], rise: [20, 120], fall: [100, 400], sUp: 0.14, sDn: -0.08 },
};
// The market has its OWN random stream (seeded from the desk seed), separate from the bot's (rng: fills, failed transactions,
// latency, data outages). So two runs with the same seed see the same coins and the same price paths even when the bot behaves
// differently (a money feature on or off): an A/B test then measures the feature, not a reshuffled market.
const MR = { a: 1 };
function mrng() { let a = MR.a = (MR.a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 }
const mgauss = () => { let u = 0, v = 0; while (!u) u = mrng(); v = mrng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) };
const mkU = (a, b) => a + (b - a) * mrng();
const mkLogN = (med, sd) => med * Math.exp(sd * mgauss());
function mkPoisson(l) { if (l > 25) return Math.max(0, Math.round(l + Math.sqrt(l) * mgauss())); const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= mrng() } while (p > L); return k - 1 }

const MOCK = {
  toks: {}, n: 0, t0: 0, G: 0, lastMin: 0, mt: 0, crashUntil: 0, major: { bitcoin: 0, ethereum: 0, solana: 0 }, majorHist: [], vol: 1,
  cfg: { newPerMin: { solana: 0.16, base: 0.07, ethereum: 0.025, bsc: 0.07, arbitrum: 0.05 }, lagNew: [60, 240], signal: 0.35, crashPerMin: 1 / 5500, estUp: 0.038, estRev: 0.004, estMR: 0.015, estFall: [200, 700] },

  init() {
    MR.a = ((SEED | 0) ^ 0x5bd1e995) | 0; this.toks = {}; this.n = 0; this.t0 = vnow; this.G = 0; this.lastMin = vnow; this.mt = vnow; this.crashUntil = 0; this.majorHist = []; this.vol = 1;
    for (let i = 0; i < 160; i++) this.spawn(true);
    for (let m = 0; m < MK_RING; m++) { this.G = m - MK_RING; for (const t of Object.values(this.toks)) this.step(t) }   // warm-up history for established tokens
    this.G = 0;
  },
  // save / restore (persistence): the whole market is too big to save (hundreds of MB of history), so a save keeps the market clock and
  // the coins the desk still holds; a restore builds a fresh market at that moment and puts those coins back exactly as they were
  dump(keep) { const held = {}; for (const k of keep || []) { const t = this.toks[k]; if (t) held[k] = t } return { mr: MR.a, n: this.n, t0: this.t0, G: this.G, lastMin: this.lastMin, crashUntil: this.crashUntil, major: this.major, majorHist: this.majorHist, vol: this.vol, held } },
  restore(sv) {
    const G1 = sv.G; this.toks = {}; this.n = sv.n; this.t0 = sv.t0; this.lastMin = sv.lastMin; this.mt = sv.lastMin; this.crashUntil = sv.crashUntil; this.major = sv.major || this.major; this.majorHist = sv.majorHist || []; this.vol = sv.vol || 1;
    this.G = G1 - MK_RING - 1; for (let i = 0; i < 160; i++) this.spawn(true);
    for (const t of Object.values(this.toks)) t.genG = G1 - MK_RING - 1;
    for (let m = 0; m < MK_RING; m++) { this.G = G1 - MK_RING + m; for (const t of Object.values(this.toks)) this.step(t) }
    this.G = G1; for (const k in (sv.held || {})) this.toks[k] = sv.held[k]; if (sv.mr != null) MR.a = sv.mr; this.mt = this.lastMin;
  },
  pickKind() { let r = mrng(), acc = 0; for (const [k, a] of Object.entries(MK_ARCH)) { acc += a.w; if (r < acc) return k } return "dud" },
  spawn(est, forced) {
    const chains = CFG.chains, chain = forced || chains[Math.floor(mrng() * chains.length)], n = ++this.n;
    const addr = chain === "solana" ? "MOCK" + n : "0x" + n.toString(16).padStart(40, "0");
    const kind = est ? "est" : this.pickKind(), ar = MK_ARCH[kind] || { A: [0.5, 2], rise: [100, 400], fall: [1000, 5000], sUp: 0.05, sDn: -0.03 };
    const liq = est ? clamp(mkLogN(500e3, 0.9), 120e3, 6e6) : clamp(mkLogN(8e3, 1.05), 2500, 700e3);
    const q = liq / 2, p0 = Math.pow(10, -7 + mrng() * 7), b = q / p0;
    const t = { sseed: (mrng() * 4294967296) | 0, chain, addr, sym: simName(n), kind, est, created: est ? this.mt - (80 + mrng() * 800) * 3600 : this.mt, genG: est ? -MK_RING - 1 : this.G, q, b, p0, price: p0,
      A: est ? mkU(0.3, 1.6) : mkU(...ar.A), rise: mkU(...ar.rise), fall: est ? mkU(...this.cfg.estFall) : mkU(...ar.fall), sUp: ar.sUp, sDn: ar.sDn, h: est ? 0.15 : 0.02, peak: 0, waveUntil: 0,
      noise: 0, sigN: est ? 0.04 : 0.09, tax0: mrng() < 0.7 ? 0 : mkU(0, 3), sellTax: 0, flow: 0, rugged: false, dead: false, insIdx: 0,
      holders: Math.floor(est ? mkU(3e3, 8e4) : mkU(25, 300)), launchHolders: 0, soph: SCAM_KINDS.has(kind) && mrng() < 0.25, wash: 1,
      cumV: new Float64Array(MK_RING), cumB: new Float64Array(MK_RING), cumS: new Float64Array(MK_RING), cumU: new Float64Array(MK_RING), px: new Float64Array(MK_RING), qs: new Float64Array(MK_RING),
      c: { v: 0, b: 0, s: 0, u: 0 }, visibleAt: this.mt + (est ? -1e6 : mkU(...this.cfg.lagNew)), tRug: 0, rugFrac: 0, blockAfter: 1e9, taxAfter: 0, taxFrom: 1e9 };
    t.sellTax = t.tax0; t.peak = t.rise * mkU(1.2, 2.2);
    if (SCAM_KINDS.has(kind)) t.wash = t.soph ? mkU(1.2, 2) : mkU(2, 7);          // sophisticated scams spread fake volume over many wallets and look organic
    if (kind === "rug_i") { t.tRug = mkU(20, 700); t.rugFrac = mkU(0.85, 0.995) }
    if (kind === "rug_s") { t.tRug = mkU(30, 400); t.devSell = mkU(0.004, 0.02) }
    if (kind === "honey") { t.blockAfter = 0; t.tRug = mkU(240, 900) }
    if (kind === "stealth") { t.blockAfter = mkU(30, 200); if (mrng() < 0.5) { t.taxFrom = t.blockAfter; t.taxAfter = mkU(45, 95); t.blockAfter = 1e9 } }
    if (kind === "runner" || kind === "moon") t.waveEvery = mkU(300, 1500);
    this.toks[addr.toLowerCase()] = t; return t;
  },

  // ----- constant-product pool primitives (fee stays in the pool) -----
  buyQuote(t, usd) { const fee = 0.003, dq = usd * (1 - fee), k = t.q * t.b, b2 = k / (t.q + dq), out = t.b - b2; t.q += usd; t.b = b2; return out },
  sellTokens(t, tok) { const fee = 0.003, k = t.q * t.b, q2 = k / (t.b + tok), out = (t.q - q2) * (1 - fee); t.q = Math.max(q2 + (t.q - q2) * fee, 1); t.b += tok; return out },
  price(t) { return t.q / t.b },

  step(t) {
    if (t.dead) return;
    const G = this.G, age = (G - t.genG), r = mkIdx(G);
    // hype state machine
    if (!t.est && t.rising === undefined) t.rising = true;
    // pumps end without warning: the chance of ending each minute grows with how far price has run (no learnable schedule)
    if (!t.est && t.rising && mrng() < (1 / t.peak) * (1 + 0.6 * Math.max(0, Math.log(this.price(t) / t.p0)))) t.rising = false;
    if (!t.est && t.rising) t.h += (1 - t.h) / Math.max(4, t.rise); else if (t.waveUntil > age) t.h += (1 - t.h) / 40; else t.h *= Math.exp(-1 / t.fall);
    if (t.waveEvery && mrng() < 1 / t.waveEvery) { t.waveUntil = age + mkU(40, 240); t.h = Math.min(1, t.h + mkU(0.3, 0.8)); t.peak = Math.max(t.peak, age) }
    if (t.est && mrng() < 0.30 / 1440) { t.waveDir = mrng() < 0.5 ? 1 : -1; t.waveUntil = age + mkU(20, 150); t.revUntil = t.waveUntil + mkU(60, 300); t.h = Math.min(1, t.h + mkU(0.3, 0.9)) }
    const rising = t.est ? t.waveUntil > age : (t.rising || t.waveUntil > age);
    // dev actions
    if (t.kind === "rug_i" && !t.rugged && age >= t.tRug) { t.rugged = true; const f = t.rugFrac; const dumped = t.b * mkU(0.5, 2.5); t.q *= 1 - f; t.b *= 1 - f; this.sellTokens(t, dumped * (1 - f)); t.h = 0.01 }
    if (t.kind === "honey" && !t.rugged && age >= t.tRug) { t.rugged = true; t.q *= 0.04; t.b *= 0.04; t.h = 0.01 }
    if (t.kind === "rug_s" && age >= t.tRug && t.q > 300) { this.sellTokens(t, t.b * t.devSell * mkU(0.5, 1.5)); t.rugged = true }
    if (age >= t.taxFrom) t.sellTax = t.taxAfter;
    // organic flow
    const base = t.est ? 0.5 : 0.12, V = t.q * (base + t.A * t.h) / 60 * (this.crashUntil > this.mt ? 1.4 : 1);
    t.noise = 0.85 * t.noise + 0.15 * mgauss() * t.sigN * 3;
    let s = (rising ? t.sUp * this.cfg.signal : t.sDn) * (rising ? 1 : (t.est ? 0.4 : 1)) + t.noise;
    if (t.est) { const lnr = Math.log(this.price(t) / this.pxAgo(t, 360)); s = t.noise * 0.6 - this.cfg.estMR * clamp(lnr, -0.6, 0.6) + (t.waveUntil > age ? this.cfg.estUp * t.waveDir : age < (t.revUntil || 0) ? -this.cfg.estRev * t.waveDir : 0) }
    if (this.crashUntil > this.mt) s -= 0.07;
    if (!t.est) { const lnm = Math.log(this.price(t) / t.p0); s += lnm > 0 ? -(MK_KAPPA[t.kind] || 0.1) * lnm : -0.03 * lnm }   // profit-taking into strength, bargain hunting after collapses
    if (t.kind === "dead") s = -0.02 + t.noise * 0.3;
    let net = V * s;
    if (mrng() < (t.est ? 0.004 : 0.012)) net += (mrng() < (0.35 + Math.max(0, s)) ? 1 : -1) * t.q * (t.est ? mkU(0.002, 0.012) : mkU(0.004, 0.03));    // whale
    // insiders / snipers take profit into strength (new tokens only)
    if (!t.est && t.kind !== "dead") { const mult = this.price(t) / t.p0, th = [1.6, 2.6, 4.2, 7]; if (t.insIdx < th.length && mult >= th[t.insIdx]) { net -= t.q * mkU(0.03, 0.1) * (t.kind === "moon" ? 0.4 : 1); t.insIdx++ } }
    const maxNet = t.q * 0.22; net = clamp(net, -maxNet, maxNet);
    const blocked = this.isBlocked(t, age);
    if (blocked) net = this.price(t) / t.p0 > 4 ? 0 : Math.max(net, 0) * 0.4;          // sellers cannot exit: buys only, price creeps up to a plateau
    if (net > 0) this.buyQuote(t, net); else if (net < 0 && t.q > 50) this.sellTokens(t, Math.min(-net / Math.max(this.price(t), 1e-18), t.b * 0.2));
    t.flow = net / t.q;
    // activity counters (wash inflates scam tokens' apparent activity)
    const avgTrade = clamp(t.q * 0.004, 25, 450), vol = V * (net ? 1 : 0.5), nTx = Math.max(0, vol / avgTrade * (0.8 + 0.4 * mrng()));
    const pBuy = clamp(0.5 + s * 1.6, 0.08, 0.92), buys = nTx * pBuy * (blocked ? 1.0 : 1), sells = nTx * (1 - pBuy) * (blocked ? 0.06 : 1);
    const wash = t.wash;
    t.c.v += vol * wash; t.c.b += buys * wash; t.c.s += sells * (wash > 1 ? 1 : 1); t.c.u += buys * (wash > 1 && !t.soph ? 0.25 : 0.75);
    t.cumV[r] = t.c.v; t.cumB[r] = t.c.b; t.cumS[r] = t.c.s; t.cumU[r] = t.c.u; t.px[r] = this.price(t); t.qs[r] = t.q;
    if (t.q < 120 || (!t.est && t.h < 0.003 && age > 2880 && t.q < 4000)) t.dead = true;
  },
  isBlocked(t, age) { if (t.kind === "honey") return true; if (t.kind === "stealth") return age >= t.blockAfter; return false },
  blocked(chain, addr) { const t = this.toks[addr.toLowerCase()]; return !!(t && this.isBlocked(t, this.G - t.genG)) },

  advance() {
    const mins = Math.min(Math.floor((vnow - this.lastMin) / 60), 40);
    for (let i = 0; i < mins; i++) {
      this.G++; this.lastMin += 60; this.mt = this.lastMin;   // the market moves in whole minutes on its own clock, so how the bot's ticks are cut never changes it
      this.vol = clamp(0.97 * this.vol + 0.03 * (0.6 + 0.8 * mrng()) + (mrng() < 0.002 ? 0.8 : 0), 0.5, 3);
      if (mrng() < this.cfg.crashPerMin && this.crashUntil < this.mt) this.crashUntil = this.mt + mkU(2, 5) * 3600;     // market-wide sell-off about every 4 days
      const bm = (this.crashUntil > this.mt ? -0.0006 : 0) + mgauss() * 0.00045 * this.vol;
      this.majorHist.push(bm); if (this.majorHist.length > 61) this.majorHist.shift();
      const sc = CFG.simScale || 1;   // market size: 1 = original demo (~470 new coins a day), bigger = closer to the real market (tens of thousands a day)
      for (const [ch, rate] of Object.entries(this.cfg.newPerMin)) if (CFG.chains.includes(ch)) { if (sc === 1) { if (mrng() < rate) this.spawn(false, ch) } else { let k = Math.floor(rate * sc); if (mrng() < rate * sc - k) k++; for (let i = 0; i < k; i++) this.spawn(false, ch) } }
      if (sc > 1 && this.G % 60 === 0) for (const k of Object.keys(this.toks)) { const t = this.toks[k]; if (!t.est && this.G - t.genG > 2880 && !(S && S.pf && S.pf.positions[t.chain + ":" + t.addr.toLowerCase()])) delete this.toks[k] }   // big markets: forget new coins after 2 days (most are dead by then)
      for (const t of Object.values(this.toks)) this.step(t);
    }
    if (mins) for (const k of Object.keys(this.toks)) { const t = this.toks[k]; if (t.dead && (this.G - t.genG) > 600 && !(S && S.pf && S.pf.positions[t.chain + ":" + t.addr.toLowerCase()])) delete this.toks[k] }
  },

  // ----- views the bot gets (with realistic feed behaviour) -----
  win(t, arr, mins) { const r = mkIdx(this.G), from = Math.max(this.G - mins, t.genG), rp = mkIdx(from); return Math.max(0, arr[r] - (from <= t.genG ? 0 : arr[rp])) },
  pxAgo(t, mins) { const g = this.G - mins; if (g <= t.genG) return t.p0; const v = t.px[mkIdx(g)]; return v > 0 ? v : t.p0 },
  snap(t) {
    const p = this.price(t), chg = m => (p / this.pxAgo(t, m) - 1) * 100, ageMin = this.G - t.genG;
    return { chain: t.chain, addr: t.addr, sym: t.sym, price: p, liq: t.q * 2, fdv: p * t.b * (t.est ? 40 : 6) * 1, vol5: this.win(t, t.cumV, 5), vol1h: this.win(t, t.cumV, 60), vol6: this.win(t, t.cumV, 360), vol24: this.win(t, t.cumV, 1440),
      chg5m: chg(5), chg1h: chg(60), chg6h: chg(360), chg24: chg(1440), buys1h: Math.round(this.win(t, t.cumB, 60)), sells1h: Math.round(this.win(t, t.cumS, 60)), buyers1h: Math.round(this.win(t, t.cumU, 60)),
      sellers1h: Math.round(this.win(t, t.cumS, 60) * 0.7), pair: "pair-" + t.addr, created: t.created, ageMin }
  },
  async discoverNew(chains) { this.advance(); const now0 = vnow; return Object.values(this.toks).filter(t => !t.est && !t.dead && now0 - t.created < 86400 && t.visibleAt <= now0 && chains.includes(t.chain)).sort((a, b) => b.created - a.created).map(t => ({ chain: t.chain, addr: t.addr, source: "new", snap: this.snap(t) })) },
  async discoverTrending(chains) { this.advance(); return Object.values(this.toks).filter(t => !t.dead && t.visibleAt <= vnow && chains.includes(t.chain)).map(t => this.snap(t)).filter(s => s.vol1h > 0).sort((a, b) => b.vol1h * (b.chg1h > 0 ? 1 : 0.3) - a.vol1h * (a.chg1h > 0 ? 1 : 0.3)).map(s => ({ chain: s.chain, addr: s.addr, source: "trending", snap: s })) },
  async snapshots(chain, addrs) { this.advance(); const o = {}; for (const a of addrs) { const t = this.toks[a.toLowerCase()]; if (t) o[a.toLowerCase()] = this.snap(t) } return o },
  async breakout(s) { const t = this.toks[s.addr.toLowerCase()]; if (!t || this.G - t.genG < 300) return null; let hi = 0; for (let m = 60; m < 1440 && m < this.G - t.genG; m += 10) hi = Math.max(hi, this.pxAgo(t, m)); return this.price(t) > hi },
  async majors() { this.advance(); let acc = 1; for (const r of this.majorHist) acc *= 1 + r; const c = (acc - 1) * 100; return { bitcoin: c, ethereum: c * 1.15 + gauss() * 0.1, solana: c * 1.4 + gauss() * 0.15 } },
  async security(chain, addr) {
    const t = this.toks[addr.toLowerCase()]; if (!t) return null; const age = this.G - t.genG, k = t.kind;
    if (rng() < 0.03 || (age < 4 && rng() < 0.65)) return null;                         // feed outage or token not indexed yet: bot fails closed
    if (t.secStatic) { const o = Object.assign({}, t.secStatic); o.sellTax = t.sellTax > 20 && age >= t.taxFrom + 60 ? t.sellTax : (t.secStatic.honeypot ? 99 : t.tax0); o.holders = Math.floor(t.secStatic.holders0 * (1 + age / 300)); if (t.rugged) { o.creator = Math.max(o.creator, 40); o.top10 = Math.max(o.top10, 80) } return o }
    const sol = chain === "solana", c = mulberry(((t.sseed || 1) ^ 0x2545F491) | 0), U = (a, b) => a + (b - a) * c(), chance = p => c() < p, pick = a => a[Math.floor(c() * a.length)];
    const scam = SCAM_KINDS.has(k), est = t.est, fp = !scam && !est;
    let honeypot = false, sellTax = t.sellTax > 20 && age >= t.taxFrom + 60 ? t.sellTax : t.tax0, flagged = false;
    if (k === "honey" && chance(t.soph ? 0.55 : 0.9)) { honeypot = true; sellTax = 99 }
    const mintable = (k === "rug_s" && chance(0.7)) || (k === "rug_i" && chance(0.3)) || (fp && chance(0.04)) || (k === "dead" && chance(0.4));
    const lpLocked = est ? null : k === "rug_i" ? (chance(0.5) ? U(85, 100) : U(0, 20)) : k === "rug_s" ? (chance(0.55) ? U(80, 100) : U(0, 30)) : k === "honey" ? U(0, 100) : (chance(0.78) ? U(80, 100) : U(0, 40));
    const creator = (k === "rug_i" || k === "rug_s") ? (chance(0.55) ? U(9, 35) : U(0.5, 6)) : (fp && chance(0.07)) ? U(8.5, 20) : U(0, 5);
    const top10 = est ? U(10, 42) : (scam && chance(0.5)) ? U(42, 80) : (fp && chance(0.13)) ? U(46, 70) : U(14, 40);
    const holders = Math.floor(est ? U(3000, 90000) : Math.max(15, t.holders * (1 + age / 300) * U(0.6, 1.4)));
    const rep = { sol, honeypot, buyTax: t.tax0 * 0.5, sellTax, openSource: scam && chance(0.25) ? false : true, proxy: chance(0.08), mintable, hiddenOwner: k === "rug_s" && chance(0.25), takeBack: false, ownerBal: k === "rug_s" && chance(0.2),
      pausable: k === "honey" && chance(0.3), cannotSellAll: false, cooldown: chance(0.04), blacklist: scam && chance(0.15), slipMod: k === "stealth" && chance(0.15), selfdestruct: false, extCall: chance(0.08), freezable: false, closable: false, nonTransferable: false,
      creatorHP: scam && chance(0.12), inDex: true, holders, holders0: holders / (1 + age / 300), top10, creator, owner: U(0, 3), lpLocked };
    t.secStatic = rep; return Object.assign({}, rep);
  },
};
