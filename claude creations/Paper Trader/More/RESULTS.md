# What the realistic simulator says

All numbers come from `test/sweep.mjs` on **held-out seeds 101-124, 7 simulated days each**, $10,000 start, default settings unless noted. Nothing was tuned on these seeds.

## Main table (demo market at its default setting)
| Configuration | Return per day (mean / median) | Worst market | Markets below start | Trades per market | Win rate | Expectancy | Scam tokens bought |
|---|---|---|---|---|---|---|---|
| **Default** (new tokens only, unique-buyer filter) | -0.10% / -0.13% | -0.52% | 17 of 24 | 23 | 23% | -0.21R | 5 of 19,261 seen |
| Established-token entries on | -0.27% / -0.33% | -0.81% | 19 of 24 | 66 | 31% | -0.18R | 4 |
| Wide profile (up to 100 positions) | -0.03% / -0.02% | -0.22% | 17 of 24 | 22 | 26% | -0.07R | 3 |
| Default without the unique-buyer filter | -0.22% / -0.21% | -0.54% | 18 of 24 | 26 | 23% | -0.34R | **70** |

## The assumption everything depends on
The bot only has an edge if buying momentum on new launches keeps going after it enters. The simulator has one knob for that (`MOCK.cfg.signal`; 0 = momentum never persists, 1 = strong persistence). Same bot, same seeds:

| Momentum persistence | Return per day | Markets below start |
|---|---|---|
| 0 (none) | -0.20% | 23 of 24 |
| **0.35 (demo default)** | **-0.10%** | 17 of 24 |
| 0.7 | +0.45% | 4 of 24 |
| 1.0 | +0.94% | 0 of 24 |

I do not know the true value for real markets, so **these results cannot tell you whether the bot makes money**. They show which parts are robust:

* **Risk controls held in every run**: no emergency shutdown, maximum drawdown 0.1-3.5%, all caps respected (see `test/invariants.test.mjs`).
* **Scam avoidance is robust to the assumption**: the unique-buyer filter (wash-trading detector) cut scam purchases from 70 to 5 over 24 markets. Real wash trading can look different, so this is evidence about the mechanism, not about live accuracy.
* **Established-token momentum loses after costs** in every setting tested (about -0.3R per trade over 1,100 trades), so it is off by default.
* **Costs are large relative to small trades**: fees, latency drift and sandwiching take roughly 1-3% per round trip, and a $5 Ethereum fee on a $100 trade is a 10% round trip. The cost gate skips trades whose fees plus impact exceed 3% of size.
* **100 open positions work**: smaller positions, similar result, lower variance, smaller drawdown.
* An earlier, friendlier version of the simulator produced +200% in three days. That was a flaw in the simulator (and later a bug that made the security feed contradict itself), not skill. Both are fixed.

## How the demo market was calibrated (no bot involved)
Tokens that pass a $15k liquidity filter at 30 minutes old:

| Kind | Share | Median change after 24h |
|---|---|---|
| dud | 50% | -73% |
| short pump | 13% | -78% |
| rug pull | 12% | -94% |
| slow rug | 7% | -100% |
| dead pool | 9% | -26% |
| honeypot / stealth honeypot | 4% / 2% | sells blocked |
| runner / moonshot | 3% / 0.4% | wide, fat tail |

Overall about 11% ever double, 4% reach 5x, 2% reach 10x, and 37% lose more than 80% within a day. These shares are my assumptions, informed by general experience with memecoin launches, not measured data.

## Limits
* The simulator encodes assumptions about how markets behave. The only honest test is live paper trading with real data over weeks.
* Live data could not be exercised from the build environment (outbound access to the data providers was blocked). Parsers are tested against recorded payload shapes and the app has a one-tap connection test.
