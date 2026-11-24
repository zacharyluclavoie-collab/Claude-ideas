# High trade count with positive expectancy in short-term crypto trading: win rate vs trade count vs expectancy

Scope note: I skimmed the earlier notes in `research_notes/Profitable crypto strategies for small accounts/` first. They already cover CEX-DEX arbitrage concentration (arXiv 2507.13023), trend/momentum, Riksbank WP 413 on reversal, Dobrynskaya momentum/reversal horizons, the Deflated Sharpe Ratio, and why memecoin bots lose. Below I add only new material, or a direct reference back where the question needs it.

Access limits: WebFetch failed with DNS "not in allowed domains" for arxiv.org and journal.uii.ac.id, so I stopped fetching. The earlier notes record the same block for quantpedia.com and ar5iv. **Every finding below comes from search-engine snippets or summaries, not from reading the full text.** Numbers should be checked against the primary PDFs before anyone relies on them.

## 1. Market regime filters (BTC trend/volatility, risk-on/off) on altcoins and memecoins: measured effect

### Takeaway
No rigorous, cost-adjusted study measures what a BTC trend filter does to altcoin or memecoin trading. The evidence is a non-peer-reviewed journal paper using BTC-SMA gating on 7 large coins (results unread), blog-level backtests, and regime work showing momentum and factor premia flip sign between regimes. The direction is consistent: filters cut drawdowns. The size of the return effect is unverified.

### Cited Findings
- A UII *Enthusiastic* journal paper reallocates among 7 large coins (BTC, ETH, BNB, SOL, TON, TRX, XRP) every 3 days, only while BTC is above its 50-, 100- or 200-day SMA. The search snippet gave the design only. The page could not be fetched, so its results are **unverified** — [journal.uii.ac.id](https://journal.uii.ac.id/ENTHUSIASTIC/article/view/39963)
- Quantified Strategies (blog, 10-year backtest): a BTC-plus-altcoin trend strategy cut max drawdown to about 19%, versus more than 80% for buy-and-hold BTC. It notes that execution costs "drastically" shrink net returns. Low-to-medium confidence: vendor-style blog, method not checked — [quantifiedstrategies.com](https://www.quantifiedstrategies.com/which-trading-strategy-is-best-for-crypto-bitcoin-vs-altcoin/)
- A QuantConnect forum sweep of a BTC-filter switch (applied to QQQ/SHY, not altcoins) found the best Sharpe at interior SMA lengths (40-50 days) and a steady decline toward 70 days. That smooth plateau is the parameter-robustness pattern to look for — [QuantConnect forum](https://www.quantconnect.com/forum/discussion/21195)
- Breadth context: one report says about 84% of Binance spot tokens were below their 200-day MA. A 200-day filter on altcoins would therefore be risk-off most of the time, so the opportunity cost is large and the number of trades falls sharply — [coinotag](https://en.coinotag.com/bitcoin-outperforms-84-percent-altcoins-below-200-day-average)
- An Aalborg master's thesis (2026, not peer-reviewed): crypto momentum was strongly positive in the COVID recovery and negative in the 2022 crash. Momentum premia "vary significantly across regimes", and no factor had a significant Fama-MacBeth premium — [AAU thesis](https://projekter.aau.dk/projekter/files/839386480/master_thesis_final2026.pdf)
- Regime-model literature: Koki et al. (2022) found a 4-state HMM forecast BTC/ETH/XRP best out of sample, and a 3-state statistical jump model best explains returns with 400+ features (cited in a Springer *Digital Finance* paper) — [Springer](https://link.springer.com/article/10.1007/s42521-023-00085-x)
- Kaiko data via CryptoSlate: broad altcoin baskets returned negative results with volatility equal to or above equities. Small caps hit a 4-year low, and the "alt season" thesis is called dead. This is commentary, not a test — [CryptoSlate](https://cryptoslate.com/?p=510745)
- Block Scholes/Bybit: alt seasons have historically started at local peaks in BTC dominance, with rotation running BTC to ETH to smaller alts. Descriptive only — [Block Scholes](https://www.blockscholes.com/research/bybit-x-block-scholes-the-altcoin-rotation-why-and-when-altcoins-outperform-bitcoin)
- Earlier notes already list 200-day-MA regime evidence on BTC itself (shallower losses) — see `trend_momentum_liquid.md` §3.

### Inferences
- For a small altcoin/DEX bot, a BTC-trend filter mainly works as a drawdown and trade-count governor. It removes most trades in bear regimes, when altcoin baskets lose money (Kaiko/CryptoSlate). It probably raises win rate and expectancy on the trades that remain, but cuts the total number of trades. Treat filter length as one parameter on a plateau (40-200 days) rather than an optimized value.
- Because premia change sign across regimes (AAU thesis), a backtest that pools 2021 and 2022 can show a positive average that applies to neither regime. Report results per regime.

### Gaps
- No cost-adjusted study of BTC-trend or BTC-volatility filters on memecoin or new-DEX-token strategies was found.
- The UII paper's numbers could not be read.
- No source measures a BTC-volatility filter (as opposed to a trend filter) on altcoins.

## 2. Mean reversion / stat arb on liquid tokens: returns, capacity, costs

### Takeaway
Short-horizon reversal in crypto is statistically real and widespread. The strongest new evidence finds it in 90% of Binance pairs at 15 minutes. However, the gross edge (about 1.3 bp per trade) is far below realistic round-trip costs (about 5 bp or more), so it does not pay a taker. Pairs/cointegration studies are mixed to negative once costs are included. CEX-DEX arbitrage is dominated by 3 searchers (already in earlier notes). The plausible small-trader angle is earning, not paying, the spread, which turns this into market making with adverse-selection risk.

### Cited Findings
- Kitron and Wengrowicz, arXiv 2608.21888 (Aug 2026 preprint, independent authors, not peer-reviewed): under a matched, strictly out-of-sample protocol, **90% of 183 Binance pairs show significant directional reversal at 15-minute horizons, against 2.7% of 187 US stocks/ETFs**, in every coin-year since 2021. **The gross edge peaks near 1.3 bp per trade against a 5 bp round-trip cost**, so the effect is detectable but cannot clear spot costs for a taker. Snippet only — [arXiv 2608.21888](https://arxiv.org/pdf/2608.21888), [IDEAS](https://ideas.repec.org/p/arx/papers/2608.21888.html)
- MDPI *JRFM* paper on hourly Kraken data, 2016-2025: time-of-day reversal and momentum patterns differ between BTC and ETH (ETH shows a positive night component and daytime reversal). Its cost scenarios are only 0-2 bp and exclude slippage, impact and funding, so net profitability is unresolved — [MDPI JRFM 19/9/692](https://www.mdpi.com/1911-8074/19/9/692)
- An informal BTC "power hour" mean-reversion analysis after the ETF launch: gross Sharpe positive, net Sharpe about -0.09 after costs. Low confidence, a single unverified blog — [MEXC news](https://www.mexc.com/news/621960)
- Brunel overreaction working paper: once transaction costs are included, abnormal reversal returns become "very small and statistically insignificant" — [Brunel](https://www.brunel.ac.uk/economics-finance-and-accounting/research/pdf/1801-Jan-GMC-Price-Overreactions-In-The-Cryptocurrency-Market.pdf)
- CERGE-EI WP 730 (with Riksbank WP 413, already in earlier notes): short-term reversal is a liquidity-provision premium, concentrated in low-volume pairs and tied to inventory risk and adverse selection — [CERGE-EI](https://www.cerge-ei.cz/pdf/wp/Wp730.pdf)
- Quantpedia summary: momentum appears cross-sectionally in the largest cryptos, reversal in the smallest. The Quantpedia BTC "MIN" (buy-the-low) reversal strategy (in-sample 98.43% annual return, -37.67% MDD) **did not hold up out of sample** in the revisit, while the "MAX" (breakout) version did — [Quantpedia](https://quantpedia.com/trend-following-and-mean-reversion-in-bitcoin/), [Quantpedia revisit](https://quantpedia.com/revisiting-trend-following-and-mean-reversion-strategies-in-bitcoin/?a=6080)
- Pairs trading:
  - Tadi and Kortchemski (arXiv 2109.10662) argue that earlier pairs studies assuming zero costs are unreliable — [arXiv 2109.10662](https://arxiv.org/abs/2109.10662)
  - A Católica Porto dissertation found all cointegration pairs portfolios underperformed buy-and-hold, with or without costs — [UCP](https://repositorio.ucp.pt/bitstreams/e0abbbf7-96a1-4333-88ae-a6f05fb7fcce/download)
  - An Erasmus thesis reported 5.97-6.81% weekly after costs, but over only 16 weeks of data, so treat it as noise — [EUR thesis](https://thesis.eur.nl/pub/47732/Bruijn-de.pdf)
  - A 2020 IEEE Access study of 26 Binance coins found pairs strategies underperform benchmarks, despite intraday mean-reverting behaviour — [DOAJ/IEEE](https://doaj.org/article/8fbfa5ffeaae44a5a4c635f23f5ca05c)
- An ML stat-arb study (MDPI *JRFM* 2019, random forest): 7.1 bp per day after 15 bp per half-turn costs. The sample predates 2019 and has not been replicated recently — [MDPI](https://mdpi.com/1911-8074/12/1/31)
- Cross-exchange arbitrage magnitudes "decreased greatly from April 2018 onward" (Crepellière, Pelster and Zeisberger) — [Paderborn TAF WP 067](https://wiwi.uni-paderborn.de/fileadmin-wiwi/cetar/TAF_Working_Paper_Series/TAF_WP_067_CrepellierePelsterZeisberger2022_rev.pdf)
- CEX-DEX arbitrage, Aug 2023 to Mar 2025: $233.8M across 7.2M arbitrages by 19 searchers, with the top 3 taking about 75%. Already in `arb_mm_copy_airdrop.md` — [arXiv 2507.13023](https://arxiv.org/html/2507.13023v2)

### Inferences
- Reversal gives a high trade count and a decent win rate, but the per-trade edge is smaller than taker costs. The only route to positive expectancy is to cut costs: maker fills (rebates or 0 fees), fee-tier exchanges, or wider-move triggers that occur less often. Each of these either adds adverse selection (maker fills get picked off on the moves that keep going) or reduces trade count.
- On DEXs, swap fees (5-30 bp per side on AMMs) plus gas and MEV make 15-minute reversal on liquid tokens almost certainly negative for a taker. That is my arithmetic applied to the 1.3 bp gross figure.

### Gaps
- No documented capacity figure for reversal strategies a small trader could use.
- No cost-adjusted study of DEX-vs-CEX dislocations that a non-builder-connected trader can capture.
- Snippets did not give the 2608.21888 maker-execution scenario, if the paper has one.

## 3. Grid trading / range bots: realistic results

### Takeaway
Theory says a static grid has roughly zero expected return under a random walk, before fees. A 2025 dynamic-grid paper reports beating buy-and-hold on BTC/ETH for 2021-2024, mainly through a lower drawdown, but it **assumes no fees**. Independent and retail evidence is anecdotal and mixed: grids profit in ranges and get stranded with losses in trends. Grids have the classic profile of high win rate, many trades and negative skew.

### Cited Findings
- Chen, Chen and Jang, arXiv 2506.11921 (June 2025): under simple assumptions a traditional grid's expected return is essentially zero. Their Dynamic Grid Trading (DGT) resets the grid as price moves. The backtest used 1-minute Binance BTC and ETH data from Jan 2021 to Jul 2024, with ranges of 10k-80k for BTC and 500-5k for ETH. Reported results:
  - BTC: DGT's IRR was above buy-and-hold with a much lower MDD.
  - ETH: the IRR edge was small. Against a market fall of about 80%, DGT limited drawdown to about 50%.
  - **The paper assumes zero transaction fees.**

  A secondary source quotes a 60-70% IRR, which I could not confirm — [arXiv abs](https://arxiv.org/abs/2506.11921v1), [alphaXiv](https://www.alphaxiv.org/abs/2506.11921v1), [code](https://github.com/colachenkc/Dynamic-Grid-Trading), [Neutralis summary](https://neutralis.finance/insights/market-making-beat-market-research)
- A search summary says student and third-party replications reported negative or modest returns (for example the HCMUS DynamicGrid course project). Low confidence: I did not see their numbers — [GitHub algotrade-education/DynamicGrid](https://github.com/algotrade-education/DynamicGrid)
- Jia (ICEMME 2023): grid trading on BTC daily data from Jul 2019 to Jul 2021 is "feasible", with parameter sensitivity tested. Short bull-heavy sample — [EUDL](https://eudl.eu/doi/10.4108/eai.18-11-2022.2327164)
- Retail anecdotes on Binance Square (unverified screenshots):
  - SUI grid backtest: ROI -33.31%, MDD 45.59%.
  - BTC grid: +7.35% while BTC rose +14.15%.
  - XRP range grid: +27.74%.
  - Grids stranded outside their range at about -23%.

  — [Binance Square #GridBot](https://www.binance.com/square/hashtag/GridBot)
- A DEV.to author's 576-configuration SOL grid sweep: the best configuration made +11.7% while SOL fell 37%. Picking the best of 576 is a textbook selection-bias case (see §4) — [DEV.to](https://dev.to/tatelyman/python-async-grid-trading-bot-for-solana-architecture-and-backtest-results-57b)
- No independent aggregate data on the share of Pionex or Binance grid users who profit was found. The available material is platform marketing — [Pionex Medium](https://medium.com/pionex/keep-50-of-the-exchange-trading-fee-as-your-profit-pionex-vs-binance-48af64f1f898)
- Hummingbot pure market making (the grid's close cousin):
  - Liquidity-miner interviews describe results as "roughly break-even, possibly slightly profitable" before incentives — [Hummingbot blog](https://hummingbot.org/blog/interview-with-liquidity-miner-dominator008/)
  - One FIRO campaign participant reported -0.90% — [FIRO forum](https://forum.firo.org/t/2022-firo-hummingbot-campaign/2290/9)
  - An ad-supported review's 7-day BTC/USDT test was net-negative on every trade. Low confidence — [GN Crypto](https://www.gncrypto.news/trading-bots/hummingbot-review/)

### Inferences
- A grid "wins" nearly every completed cycle (spacing minus 2x fees), so it reports a very high win rate and trade count. The losses sit in unrealised inventory when price trends out of the range. Win rate is therefore a misleading metric for grids; judge them by mark-to-market P&L against holding the same inventory.
- Fee-free backtests (DGT) overstate results most for tight grids, because cost per cycle is fixed while profit per cycle shrinks with spacing. Spacing must be several multiples of round-trip cost.

### Gaps
- No peer-reviewed, cost-inclusive live grid study.
- No independent survey of retail grid-bot outcomes.

## 4. Win rate vs payoff ratio, evaluation metrics, sample sizes, multiple testing

### Takeaway
Win rate alone says nothing about profitability. Expectancy = win% x average win - loss% x average loss, and tightening take-profits mechanically trades average win for win rate. Under a driftless price process, moving the barriers changes win rate but not gross expectancy, and costs make every such setting negative. Professionals use expectancy, profit factor and Sharpe, deflated for the number of trials. Trusting a win rate takes hundreds of trades. Trying many rules quickly produces spurious Sharpe ratios around 1: Bailey et al. show that with 5 years of daily data, more than about 45 configurations nearly guarantees an in-sample Sharpe of 1 or more with an expected out-of-sample Sharpe of 0.

### Cited Findings
- Worked example: a 40% win rate with a $250 average win and $100 average loss gives +$40 per trade, while a 60% win rate with a $100 average win and $200 average loss gives -$20 per trade — [ActionForex](https://www.actionforex.com/?p=26232)
- Raising reward-to-risk (wider target or tighter stop) lowers win rate, and the reverse also holds. No universal optimal ratio exists. These are educational and practitioner sources, not empirical studies — [TradingView](https://www.tradingview.com/chart/BTCUSD/vlCXFUXT-The-Sweet-Spot/?amp), [BabyPips](https://www.babypips.com/trading/psychology-how-to-find-reward-risk-ratio-works-for-you-2026-03-26), [TradeZero](https://tradezero.com/blog/your-win-rate-could-be-lying-to-you)
- I found **no empirical study** that measures how tightening take-profits changes average win in crypto strategies. The evidence is mechanical or educational only.
- Bailey, Borwein, López de Prado and Zhu, "The Probability of Backtest Overfitting" (J. Computational Finance 2017): published backtests rarely disclose the number of trials, so many findings are false positives. They propose estimating PBO with combinatorially symmetric cross-validation (CSCV) — [SSRN 2326253](https://papers.ssrn.com/abstract=2326253), [escholarship PDF](https://escholarship.org/content/qt4w1110bb/qt4w1110bb.pdf)
- Minimum Backtest Length (MinBTL): with 5 years of daily data, testing no more than about 45 independent configurations keeps the expected maximum in-sample Sharpe below 1 by chance. Beyond that, an in-sample Sharpe of 1 or more is nearly guaranteed while the expected out-of-sample Sharpe is 0 — [Bailey et al. (BODT)](https://carmamaths.org/jon/BODT.pdf), [overfit tools](https://www.davidhbailey.com/dhbpapers/overfit-tools-at.pdf), [CXO Advisory](https://www.cxoadvisory.com/big-ideas/insidiousness-of-overfitting-investment-strategies-via-iterative-backtests)
- At a 5% significance level, about 1 in 20 trials is expected to pass by chance — [carmamaths backtest.pdf](https://carmamaths.org/jon/backtest.pdf)
- The Deflated Sharpe Ratio adjusts the significance threshold for number of trials, skew and kurtosis. It is already in `risk_expectations.md` — [SSRN 2460551](https://papers.ssrn.com/abstract=2460551)

### Inferences (own arithmetic, standard statistics, not from a source)
- **Win-rate precision.** The standard error of a win rate is sqrt(p(1-p)/n). At p = 55%:

  | Trades (n) | Approx. 95% interval |
  |---|---|
  | 100 | ±9.8 pp |
  | 400 | ±4.9 pp |
  | 1,000 | ±3.1 pp |

  About 400 trades are needed to tell 55% apart from 50% at roughly 2 standard errors.
- **Expectancy precision.** A t-stat of about 2 needs n ≈ 4 / (per-trade mean/sd)². With a per-trade "Sharpe" of 0.1 that is about 400 trades; at 0.05 it is about 1,600 trades. Skewed payoffs (rare big memecoin wins) raise these numbers further, because a few outliers dominate the mean.
- **Barrier arithmetic.** For a driftless price with a symmetric stop and target, P(target first) ≈ SL / (SL + TP). Shrinking TP raises win rate exactly enough to keep gross expectancy at 0, and each round trip's fixed cost makes it negative. A filter therefore "raises win rate without lowering expectancy" only if it changes the conditional drift (true information), not just the barrier geometry.
- **Practical test for a new filter.** Win rate, average win and average loss should all improve or hold, and expectancy per trade after costs should not fall. A useful add-on is total expectancy (expectancy x trades): a filter that halves trade count must more than double per-trade edge to raise total profit. Fix the number of rule variants in advance, record every one tried, and apply the deflated Sharpe or PBO.
- **Cost drag grows with trade count.** Cost per trade is fixed while gross edge per trade usually shrinks as signals are loosened to trade more often. The reversal evidence in §2 (1.3 bp gross vs 5 bp cost) is a concrete crypto case.

### Gaps
- No crypto-specific measurement of win rate vs average win under take-profit tightening.
- No profit-factor benchmarks for live crypto bots.
- The MinBTL formula was not retrieved verbatim.

## 5. Position count and diversification for skewed-payoff tokens

### Takeaway
Direct evidence on how the number of concurrent small positions affects risk-adjusted results for memecoin/altcoin strategies was not found. Indirect evidence says crypto returns are fat-tailed and right-skewed, right-tail co-movement is stronger than left-tail, and naive equal weighting survives costs. Skewness itself is priced: high-skew coins return more with deeper drawdowns. Spreading over many positions mainly helps you hold the rare right-tail winners; it does not diversify away common crashes.

### Cited Findings
- Quantpedia skewness/lottery strategy: higher-skew quartile and tercile portfolios earned 32.02% and 35.41%, with higher volatility (32.31%) and max drawdown (29%) for the quartile portfolio. The long-short design is rebalanced monthly — [Quantpedia](https://quantpedia.com/skewness-lottery-trading-strategy-in-cryptocurrencies/)
- Nottingham study: right-tail co-movement among cryptocurrencies is stronger than left-tail, and diversification "can be accomplished simply by employing the naïve equal-weighted scheme even when transaction costs are taken into account" — [Nottingham repository](https://nottingham-repository.worktribe.com/OutputFile/4739516)
- Stanford (Boyd et al.) crypto portfolio paper: heavy tails, excess kurtosis and asymmetric returns in cryptocurrencies — [Stanford PDF](https://www-leland.stanford.edu/~boyd/papers/pdf/crypto_portfolio.pdf)
- Earlier notes (`why_bots_lose.md`) record memecoin survival below 1.4% and the concentration of launch-period gains among insiders, so the right tail is thin and hard to reach.

### Inferences
- With strongly right-skewed tokens, the median single position loses and the mean is carried by a few winners. Many small, equal-sized positions raise the probability of catching the winners and make realised returns converge toward the mean, which helps only if that mean is positive after costs. If the mean is negative (most memecoin evidence), more positions just make the loss more certain.
- Because altcoins crash together (high common BTC beta), the diversification benefit is mostly idiosyncratic, on the upside, rather than drawdown protection. That is the reason to pair it with a regime filter (§1).
- Per-position fixed costs (gas, priority fees, minimum sizes) set a floor on position size for small accounts, which caps the useful number of concurrent positions.

### Gaps
- No study of portfolio breadth (N positions) against Sharpe or drawdown for memecoin or new-token strategies.
- No power-law fit of DEX token returns relevant to position sizing was found in this pass.
