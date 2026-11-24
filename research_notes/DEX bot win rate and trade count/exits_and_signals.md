# Exit rules and short-horizon return predictors for DEX and small-cap crypto tokens

**Method note.** Every WebFetch call failed with DNS errors because the session's network policy blocks the hosts: arxiv.org, ideas.repec.org, link.springer.com and cfr-cologne.de. So every finding below comes from search-result snippets and abstracts, not full texts. Exact table numbers (stop levels, monthly returns, t-stats) usually could not be checked. Confidence is flagged per item. I skimmed the earlier notes in `research_notes/Profitable crypto strategies for small accounts/` and do not repeat them here: the CTREND/JFQA trend factor, Dobrynskaya's 2-4 week momentum, the Riksbank WP 413 reversal result, AdaptiveTrend, bot fees of about 1%, the copy-trading gap, and the Jupiter Ultra MEV result.

## 1. Stop-loss and trailing stops: do they improve expectancy or only win rate? How wide relative to volatility?

### Takeaway
Theory (Kaminski and Lo) says a stop adds expected return only when returns are serially correlated with momentum. Under a random walk, a stop always lowers expected return. Crypto evidence matches this split:
- Stops layered on monthly momentum portfolios raised returns and Sharpe ratios (Sadaqat and Butt 2023).
- Industry-style stops on plain long positions roughly halved both returns and volatility (Białkowski 2020). That is risk reduction, not added expectancy.

No source found gives an optimal stop width in volatility units for DEX tokens. Practitioner backtests suggest that tight trailing stops (1-3%) on 15-minute crypto bars hurt both win rate and profit.

### Cited Findings
- **Kaminski and Lo, "When Do Stop-Loss Rules Stop Losses?" (Journal of Financial Markets, 2014).** Under i.i.d. or random-walk returns, the "stopping premium" is always negative, so 0/1 stop-loss rules always lower expected return. With momentum (positive serial correlation), the premium can be positive. In monthly US equity data 1950-2004, the working paper reports that some stop rules added about 50-100 bps per month during stop-out periods. The published version, on daily futures, says some policies raise expected return while cutting volatility at longer sampling frequencies. These are snippet-level numbers; the 50-100 bps is from the 2008 working paper. — [MIT DSpace PDF](https://dspace.mit.edu/bitstream/handle/1721.1/114876/Lo_When%20Do%20Stop-Loss.pdf); [EconPapers](https://econpapers.repec.org/RePEc:eee:finmar:v:18:y:2014:i:c:p:234-254)
- **Sadaqat and Butt, "Stop-loss rules and momentum payoffs in cryptocurrencies" (JBEF vol. 39, 2023, 100833).** 147 coins, Jan 2015 to Jun 2022. Stop-loss momentum beats benchmark momentum (time-series, rank-based and volatility-scaled) on returns, Sharpe and alpha, in all market states. The authors link this to the disposition effect.
  - A search summary mentions a 30% stop-loss rule in this paper. The best threshold and the monthly return figures could not be read because the snippet table was garbled. Medium confidence on direction, low on magnitude.
  - — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S2214635023000473); [full-text PDF mirror, not opened](https://bibliotecadigital.bcb.gob.bo/xmlui/bitstream/handle/123456789/1933/Stop-loss-rules-and-momentum-payoffs-in_2023_Journal-of-Behavioral-and-Exper.pdf?sequence=49&isAllowed=y)
- **Białkowski, Economics Letters vol. 191 (2020).** With industry stop-loss rules, volatility and returns of single coins or crypto portfolios are "nearly halved". The survival rate of long crypto positions does not exceed 35%, meaning most positions get stopped out. Thresholds and sample details were not seen. — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0165176519304227)
- **Kaya and Mostowfi (Finance Research Letters 2022, low-volatility strategies in liquid coins).** A simple stop-loss overlay raised Sharpe ratios of long-only portfolios. Snippet only. — [ZHAW PDF](https://digitalcollection.zhaw.ch/bitstream/11475/23853/3/2022_Kaya-Mostowfi_Low-volatility-strategies-cryptocurrencies_frl.pdf)
- **Equity analogue: Han, Zhou and Zhu, "Taming Momentum Crashes".** Stops sharply cut momentum drawdowns but add trading costs. — [Alpha Architect](https://alphaarchitect.com/2016/08/taming-the-momentum-roller-coaster-fact-or-fiction/)
- **Practitioner backtests (low confidence, vendor or single author, small samples, no out-of-sample test):**
  - A 3% trailing stop cut win rate by 8-12 points versus fixed stops on 15-minute crypto bars. Normal 1-3% pullbacks trigger it. The vendor concluded a calibrated fixed stop plus a time exit was best. — [TrendRider](https://trendrider.net/blog/stop-loss-strategies-crypto-trading-2026)
  - A trailing stop gave about 8% less total profit than a fixed -3.5% stop on one author's bot. — [DEV Community](https://dev.to/trendrider/i-tested-4-stop-loss-methods-on-my-crypto-bot-heres-what-actually-works-47i0)
  - A 1% trailing stop cut the 2024 result from +318.5% to +143.3%. — [ArrowAlgo, 4,000 backtests](https://arrowalgo.com/what-4000-backtests-taught-us/)
  - An ATR trailing stop plus fixed take-profit on BTC gave a 54.55% win rate and a 1.85 profit factor (2024, one run). The 3-minute and 1-hour variants had very low win rates. — [CoinQuant](https://www.coinquant.ai/strategies/btc-atr-6h-backtest)
- **Expectancy formula:** E(R) = win rate x payoff ratio - (1 - win rate). With trailing stops, the *realized* average-win / average-loss ratio is what matters, not the planned one. — [Zaellab](https://zaellabfx.com/en/guides/risk-reward-ratio-and-win-rate/)

### Inferences
- Stops raise expectancy only if the token's returns trend after the stop level is hit, i.e. losers keep losing. For freshly launched DEX tokens that rug or bleed out, losers plausibly do keep losing (see section 3), so a hard stop is more likely to help there than in random-walk-like liquid pairs.
- On thin AMM pools, a stop fills at the pool price after slippage, not at the stop level. Rug pulls are effectively instant gaps, so a stop cannot cap them. Realized loss per stopped trade will exceed the nominal stop.
- Tight stops raise trade count and fee drag. On a DEX with a 0.25-1% fee each way, a 3% stop costs roughly 0.5-2% in round-trip fees on every stop-out. That is a material share of the risk unit.

### Gaps
- No crypto or DEX study found that reports optimal stop width in ATR or sigma multiples, or that compares trailing and fixed stops with significance tests.
- Sadaqat and Butt's exact stop thresholds and monthly figures were not readable.

## 2. Partial take-profit, scaling out and time stops: any measured evidence?

### Takeaway
I found no peer-reviewed crypto evidence on partial take-profit or scaling out. The only numbers come from one new-token study that used fixed sell thresholds, and from practitioner posts that favor time exits. Treat this area as essentially untested.

### Cited Findings
- **Uniswap V2 new-token study (EPJ Data Science 2025/2026; arXiv 2502.10512, Naviglio, Tarantelli and Lillo per one search summary).**
  - Setup: about 15 new ETH-paired tokens per hour on Uniswap V2, Oct-Dec 2024. The paper tests a strategy that enters at the 60th swap with a small ETH stake and exits at predefined sell thresholds.
  - Snippets say "all remaining tokens yielded a positive profit" after excluding honeypots and rug pulls. 162 tokens reached a combined maximum profit of 1,056.07 ETH.
  - Many tokens "initially exhibit extremely high returns, creating an illusion of huge profits".
  - Low confidence on profitability: the positive result is conditional on excluding the scams, which you cannot do ex ante, and the full text was not opened.
  - — [EPJ DS abstract](https://epjds.epj.org/articles/epjdata/abs/2026/01/13688_2025_Article_602/13688_2025_Article_602.html); [Springer](https://link.springer.com/article/10.1140/epjds/s13688-025-00602-5); [SNS PDF](https://ricerca.sns.it/retrieve/6e6be1ec-97e8-4a2c-84fe-b0222f17a60b/epj_DS-Uniswap%20copy.pdf)
- **Time stops (practitioner).** One bot author exits after 24 hours if profit is under 1%, to clear "zombie trades". No separate win-rate figure is reported. — [DEV Community](https://dev.to/trendrider/i-tested-4-stop-loss-methods-on-my-crypto-bot-heres-what-actually-works-47i0). TrendRider says fixed stop plus time exit gave the "best risk-adjusted returns". This is vendor content. — [TrendRider](https://trendrider.net/blog/stop-loss-strategies-crypto-trading-2026)
- **Indirect support for a short time stop on hype trades:**
  - Twitter-promoted pump-and-dump price run-ups reverse, typically starting at least 30 minutes after the dump phase. — [Int. Rev. Fin. Analysis / ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1057521924004113)
  - Jumps detected intraday predict same-direction end-of-day returns but not next-day returns. — [Springer, Digital Finance](https://link.springer.com/article/10.1007/s42521-024-00116-1)

### Inferences
- Evidence on short-lived effects (sections 3 and 4) supports time stops on the order of hours, not days, for signal-driven DEX entries. Jump continuation ends by the end of the day, pump reversals start within about 30 minutes, and attention reversals come the next day.
- Partial take-profit raises win rate mechanically by booking small wins. Its effect on expectancy depends on whether the right tail (rare 10x-100x launch winners) gets cut off. Given the extreme right skew of new-token returns, aggressive scaling out may lower expectancy. This is untested.

### Gaps
- No study of scale-out rules (e.g. sell 50% at 2x) on DEX or memecoin data.
- No controlled time-stop study in crypto.

## 3. Short-horizon predictors: momentum vs reversal, order-flow imbalance, volume spikes, new listings, attention

### Takeaway
At minutes-to-days horizons the evidence is mixed and depends on liquidity:
- **Liquid coins:** momentum or continuation.
- **Small, illiquid coins:** daily reversal.
- **Abnormal volume:** predicts lower next-day returns.
- **Attention spikes:** come with same-day gains followed by reversal.
- **Order-flow imbalance:** works over seconds to minutes and decays fast.
- **New DEX tokens:** dominated by rug pulls and very low "graduation" rates.

### Cited Findings

**Intraday momentum and reversal**
- **Wen, Bouri, Xu and Zhao (NAJEF vol. 62, 2022).** Intraday momentum and reversal coexist in crypto. Which one dominates depends on horizon and conditions, and patterns change around large intraday jumps and FOMC days. High-frequency BTC data, Mar 2013 to May 2020. Exact coefficients not seen. — [EconBiz record](https://www.econbiz.de/Record/intraday-return-predictability-in-the-cryptocurrency-markets-momentum-reversal-or-both/10013534113); DOI [10.1016/j.najef.2022.101733](https://doi.org/10.1016/j.najef.2022.101733)
- **Shen, Urquhart and Wang, "Bitcoin intraday time-series momentum" (Financial Review 2022).** Using volume-based "market time", the first half-hour return positively predicts the last half-hour return. The effect is driven by liquidity provision, not late-informed trading. — [Reading CentAUR](https://centaur.reading.ac.uk/100181)
- **2025 BTC/ETH high-frequency study (JRFM).** After large positive moves, ETH shows significant continuation at horizons up to 30 minutes, stronger than BTC at 1- and 5-minute horizons. BTC shows no significant predictability at any horizon tested. — [MDPI JRFM 19(9):692](https://www.mdpi.com/1911-8074/19/9/692)

**Daily reversal**
- **Zaremba et al., "Up or down?" (IRFA vol. 78, 2021).** The previous day's return is a "powerful" predictor of crypto returns (short-term reversal). — [IDEAS/RePEc](https://ideas.repec.org/a/eee/finana/v78y2021ics1057521921002349.html)
- **Fičura (2023), follow-up.** Short-term reversal in small, illiquid coins is driven mostly by low trading volume. Short-term momentum in large, liquid coins is driven by high market cap. — [CERGE-EI WP / IDEAS](https://ideas.repec.org/p/prg/jnlwps/v5y2023id5.003.html)
- **arXiv 2608.21888, matched cross-market study of 15-minute bars.** Short-horizon mean reversion exists, and order flow "conditions the reversal but does not replace it". Magnitude and cost results not seen because the fetch was blocked. — [IDEAS/RePEc](https://ideas.repec.org/p/arx/papers/2608.21888.html)

**Order-flow imbalance (OFI)**
- **Supporting evidence:**
  - In Bitcoin, OFI Granger-causes returns more often than the reverse. — [Springer, Review of Quantitative Finance and Accounting](https://link.springer.com/article/10.1007/s11156-023-01148-1)
  - Order imbalance at crypto-futures quarter-hour openings is tested against 1-minute, 5-minute and 15-minute forward returns. — [arXiv 2607.09426](https://arxiv.org/pdf/2607.09426)
- **Negative evidence:** a working paper on about 8.7M Binance trades in 1-minute bars finds the OFI hypothesis fails under a clean test. OFI autocorrelation decays on a seconds-to-minutes timescale. — [vankyle00 trading-models WP](https://vankyle00.github.io/trading-models/docs/models/03-order-flow-imbalance-btc.html) (low confidence, unreviewed)
- **Inference:** these studies use centralized order-book data. DEX bots see swaps after they land in a block, so the usable OFI lead is likely smaller still. This is an inference, not a finding.

**Volume spikes**
- **Garfinkel et al., "Disagreement and returns: the case of cryptocurrencies" (Financial Management 2025).** Abnormal volume (a disagreement proxy) predicts *lower* next-day returns. Fama-MacBeth slope -0.102, t = -4.50. Where short-selling is restricted, a 1-SD rise in abnormal volume lowers the next-day return by 0.319%. Binance data. — [Wiley](https://onlinelibrary.wiley.com/doi/10.1111/fima.12491)
- **Inference:** most DEX tokens cannot be shorted, so the short-constrained case is the relevant one. A volume spike is then a bearish next-day signal, not a buy signal.
- **Jumps:** an intraday jump predicts same-direction returns to the end of the day, not the next day (tick data). — [Springer, Digital Finance](https://link.springer.com/article/10.1007/s42521-024-00116-1)

**New listings on DEXs and launchpads**
- About 15 new ETH-paired tokens per hour on Uniswap V2 (Oct-Dec 2024). Owner liquidity withdrawals (rug pulls) and thin pools that amplify slippage drive losses. — [EPJ DS](https://epjds.epj.org/articles/epjdata/abs/2026/01/13688_2025_Article_602/13688_2025_Article_602.html)
- A 2022 Solidus Labs report claimed 97.7% of Uniswap tokens were rug pulls. Critics said it ignored liquidity and volume, so it is a disputed upper bound. — [Decrypt](https://decrypt.co/113327/report-claims-97-of-uniswap-tokens-are-rug-pulls-crypto-twitter-has-doubts)
- **pump.fun graduation rates conflict across studies:**
  - 0.63% for Sep-Oct 2025 (Marino et al., arXiv 2602.14860, building early-trading graduation predictors). — [arXiv 2602.14860](https://arxiv.org/html/2602.14860v1)
  - Kamat (arXiv 2607.02823) reported a pooled 24-hour rate of 0.198% across 832,941 launches. The author later said the "timeout" label was flawed, so 0.198% is unreliable. — [IDEAS/RePEc](https://ideas.repec.org/p/arx/papers/2607.02823.html); [Brave New Coin](https://bravenewcoin.com/insights/what-auditing-832941-pump-fun-launches-taught-me-about-memecoin-success)
  - About 1.02% (Szwajcok et al., arXiv 2609.10246), seen only through a secondary summary.
- **Sniping competition:** about 52-53% of new pump.fun coins got an outside buy within about 1.3 seconds, unchanged across Solana block-time cuts (Bitquery). Gross sandwich profit was $29.7M, mostly against pump.fun traders. — [CryptoSlate](https://cryptoslate.com/solana-study-finds-rapid-pump-fun-buying-persisted-as-blocks-sped-up/)
- **CEX-listing effect (not DEX):** the Xangle claim of 208% average gains for Uniswap-first tokens after a major CEX listing is unverified. — [Cointelegraph](https://cointelegraph.com/news/the-uniswap-effect-is-leading-to-208-gains-on-average-for-certain-tokens). Other analyses say the move mostly happens before or at the listing and dissipates after. — [RockawayX](https://rockawayx.com/insights/bullish-or-bearish-what-really-happens-when-tokens-list-on-a-cex); [The Tie](https://www.thetie.io/insights/what-does-an-exchange-listing-actually-deliver-in-2026)

**Attention and social signals**
- **Pugachyov, Twitter attention (FoFI 2024 WP, 2018-2022).** Abnormal Twitter attention comes with higher same-day returns and lower later returns (overreaction). The reversal is significant for *large* coins but not small ones. — [Lancaster FoFI PDF](http://wp.lancs.ac.uk/fofi2024/files/2024/04/FoFI-2024-148-Nikolay-Pugachyov.pdf)
- **CFR Cologne WP 25-02, "Social Media-Based Attention".** Title only; contents not seen. — [CFR PDF](https://www.cfr-cologne.de/download/workingpaper/cfr-25-02.pdf)
- **COVID-era study.** Attention raises returns of small and mid-cap coins. Reversal effects are positive only for small caps. This partly conflicts with Pugachyov on small coins. — [PMC11602072](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11602072/)
- **"Wisdom of the crowd signals" (Electronic Markets 2025).** Explicit buy/sell calls on X, Reddit, Stocktwits and Telegram significantly predict short-term price moves, especially for low-cap coins with recent negative returns. Magnitude not seen. — [Springer](https://link.springer.com/article/10.1007/s12525-025-00815-6)
- **PLOS ONE 2018 (older).** Twitter activity and sentiment predict short-term returns of 181 altcoins. — [PLOS ONE](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0208119)
- **Twitter-linked pump-and-dumps.** The pre-event run-up tracks a surge in tweets, then reverses, starting at least 30 minutes after the dump phase. — [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1057521924004113)

### Inferences
- **Signal decay ranking, fastest first:** OFI (seconds to minutes) < jump continuation (to end of day) < attention and abnormal volume (reverse by the next day) < daily reversal or momentum (1 day) < weekly momentum (covered in the earlier notes).
- A DEX bot buying *on* a volume or attention spike is on the wrong side of the documented next-day reversal, unless it exits within the same session.
- In small, illiquid tokens, the evidence favors fading moves (reversal) over chasing them at a daily horizon. Continuation shows up mostly in liquid majors or at sub-30-minute horizons (ETH).

### Gaps
- No study found that measures any of these predictors on DEX swap data specifically. Nearly all use CEX data such as Binance.
- Telegram-specific attention decay is unmeasured, apart from the Electronic Markets paper, whose numbers I could not see.
- No net-of-cost result for new-token first-hour or first-day buy-and-hold across *all* launches, scams included.

## 4. How large are these effects after realistic DEX costs (0.25-1% fee plus slippage)?

### Takeaway
Most documented short-horizon effects are a few tenths of a percent per day or less, for example 0.32% next-day per 1-SD abnormal volume. They come from CEX data with fees of a few basis points. A DEX round trip at 0.5-2% in fees, before slippage and MEV, is larger than these effects. Only the extreme right tail of new-token launches is big enough to clear DEX costs, and that tail sits inside a very high scam and failure rate.

### Cited Findings
- The abnormal-volume effect is 0.319% next-day per 1 SD (Binance, short-constrained case). — [Wiley FM 2025](https://onlinelibrary.wiley.com/doi/10.1111/fima.12491)
- Thin Uniswap pools mean even small buys cause significant slippage. — [EPJ DS / arXiv 2502.10512](https://arxiv.org/pdf/2502.10512)
- Searches found no rigorous net-of-fee sniper-bot study. One anecdotal 30-day test with $5,000 reported -22% net after fees and slippage for a common Python sniper. That is a single unverified Medium post. — [Medium](https://medium.com/@sarahwalkerjames886iy9srfes/i-lost-14-000-testing-solana-memecoin-bots-heres-the-only-agent-that-works-a52942be3d24)
- Stop-loss studies note that stops add trading costs (equity analogue). — [Alpha Architect](https://alphaarchitect.com/2016/08/taming-the-momentum-roller-coaster-fact-or-fiction/)
- Earlier notes already cover the about 1% Telegram-bot fee per side and MEV and sandwich exposure. These stack on top of the DEX LP fee.

### Inferences
- **Break-even arithmetic:** with a 0.3% LP fee and a 1% bot fee per side plus about 0.5% slippage per side, the round-trip cost is about 3.6%. A strategy with a 50% win rate then needs average wins about 3.6 percentage points larger than average losses just to break even. Every signal in section 3 that has a measured size is an order of magnitude below that.
- Higher trade count from tight stops, scaling out or fast time stops multiplies this drag. Fewer, larger-move trades are favored mechanically on DEXs.
- Win rate is a misleading target here. Stops and partial take-profits move win rate without necessarily improving expectancy (Kaminski and Lo), and DEX cost drag hits every trade whether it wins or loses.

### Gaps
- No paper found that re-estimates intraday momentum, reversal, OFI or attention effects with DEX-level costs of 0.25-1% plus slippage. Kaiko and Amberdata research pages were not reached in the searches I ran; this is a remaining lead.
- No Quantpedia summary was checked, again for lack of search budget.
