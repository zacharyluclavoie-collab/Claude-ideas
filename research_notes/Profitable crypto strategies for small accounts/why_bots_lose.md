# Why small retail memecoin/DEX bots lose money, and which practices measurably reduce losses

Method caveat (read first): every WebFetch failed in this session (DNS/allowlist block: cnitarot.github.io, beincrypto.com, coingecko.com; earlier notes report the same for arxiv.org, cointelegraph.com, etc.). All findings below come from WebSearch result summaries, not from reading primary documents. Treat each number as "reported by"; verify before quoting. Earlier notes at `research_notes/Memecoin bot evidence review/` (mev_costs, launch_base_rates, signals_evidence, exits_sizing, validation_methods) already cover: Solidus 98.6% rug stat, Chainalysis 3.59%, IMC'26 Jito sandwich $7.7M, 58.43% bot failure rate (arXiv 2504.18055), Jupiter Ultra excess ratio 0.7 vs Axiom 18.9, 28M Solana sandwiches. I do not repeat those except where needed; below is new angles only.

## 1. What fraction of retail memecoin traders lose, and by how much?

### Takeaway
Dune-based pump.fun analyses show the share of profitable wallets mostly sat at or below ~50% from 2024 to 2025 (low 30.1% June 2025), but the headline split understates the problem: profit is extremely concentrated (about 99%+ of wallets never exceed $10k realized). The numbers swing by month and by accounting method (unrealized gains and post-graduation Raydium trades are excluded), so "50-70% lose" is the defensible range, not a point estimate. No median-loss figure and no bot-specific (as opposed to wallet-level) P&L was found.

### Cited Findings
- Search summary of Dune-based reports: roughly 27.2% of >4.2M wallets were profitable in an early-period analysis; only ~5,000 addresses made >$100k and ~311 exceeded $1M. — [BeInCrypto](https://beincrypto.com/pump-fun-meme-coins-trader-losses/); [Crypto.news](https://crypto.news/over-60-pump-fun-traders-saw-losses-less-than-0-01-made-over-1m/) (not opened; the two figures come from different reports and periods)
- Over 60% of pump.fun traders saw losses, <0.01% made over $1M (Dune, ahead of the PUMP token launch). — [BeInCrypto](https://beincrypto.com/pump-fun-trading-data-majority-lose-money/); [crypto.news](https://crypto.news/over-60-pump-fun-traders-saw-losses-less-than-0-01-made-over-1m/)
- CoinGecko research: April 2024 to late 2025, most active pump.fun traders lost money each month; share of profitable wallets rarely exceeded 50% and hit a low of 30.1% in June 2025. A 2026 "comeback" is reported (BeInCrypto: >73% profitable in April 2026, highest since 2024). — [CoinGecko Research](https://www.coingecko.com/research/publications/pump-fun-traders-are-making-a-comeback); [BeInCrypto](https://beincrypto.com/pump-fun-traders-profit-comeback-meme-coin-season/)
- March 2026: combining wallets with losses and those under $500 profit gives ~96% of participants; another report says 49% of March traders in the red. — [crypto.news](https://crypto.news/pump-fun-data-shows-49-of-march-traders-in-the-red-as-platform-locks-fees/) (summary-level; the 96% figure appears in one summary only)
- >99% of pump.fun traders have not realized >$10,000 profit; only ~293 made >$1M (LookOnChain via Bitcoinist/CoinMarketCap). — [CoinMarketCap Academy](https://coinmarketcap.com/academy/nl/article/996percent-of-pumpfun-traders-have-not-realized-over-dollar10000-in-profits-data-shows)
- Methodology dispute: pump.fun's founder argued post-bonding Raydium buys are not in the PnL, and unrealized gains are excluded, so Dune figures may understate profits. — via BeInCrypto/Cointelegraph summaries; [Cointelegraph](https://cointelegraph.com/news/pump-fun-crypto-traders-majority-do-not-realize-profits-dune-data)
- Amended lawsuit alleges investor losses on the platform of up to $5.5B (allegation, not a finding). — [MEXC News summary](https://www.mexc.com/news/81408)
- Insider capture: a study reported by Yellow.com says creator and early-entry wallets captured a median 83% of value extracted per token; buyers entering after the first 10% of supply sold could still earn positive returns (study not named, unverified). — [Yellow.com](https://yellow.com/research/pump-fun-700m-fees-memecoin-launchpad-economics-2026)
- Example insider concentration: suspected insiders bought >60.5% of FOCAI supply and 15 wallets made >$20M (Lookonchain via Cointelegraph). — [Cointelegraph](https://cointelegraph.com/news/focai-memecoin-insider-trading-solana-profit)
- Pine Analytics: deployers fund sniper wallets that buy their own token in the launch block; ~15,000 launches affected; ~1.75% of launch activity; most sell within 5 minutes (85%) and 90% exit in 1-2 swaps, so later retail buyers are buying the snipers' exit. — [Pine Analytics](https://pineanalytics.substack.com/p/exit-liquidity-machines); [BeInCrypto](https://beincrypto.com/pump-fun-meme-coin-snipers-systematic-problem)
- DEXTools, 29 Jun 2026 sample of 215 fresh pump.fun tokens: bots pile into ~1 in 4 new tokens at launch, almost none graduate; median pooled liquidity ~$4,400. — [DEXTools](https://www.dextools.io/news/pumpfun-new-token-bot-activity-data-june-2026) (small sample, exchange-aggregator marketing content)
- Only ~0.7-0.8% of pump.fun launches graduated in Jul-Aug 2025. — [Cointelegraph](https://cointelegraph.com/news/how-pump-fun-captured-80-of-solana-memecoins-and-can-it-last)

### Inferences
- A bot buying random new launches is trading against a pool where ~99% of tokens fail and insiders take a median 83% of value (low-confidence on the 83%); even a 50% "win share" figure hides a skewed payoff where the median wallet is flat-to-negative before fees.
- Wallet-level P&L is not bot P&L: bots trade more, pay more fees and fail more, so bot outcomes should be worse than the wallet median, not better.

### Gaps
- No median/mean loss per retail trader found. No Chainalysis, Nansen or academic estimate of fraction of Telegram-bot users who lose. SBFC 2025 paper (6,000 pump.fun projects, https://sbfc.sydney.edu.au/2025/papers/SBFC2025_4G3_P154.pdf) surfaced but could not be opened.

## 2. Loss mechanisms: copy trading, adverse selection, failed txs, fees, security

### Takeaway
The best new quantitative evidence is a copyability gap: reported "smart money" returns do not transfer to followers (14% wallet vs 3% copier per trade in one paper; only ~26% of large wallet gains passed Bitquery's checks as ordinary market trading). Fee and failure costs are large relative to small edges, and Telegram bots add custody risk.

### Cited Findings
- arXiv 2601.08641 (meme coin copy trading, multi-agent LLM filter): smart-money wallets average 14% return per trade while estimated copier return is 3% per trade under realistic frictions. Paper's own system is the proposed fix; no decay-over-time test. — [arXiv](https://arxiv.org/html/2601.08641)
- Bitquery review of 3,170 large wallet-token positions ($752.5M of gains): only ~26% passed checks for conventional market trading; 1,579 profitable positions involved tokens that arrived by transfer, not purchase (insider/related-wallet distribution). Study did not measure copier P&L. — [CryptoSlate](https://cryptoslate.com/pump-funs-biggest-winners-may-be-impossible-to-copy-as-752-million-study-exposes-hidden-trading-gap/); [KuCoin flash summary](https://www.kucoin.com/news/flash/bitquery-study-reveals-74-of-pump-fun-gains-cannot-be-replicated-by-copy-traders)
- Fake "profitable wallets": scammers buy their own token with multiple wallets to manufacture winning-sniper wallets that copy tools then surface. — [Gemstone Labs guide](https://xxxdimacion.gitbook.io/gemstone-labs/ultimate-memecoin-guide/fake-profitable-wallets) (low-quality community source); consistent with Pine above.
- Failed transactions: ISSTA 2025 study of >1.5B failed Solana txs: bots 58.43% failure rate; "price/profit not met" and invalid-status errors are 67.18% of failures (already in earlier notes). New context: Dune showed ~75% of non-vote Solana txs failed on 4 Apr 2024; Blockworks ~59% in early 2025; >92% of failures one March week were by bots (>5,000 tx/day), with caveat that this isn't proof the average bot does worse. — [arXiv 2504.18055](https://arxiv.org/html/2504.18055v1); [Cointelegraph](https://cointelegraph.com/news/solana-struggling-record-seventy-five-percent-trasnactions-fail-memecoin-mania); [Blockworks](https://blockworks.com/news/lightspeed-newsletter-dropped-solana-transactions)
- Fees: Telegram bots Trojan and BONKbot charge ~1% per trade (0.9% with referral on Trojan), on top of DEX, priority and tip fees (forum-sourced, unverified). A 1% fee each way is a 2% round-trip hurdle. — [Skool comparison](https://skool.com/crypto/trojan-vs-bonkbot-telegram-trading-bots)
- Custody/security: BONKbot and Solareum users lost ~$520k in March 2024 (BONKbot portion ~$208k; cause disputed); Banana Gun users lost ~$1.9M (Cyvers). — [Forklog](https://forklog.com/en/telegram-bots-bonkbot-and-solareum-users-suffer-520000-losses-due-to-hacks/); [Decrypt](https://decrypt.co/224127/solana-wallet-drained-523k-bonkbot-denies-link?amp=1); [Cointelegraph via TradingView](https://ar.tradingview.com/news/cointelegraph:126628e1a094b:0-telegram-bot-banana-gun-s-users-drained-of-over-1-9m)
- DEX informed flow: price impact of DEX flow on non-stablecoin pairs is larger when blockchain fees are high; ~6.5 bp permanent impact per one-sd shock (working paper). Liquidity near the prevailing price in ETH/USDC Uniswap V3 shows informed (permanent-impact) behavior. — [HKBU working paper](https://econ.ntu.edu.tw/wp-content/uploads/2023/12/HKBU_1111006.pdf); [Klein et al. SNB seminar](https://www.snb.ch/dam/jcr:a60e3838-c2db-4ea3-bcb3-96e87c9ebdc0/sem_2026_05_22_klein.n.pdf) (snippets only)

### Inferences
- Copy and "smart wallet" strategies lose most of their edge in transmission: latency, being the exit liquidity for the leader, and wallets whose profit is insider-transferred. A 3% gross per-trade copier return (paper figure) is within the range wiped out by ~2% round-trip bot fees plus slippage and failed-tx cost.
- Survivorship: leaderboards select winners ex post; informal 100-wallet/30-day tracking could not see wallets that vanished (small, non-rigorous source summarized in search; no link retained).

### Gaps
- No public dataset of real bot P&L (leaked or audited). No quantified rug/honeypot loss per trade for retail bots beyond base rates in earlier notes.

## 3. Sniper and copy bots: real vs advertised P&L

### Takeaway
No audited or leaked bot P&L dataset was found. Evidence is qualitative: advertised results are screenshots of winners, not benchmarked, and some "sniper profits" are staged by deployers. One vendor admission says rugs/unsellable tokens cut or reverse real profitability.

### Cited Findings
- MadeOnSol: bot PnL screenshots are mostly misleading; benchmark against simply holding SOL in the same period (USD PnL can look positive while underperforming hold). — [MadeOnSol](https://madeonsol.com/blog/solana-bot-trading-performance-attribution) (vendor blog, opinion)
- A Telegram sniper-bot changelog states a single 100% loss wipes out profit from many winners and that real-world profitability was often cut in half or negative. — [Telegram channel post](https://t.me/s/DcaBot_by_GoodCrypto/758) (vendor self-report, single source)
- Headline bot wins are survivor examples: a "27,000 SOL in a month" sniper was an analyst estimate ("may have earned"); the 6.3M sniper story is similar. — [Forklog](https://forklog.com/news/snajper-bot-zarabotal-6-3-mln-na-mem-koinah) (not opened; search-summary characterisation)
- Hobbyist posts claim large daily P&L (e.g., "my pump.fun bot makes $4,000 a day"), already noted in earlier notes as unverified. — [dev.to](https://dev.to/gengengen/my-pumpfun-bot-makes-4000-a-day-here-are-the-4-numbers-51oa)

### Inferences
- Treat any bot P&L claim without full trade history including failed/unsellable fills and a SOL-hold benchmark as non-evidence.

### Gaps
- No developer-published losing P&L found; no leaked dataset.

## 4. Measured effect of mitigations

### Takeaway
Only execution-side mitigations have any measured support: routing through protected/private order flow is associated with far fewer sandwiches (Jupiter Ultra) but is not a guarantee, and protection can itself be inadequate (86% of single-tx Jito bundles had tips too low for priority). I found no rigorous measurements of liquidity/age thresholds, "avoid first minutes", exit rules or position caps for memecoin bots; those remain untested assertions.

### Cited Findings
- IMC'26 Jito sandwich study (early 2025): 521,903 sandwiches, >$7.7M user cost; >86% of single-tx Jito bundles lacked tips high enough for reliable priority placement, i.e. self-defense via bundles often did not work. Primary PDF unreachable. — [IMC'26 PDF](https://cnitarot.github.io/papers/imc26_solana.pdf)
- Three-year, six-chain protected-order-flow study (arXiv 2609.28115): Jupiter Ultra excess-victimization ratio 0.7 vs >10 for several Telegram/terminal front ends; authors conclude front-running protections can be weaker than users expect; Jupiter credits Ultra V3 (Oct 2025) private routing and dynamic slippage; "34x better" is Jupiter's own claim. — [CryptoBriefing](https://cryptobriefing.com/jupiter-ultra-sandwich-attacks-study/); [AMBCrypto](https://ambcrypto.com/jupiter-crypto-drops-9-despite-strong-showing-in-solana-attack-study/); [arXiv](https://arxiv.org/pdf/2609.28115)
- Concentration: Helius reports Jito analysis attributes nearly half of Solana sandwiches to a single bot program; Jito banned 15 more validators after sandwich data. — [Helius MEV report](https://www.helius.dev/blog/solana-mev-report); [CryptoRank](https://cryptorank.io/news/feed/4d1c4-jito-bans-15-additional-validators-after-data-emerges-of-widespread-sandwich-attacks)
- Weekly dashboard: ~87,061 sandwiches, ~$620k measurable extraction in an April 2025 week; author says an underestimate because squeezed-slippage failed txs are not counted. — [MEV Monitor](https://mirror.xyz/0x7c855e1bF411Ab5975235bC8C74E032615073044/mwh7Bkqp_nmsOkW6T7ee4tqXyXYgaRwLQd8zi38HbcY)
- Ethereum side: independent benchmark of four private MEV-protection RPCs on identical transactions exists (numeric results not retrieved). Flashbots' own savings claims are self-reported. — [arXiv 2505.19708](https://arxiv.org/html/2505.19708v1); [Flashbots docs](https://docs.flashbots.net/flashbots-protect/overview)
- Unverified: claims that sandwich profitability fell 60-70% in 2025 after validator action; $370-500M extracted over 16 months. — [MEXC news](https://www.mexc.com/news/339517); [DEV article](https://dev.to/ohmygod/solana-mev-defense-in-2026-how-sandwich-bots-extracted-500m-and-the-6-protocol-level-defenses-16d9) (weak, no methodology)
- Entry timing: Yellow.com (via a study I could not identify) says buyers entering after the first 10% of supply sold still earned positive returns, which hints that skipping the launch block avoids part of the sniper cost. — [Yellow.com](https://yellow.com/research/pump-fun-700m-fees-memecoin-launchpad-economics-2026) (low confidence)
- Graduation: arXiv 2602.14860 studies how participant composition affects whether a token graduates; results not read. — [arXiv](https://www.arxiv.org/pdf/2602.14860)

### Inferences
- Per-trade sandwich losses on Solana are small (earlier notes estimate ~$7-15 per attack), so for sub-$1k trades, MEV is a smaller leak than 1% bot fees, failed txs and token-quality risk. Sandwich protection matters most for larger size or high slippage tolerance.
- Tight slippage reduces sandwich extraction by construction but raises failed-tx rate (price-not-met is the top failure class); the net is untested.

### Gaps
- No controlled study of tight vs loose slippage, Jito-bundle vs normal RPC landing P&L, minimum-liquidity/age filters, exit rules or position caps in memecoins. Chorus One latency study (swQoS/Jito tips) was not opened.

## 5. Which DEX trading style shows less adverse selection?

### Takeaway
I found no study directly comparing adverse selection across liquid mid-caps, DEX majors and new memecoins. Indirect evidence suggests the burden falls on new tokens (launch insiders/snipers, rugs, survival <1.4%) and that established, deep pairs are where sandwiches are least profitable per victim and where protections work, but this is inference, not measurement.

### Cited Findings
- Informed flow exists even in the most liquid DEX pair (ETH/USDC V3): liquidity near the market price shows permanent price impact. — [Klein et al.](https://www.snb.ch/dam/jcr:a60e3838-c2db-4ea3-bcb3-96e87c9ebdc0/sem_2026_05_22_klein.n.pdf) (snippet)
- Rollup study (Gogol et al., Jan 2026) finds little evidence of economically meaningful sandwiching on L2s (in earlier notes). — [arXiv 2601.19570](https://arxiv.org/html/2601.19570v1)
- Pump.fun-specific: launch-block sniping and insider capture (above) are concentrated in the first minutes of a token's life.

### Inferences
- Lowest-adverse-selection candidates, untested: established tokens with deep liquidity, trading on lower-MEV venues or protected routes, with slower, larger-horizon entries where fee drag is small relative to move size. Whether any signal there has after-cost edge is a separate question (earlier review found none).

### Gaps
- No quantified comparison by token liquidity tier or age. A search for such a study returned nothing usable.
