# Trend-following, momentum and mean-reversion on liquid crypto (BTC, ETH, SOL, top-50) after costs

Access caveat: WebFetch failed for every host tried (concretumgroup.com, acfr.aut.ac.nz, quantpedia.com, arxiv.org, ar5iv, abarbon.com: DNS "not in allowed domains"). All findings below come from WebSearch result summaries, not from reading full papers. I could not verify exact Sharpe/CAGR/drawdown figures in the primary texts. Treat every number as secondary and unverified unless stated. Several key figures the objective asked for (CAGR, per-strategy cost assumptions, 2022 results of the Zarattini et al. paper) were NOT found.

## 1. Time-series momentum / MA / Donchian trend following on BTC/ETH: published results, costs, recent years

### Takeaway
Published academic and practitioner work reports positive risk-adjusted results for ensemble Donchian trend on BTC and large coins, but I could only verify abstract-level claims. Simple retail-style backtests of single-lookback Donchian on BTC for 2022-2026 show mediocre Sharpe (about 0.4) and 35-40% drawdowns, and buy-and-hold is a high bar.

### Cited Findings
- Zarattini, Pagani, Barbon, "Catching Crypto Trends: A Tactical Approach for Bitcoin and Altcoins" (SSRN 5209907, Swiss Finance Institute RP 25-80, posted May 2025, revised Oct 2025). Combines several Donchian channel models with different lookbacks into one signal with volatility-based position sizing. On a rotating top-20 most-liquid-coin portfolio it reports net-of-fees Sharpe above 1.5 and annualized alpha of 10.8% vs Bitcoin. — [IDEAS/RePEc](https://ideas.repec.org/p/chf/rpseri/rp2580.html), [Barbon page](https://abarbon.com/papers/catching-crypto-trends), [Concretum](https://concretumgroup.com/catching-crypto-trends-a-tactical-approach-for-bitcoin-and-altcoins/) (figures from search summary only; pages not opened; BTC-only Sharpe, drawdown, fee/slippage assumptions NOT confirmed)
- Same group's intraday Bitcoin trend work reports gross-of-fees Sharpe about 1.6 for 2018-2025 (separate study; gross, so not comparable) — [Concretum](https://concretumgroup.com/seasonality-in-bitcoin-intraday-trend-trading/) (search summary only)
- Hudson & Urquhart, "Technical trading and cryptocurrencies", Annals of Operations Research (2021): break-even transaction costs reported as substantially higher than typical crypto costs, i.e. rules stay profitable after realistic costs (abstract-level; full methodology and numbers unverified) — [Springer](https://link.springer.com/article/10.1007/s10479-019-03357-1)
- Study of 69 moving-average and breakout rules: costs reduce odds of rule-based gains for Ripple and Litecoin but increase them for BTC and ETH (paraphrased from abstract; paper not identified by name in my notes) — [Emerald JCMS](https://emerald.com/insight/content/doi/10.1108/JCMS-10-2021-0030) (low confidence on attribution)
- Rozario et al. (2020): walk-forward test of SMA/EMA/DEMA rules on Bitcoin 2011-2019 found no predictable, attractive Sharpe when training on year Y and testing on Y+1; abstract also cites 255% walk-forward annualised returns, so evidence is mixed — [Glasgow eprints](https://eprints.gla.ac.uk/302711/1/302711.pdf)
- Grayscale (2023): BTC moving-average rules reduce volatility/drawdowns over 2012-2023; highest Sharpe when short MA is about 10-30 days; 20/100 crossover tested; in-sample, industry report — [Grayscale](https://research.grayscale.com/reports/the-trend-is-your-friend-managing-bitcoins-volatility-with-momentum-signals)
- WisdomTree backtest: Bitcoin momentum strategy Sharpe 1.04 vs 0.84 for Bitcoin; max drawdown -64% vs -83.4% for BTC (issuer marketing content, in-sample) — [WisdomTree](https://www.wisdomtree.com/dk/insights/blog/enhancing-bitcoin-returns-using-momentum)
- Quantpedia example: adding a trend filter improved BTC max drawdown from -23.9% to -12.4% and Sharpe from 0.33 to 0.80 (context of the example unclear) — [Quantpedia](https://quantpedia.com/how-to-design-a-simple-multi-timeframe-trend-strategy-on-bitcoin/?a=6080) (low confidence)
- Retail-site backtest: BTC daily 20/10 Donchian, 0.1% taker fee, Jan 2022-Jun 2026: total return 36.5%, max drawdown 38.5%, Sharpe 0.38, 25 trades; a different longer window on same site shows Sharpe about 1.06 with -37% drawdown; windows not comparable — [CoinQuant](https://www.coinquant.ai/strategies/btc-donchian-channel-3d-backtest) (blog/aggregator, low confidence)
- Same search: BTC buy-and-hold in one crypto backtest set: net +976%, worst daily drawdown -76.6%, 2022 return -64.2% — [DEV Community](https://dev.to/maymay5692/i-backtested-49-crypto-trading-strategies-heres-every-single-result-4gg5) (blog, low confidence; period not confirmed)
- Equity-market illustration of fee sensitivity for Donchian 20/10 (S&P 500, not crypto): 7.84% frictionless, 5.24% at 10 bps, 1.44% at 25 bps, -4.61% at 50 bps — [quantifiedtrader](https://quantifiedtrader.com/backtest/strategies/donchian/) (different asset; shows turnover x cost mechanism only)

### Inferences
- A single-lookback 20/10 Donchian on BTC in 2022-2026 likely adds little over buy-and-hold on return but cuts drawdown versus -75% to -80% buy-and-hold; the value is drawdown control, not alpha.
- Multi-lookback ensemble plus vol sizing (Zarattini et al.) is the most credible bot-friendly rule family, but its quoted Sharpe above 1.5 is on a top-20 rotating basket with hindsight-free-ish selection that I could not audit.
- BTC/ETH/SOL with taker fees of roughly 0.05-0.1% and daily rebalancing: costs are small relative to trend moves, so costs matter more for hourly/intraday or alt-heavy baskets.

### Gaps
- Could not open any primary paper; no confirmed CAGR, max drawdown, turnover, or fee/slippage assumption for Zarattini et al.
- No verified 2022-specific performance of the ensemble Donchian rule.
- Grobys-authored BTC trend paper not located by name (search returned his momentum/volatility work only).

## 2. Cross-sectional momentum, size and reversal in top-50 coins; short-horizon reversal vs momentum

### Takeaway
Size and momentum are documented cross-sectional factors, but cross-sectional momentum is sample-dependent and often fragile after costs in liquid coins, while time-series momentum looks stronger. Horizon matters: positive momentum up to 2-4 weeks, reversal beyond one month in broad samples.

### Cited Findings
- Liu, Tsyvinski & Wu, "Common Risk Factors in Cryptocurrency", Journal of Finance 77(2), 2022: three factors (market, size CSMB, momentum CMOM) explain the cross-section; sample coins with cap above $1M, 2014-2018 (109 to 1,583 coins); small coins earn more, momentum positive — [EconPapers](https://econpapers.repec.org/RePEc:bla:jfinan:v:77:y:2022:i:2:p:1133-1177), [NBER](https://www.nber.org/papers/w25882.pdf). Reports momentum stronger among larger coins; a separate 78-coin study reports it stronger in small coins (conflict) — [Alpha Architect](https://alphaarchitect.com/factors-investing-in-cryptocurrency/)
- Fieberg, Liedtke, Poddig, Walker, Zaremba, "A Trend Factor for the Cross-Section of Cryptocurrency Returns", JFQA 2025: CTREND aggregates price/volume signals across horizons with ML on 3,000+ coins; reported to survive transaction costs and persist in big, liquid coins, significant up to 4-week holding periods — [Cambridge JFQA](https://www.cambridge.org/core/journals/journal-of-financial-and-quantitative-analysis/article/trend-factor-for-the-cross-section-of-cryptocurrency-returns/4C1509ACBA33D5DCAF0AC24379148178)
- Han, Kang, Ryu, time-series and cross-sectional momentum in crypto: after accounting for transaction costs and daily price fluctuations many momentum portfolios are liquidated and significant returns become insignificant; large liquid coins only; evidence of time-series momentum strong, cross-sectional weak — [AUT/ACFR PDF](https://acfr.aut.ac.nz/__data/assets/pdf_file/0009/918729/Time_Series_and_Cross_Sectional_Momentum_in_the_Cryptocurrency_Market_with_IA.pdf) (search snippet only)
- Dobrynskaya (2023), 2,000 largest coins 2014-2020: positive momentum up to 2-4 weeks, significant reversal beyond one month, driven by past losers; weekly rebalancing costly — [HSE summary](https://spb.hse.ru/en/news/559533243.html) (secondary)
- Riksbank WP 413: short-term-reversal (liquidity provision) returns concentrate in low-activity pairs, which suggests weaker reversal in the most liquid coins (conflicts with CTREND survives-in-large-coins claim) — [Riksbank](https://www.riksbank.se/globalassets/media/rapporter/working-papers/2022/no.-413-trading-volume-and-liquidity-provision-in-cryptocurreny-markets.pdf)
- A Fieberg/Liedtke/Zaremba entry reports momentum prevails in larger coins but incurs substantial trading costs and draws alpha largely from short positions (paper not confirmed) — [Bremen repository](https://media.suub.uni-bremen.de/handle/elib/8606?locale=de) (unverified)
- Liu & Tsyvinski earlier work: 1-12 month cross-sectional momentum not generally significant per one summary; Peng & Shams (1,160 coins) report reversal at 1-4 week proxies (conflicting with Dobrynskaya's short-horizon momentum) — [Duncker & Humblot](https://elibrary.duncker-humblot.com/article/60791/download) (secondary)

### Inferences
- Short-side alpha is largely unavailable to small spot-only accounts, so long-only cross-sectional implementations capture only part of the published premium.
- A small account trading top-50 coins should expect the cross-sectional edge to be weaker than published (shorts, liquidity, fees, wider spreads on mid-caps).
- Hour/day reversal in the most liquid coins: no clean cost-adjusted evidence found; sources conflict.

### Gaps
- No verified net Sharpe/CAGR for long-only top-50 cross-sectional momentum or reversal.
- No hourly/daily reversal paper with explicit costs for top-50 coins.

## 3. Vol-targeting, regime filters, simple bot rules including 2022

### Takeaway
Vol management and simple MA/regime filters consistently reduce drawdown in backtests; the Sharpe gain depends on lookback and sample. Single-rule results in 2022 are not well documented in sources I could verify.

### Cited Findings
- Volatility management is reported to mitigate crypto momentum crashes (large-cap coins; crash sensitive to a December 2020 episode) — [Osuva (Grobys et al.)](https://osuva.uwasa.fi/server/api/core/bitstreams/c9b4eafc-561e-439e-905b-1e1c1edb8adb/content) (search summary)
- 200-day-MA regime split (bull/bear/sideways): trend sleeve toggling BTC/cash kept losses shallower — [KuCoin news](https://www.kucoin.com/news/flash/bitcoin-portfolio-allocation-study-reveals-risk-return-tradeoffs), [edgeX](https://pro.edgex.exchange/en-US/news/article/backtesting-bitcoin-60-40-portfolio) (exchange content, low confidence)
- Quantpedia revisit of BTC trend and mean-reversion rules: the MAX-type strategy remains very effective out-of-sample while the MIN-type is weaker than in-sample — [Quantpedia](https://quantpedia.com/revisiting-trend-following-and-mean-reversion-strategies-in-bitcoin/) (summary only; rule definitions not verified)
- 2026 preprint "AdaptiveTrend": Sharpe 2.41, max drawdown -12.7%, Calmar 3.18 over 2022-2024 test, 150+ pairs; self-reported by small independent authors, treat as unreplicated — [arXiv 2602.11708](https://arxiv.org/html/2602.11708v1) (not opened)
- A 2026 master's thesis reports a momentum factor turning negative during the 2022 crash — [AAU thesis](https://projekter.aau.dk/projekter/files/839386480/master_thesis_final2026.pdf) (low confidence)

### Inferences
- Bot-simple candidate rules: ensemble of Donchian breakouts (e.g. 20/50/100-day lookbacks), long-only/flat for spot, vol-targeted sizing, 100-200 day MA as regime filter. Documented performance for specific lookbacks (20/50 breakout, 100-day MA) with 2022 included was NOT found in verified sources.

### Gaps
- No verified 2022-specific drawdown/return for 100-day MA or 20/50 breakout on BTC/ETH/SOL.
- Could not retrieve Quantpedia/arXiv full texts.

## 4. Data-mining and decay evidence

### Takeaway
Evidence suggests crypto momentum is real but fragile: sample-dependent, crash-prone, liquidity-driven in small coins, and rarely tested with multiple-testing corrections. I found no rigorous post-2022 decay study.

### Cited Findings
- Earlier high momentum payoffs may stem from illiquid small caps; conclusions depend strongly on sample period — [Osuva (Grobys)](https://osuva.uwasa.fi/server/api/core/bitstreams/994474fd-8d6c-4669-9f43-98836145cad6/content) (search summary)
- Glasgow study notes some prior crypto technical-analysis research ignores data snooping — [Glasgow eprints](https://eprints.gla.ac.uk/302711/1/302711.pdf)
- A Bakker thesis reports profitable strategies even after data-snooping and cost adjustment (thesis-level, weak) — [Erasmus thesis](https://thesis.eur.nl/pub/41546/Bakker.pdf)
- Grobys and Sapkota (2019) first crypto momentum study, 78 coins 2015-2018; later work reports trimmed average payoff 0.93% per week (sample-dependent) — [Osuva](https://osuva.uwasa.fi/server/api/core/bitstreams/c9b4eafc-561e-439e-905b-1e1c1edb8adb/content)
- Out-of-sample decay example at rule level: Quantpedia MIN strategy weaker than in-sample — see section 3.
- 2022 study on 11+ coins questions value of technical and fundamental analysis on crypto — [IDEAS](https://ideas.repec.org/a/eee/intfin/v79y2022ics1042443122000816.html) (abstract-level)

### Inferences
- Most published Sharpe ratios above 1.5 span 2018-2024 when BTC rose from about $3k to above $100k; trend rules benefit from that single secular up-move. Expect lower forward Sharpe (my estimate: roughly 0.5-1.0 for BTC-only trend) and treat headline numbers as upper bounds. This is judgment, not sourced.

### Gaps
- No deflated-Sharpe/multiple-testing study on crypto trend found; no direct measurement of 2023-2026 decay.
