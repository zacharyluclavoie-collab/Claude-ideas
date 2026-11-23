# Risk management, skewed payoffs and realistic expectations for small crypto accounts

Access notes: pmc.ncbi.nlm.nih.gov, eprints.lancs.ac.uk and institutionalinvestor.com could not be fetched (host not in the session's allowed network domains). Their content below comes only from search-result excerpts and is marked as such. Most other pages were seen only as search snippets, not full text. About 11 tool calls used. No full-text tables were read, so exact figures should be rechecked before publication.

## Position sizing under uncertain edge (Kelly, fractional Kelly, vol targeting, drawdown control)

### Takeaway
Theory favours fractional Kelly when the edge is estimated with error. Full Kelly has a very high drawdown probability, and the main danger is an overstated mean. Volatility scaling has mixed empirical support: positive in the original paper, contested in later replications. I found no solid measured evidence on circuit breakers for crypto.

### Cited Findings
- (Theory) MacLean, Thorp and Ziemba: Kelly maximises long-run exponential growth but is risky in the short term. Estimation error can be moderated by betting a fraction lambda (0 to 1) of Kelly. Authors say growth-maximising investors should bet Kelly or less. Seen as search excerpts only. — [MacLean/Thorp/Ziemba, Long-term capital growth (eScholarship)](https://escholarship.org/content/qt5mr5k8qj/qt5mr5k8qj.pdf); [Ziemba/MacLean chapter](https://www.maths.ed.ac.uk/mckinnon/blackouts/StochOptFinanceAndEnergySpringer/Chap1_KellyZiemba.pdf)
- (Theory) Ziemba/MacLean chapter warns that Kelly is highly sensitive to parameter estimates, especially means, and is dangerous when they are wrong. — [Chap1 KellyZiemba](https://www.maths.ed.ac.uk/mckinnon/blackouts/StochOptFinanceAndEnergySpringer/Chap1_KellyZiemba.pdf)
- (Theory) A summary of Thorp's drawdown analysis states that for full Kelly the probability of a 50% drawdown is 50%. Low confidence: PMC page was unreachable and this is from a search snippet; the 50% figure is the standard result for a bet-to-halve event, but verify. — [PMC9955835](https://pmc.ncbi.nlm.nih.gov/articles/PMC9955835)
- (Theory) 2025 arXiv paper: fractional Kelly with full information is equivalent to full Kelly on shrinkage estimators of returns, i.e. fractional Kelly is a formal shrinkage of an uncertain edge. — [Hakobyan & Lototsky](https://www.arxiv.org/pdf/2503.17927)
- (Simulation, blog) One simulation reports half Kelly protects against negative growth from overbetting while giving up at most about 25% of growth; specific to the blog's assumptions. — [Downey blog](https://matthewdowney.github.io/uncertainty-kelly-criterion-optimal-bet-size)
- (Measured, contested) Moreira & Muir: scaling by inverse of prior-month realised variance raised market Sharpe about 25% (alpha 4.9%) and factor Sharpes by 50-100% of original. — [NBER w22208](https://www.nber.org/papers/w22208). Contested: Cederburg et al. (2019) find no statistical evidence of Sharpe or CER improvement across 104 equity strategies; another replication finds gains for only 5 of 9 factors. — [Lehigh COWY PDF](https://www.lehigh.edu/~xuy219/research/COWY.pdf) (snippet only). Equity evidence, not crypto.

### Inferences
- With a small crypto account the edge estimate is likely noisy and optimistic (see validation section), so sizing at well under half of the backtest-implied Kelly is defensible; treat "Kelly" as an upper bound, not a target.
- Fixed-fractional risk per trade (for example 0.5-1% of equity at the stop) plus a volatility-scaled gross exposure cap is the simplest robust implementation; this is a practitioner judgement, not something established by the sources above.
- Circuit breakers and trend filters: no empirical crypto evidence found. Treat as unproven risk controls that cut tail risk by construction but also cut recovery participation.

### Gaps
- No full-text verification of MacLean/Thorp/Ziemba tables (growth vs fraction, drawdown probabilities).
- No measured study of circuit breakers / drawdown-based de-risking in crypto.
- Harvey et al. volatility-targeting evidence: search returned nothing.
- Risk parity for crypto: not researched.

## Realistic return distributions: crypto funds, CTAs, retail bots and retail trader survival

### Takeaway
Professional crypto hedge fund indices show very high but bitcoin-beta-driven returns and still trail or roughly match bitcoin. Systematic crypto trend following looks good in preprints but the strongest numbers come from single-author, weakly cost-modelled papers. Retail day-trader evidence from equities/futures is uniformly poor; crypto-specific retail evidence is thin but points the same way.

### Cited Findings
- HFR Cryptocurrency Index: +65.8% in 2023 (HFRI Fund Weighted Composite +7.5%); +59.8% in 2024; annualised +51.4% over five years to Feb 2025 (cumulative +694.6% vs bitcoin up about 470% on the source's wording). Secondary summaries of HFR data. — [HFR Dec 2023 notes](https://www.hfr.com/?p=24823); [HFR 03/17/2025 commentary](https://www.hfr.com/?p=38140); [The Full FX on HFR crypto data](https://thefullfx.com/hfr-expands-crypto-fund-performance-data/). Bloomberg headline: crypto hedge funds had a great 2024 but failed to beat bitcoin (paywalled, figures not seen) — [Bloomberg](https://www.bloomberg.com/news/articles/2025-01-15/crypto-hedge-funds-had-a-great-2024-but-failed-to-beat-bitcoin)
- Cambridge Associates' head of digital assets said investors should anticipate a 50% crypto drawdown (search excerpt of Institutional Investor article). — [Institutional Investor](https://www.institutionalinvestor.com/article/2bstm0ttbd36wmby0uy2o/portfolio/crypto-hedge-funds-deliver-bitcoin-like-returns-without-the-volatility)
- Low confidence: SQ Magazine claims crypto hedge funds averaged 36% return, 46% volatility, Sharpe 1.6 in 2025; could not trace to a primary source. — [SQ Magazine](https://sqmagazine.co.uk/crypto-hedge-funds-statistics.md)
- I did not find a Cambridge Associates crypto hedge fund benchmark with returns/Sharpe/drawdown; their crypto publication found was on VC funds. — [Cambridge Associates PDF](https://www.cambridgeassociates.com/wp-content/uploads/2025/12/2025-11-Unlocking-Innovation-with-Blockchain-and-Crypto-VC-Funds.pdf)
- Crypto trend following, AdaptiveTrend preprint (2022-2024 out-of-sample, 150+ pairs): Sharpe 2.41, max drawdown -12.7% (70/30 long-short), Sharpe 2.12 / MDD -14.3% (50/50), with 4 bps taker fee, volume-based slippage and funding. Single-author preprint; treat with caution. — [arXiv 2602.11708](https://arxiv.org/html/2602.11708v1)
- "A Decade of Evidence of Trend Following in Cryptocurrencies": very high walk-forward results but parameter-fragile and assumes negligible fees/slippage. — [arXiv 2009.12155](https://arxiv.org/pdf/2009.12155)
- Monash: short lookbacks give high Sharpe but frequent rebalancing lets costs erode profits (project summary only). — [Monash](https://www.monash.edu/business/mcfs/our-research/all-projects/investment-strategy/trend-following-strategies-for-crypto-investors)
- Brazil futures day traders (Chague, De-Losso, Giovannetti): of those who persisted more than 300 days (started 2013-2015), 97% lost money; only 1.1% earned more than minimum wage and about 0.5% more than a bank teller's starting salary; no evidence of learning. — [SSRN 3423101](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3423101); [Bloomberg Quint](https://www.bloombergquint.com/onweb/day-traders-in-brazil-study-would-ve-done-better-with-9-to-5-job). Abstract versions differ slightly (0.4% vs 0.5%).
- Taiwan (Barber, Lee, Liu, Odean): fewer than 1% of day traders reliably earn positive net returns after costs (2014 J. Fin. Markets) — [eScholarship PDF](https://www.escholarship.org/content/qt7k75v0qx/qt7k75v0qx.pdf?t=ohrd1z); secondary source says over 360,000 traders, over 80% lost money (unverified against paper) — [TradingView summary](https://my.tradingview.com/chart/EURUSD/pJsnrpJF-The-Ineffectiveness-of-Day-Trading-A-Critical-Review-of-Empiric). Barber et al. 2009: individual losses large, roughly two-thirds attributed to transaction costs (per secondary write-up) — [Berkeley Haas](https://newsroom.haas.berkeley.edu/individual-investors-see-red-prof-terry-odean-finds/)
- Crypto retail: Hyperliquid on-chain study (Mar 27 to Jun 30 2025): front-end (mostly retail) traders lost $1.11B net, market makers gained $208M, algorithmic takers about break-even. One venue, about three months. — [Jia et al., AFT 2026](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.AFT.2026.36)
- A 2020 Binance figure cited by an NYU Stern paper: 79% of customers traded above 20x leverage (old data). — [NYU Stern](https://www.stern.nyu.edu/sites/default/files/assets/documents/Duron-Carielo_Is%20There%20A%20Future%20In%20Perpetual%20Futures.pdf)

### Inferences
- Fund-index returns (50-65% in good years) reflect bitcoin beta plus survivorship/self-reporting bias and large fund-level resources; they are not a sensible target for a $1k-10k account.
- Retail evidence says the typical active trader loses and costs are the main channel; surviving is the dominant outcome to optimise, not return.

### Gaps
- No retail algorithmic bot survival rate study found; the retail evidence is from discretionary day traders.
- No Bitwise/Galaxy report was opened (a Bitwise hedge-fund article appeared in search but was not fetched).
- No verified long-run Sharpe / max drawdown for a crypto CTA index from a primary source.
- Percentage of profitable crypto perp accounts: not found; "70-97% lose" claims in blogs are unsourced.

## Probability of ruin, drawdown recovery and cost of overtrading

### Takeaway
Mostly mathematical, not sourced here. The sourced part is that costs and turnover are the main channel of retail loss.

### Cited Findings
- Barber et al. (2009): about two-thirds of Taiwanese individual investors' trading losses came from transaction costs (secondary source). — [Berkeley Haas](https://newsroom.haas.berkeley.edu/individual-investors-see-red-prof-terry-odean-finds/)
- Monash/AdaptiveTrend: costs erode short-lookback trend profits. — see above.

### Inferences (own arithmetic, standard identities, not from a source)
- Recovery from a drawdown of d needs a gain of d/(1-d): 20% needs 25%, 33% needs 50%, 50% needs 100%, 75% needs 300%.
- At a 3% monthly net return, recovering a 50% drawdown takes about 24 months (ln2/ln1.03); at 1% monthly, about 70 months.
- Round-trip cost of, say, 0.2% (fee plus slippage) at 5 round trips a day is about 1% per day of turnover drag, so any edge must exceed it before it is positive.
- Ruin risk rises sharply when risk per trade exceeds a few percent or leverage is used with stop gaps; exact ruin probabilities depend on win rate and payoff and were not sourced.

### Gaps
- No sourced numerical probability-of-ruin tables or empirical recovery-time studies for crypto accounts.

## Reasonable expectations for $1k-$10k, and when passive/yield beats active trading

### Takeaway
No source gives monthly return expectations for small accounts. Based on the evidence above, a realistic goal is capital preservation and a modest net edge; absolute dollar results are small (1% monthly on $1k is $10). Passive holding of majors or yield is the benchmark that most active retail strategies fail to beat net of costs.

### Cited Findings
- HFR crypto index trailed or roughly matched bitcoin even for professional funds (see above). — [HFR 03/17/2025](https://www.hfr.com/?p=38140); [Bloomberg](https://www.bloomberg.com/news/articles/2025-01-15/crypto-hedge-funds-had-a-great-2024-but-failed-to-beat-bitcoin)
- Retail day-trader results above (under 1-3% reliably profitable).

### Inferences
- Opinion: holding BTC/ETH (accepting 50%+ drawdowns) or low-risk yield is the default; active trading is justified only if a strategy beats that benchmark after realistic costs on validated out-of-sample data, and a small account should treat the first months as cost of learning.
- A conservative planning range (my judgement, unsourced): a validated systematic strategy may deliver low single-digit percent monthly in good regimes with years of negative months and 20-40% drawdowns; do not plan around professional-fund or preprint Sharpes of 2+.

### Gaps
- No empirical distribution of monthly returns for $1k-10k crypto accounts; no yield-vs-trading comparison (stablecoin yield risks not researched).

## Validation standards before risking money

### Takeaway
Backtests are weak predictors of live results, and overfitting widens the gap. Use deflated Sharpe, minimum track record length, walk-forward testing and a staged live ramp.

### Cited Findings
- Quantopian study of 888 strategies: more backtesting effort means larger backtest-to-OOS gap; weak correlation between IS and OOS Sharpe/alpha; OOS predictability R^2 below 0.25. — [Wiecki et al. (via Quantpedia)](https://quantpedia.com/quantopians-academic-paper-about-in-vs-out-of-sample-performance-of-trading-alg/)
- 1,726 commercial structured strategies: pro-forma performance weakly portable and weakens sharply once live (arXiv). — [arXiv 2604.18821](https://arxiv.org/pdf/2604.18821)
- Deflated Sharpe Ratio corrects for multiple testing and non-normality; Probabilistic Sharpe and Minimum Track Record Length give the length needed to reject a Sharpe below a threshold; required length grows with fat tails, higher confidence and a threshold close to the observed Sharpe. Minimum Backtest Length (Bailey, Borwein, Lopez de Prado, Zhu) bounds how many trials a backtest of given length can support. — [SSRN 2460551](https://papers.ssrn.com/abstract=2460551); [Risk.net](https://risk.net/node/2223785)
- Trend-following crypto papers showed parameter fragility and assumed negligible costs (see above). — [arXiv 2009.12155](https://arxiv.org/pdf/2009.12155)

### Inferences
- Practical checklist (judgement): count every parameter/variant tried and deflate; require stable results in a neighbourhood of parameters; model fees, slippage, funding; run paper trading then tiny live size; compare fills to simulation and assume live Sharpe is materially below backtest.
- Specific paper-to-live slippage numbers for crypto were not found, so use measured live fills rather than a fixed haircut.

### Gaps
- No sourced numeric sample-size rule (trades or months) beyond the MinTRL concept; formulas not read.
- No crypto-specific paper-to-live slippage study found.
