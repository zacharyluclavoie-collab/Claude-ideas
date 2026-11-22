# Observable signals predicting returns or scam outcomes for new/trending DEX tokens

Method caveat: WebFetch was blocked (arxiv.org, cryptoslate.com did not resolve in this session's network allowlist). All findings below come from WebSearch result summaries only, not full-text reads. Effect sizes and numbers were not checked against the primary papers. Allow arxiv.org and re-fetch if exact figures are needed.

## (a) Which signals predict scams/rugs, and (b) forward returns after fees?

### Takeaway
Rug/scam prediction has real but leakage-prone ML evidence. The best-supported features are liquidity (TVL) dynamics, trading idleness, and holder concentration (Gini/HHI/top-holder share). I found no credible out-of-sample evidence that any signal predicts positive forward returns net of fees for new tokens. Social metrics, deployer history, unique-buyer ratios, and liquidity lock status have little or no direct evidence in what I found.

### Cited Findings
- TON DEX study: gradient boosting detects rug pulls within the first five minutes of trading; a TVL-based label method reached AUC up to 0.891, while an idle-based method gave better recall. — [arXiv 2509.01168](https://arxiv.org/abs/2509.01168)
- Solana study (Pump.fun and Raydium): rug label = TVL drops below 99% or idle time over 80% of lifetime. Idle-time signals work better on Pump.fun, TVL signals better on Raydium. Combining them gave earlier detection. — [arXiv 2608.20271](https://arxiv.org/pdf/2608.20271)
- Concentration heuristics from one paper: Gini typically above 0.8 before rug pulls versus below 0.5 for normal projects; Herfindahl above 0.25 on top-10 holders flagged; team-controlled addresses may collectively hold over 60% in rug projects. These are single-paper heuristics, not validated cutoffs. — [arXiv 2201.07220 (Uniswap, "Do not rug on me")](https://arxiv.org/pdf/2201.07220)
- Same Uniswap paper reports that 90% of tokens using locking contracts tend to eventually become rug pulls or malicious (a search summary; this undercuts "liquidity locked" as a safety signal). — [arXiv 2201.07220](https://arxiv.org/pdf/2201.07220)
- Leakage warning: many detectors rely on reactive on-chain signals and suffer temporal data leakage; a 2026 paper builds a 1,000-token dataset with features taken strictly before any liquidity withdrawal. — [arXiv 2603.11324 (LROO)](https://arxiv.org/pdf/2603.11324)
- Another paper (2025) argues code-only or transaction-only detection yields false negatives and positives. — [arXiv 2506.18398](https://www.arxiv.org/pdf/2506.18398)
- Cross-chain study of 34,988 tokens (Ethereum, BSC, Solana, Base): $3.27M realized losses from pump-and-dump and $6.04M from rug pulls, over 17,000 victim addresses. — [arXiv 2507.01963](https://arxiv.org/html/2507.01963v2)
- Pump.fun academic study (6,000 projects): most launches are not tied to informative fundamentals; outcomes are driven by trader behavior, coordination and attention. — [SBFC 2025 paper](https://sbfc.sydney.edu.au/2025/papers/SBFC2025_4G3_P154.pdf) (summary via search; I did not confirm that this is the paper behind the "outcomes driven by attention" claim)
- Twitter: event study of crypto pump-and-dumps finds abnormal tweet counts positively related to abnormal returns, with delayed selling after the dump. This is concurrent, not a tradable forward signal. — [arXiv 2306.02148](https://arxiv.org/pdf/2306.02148v1)
- Telegram: 412 pump-and-dump events in Telegram channels (Jun 2018 to Feb 2019); pump announcements average roughly 65% returns for organizers (figure cited second-hand, unverified). — [arXiv 1811.10109](https://arxiv.org/pdf/1811.10109)
- Bundled/insider supply: only anecdotal evidence found (FOCAI insiders held over 60.5% of supply; PEPE about 30% bundled, per Bubblemaps). Commentary says some bundled coins still ran hard. — [Cointelegraph FOCAI](https://cointelegraph.com/news/focai-memecoin-insider-trading-solana-profit); [Cointelegraph PEPE](https://cointelegraph.com/news/pepe-memecoin-launch-insider-wallet-concentration-bubblemaps)
- Sniping: Pine Analytics says deployers fund sniper wallets that buy in the first block; 85% sell within five minutes; about 50% of Pump.fun launches involve sniping (Pine says its analysis is a subset and mostly bots). — [Pine Analytics](https://pineanalytics.substack.com/p/exit-liquidity-machines)

### Inferences
- Liquidity-drain and idleness signals are largely detective (the rug is already underway); useful for exit triggers more than entry selection.
- Lock status looks weak or even misleading as a standalone safety signal given the Uniswap finding.
- Holder concentration is the most consistently cited pre-event feature, but cutoffs are unvalidated and bundling can obscure true concentration.
- Signal categories with no evidence found: unique buyer / buyer-seller ratio, holder count growth, volume acceleration, deployer wallet history (as a validated predictor), social metrics as a forward predictor.

### Gaps
- No full-text reads; no effect sizes beyond AUC 0.891 (TON).
- No study found testing any of these signals against forward returns net of fees/slippage for new tokens.
- Deployer-history, buyer/seller ratio, and holder-growth features may appear inside the ML papers' feature sets, but I did not see their importances.

## Momentum / mean reversion at hours-to-days horizons in small-cap crypto

### Takeaway
Daily-to-weekly reversal is documented in small, illiquid coins; momentum shows up mainly in the largest coins. No evidence found specific to memecoins in their first hours/days, and none net of realistic DEX costs.

### Cited Findings
- Across 3,600+ coins, low last-day-return coins outperform high last-day-return coins; the largest, most tradeable coins show daily momentum instead. — [Up or down? Short-term reversal, momentum, and liquidity effects (IRFA 2021)](https://ideas.repec.org/a/eee/finana/v78y2021ics1057521921002349.html)
- 200 coins 2015-2019: significant reversal at daily, weekly, monthly rebalancing; small liquid coins show a monthly loser-minus-winner spread of about 12.15%, not statistically significant. — [Applied Economics Letters 2020](https://informahealthcare.com/doi/abs/10.1080/13504851.2020.1784831)
- Market, size and momentum factors explain cross-sectional crypto returns; long-short construction assumes shorting is possible. — [NBER w25882](https://www.nber.org/papers/w25882.pdf)
- Salience effect: a one standard-deviation higher salience value lowers next-week return by 0.41%, confined to micro-caps and moderated by limits to arbitrage. — [Southampton working paper](https://eprints.soton.ac.uk/471607/1/AcceptedManuscript.pdf)
- Four-factor study (2024) finds size effect, reversal effect and illiquidity premium. — [Cambridge JFQA-listed link](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/S0022109024000747) (attribution to Peng and Shams came from the search summary, not confirmed)

### Inferences
- For tiny, illiquid new tokens, reversal is the better-supported prior than momentum, but those samples are mostly CEX-listed coins with day-plus horizons, not minutes-to-hours DEX launches.
- Reversal gains in illiquid coins are likely eaten by spreads, price impact and rug risk.

### Gaps
- No paper found on memecoin hours-to-days momentum/reversal on DEXs after costs.

## Accuracy of GoPlus, RugCheck, TokenSniffer, De.Fi

### Takeaway
The only independent measurements found are for GoPlus, and they show large false negatives (roughly 40% of trapdoor tokens missed). I found no independent benchmark of RugCheck, TokenSniffer or De.Fi.

### Cited Findings
- Uniswap trapdoor-token study: GoPlus flagged about 60% of ground-truth trapdoor tokens and flagged all non-trapdoor tokens correctly (no false positives). Authors did not compare with TokenSniffer or honeypot.is. — [arXiv 2309.04700](https://arxiv.org/pdf/2309.04700)
- Telegram bait-and-trap study: GoPlus labeled 138 honeypots in the main dataset versus 1,492 for the authors' tool; about 59.6% on a validation set; Honeypot.is found about 43% fewer than the authors' tool. — [arXiv 2610.10149](https://arxiv.org/pdf/2610.10149)
- Static analysis misses traps that need specific transaction sequences. — [MDPI Information 16(5):405](https://mdpi.com/2078-2489/16/5/405)
- Evasion: some schemes use only covert code-level traps, others only transaction-level manipulation such as wash trading, so single-layer scanners miss the other; CRPWarner missed rug pulls using complex data structures. — [arXiv 2506.18398](https://www.arxiv.org/pdf/2506.18398); [CRPWarner](https://arxiv.org/pdf/2403.01425)
- TokenSniffer, Forta and RugDoc do not publish datasets, hampering independent evaluation. — [TM-RugPull dataset paper](https://arxiv.org/html/2602.21529v1)
- Scope descriptions (vendor/marketing, not accuracy evidence): RugCheck is Solana-first (authorities, liquidity, holders); TokenSniffer uses trade simulation plus source analysis. — [DEXTools comparison](https://www.dextools.io/tutorials/rugcheck-vs-token-sniffer-comparison)

### Inferences
- Treat a "pass" from any scanner as weak evidence of safety; fresh tokens may be scored before malicious logic or later contract changes appear.

### Gaps
- No false-positive/negative rates for RugCheck, TokenSniffer, De.Fi. No Solana-specific scanner benchmark found. The GoPlus studies are Ethereum/Telegram-token samples and may not transfer.

## Profitable memecoin strategies and audits of copy-trading/sniper bots

### Takeaway
Credible evidence shows most memecoin traders lose, and headline "top wallet" profits are largely not replicable. I found no independent audit showing a net-profitable copy or sniper bot strategy.

### Cited Findings
- Bitquery: of 3,170 wallets with $100k+ gains totaling $752.5M, only 26% of the sum passed conventional-trading checks; 51% came from wallets selling transferred tokens, 13% possibly coordinated, 10% unclassified; 15 of the top 25 gains met wash-loop criteria. Bitquery did not compute follower returns. Reported sample window in the coverage is inconsistent with other dates, so verify. — [KuCoin News summary](https://www.kucoin.com/news/flash/bitquery-study-reveals-74-of-pump-fun-gains-cannot-be-replicated-by-copy-traders); [CryptoSlate](https://cryptoslate.com/pump-funs-biggest-winners-may-be-impossible-to-copy-as-752-million-study-exposes-hidden-trading-gap/)
- Most Pump.fun wallets lose: about 99.6% of traders have not realized over $10,000; one analysis puts the loss share at 62.5%. — [CoinMarketCap Academy](https://coinmarketcap.com/academy/nl/article/996percent-of-pumpfun-traders-have-not-realized-over-dollar10000-in-profits-data-shows); [crypto.news](https://crypto.news/only-0-76-of-pump-fun-wallets-made-1000-or-more-cn-research/)
- CoinGecko: 73.28% of wallets ended April (2026) in realized profit, but this excludes unsold holdings, so it likely overstates. — [CoinGecko Research](https://www.coingecko.com/research/publications/pump-fun-traders-are-making-a-comeback)
- Snipers capture first-block entries and exit within minutes (Pine, see above), so followers entering later face adverse selection.

### Inferences
- Copy-trading signal quality is contaminated by wash trading and transferred-token sales, which inflate wallet leaderboards.
- Unrealized-loss exclusion and survivorship make most public "profitable wallet" stats unreliable.

### Gaps
- No independent audit of commercial sniper/copy bots (e.g., Trojan, BonkBot, GMGN) with fee, slippage and MEV-tip accounting.
- No published reproducible profitable strategy with out-of-sample, after-cost results.
- Chainalysis/Solidus and Dune dashboards were not retrieved; Solidus-specific rug data not found.
