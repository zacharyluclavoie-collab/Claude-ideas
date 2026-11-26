# Paper Trader (web app)

Autonomous crypto **paper** trading in the browser. Simulated money only: there is no wallet, key, signing or transaction code anywhere. Works as an installable iPhone web app (Share > Add to Home Screen) or as a page in a Claude artifact (demo market only).

## Structure
```
src/            source (edit these)
  core.js         config, state, helpers
  security.js     mandatory token checks (fail closed)
  strategy.js     new-token and established-token analysis
  risk.js         risk manager: sizing, caps, cost gate, shutdown, regime
  execution.js    fill simulator: pool impact, fees, latency, sandwiching, failures, taxes
  providers_live.js  DexScreener / GeckoTerminal / GoPlus / CoinGecko (read-only GET) + parsers + connection self-test
  sim_market.js   realistic synthetic market with constant-product pools (demo mode, tests)
  engine.js       three independent loops: fast (safety + prices), slow (regime + rechecks), scan (new / trending)
  ui.js, style.css, body.html
build.mjs       node build.mjs [artifactOut]  ->  index.html (+ dist/engine_bundle.js for tests)
test/           node --test test/*.test.mjs   (parsers, invariants)   |  sweep.mjs / calib*.mjs for backtests
```

## Run the tests and backtests
```
node build.mjs
node --test test/*.test.mjs                                   # parser fixtures + safety invariants
node test/sweep.mjs 1 12 4 "" label                 # seeds 1-12, 4 simulated days each, in parallel
BYKIND=1 node test/sweep.mjs 101 124 7 "CFG.tr.enabled=true;" trending-on
node test/calib.mjs 4 1                             # how do tokens that pass the liquidity filter behave after launch
```

## What is realistic and what is not
* **Real in live mode:** prices, liquidity, volumes, new pools and security reports. Rate limits and CORS are handled; the Settings page has a one-tap connection test.
* **Simulated in both modes:** every fill. Price impact comes from the pool's own reserves (constant product), plus DEX fee, per-chain network fees (priority tips on new Solana tokens), latency drift that goes against momentum entries, sandwiching of larger buys, dropped or reverted transactions, slippage limits, partial fills, token taxes, sell restrictions.
* **Costs are enforced before every buy:** round-trip fees + impact must stay under 3% of the trade, so small trades on high-fee chains are skipped.
* Positions are valued at what selling into the pool would return, not at the mid price.
* **Demo market:** every token owns a pool; organic flow, whales, insiders and your own orders move it. Most launches fade (about half are duds, about a fifth are rugs or honeypots), insiders sell into rallies, scam tokens fake activity, and the security feed misses some scams and flags some good tokens. Established tokens have no built-in edge.
* **Not simulated:** insider access, bot speed advantages, real mempool dynamics, DEX routing quirks, tokens that change behaviour after your buy in ways GoPlus cannot see. Treat any profit as an upper bound.

## Findings from the realistic simulator
See `RESULTS.md`.

## Full Auto
On by default (Master settings). Every 10 s it puts any desk that is off ★ Lots of trades, or has hand-made risk/selling/chain overrides, back on the tested settings; keeps Auto market size on; restarts a desk that stopped after a bad day when a new day starts; replaces the Autopilot. Manual settings are locked while it is on. All actions are logged on the Master.

## Bot room
The **🤖 Bots** tab on the Master (and the Bot room card on the Master page) shows every desk's bots talking to each other, live: the Scanner finds coins, the Scam filter drops fakes, the Agents say which coins they like, Security checks for scams, the Committee votes, the Risk manager sizes the trade, the Trader buys and sells, and the Watcher guards open coins. Each message is made by the engine at the moment of a real decision (`talk()` in core.js), with the real numbers (score, checks passed, trade size, profit). Buys and sells are always shown; routine messages are sampled per bot so they can be read, and the counters include all the work. A map of the bots animates each message as it flies from one bot to the next; tap a bot card to see only its messages, or filter by desk or by buys and sells. The same live map and the newest bot messages are also on the Master page (one map, moved between the Master and the Bots tab; it only animates while on screen). The Master is laid out densely: badges in one row, one stats panel, two-wide desk cards on phones, and two columns on screens 900 px and wider.

## Desks and the Master board
`index.html` is the Master board: it runs the app several times side by side (5 by default, 5-25 in Master settings), one "desk" per market area, each with its own account, settings and agents, and adds up their profit and loss. Master settings change every desk at once (mode, live/demo, speed, pause, risk sliders, sell all, emergency stop, number of desks, starting balance). `app.html` is the single app on its own.

## Settings found by self-search
`test/search.mjs` / `test/search2.mjs` try many random settings in the simulator (training seeds), then `test/holdout2.mjs` re-tests the best on seeds they never saw. "Lots of trades" uses the round-2 winner (#9: widest scan, stop 5%, half sold at +7%, rest up to +40% / 5% trailing stop, Trend Follower on, lessons off): +1.69%/day on 10 unseen simulated markets, 10/10 profitable. "Max trades" uses #8 (~56 trades/day, +1.79%/day, 9/10 profitable, deeper dips). Logs in reports/search_log_round2.txt and reports/holdout_round2.txt. Simulated results only. Round 5 (reports/search_log_round5_fees_scams.txt) added the scam filters to Lots of trades: on 8 unseen 5x markets +3.95%/day vs +3.80%, worst market +2.68% vs +1.48%, max dip 0.98% vs 2.01%, 70% fewer scam buys. A tighter fee cap (3%) looked good in training but not on unseen markets, so the 5% cap stays. Round 8 (reports/search_log_round8.txt): Max trades + scam filters vs Lots of trades. Unseen 5x markets (8): +7.54%/day vs +4.66%, better on all 8, worst market +5.28% vs +3.66%, max dip 1.22% vs 1.09%, same scam buys. Unseen 1x markets (4): +3.72% vs +2.54%, better on all 4. Unseen 20x markets (4): +6.43% vs +3.52%, worst market +2.97% vs +0.71%. So **Lots of trades is now Max trades + scam filters** (stop -4.5%, 30% sold at +6%, rest to +30% / 5% trailing, up to 20 coins); Max trades is the same without the filters. One Solana desk, 2 days, 6 markets: $100 +16% on average but 3 of 6 markets lost 13-21%; $200 +37%, all 6 up. Capping small accounts at half their money invested did not clearly help (better worst case at $100, a losing market at $200), so it was not added.

## Small balances ($10 to $100)
Every trade pays network and exchange fees whatever its size: on new Solana coins about $0.17 for a buy plus a sell, plus 0.3% each way. Demo tests (one Solana desk on the round-5 Lots of trades, 2 simulated days, 6 markets each, `test/small.mjs`; the round-8 Lots of trades gave $100 +16% with 3 of 6 markets down 13-21%, and $200 +37% with all 6 up):

| Start | Trades per run | Mean return | Notes |
|---|---|---|---|
| $10 | 0-1 | about 0% | fees are bigger than any trade the risk rules allow |
| $25 | 7 | -5.5% (5% fee cap) / +0.2% (2.5% cap) | |
| $50 | 46 | -12.5% (5% cap) / -1.2% (2.5% cap) | |
| $100 | 136 | +5.5% (5% cap) / -5.6% (2.5% cap) | 4 of 6 markets up |
| $200 | 145 | +19% | one market -14%: under $500 each coin gets about 20% of the account, so swings are large |

Bigger slices per coin (35-50%) and buying older coins (no priority fee) did not help: they traded rarely or lost more. So under $75 the bot only buys when fees stay under 2.5% (it trades very little but stops paying fees away); from $75 the normal 5% limit applies. The Master has one-tap **Small start** buttons ($10 or $100, one Solana desk) and shows a tip when the balance is under $100. Recommended: start with $100 of pretend money.

## Running 24/7 without your phone (always-on runner)
An iPhone web app cannot run in the background: iOS freezes it when the screen locks. For continuous paper trading, run the same engine headless on any always-on machine (home computer, Raspberry Pi, cheap VPS, a container). It needs only Node 20+ and internet access to the data providers.
```
node server/run.mjs --port 8787 --token CHOOSE_A_SECRET     # 5 desks (Solana, Base, BSC, Arbitrum, Big coins), live data, state in ./state/
node server/run.mjs --desks 10 --preset most                 # 10 desks, every desk in "Most money" mode
node server/run.mjs --desks 1                                # one bot trading every chain (state/state.json)
node server/run.mjs --desks 1 --cap 100 --preset lots        # one bot with $100 of pretend money (--cap sets the balance of accounts that have not started yet)
```
Each desk has its own paper account ($2,000 by default) and its own state file (`state/state_desk1.json`, ...); the status page adds them up and lists each desk with its positions and recent events. Desks practise in simulation one at a time every 3 days. They share the free data-provider limits, so more desks means each scans a little slower.
Open `http://<machine>:8787/?token=CHOOSE_A_SECRET` on your phone to watch equity, positions and events (refreshes every 3 s). State survives restarts and reboots; stops, take-profits and emergency exits run all the time. `POST /stop?token=...` sets the emergency stop. Run `node build.mjs` first if you changed the source (it refreshes `server/engine_bundle.js`).

systemd example (`/etc/systemd/system/papertrader.service`):
```
[Service]
WorkingDirectory=/opt/Claude-ideas/trader
ExecStart=/usr/bin/node server/run.mjs --port 8787 --token CHOOSE_A_SECRET
Restart=always
[Install]
WantedBy=multi-user.target
```
Expose the port only through a private network or a reverse proxy with HTTPS; the token is a light guard, not full security. The runner never holds keys or sends transactions.
Offline: with no internet the runner keeps its account and simply sees no market data (the chip shows "No data", no new trades). The phone app's demo market works fully offline.

## Scan speed
Scanning is two-stage. Stage 1 judges every discovered token locally from numbers already in hand (about 80,000 tokens per second headless, no network). Stage 2 fetches a fresh price and the security report only for survivors. Turbo (default) repeats stage 1 about every second. In live mode the real limit is the data providers (DexScreener allows about 5 requests/s of 30 tokens; GeckoTerminal and GoPlus about 30/min), so new tokens arrive at a few dozen per second at most, not 1,000.

## Recorder and replay (test on real data)
```
node recorder/record.mjs --out data              # live: records every new pool at birth and follows it until it dies (JSON lines per day)
node recorder/record.mjs --demo --hours 30       # same format from the synthetic market (pipeline test)
node recorder/replay.mjs data/                   # replays the real engine on the recording, no look-ahead; train/test split + bootstrap interval
node recorder/replay.mjs data/ --setup "CFG.keep.on=false;"
```
Record for several weeks first. Replay fills come from recorded liquidity (no flow data), so they are cruder than the demo market's pool model; use replay to compare strategies on the same real tokens, and judge only after hundreds of trades. Research behind these tools: `../reports/Memecoin bot evidence review.md`.
