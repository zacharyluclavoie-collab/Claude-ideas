# Exit rules, position sizing and portfolio construction for heavy-tailed, high-failure assets (new memecoins)

Scope and limits: several hosts (arxiv.org, ideas.repec.org, cxoadvisory.com) were unreachable via fetch in this session, so most findings rest on search-result summaries, not full-text reads. Items needing verification against the original are flagged. No rigorous, independent memecoin-specific backtest of exits or sizing was found. Almost all evidence is from equities, futures, BTC/large-cap crypto, or theory. Statements under "Inferences" are my reasoning, not measured on memecoins.

## 1. Stop / trailing-stop / target structures that preserve tail winners while limiting losses

### Takeaway
The best-supported structure is: small, fixed initial loss; no fixed profit cap; a ratcheting trailing stop (or scale-out of a fraction) so the runner is held. Evidence is from lottery-type stocks and trend-following (incl. large-cap crypto), not memecoins. No credible memecoin-specific backtest of stop/target settings was found, and memecoin-specific execution risk (rugs, failed sells, slippage) is the dominant unknown.

### Cited Findings
- Dai, Marshall, Nguyen, Visaltanachoti, "Lottery stocks and stop-loss rules" (Global Finance Journal 2023): lottery-type stocks have sporadic big gains and frequent small losses; stop-loss exits trim losses while keeping exposure to the occasional large rally, raising returns; sell signals from popular technical rules act like stop-losses and improve risk-adjusted returns. A related thesis reports the outperformance holds after transaction costs, though stop-loss rules have lower mean returns vs a mean-variance-optimal benchmark. (Equities, not crypto; summary from search snippet, abstract not read directly.) — [IDEAS/RePEc](https://ideas.repec.org/a/eee/glofin/v56y2023ics1044028322000503.html); thesis: [CORE PDF](https://core.ac.uk/download/519744872.pdf)
- Zarattini, Pagani, Barbon, "Catching Crypto Trends" (Swiss Finance Institute RP 25-80): ensemble of Donchian-channel trend models plus volatility-based sizing on a rotating top-20 liquid coin portfolio; reported net-of-fees Sharpe above 1.5 and ~10.8% annualized alpha vs Bitcoin. Exit is a trailing stop that only ratchets upward; CXO summary: stop = higher of prior stop and midpoint of max/min closes over each lookback, 25% volatility targeting. Stop rule details not verified against the PDF. — [IDEAS](https://ideas.repec.org/p/chf/rpseri/rp2580.html); [Quantified Strategies](https://www.quantifiedstrategies.com/?p=1192563); [CXO Advisory](https://www.cxoadvisory.com/technical-trading/crypto-asset-trend-following-strategies/)
- Quantified Strategies reports a multi-lookback BTC trend approach cut max drawdown to 19% vs over 80% for passive long (Jan 2015-Mar 2025), and the diversified altcoin version had Sharpe 1.57, max drawdown 11%. Secondary blog source; treat as optimistic. — [Quantified Strategies](https://www.quantifiedstrategies.com/?p=1192563)
- arXiv 2602.11708 (Nguyen): dynamic trailing stop calibrated to intraday volatility on 6-hour crypto candles; reports Sharpe 2.41, max drawdown -12.7%. Single preprint, backtest, not independently validated. — [arXiv](https://arxiv.org/html/2602.11708v1)
- Positive skew in trend following comes from payoff shape: win rate can be low, small losses are frequent, occasional large gains come from riding trends. — [arXiv 2101.01006](https://arxiv.org/pdf/2101.01006v1); [arXiv 1607.02410](https://arxiv.org/pdf/1607.02410)
- Trade-off: more positive skew often comes with lower Sharpe (65-futures model). — [Advisor Perspectives](https://www.advisorperspectives.com/commentaries/2025/05/07/trend-followings-tricky-tradeoffs)
- Adding a 1% stop to a mean-reversion test cut win rate 68.8% to 55.5% and moved skew from -2.51 to +0.60, at a cost to returns (single blog, not peer reviewed). — [Price Action Lab](https://priceactionlab.com/Blog/?p=70936)
- A 6-ATR trailing stop daily trend system reported 45.77% win rate, 1.74 payoff ratio over 25 years (education site, single source). — [Trading with Rayner](https://www.tradingwithrayner.com/trend-following-strategy)
- Memecoin-specific: one write-up of a take-profit/stop-loss/timeout grid (TP 20-200%, SL 10-70%, timeouts 2-10 min) reported tighter bands gave higher win rates but smaller average returns; another self-reported ~52-54% win rate at +30% TP with -30%/-50% SL over 1,034 trades. Unverified, no stated validation, unclear fee/slippage treatment. Open-source bot defaults (TP 200%/SL 50%; TP 200%/SL 80%) are configuration defaults, not tested optima. — [KetchupJL backtesting](https://ketchupjl.github.io/backtesting); [DEV Community](https://dev.to/gengengen/my-pumpfun-bot-makes-4000-a-day-here-are-the-4-numbers-51oa); [Kitemetric](https://kitemetric.com/blogs/mastering-solana-sniper-bot-backtesting)
- Base rates: ~1.79% of pump.fun tokens graduated to Raydium (33,683 of 1,883,578 over six months). — [crypto.news summary via search](https://crypto.news/only-0-76-of-pump-fun-wallets-made-1000-or-more-cn-research/)

### Inferences
- Fixed profit targets truncate the right tail that pays for all the losses; a ratcheting trailing stop (or scaling out a minority, then trailing the remainder) is the structure consistent with the lottery-stock and trend-following evidence.
- Expect a low win rate (well under 50%) with this structure; success must be judged by expectancy and payoff ratio, not hit rate. Tight stops raise win rate but cut the tail (consistent with the grid write-up), so there is a genuine trade-off to be tuned out-of-sample.
- On illiquid new tokens, a stop is a request, not a guarantee: gap/slippage and failed sells mean realized loss can exceed the nominal stop. Position size must be set on worst-case loss (possibly 100%) rather than stop distance. This is reasoning; I found no measured data on stop slippage for memecoins.
- Time stops are a natural complement for tokens that neither rally nor fail (capital tied up), but I found no evidence quantifying them (see Gaps).

### Gaps
- No independent, out-of-sample memecoin backtest of trailing stops, scale-outs or time stops with realistic fees/slippage/MEV.
- Could not read the Zarattini et al. full text, Dai et al. full text, or the arXiv preprint (host blocked); stop mechanics and statistics rely on summaries.
- No evidence found specifically on time stops.

## 2. Fixed-fractional vs Kelly sizing under edge uncertainty; scout sizing; ruin with many tiny vs few large positions

### Takeaway
Theory and the Kelly literature agree: with uncertain edge and fat tails, bet a (variable) fraction of Kelly, well below full. For memecoins the edge is essentially unknown and the loss can be near total, so small fixed-fractional sizing on worst-case loss is the defensible default. All of this is theory/other-asset evidence.

### Cited Findings
- MacLean, Thorp, Ziemba (Quantitative Finance 2010): full Kelly maximizes long-run growth but is highly risky short-term (large bets, possibility of losing most wealth through bad scenarios); blending Kelly with cash (fractional Kelly) gives smoother paths at generally lower final wealth. — [Good and Bad Properties of Kelly (PDF)](https://www.stat.berkeley.edu/~aldous/157/Papers/Good_Bad_Kelly.pdf)
- Parameter uncertainty implies betting less than full Kelly, but the right reduction varies with uncertainty rather than being a constant fraction. — [LessWrong "never go full Kelly"](https://www.lesswrong.com/posts/TNWnK9g2EeRnQA8Dg/never-go-full-kelly) (blog, discusses the literature); [Morse notes on Baker & McHale](https://stmorse.github.io/journal/odds4.html)
- Estimated Kelly fraction has sampling error that can be quantified (Sinclair, confidence intervals for Kelly); fractional Kelly is the popular mitigation for probability-estimation error. — [Wikipedia: Kelly criterion](https://en.wikipedia.org/wiki/Kelly_criterion); [arXiv 1701.02814](https://arxiv.org/pdf/1701.02814)
- "Leverage and Uncertainty" argues that tail-loss effects tied to parameter uncertainty explain why fractional Kelly must be used in practice (search summary; paper not read). — [arXiv 1612.07194](https://arxiv.org/pdf/1612.07194)
- Wallet-level outcomes in pump.fun: roughly half of ~1.4M wallets lost money in one March 2026 Dune analysis, and ~96% earned under $500; only 0.048% realized >$100k profit. Wallet counts, third-party dashboards, not audited, figures differ across studies (60%+ losers in another). — [BeInCrypto](https://beincrypto.com/pump-fun-meme-coins-trader-losses/); [CoinGecko research](https://www.coingecko.com/research/publications/pump-fun-traders-are-making-a-comeback); [crypto.news](https://crypto.news/only-0-76-of-pump-fun-wallets-made-1000-or-more-cn-research/)

### Inferences
- Kelly requires p and payoff odds; for new memecoins neither can be estimated reliably, and survivorship bias in historical data likely overstates edge. Applying even half-Kelly to an overestimated edge can mean over-betting (theory: over-betting beyond 2x Kelly has negative growth). Use a small fraction (e.g., quarter Kelly or less) of a deliberately conservative edge estimate, and zero until an edge is demonstrated live.
- Because loss can approach 100% through rugs/illiquidity, size each position so that a total loss costs a fixed small fraction of equity (e.g., 0.25-1%); this is fixed-fractional sizing on worst-case loss and is robust to edge uncertainty. Scout positions should be a fraction of that (e.g., a third to a half) and scale up only on confirmation, with the number scaled to keep aggregate at-risk capital bounded.
- Ruin risk with many tiny positions is dominated by correlated total-loss events (see section 3) and costs/fees per trade, not by single-position risk; ruin with few large positions is dominated by idiosyncratic zero outcomes. Both are checkable by Monte Carlo using a measured payoff distribution (not found in literature).

### Gaps
- No memecoin-specific Kelly or sizing study. No published distribution of per-trade returns for systematic memecoin entries that would let Kelly be computed.
- Exact quantitative Kelly-drawdown tables (probability of halving before doubling by fraction) were not retrieved from the MacLean-Thorp-Ziemba paper.

## 3. Optimal number of concurrent positions; diversification; memecoin correlation in crashes

### Takeaway
Diversification across many small bets helps lottery-like payoffs only if idiosyncratic risk dominates; memecoins appear to be highly correlated to BTC/the sector in selloffs, so extra positions add less protection than the count suggests. No study gives an optimal count for memecoins.

### Cited Findings
- Cointelegraph reported ~0.82 daily correlation of memecoins vs DOGE (2024) and another piece says the correlation between major memecoins and Bitcoin exceeded 0.85; memecoins tend to rise more than BTC when it rises and fall more when it falls. These concern major memecoins, not fresh launches; figures come from different dates and methods. — [Cointelegraph: memecoins crashing](https://cointelegraph.com/news/why-doge-wif-other-memecoins-are-crashing); [Cointelegraph: base/solana memecoin plummet](https://cointelegraph.com/news/base-solana-memecoin-market-caps-plummet-mati-greenspan-charles-edwards)
- Memecoin sector decline of ~73% from late-2024 peak reported in Nov 2025 vs BTC max drawdown of 54% from October peak (reports vary 66-75%, different market-cap bases). — [AMBCrypto](https://ambcrypto.com/memecoins-bleed-out-over-51-in-2-months-is-there-any-hope-for-the-sector/amp); [Cointelegraph](https://cointelegraph.com/markets/memecoins-sell-off-as-bitcoin-price-takes-the-spotlight-is-meme-season-over)
- Some periods show memecoins falling while BTC holds; one source says correlations rise across the board in acute de-risking. — [Cointelegraph](https://cointelegraph.com/markets/memecoins-sell-off-as-bitcoin-price-takes-the-spotlight-is-meme-season-over)
- Search found no source linking a specific number of concurrent positions to skew capture (CAIS discusses diversification of positive skew generally). — [CAIS](https://caisgroup.com/articles/trend-following-and-the-diversification-potential-of-positive-skew)
- Rotational crypto trend strategies used ~20 liquid coins (not memecoins). — [IDEAS](https://ideas.repec.org/p/chf/rpseri/rp2580.html)

### Inferences
- With a ~2% graduation rate or similar base rate of winners, the chance of holding any winner rises with count, but the expected number of winners within a small book is low, so variance of outcomes is large over short horizons; this argues for enough breadth (more than a handful) at small size, subject to a hard cap on aggregate at-risk capital because crash correlation makes losses cluster.
- Treat concurrent exposure as one correlated "memecoin beta" bet when sizing the total book; a cap on total open risk (not just per position) is the relevant control. This is theory and reasoning; I found no measured optimum.

### Gaps
- No pairwise correlation data for newly launched tokens (days-old) during crashes; figures found are for established memecoins.
- No study on optimal N for lottery-like crypto payoffs.

## 4. Forcing a minimum number of open positions vs waiting for quality setups (overtrading costs)

### Takeaway
No evidence supports forcing positions; the behavioral literature shows higher trading activity correlates with worse net returns, and memecoin costs (fees, slippage, tips) are high. Evidence is from retail equity investors, not bots or memecoins.

### Cited Findings
- Barber and Odean (66,465 households, 1991-1996): households that trade more have lower net returns; attributed to overconfidence. — [Barber & Odean papers (Berkeley)](https://faculty.haas.berkeley.edu/odean/Papers%20current%20versions/Individual_Investor_Performance_Final.pdf); [Odean AER 1999](https://econweb.ucsd.edu/~jandreon/Econ264/papers/Odean%20AER%201999.pdf)
- Barber, Lin, Odean: retail order imbalance positively predicts returns but retail trades on average lose money; small trades concentrate on attention-grabbing stocks and perform worse. — [JFQA/Cambridge](https://resolve.cambridge.org/core/journals/journal-of-financial-and-quantitative-analysis/article/resolving-a-paradox-retail-trades-positively-predict-returns-but-are-not-profitable/6AAA9078F50C2597F44D73FA6A8E3F0D)
- Lottery-like stocks underperform on average (Management Science 2019 per search summary), and Barberis-Huang argue positively skewed securities can be overpriced, implying the average lottery-like entry has negative expected return. — [NBER w12936](https://nber.org/system/files/working_papers/w12936/w12936.pdf)

### Inferences
- A minimum-open-positions rule is a quota that converts waiting into forced negative-expectancy trades if the average random entry has negative edge (as skew-preference theory suggests). Better: enter only when a rule-based filter passes, and measure the trade-count/edge relationship live.
- Possible reconciliation: a minimum number of small scouts can be justified purely as data collection to estimate the edge, with strictly capped total loss budget; that is an experiment-design argument, not performance evidence.

### Gaps
- No study of forced-activity quotas in automated trading; no memecoin cost-per-trade measurement.

## 5. Daily loss limits, drawdown shutdowns, regime filters (BTC/ETH weakness)

### Takeaway
BTC trend/regime filters consistently reduce drawdown in backtests of BTC and large-cap altcoin strategies, often at some cost to return; evidence is non-peer-reviewed or preprint, and filters do not prevent deep altcoin drawdowns. I found no evidence on daily loss limits or drawdown shutdowns.

### Cited Findings
- BTC multi-lookback trend: max drawdown 19% vs 80%+ buy and hold (2015-2025); diversified altcoin trend Sharpe 1.57, max DD 11% (Quantified Strategies, secondary summary). — [Quantified Strategies](https://www.quantifiedstrategies.com/?p=1192563)
- WisdomTree illustrative BTC momentum: lower average exposure, lower max drawdown, Sharpe 1.04 vs 0.84 for BTC. — [WisdomTree](https://www.wisdomtree.com/dk/insights/blog/enhancing-bitcoin-returns-using-momentum)
- Grayscale: momentum signals reduced BTC volatility risk in some periods at the expense of lower returns. — [Grayscale Research](https://research.grayscale.com/reports/the-trend-is-your-friend-managing-bitcoins-volatility-with-momentum-signals)
- A Substack analysis of altcoin breadth found a 100-day-MA strategy still suffered a 98% max drawdown lasting 1,586 days (single blog; shows filters do not eliminate deep drawdowns). — [Quant Hedge Substack](https://quanthedge.substack.com/p/your-new-best-friend-in-crypto-trading)
- Memecoins amplify BTC moves and their weakness may precede or accompany broader altcoin drawdowns (journalistic claim). — [Cointelegraph](https://cointelegraph.com/markets/memecoins-sell-off-as-bitcoin-price-takes-the-spotlight-is-meme-season-over)
- Search for evidence that daily loss limits or trade caps improve outcomes found none. — see Barber/Odean results above (volume vs overconfidence only).

### Inferences
- A BTC/ETH regime filter is plausible as a way to cut exposure when memecoin beta is most punitive (amplified downside), but no source tests it on new memecoins, and a filter could also mute entries in meme seasons that decouple from BTC.
- A daily loss limit and a drawdown shutdown function as circuit breakers against operational failure (bugs, rug clusters, bad parameters) and correlated crashes; justified by risk-management theory, not measured effect. If the edge is unknown, a circuit breaker that pauses trading and triggers review is cheap insurance; it can also lock in a losing streak if the edge is real (reduces compounding), a trade-off not quantified here.

### Gaps
- No empirical test of daily loss limits, drawdown shutdowns, or time-of-day/regime gating on memecoin trading.
- Altcoin/regime backtests found are not peer reviewed and are prone to survivorship and look-ahead bias; the arXiv and QS figures should be checked against full methodology.
