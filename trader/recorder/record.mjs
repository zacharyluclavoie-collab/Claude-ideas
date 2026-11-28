// Forward recorder: writes every new pool at birth and follows it until it dies, as JSON lines (data/YYYY-MM-DD.jsonl).
// Avoids survivorship bias: the universe is recorded as it appears, not sampled from trending lists afterwards.
// The recording can then be replayed through the real engine as fast as the computer allows (recorder/replay.mjs).
//   node recorder/record.mjs                       live data, runs until stopped (Ctrl-C)
//   node recorder/record.mjs --demo --hours 48    synthetic market at fast speed (pipeline test)
// The runner starts it too (node server/run.mjs --test, or --record), sharing the free data limits with the bot.
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";   // works with spaces in folder names and on Windows
import vm from "node:vm";
import path from "node:path";
const dir = path.dirname(fileURLToPath(new URL(import.meta.url)));

export async function startRecorder({ demo = false, hours = 24, out = "data", every = 60, max = 600, chains = null, shared = null, log = console.log, stopped = () => false } = {}) {
  const OUT = path.resolve(out); fs.mkdirSync(OUT, { recursive: true });
  const ctx = vm.createContext({ SHARED_RL: shared, console, setTimeout, clearTimeout, Date, Math, JSON, performance, fetch, AbortController, URL, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, document: { getElementById: () => ({}) }, navigator: {} });
  vm.runInContext('"use strict";\n' + fs.readFileSync(path.join(dir, "..", "server", "engine_bundle.js"), "utf8"), ctx);
  const E = c => vm.runInContext(c, ctx);
  E(`MODE=${JSON.stringify(demo ? "mock" : "live")};rng=mulberry(${demo ? 5 : Date.now() & 0xffffff});S=newState(1e4);${demo ? "vnow=1.76e9;MOCK.init();" : ""}${chains ? `CFG.chains=${JSON.stringify(chains)};` : ""}`);
  const nowT = () => E("now()");
  const day = t => new Date(t * 1000).toISOString().slice(0, 10);
  const streams = {};
  const w = (t, o) => { const f = path.join(OUT, day(t) + ".jsonl"); (streams[f] = streams[f] || fs.createWriteStream(f, { flags: "a" })).write(JSON.stringify({ t: Math.round(t), ...o }) + "\n") };
  const snapRow = s => ({ k: "snap", c: s.chain, a: s.addr, s: s.sym, p: s.price, l: s.liq, f: s.fdv, v: [s.vol5, s.vol1h, s.vol6, s.vol24], g: [s.chg5m, s.chg1h, s.chg6h, s.chg24], b: s.buys1h, x: s.sells1h, u: s.buyers1h ?? null, w: s.sellers1h ?? null, pa: s.pair, cr: s.created });
  const tracked = new Map();   // key -> {c,a,born,secN}
  let lastMaj = 0, rows = 0;
  async function cycle() {
    const t = nowT();
    const found = await E(`P().discoverNew(CFG.chains)`);          // every new pool this cycle
    for (const c of found) {
      const key = c.chain + ":" + c.addr.toLowerCase();
      if (!tracked.has(key) && tracked.size < max) { tracked.set(key, { c: c.chain, a: c.addr, born: t, secN: 0 }); if (c.snap) { w(t, snapRow(c.snap)); rows++ } }
    }
    const byChain = {};
    for (const v of tracked.values()) (byChain[v.c] = byChain[v.c] || []).push(v.a);
    for (const ch of Object.keys(byChain)) {
      ctx.__addrs = byChain[ch]; ctx.__ch = ch;
      const snaps = await E(`P().snapshots(__ch,__addrs)`);
      for (const a of byChain[ch]) {
        const s = snaps[a.toLowerCase()], key = ch + ":" + a.toLowerCase(), v = tracked.get(key);
        if (!s || !v) continue;
        w(t, snapRow(s)); rows++;
        const age = t - v.born;
        if (s.liq < 500 || age > 72 * 3600) { w(t, { k: "end", c: ch, a, why: s.liq < 500 ? "dead" : "aged" }); tracked.delete(key) }
        else if ((v.secN === 0 && age >= 240) || (v.secN === 1 && age >= 1800)) {
          ctx.__c = ch; ctx.__a = a; const sec = await E(`P().security(__c,__a)`); v.secN++;
          if (sec) w(t, { k: "sec", c: ch, a, d: sec });
        }
      }
    }
    if (t - lastMaj >= 300) { lastMaj = t; const m = await E(`P().majors()`); if (m) w(t, { k: "maj", d: m }) }
  }
  const t0 = nowT(); let n = 0;
  while (!stopped() && nowT() - t0 < hours * 3600) {
    try { await cycle() } catch (e) { log("recorder cycle failed: " + e.message) }
    if (demo) E(`vnow+=${every}`); else await new Promise(r => setTimeout(r, every * 1000));
    if (++n % 30 === 0) log(`${new Date().toISOString()} recorder: following ${tracked.size} coins, ${rows} rows saved`);
  }
  for (const s of Object.values(streams)) s.end();
  log("recorder done, rows written: " + rows + " -> " + OUT);
  return rows;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {   // run from the command line
  const args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf("--" + n); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true) };
  let stop = false; process.on("SIGINT", () => { stop = true }); process.on("SIGTERM", () => { stop = true });
  const ch = opt("chains", ""); await startRecorder({ demo: !!opt("demo", false), hours: +opt("hours", 24), out: opt("out", "data"), every: +opt("every", 60), max: +opt("max", 600), chains: ch && ch !== true ? String(ch).split(",") : null, stopped: () => stop });
}
