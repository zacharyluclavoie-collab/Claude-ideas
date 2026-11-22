# Validating a DEX token trading bot honestly with recorded data

Research caveat: several official doc hosts (docs.dexscreener.com, docs.gopluslabs.io, geckoterminal.com) did not resolve from this session, so many rate-limit figures come from search snippets and secondary sources and are flagged. Verify against the provider pages before building on them. Birdeye free-tier numbers and the exact DSR/MinBTL formulas were not retrieved.

## 1. What biases afflict token backtests, and how to avoid them (including what to record)

### Takeaway
The dominant bias is survivorship: nearly all launched tokens die, so any dataset assembled after the fact (DexScreener or GeckoTerminal "current" listings, Dune queries on surviving pools) is skewed toward winners. The fix is to record the launch universe forward in time, with timestamps, and replay it event by event. Slippage and sandwiching are worst on exactly the volatile new-token trades a memecoin bot targets.

### Cited Findings
- Solidus Labs reported 98.6% of Pump.fun launches were rug pulls or pump-and-dumps, and only about 97,000 of about 7 million launched kept at least $1,000 in liquidity; Pump.fun disputed the claim. This is an industry report, not peer-reviewed — [CryptoPotato](https://cryptopotato.com/98-of-tokens-on-pump-fun-are-rug-pulls-or-fraud-report/), [The Defiant](https://thedefiant.io/alarming-99-of-memecoin-launches-on-pumpfun-are-pump-and-dumps-or-rug-pulls-report)
- Success definitions give wildly different rates: under 0.002% reach $1M market cap ([Protos](https://protos.com/research-finds-less-than-0-002-of-pump-fun-memecoins-succeed)); a Dune-based figure puts the success rate at 1.41% and graduation to an AMM at about 0.7-0.8% of launches in mid-2025 ([Cointelegraph](https://cointelegraph.com/news/memecoins-pump-fun-99-percent-fail-launch)). Any backtest on "tokens that still exist" ignores these 98%+ of failures.
- CoinGecko's wallet-level data: share of profitable Pump.fun wallets rarely exceeded 50%, low of 30.1% in June 2025; the measure excludes bagholders who never sold, so it overstates profitability — [CoinGecko Research](https://www.coingecko.com/research/publications/pump-fun-traders-are-making-a-comeback)
- Academic data sources on Pump.fun exist: [arXiv 2512.11850](https://arxiv.org/html/2512.11850v2) (Q4 2024 empirical study) and [arXiv 2602.14860](https://arxiv.org/html/2602.14860v1) (predicting token success). Not reviewed in detail here.
- Sandwich risk concentrates in volatile new-token moments: one week of Solana data found 87,061 sandwich attacks, mostly around new token launches — [MEV Monitor](https://mirror.xyz/0x7c855e1bF411Ab5975235bC8C74E032615073044/mwh7Bkqp_nmsOkW6T7ee4tqXyXYgaRwLQd8zi38HbcY)
- Bitquery: Jupiter trades through Pump.fun/PumpSwap that allowed 20-50% slippage were sandwiched 14x as often as those under 3% (observational) — [CryptoSlate](https://cryptoslate.com/solana-sandwich-bots-took-29-7-million-before-costs-bitquery-estimates/)
- Ethereum comparison: adversarial slippage probability about 80% higher for PEPE than for USDC — [arXiv 2309.13648](https://www.arxiv.org/pdf/2309.13648)
- GeckoTerminal cache/update frequency on some endpoints was changed from 30 to 15 minutes, so API snapshots can lag the chain — [CoinGecko changelog](https://docs.coingecko.com/changelog?page=1)

### Inferences
(My recommendations, not from the sources above.)
- Bias list and fixes:
  - Survivorship: subscribe to pool-creation events (Helius webhooks/logs, or poll GeckoTerminal new_pools / DexScreener latest profiles) and record every new pool at birth, including those later rugged or delisted. Never build the universe from "currently trending/listed" tokens.
  - Look-ahead from final-state data: fields like holder count, LP-locked, mint-authority, GoPlus flags, top-10 concentration, and market cap are mutable. Store each as a timestamped snapshot with fetch time; at replay only use rows with `fetched_at <= decision_time`. Treat GoPlus checks as of the time they were run; a later "honeypot" flag must not leak backward.
  - Snapshot timing: record both exchange/block time and local receive time; the replay clock should use receive time plus your bot's decision latency. API-cached candles (15-30 min staleness on some endpoints) must not be treated as real-time.
  - Delisted/dead pools: keep dead pools in the dataset with a terminal state (liquidity to ~0, no trades for N minutes). Realised exits must be modelled when liquidity vanishes (assume 100% loss or exit at last executable price, not last quoted price).
  - Fill assumptions: price mid or last-trade is not a fill. Fill against pool reserves (constant-product/CLMM math) at your size, add fee, priority fee/tip, and slippage tolerance; model non-landing and sandwich losses.
  - Trade-count/selection: pre-register universe filters (min liquidity, age) before looking at returns; apply them using data available at decision time.
- What to capture: pool creation event; per-pool reserves/price/liquidity at 1-5 s for the first hour, then 15-60 s (compactly via block-level swap events from Helius/RPC if possible); swap-level trades (this lets you rebuild any bar later); token security snapshot at discovery and re-check at intervals; creator/top holder concentration; your own decision logs, quotes, and actual fills.

### Gaps
- No peer-reviewed estimate found of how much survivorship inflates DEX token backtest returns specifically.
- Did not find primary documentation on how DexScreener/GeckoTerminal treat dead pools (whether they are purged from API responses).

## 2. Walk-forward and out-of-sample design, sample sizes, multiple-testing corrections

### Takeaway
Use time-ordered splits with embargo, count every configuration tried, and deflate the best Sharpe by the number of trials (Deflated Sharpe, PBO via CSCV); with fat-tailed memecoin returns, trade counts needed for significance are large, so prefer live paper forward-testing as the final out-of-sample set. Exact formulas below were not verified against the primary papers.

### Cited Findings
- Bailey and Lopez de Prado's Deflated Sharpe Ratio corrects for selection bias under multiple testing and for non-normal returns (JPM, 2014) — [SSRN 2460551](https://papers.ssrn.com/abstract=2460551)
- Probability of Backtest Overfitting estimated with combinatorially symmetric cross-validation (CSCV) — [SSRN 2326253](https://papers.ssrn.com/abstract=2326253)
- Authors state a high in-sample Sharpe is meaningless unless the number of trials is controlled for; Minimum Backtest Length (MinBTL) is a function of the number of trials — [Bailey et al. pseudo-mathematics paper](https://carmamaths.org/jon/backtest.pdf), [overfit tools](https://www.davidhbailey.com/dhbpapers/overfit-tools-at.pdf)
- Minimum Track Record Length (how many observations are needed for confidence a Sharpe exceeds a threshold, accounting for skew and kurtosis) — [Bailey & Lopez de Prado, Journal of Risk](https://www.risk.net/journal-risk/2223785/sharpe-ratio-efficient-frontier); implemented in R PerformanceAnalytics [MinTrackRecord](https://rdrr.io/cran/PerformanceAnalytics/man/MinTrackRecord.html)

### Inferences
(From general knowledge; formulas unverified here, check primary sources.)
- MinTRL approx: n >= 1 + [1 - skew*SR + ((kurt-1)/4)*SR^2] * (z_alpha / (SR - SR*))^2, per-period SR. Negative skew and high kurtosis (typical of memecoin payoffs, rare big wins and rug losses) inflate required n. Rough rule: a per-trade Sharpe of 0.1 against 0 at 95% needs on the order of 270+ independent trades before the skew/kurtosis penalty; per-trade Sharpe 0.05 needs on the order of 1,000+.
- Expected maximum Sharpe over N independent trials grows roughly like sqrt(2 ln N) times the cross-trial Sharpe std; so testing 1,000 parameter combinations produces a noise-only best Sharpe far above zero. Log N honestly (every threshold, filter and exit you tried).
- Protocol: (1) lock universe and feature definitions; (2) anchored or rolling walk-forward in time (train on weeks 1-k, test on k+1, with an embargo of at least the max holding time plus feature lookback); (3) tune only on training windows, report only concatenated out-of-sample results; (4) report DSR and PBO for the tuning procedure, plus White's Reality Check / Hansen SPA or a stationary-bootstrap on trade P&L (resample by day or by token to respect clustering; tokens launched in the same hour are correlated by market regime); (5) final untouched holdout period, then live paper, then small live. Prefer few parameters and plateaus over peaks.
- Report per-token and per-day clustered confidence intervals, not per-trade, since trades within one launch wave are not independent. Report median and tail (worst 5%) per trade, not just mean.

### Gaps
- Exact DSR, MinBTL and MinTRL formulas and numbers not retrieved from primary text.
- White's Reality Check / Hansen SPA were not researched; named from background knowledge only.
- No source on minimum sample sizes specific to memecoin strategies.

## 3. Paper-vs-live gap for DEX bots and calibrating execution models

### Takeaway
No rigorous published number for the paper-vs-live gap in DEX bots was found; evidence is practitioner claims and MEV measurements. The reliable approach is to log every live fill and fit your own slippage, landing-rate and latency model, treating backtest returns as an upper bound until calibrated.

### Cited Findings
- Practitioner posts say paper-trading bots lose money live because backtests omit liquidity, slippage, gas and execution speed — [kitemetric](https://kitemetric.com/blogs/mastering-solana-sniper-bot-backtesting) (low-quality, anecdotal)
- Self-reported Jito inclusion rates (e.g. 92% at a 500 microSOL-priority fee; +22% inclusion for +0.001 SOL) come from promotional bot posts and are unverified — [DEV Community](https://dev.to/apollo_ag/i-sniped-a-solana-token-in-400ms-heres-the-full-tech-stack-4eg6)
- A popular bot's default slippage tolerance reported as 15% — [programminginsider](https://programminginsider.com/the-best-sniper-bots-for-memecoin-trading-in-2026-ranked-by-speed-and-execution/) (promotional context)
- Solana sandwich bots extracted an estimated $29.7M gross over 11 months — [CryptoSlate/Bitquery](https://cryptoslate.com/solana-sandwich-bots-took-29-7-million-before-costs-bitquery-estimates/); a three-year study with ETH Zurich, Flashbots and others found about $28M recorded on Solana and notes protected order flow does not remove risk — [arXiv 2609.28115](https://arxiv.org/pdf/2609.28115), [Crypto Briefing](https://cryptobriefing.com/jupiter-ultra-sandwich-attacks-study/)
- Tight slippage tolerance reduces sandwiching (20-50% tolerance sandwiched 14x more than under 3%), at the cost of more failed transactions — [CryptoSlate](https://cryptoslate.com/solana-sandwich-bots-took-29-7-million-before-costs-bitquery-estimates/)

### Inferences
- Expect the gap to be large and mostly negative: slippage is higher on launches, failed/late landings remove the best entries (adverse selection: you land when others do not want the trade), and exits fail when liquidity vanishes. I found no defensible single percentage; treat any "X% haircut" as unknown until measured.
- Calibration plan: log per live trade quote price, expected out, tx signature, send time, landing slot/time, realised out, fee and tip. Fit (a) slippage = f(size/pool liquidity, token age, volatility), (b) landing probability and delay = f(tip, congestion), (c) sandwich loss frequency. Compare paper vs live P&L by matched trade (same signal), decomposing the gap into latency, price impact, fees and non-fills. Start live at minimum size (tens of trades) purely to measure, then re-run the backtest with the fitted model and require the strategy stay positive under pessimistic (e.g. 2x fitted slippage, 1 extra slot delay) settings.
- Use shadow quoting: at every paper decision, also call a Jupiter quote at that moment and log it; this gives real executable prices without trading.

### Gaps
- No peer-reviewed or independently verified paper-vs-live gap figure for DEX bots found.
- No verified Jito landing-rate or latency benchmark found.
- Did not read the arXiv 2609.28115 paper in full (only excerpts).

## 4. Free API rate limits, terms, and compact storage

### Takeaway
Free tiers allow modest continuous recording (tens of requests per minute), enough for a few hundred pools at 1-minute resolution only with batching; for second-level data, use on-chain swap events (Helius) rather than polling. Several numbers conflict between sources.

### Cited Findings
- DexScreener: latest token profiles endpoint 60 req/min (official reference listing, number truncated in snippet); pairs/search endpoints reported as 300 req/min by third-party docs, not confirmed on the official page — [DexScreener docs](https://docs.dexscreener.com/api/reference), [Codex comparison](https://codex.io/compare/codex-vs-dexscreener), [CoinGecko comparison](https://www.coingecko.com/learn/coingecko-api-vs-dexscreener-api)
- GeckoTerminal public API: 30 calls/min per official FAQ; CoinGecko keyless docs show about 10/min, apparently outdated (changelog says raised from 10 to 30 in April 2023). OHLCV `limit` max 1000 per request, default 100. A claimed 6-month OHLCV history limit is unverified — [GeckoTerminal FAQ](https://apiguide.geckoterminal.com/faq), [keyless docs](https://docs.coingecko.com/docs/keyless-public-api), [OHLCV ref](https://docs.coingecko.com/reference/token-ohlcv-token-address.md)
- CoinGecko Demo plan: 10K credits/month; per-minute limit stated as 30 on pricing page and 100 in error docs (conflict); attribution required; long daily history reserved for paid tiers; failed requests also count toward the rate limit — [pricing](https://www.coingecko.com/en/api/pricing), [rate limits](https://docs.coingecko.com/docs/errors-and-rate-limits)
- GoPlus free tier reported as 150K CU/month, 30K CU/day, 150 CU/min, batch calls not enabled (garbled snippet, needs confirmation) — [GoPlus](https://gopluslabs.io/security-api)
- Helius: figures conflict across pages: 1M credits with 10 RPC req/s and 2 req/s DAS on the rate-limits page, vs 2M credits and 50 RPC/s elsewhere; credits do not roll over — [Helius rate limits](https://helius.dev/docs/billing/rate-limits), [plans](https://www.helius.dev/docs/billing/plans)
- Birdeye: limits set per account across all endpoints, with Free/Premium/Business/Enterprise tiers and per-endpoint compute-unit costs; wallet endpoints 30 req/min; free-tier numbers not retrieved — [Birdeye rate limiting](https://docs.birdeye.so/docs/rate-limiting), [CU cost](https://docs.birdeye.so/reference/compute-unit-cost)
- Dune: Free plan is now view-only with no API access or credits (accounts predating July 21, 2026 lose 2,500 monthly credits); older docs cited 40 req/min on Free — [Dune pricing FAQ](https://docs.dune.com/learning/how-tos/pricing-faqs), [Crypto Briefing](https://cryptobriefing.com/dune-free-plan-view-only-access/), [rate limits](https://docs.dune.com/api-reference/overview/rate-limits)
- The Graph: 100,000 free queries/month; $2 per 100K beyond that on the pricing page ($4 per 100K in a Gnosis doc, conflict) — [The Graph billing](https://thegraph.com/docs/en/billing/), [pricing](https://thegraph.com/pricing.md)

### Inferences
- Budget: at 30 calls/min, GeckoTerminal yields 43,200 calls/day; one multi-pool call (if the endpoint supports batching up to ~30 addresses, unverified) could cover many pools. DexScreener at 300/min with up to 30 pairs per call (batching limit from my background knowledge, unverified) is the best free polling source. Respect terms: check each provider's ToS on redistribution/storage; CoinGecko requires attribution.
- Storage: write append-only Parquet (columnar, zstd) partitioned by date/source; store swaps and snapshots, derive bars at replay time; delta-encode timestamps and integer-scale prices; keep raw JSON for a short window for schema debugging; store `fetched_at`, `source`, `request_params` per row. Rough scale: 1 row of about 10 numeric columns compresses to tens of bytes, so millions of rows per day fit in tens of MB.
- Use on-chain recording (Helius webhooks/RPC logs) for ground truth and exact swap-level history; use APIs for metadata and cross-checks. Avoid Dune free tier for pipelines given the change.

### Gaps
- Official DexScreener, GeckoTerminal and GoPlus pages were unreachable; their limits are secondary-source.
- Birdeye free-tier numbers not found; Helius and CoinGecko figures conflict between pages.
- Terms-of-service wording on storage/redistribution of recorded data not retrieved for any provider.
- No source found for compression ratios; storage estimates are my own reasoning.
