# Paper Trader — Spec V2 results

Demo market only. Paper money only. No real wallet and no real orders were used, ever.
Past demo results do not predict real results.

## Headline (the clean control run, in the app)

The run used defaults: write-off ladder on, every other money feature off.
It ran 14 clean simulated days at 10,000x, starting with $10,000 over 5 desks, with no reloads and no interruptions. Market seed was 424242. Full Auto was off and market size was fixed at 1x, so the run can be repeated exactly.

| | Result |
|---|---|
| Final balance | **$12,944.94 (+$2,944.94, +29.45%)** |
| Trades | 1,832 (1,090 won / 742 lost, 59% win rate) |
| Money won / lost | +$4,983.22 / −$2,083.82 |
| Average win / loss | +$4.57 / −$2.81 |
| Expectancy | **+$1.58 per trade** |
| Profit factor | 2.39 |
| Max drawdown | −$74.27 (0.65%) |
| Fees burned on failed transactions | $21.00 (0.4% of gross profit) |
| Written off | 7 coins, −$285.73 (13.7% of all losses; 3.8 per 1,000 trades) |
| Failed buys / sells | 175 of 2,020 buys; 241 of 3,459 sells; 152 retries worked |
| Report reconciles | **YES**: unexplained $0.00, rounding $0.00, 14 of 14 daily rows, every end-of-day balance chains |
| Checks | 9,913 snapshots, **0 invariant failures** |
| Real time | 20.1 min (~1,001x actual on average) |

Compared with V1 ($12,505.12, +25.05%, 1,391 trades): the demo market changed in V2. It now has its own random stream so A/B tests are fair. V1 also lost about 4 days to No-New-Trades checks. So the two runs are not a like-for-like comparison.

## Money table (Part 4): same market, one feature changed

### In the app (K2), seed 424242, 14 days

| Run | Profit | Trades | Expectancy | Profit factor | Max drawdown | Write-offs | vs control |
|---|---|---|---|---|---|---|---|
| **Control** (defaults) | **+$2,944.94** | 1,832 | +$1.58 | 2.39 | −$74.27 | 7 (−$285.73) | — |
| Desk features (pre-buy, cost control, bank the day, memory, cold-desk) | +$2,565.37 | 1,840 | +$1.36 | 2.23 | −$67.75 | 12 (−$396.46) | **−$379.57, fails** |
| Smart allocation | +$3,072.34 | 1,716 | +$1.73 | 2.08 | **−$180.40** | 9 (−$634.37) | +$127.40, but drawdown +143%, **fails** |
| Mode tournament, attempt 1 | +$2,409.76 | 1,676 | +$1.43 | 2.31 | −$70.12 | 7 (−$285.03) | **−$535.18, fails** |
| Mode tournament, attempt 2 (ranking fixed) | +$2,838.61 | 1,798 | +$1.57 | 2.31 | −$72.27 | 10 (−$409.16) | **−$106.33, fails** |

### Engine-only checks: each feature alone, same market, 2–3 seeds

Same engine and same desks as the app, run without the screen. The app's control run and the engine's control run on seed 424242 matched to the cent: +$2,944.94, 1,832 trades, 7 write-offs.

| Feature alone | Seed 424242 | Seed 777 | Verdict |
|---|---|---|---|
| Write-off ladder OFF (ladder is on by default) | +$85.69 | +$13.33 (but lower expectancy; 12 write-offs vs 8) | not proven either way |
| Pre-buy sellability check | −$3.06 | $0.00 (never matched a coin) | no effect |
| Failed-sell cost control | −$325.71 | +$211.96 | mixed: not proven |
| Bank the day ($150 target) | $0.00 (never triggered) | $0.00 (never triggered) | no effect: desks make about $40–70 a day each |
| Bank the day ($40 target, extra attempt) | −$264.94 | −$484.57 | **loses** |
| Coin pattern memory | $0.00 (0 decisions changed) | MEMORY777 | no effect |
| Cold-desk size steps | +$457.72 | −$306.32 | COLD31337 |

Control profits: seed 424242 +$2,944.94, seed 777 +$3,148.98, seed 31337 +$3,266.83.

## Recommendation per feature

Rule: recommend ON only if it beats control on BOTH expectancy and total profit, with drawdown no more than 20% worse. One pair of runs is one sample.

- **M1 Smart allocation: keep OFF.** It made +$127.40 more, but drawdown was 143% worse. One 2x-sized coin that could not be sold lost $116.04. The in-run "flat sizing" estimate said +$2,385.53, while the exact flat run (control, same market) made +$2,944.94. The estimate is rough, and the report now says so. For an exact answer use "Start over, same market".
- **M2 Mode tournament: keep OFF.** Both attempts lost money (−$535.18, −$106.33). Its useful output: Lots of trades made the most per trade, +$1.67 over 1,627 trades. Runner and Tight had fewer than 100 trades each, so there is not enough data to call them.
- **M3 Write-off ladder: keep ON** (the spec default). With the ladder on, write-off losses were smaller on both seeds (−$285.73 vs −$345.84; −$329.79 vs −$487.81). Total profit was about the same (−$85.69, −$13.33). It cannot save coins that block all sells. Those are the write-offs that remain. **Pre-buy check: keep OFF** (no measurable effect).
- **M4 Failed-transaction cost control: keep OFF.** Results were mixed (−$325.71 / +$211.96). Its retry delays (1, 5, 15 min) can give a coin time to turn unsellable.
- **M5 Exit breakdown: ON** (it only measures). In the control run, trailing stops made +$4,564.01 over 1,464 trades. Stop-losses lost −$1,332.79 over 338. Write-offs lost −$285.73 over 7.
- **M6 Bank the day: keep OFF.** At $150 it never triggers. At $40 it lost money on both seeds.
- **M7 Pattern memory: keep OFF.** It never changed a single buy decision: in Lots of trades mode the committee is never exactly at its pass line.
- **M8 Cold-desk size steps: keep OFF.** COLD_VERDICT
- **M9 Money dashboard: ON.** It shows expectancy, profit factor, max drawdown, fees as % of gross profit, write-off loss as % of gross losses, and best/worst day.

**Bottom line: no money feature passed the proof rule.** The defaults stay as they are. The biggest remaining loss is coins that turn unsellable after the bot buys them ("stealth honeypots" in the demo market). They are 14–19% of all losses. No sell rule can fix them; only spotting them before buying could. Nothing tested here did that reliably.

## Test results (Part 5)

| Test | Result |
|---|---|
| A2 trades-today invariant | 20/20 |
| B2 fees in cents | 20/20; report residual $0.00 in 20/20 |
| C2 every day in the report | 14/14 rows in all 5 app runs; every end-of-day balance chains |
| D2 10 reloads | 10/10 exact to the cent and the trade (banner = restored = verified) |
| E2 bottom bar = main panel | 20/20 (same snapshot id) |
| F2 one speed number | 20/20 (same measurement id everywhere) |
| G2 V1 regression | B speed honest (within 8% over the same 10 s), C one clock 10/10, D 60 s pause identical, E No-new-trades 0 buys, F 10/10, Run Until exact + "Test complete" + report |
| H2 400px vs 1920px | H2_RESULT |
| I2 tab lock | pass: second tab blocked; read-only never saves; Take over pauses and saves the first tab, then continues |
| J2 write-off ladder | 3 forced unsellable coins: every step logged (normal → wider slippage → any price → alert → write-off at 12), full audit; 3 forced flaky coins sold by the any-price step. Rate 3.8 per 1,000 trades vs V1 3.6: **not cut**. Target (−50%) **not met** |
| K2 money runs | see the money table |

## Things fixed while testing (found by the tests)
- Changing a desk's mode moved 40% of its money into a BTC/ETH side account the totals did not count. Fixed, with a new check.
- The demo market shared one random stream with the bot. Any setting change reshuffled the whole market, so A/B results were noise. The market now has its own stream and its own minute clock. Two runs with the same seed now match to the cent, even at different computer speeds.
- Market size "Auto" followed the screen's frame rate and changed the market mid-run. Test runs now fix it at 1x.
- The tournament never started when it was switched on before the run. A slow mode (under 30 trades a day) could never be ranked. Both are fixed.
- Desk cards and the desk page could differ by 1 cent. Open coins' value is now rounded once.
- A paused screen still made new snapshot numbers. Fixed: a paused screen is now fully still.

## Honest limits
- Demo market, not real prices. A demo profit says nothing about real markets.
- Each money comparison is one market sample per seed (2–3 seeds). Small edges are inside the noise.
- Speed depends on the computer. These runs averaged about 1,000x actual at 10,000x selected, with other jobs running.
- "Scam coins bought" counts coins that passed every check but were scams in the demo's hidden truth (about 22 per run). No coin that failed the scam filter was ever bought.
