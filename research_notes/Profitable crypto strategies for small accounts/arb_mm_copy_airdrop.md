# Arbitrage, market making, copy trading and airdrop farming for small crypto accounts

Method caveat: WebFetch could not open any page (arxiv.org, cryptoslate.com, helius.dev and hummingbot.org all failed DNS resolution; those hosts are not in the session's allowed network domains). Every finding below comes from WebSearch result summaries, not from reading the full pages. Treat the numbers as second-hand and verify against the linked primary source before publishing. About 9 search calls were made, so coverage is thin.

## 1. Arbitrage (CEX-DEX, DEX-DEX, triangular): who captures profit, margins, latency and capital, can a retail bot compete

### Takeaway
Measured arbitrage profit is concentrated in a few professional searchers, and on Ethereum in builders that integrate their own searchers. On Solana, arbitrage is a high-volume, low-margin, high-failure-rate game. I found no independent evidence of a small retail bot profiting.

### Cited Findings
- Ethereum CEX-DEX: 19 major searchers extracted about $233.8M from 7,203,560 arbitrages between Aug 2023 and Mar 2025, an average of roughly $32 per arbitrage (my arithmetic). Paper accepted at AFT 2025. — [arXiv 2507.13023](https://arxiv.org/html/2507.13023v3); [Dagstuhl AFT 2025](https://drops.dagstuhl.de/storage/00lipics/lipics-vol354-aft2025/html/LIPIcs.AFT.2025.26/LIPIcs.AFT.2025.26.html)
- The top 3 searchers captured about three-quarters of both volume and extracted value. — [arXiv 2507.13023](https://arxiv.org/html/2507.13023v3)
- Three builders (beaverbuild, Titan, rsync) dominate the Ethereum builder market, and two of them vertically integrate their own CEX-DEX searchers. — [arXiv 2507.13023](https://arxiv.org/html/2507.13023v3)
- Exclusive (builder-affiliated) searchers keep lower margins because they share most revenue with the builder, sometimes at negative net profit. Neutral searchers that spread flow across builders keep higher margins. — [arXiv 2507.13023](https://arxiv.org/html/2507.13023v3)
- A PREreview of the paper says integrated searchers keep about 10-15% of revenue and neutral searchers 30-70%. The reviewer also criticized the exclusion of "Pattern 3" searchers from revenue estimates and the lack of a benchmark or statistical test for the concentration claim. Low confidence: this is a review, not the paper. — [PREreview](https://prereview.org/reviews/21343454)
- A 2026 arXiv paper on builder centralization (non-atomic MEV, Sep 2023 to Aug 2025) argues beaverbuild's share shows entrenched concentration. I saw only a search snippet. — [arXiv 2605.04471](https://arxiv.org/pdf/2605.04471.pdf)
- Solana (Jito data via Helius): about 90.4M successful arbitrage transactions in a year, average profit $1.58, total about $142.8M (mostly SOL), largest single arbitrage $3.7M. The report says Jito data does not capture searcher profits or activity through alternative mempools, and the "year" window was undated in the snippet. — [Helius Solana MEV report](https://www.helius.dev/blog/solana-mev-report)
- Solana spam: citing Jito Labs, arbitrage transactions used 60% of compute in one epoch and 98% of attempts failed, because first-in-line ordering rewards sending duplicate transactions. This is early 2023 data and predates later changes. — [CoinDesk, Feb 2023](https://www.coindesk.com/business/2023/02/28/solanas-spam-problems-persist-despite-tech-improvements-mev-researchers-say)
- Solana: Jito Block Engine is an off-chain bundle auction, and in one Jan 2024 case a single bot made about $1.8M from one bundle, tipping validator Figment. — [The Block](https://www.theblock.co/post/272079/solana-based-mev-bot-earns-1-8-million-after-back-running-memecoin-trader-in-seconds)
- A 2026 ASE-accepted paper on 200 addresses tied to two Solana bot services found a small cluster of bots routing through one proprietary AMM had positive wSOL balance changes in 62.3% of transactions versus 21.01% for other transactions in the same group. The authors call it correlation in a small sample. — [CryptoSlate](https://cryptoslate.com/a-tiny-cluster-of-solana-bots-unlocked-a-3x-trading-advantage-by-routing-through-one-proprietary-protocol/)
- A hackmd analysis (not peer-reviewed) says latency matters more on Solana than on Ethereum. Low confidence. — [Extropy hackmd](https://hackmd.io/@Extropy/ArbAnalysis)

### Inferences
- A $1.58 average Solana profit per success, combined with a 98% failure rate in the 2023 data, implies that fees and failed-transaction costs eat most of the margin for anyone without top latency. This is my inference, and the two figures come from different periods.
- CEX-DEX arbitrage needs inventory on a CEX, co-located infrastructure and builder relationships, so a small account is effectively excluded. Edge also appears to sit with whoever controls block building.
- Retail-feasible niches (long-tail pools, new-token cross-DEX gaps) probably exist, but I found no study measuring them.

### Gaps
- No peer-reviewed figures for triangular arbitrage margins or for DEX-DEX arbitrage on Ethereum L1 or L2 were found in my searches.
- No data on the capital or latency thresholds at which a searcher becomes profitable.
- Could not open the Helius, arXiv or CryptoSlate pages, so the exact methods and date windows are unverified.
- No independent Solana arbitrage profit-concentration data from a credible source.

## 2. Market making for small accounts (CEX and DEX)

### Takeaway
Evidence is weak and mostly promotional or anecdotal for CEX market making. For passive DEX liquidity provision there is decent academic evidence that most large pools do not earn enough fees to cover arbitrage losses.

### Cited Findings
- Uniswap v2/v3 pools studied Jan 2022 to Dec 2023: fee income fell short of arbitrage losses (LVR) in most of the largest pools. v2 did better for passive LPs than v3, and some pools with less-traded tokens were profitable. — [arXiv 2404.05803v2](https://arxiv.org/html/2404.05803v2)
- Theory: passive constant-function AMM positions underperform a rebalancing strategy before fees (loss-versus-rebalancing). — [Milionis et al.](https://par.nsf.gov/servlets/purl/10466244)
- Uniswap v3 ETH-USDC 0.05% pool blog analysis: only 28% of LPs had positive cumulative PnL, and mean and median returns were negative. The top earners used narrow ranges and short holding periods. Non-peer-reviewed. Low confidence. — [Mirror post](https://mirror.xyz/0xA3DB621697fBC0dA0b16160eb8E201E1a763D2c1/SI9A-eRE8g7gy0oDbqChl1mOm6JwBriimDq29VE4O58)
- A counterpoint blog argues the LVR-based PnL studies are sometimes over-generalized and that LVR can identify positive-EV pools. Low confidence. — [Teletype](https://teletype.in/@jj221/OrFRYQdnos7)
- Hummingbot (open-source MM bot) says profits depend on being in the right markets at the right time and that crowded trades lose profitability. The vendor is promotional, and its own beginner material says an account of $10,000 can trade millions in monthly volume, so fees dominate. — [Hummingbot blog](https://hummingbot.org/blog/does-community-based-market-making-work/); [Hummingbot misconceptions](https://docs.hummingbot.org/academy-content/top-beginner-misconceptions-about-market-making/)
- A developer blog says taker fees of about 0.1% erase spread, so maker rebates are needed, and margins are thin even then. Unsourced win-rate claims. Low confidence. — [DEV Community](https://dev.to/trendrider/crypto-market-making-bots-how-they-actually-work-and-why-most-fail-2kn)
- Anecdote: a trader turning $6,800 into $1.5M in two weeks with a high-frequency delta-neutral, rebate-based strategy. The article itself says it needs speed, capital and deep CEX hooks. Outlier, not a benchmark. — [Cointelegraph](https://cointelegraph.com/explained/this-trader-turned-68k-into-15m-by-using-a-high-risk-strategy-heres-how)

### Inferences
- For a small account the realistic edge is limited to illiquid pairs, where spreads are wide but inventory risk and adverse selection are high, and to fee tiers. I found no independent source quantifying this.
- Narrow-range, actively managed DEX LP appears to be where winners sit, but this is from one blog post.

### Gaps
- No independent audited returns for retail CEX market-making bots.
- No data on DEX order-book (for example on-chain CLOB) market making by small accounts.
- No exchange fee-rebate schedules were collected.
- Hummingbot page not opened; its $ONE Makers results were not seen.

## 3. Copy trading and wallet following

### Takeaway
Independent evidence suggests followers do worse than leaderboards imply: much of "top wallet" profit cannot be copied, and fees, slippage and manipulation cut returns. No study measuring real follower PnL was found.

### Cited Findings
- Bitquery analysis of 3,170 wallet-token positions with gains of at least $100,000 (reported period Oct 2025 to Aug 2026): only about a quarter of gains passed checks for conventional market trading. 51% involved wallets selling tokens received from other addresses, and 13% showed potentially coordinated trading. Copy systems need a visible purchase, so transferred-token gains cannot be copied. Bitquery sells data, so it has some interest in the topic; press coverage only, original not opened. — [CryptoSlate](https://cryptoslate.com/pump-funs-biggest-winners-may-be-impossible-to-copy-as-752-million-study-exposes-hidden-trading-gap/); [KuCoin news summary](https://www.kucoin.com/news/flash/bitquery-study-reveals-74-of-pump-fun-gains-cannot-be-replicated-by-copy-traders)
- GMGN charges a 1% fee per transaction plus network and priority costs. — [CryptoSlate](https://cryptoslate.com/pump-funs-biggest-winners-may-be-impossible-to-copy-as-752-million-study-exposes-hidden-trading-gap/)
- Academic paper (arXiv 2601.08641): bots manipulate prices to induce predictable copy behavior, and in the authors' statistical models copier returns stayed negative even with accurately identified profitable wallets, because price impact depends on trade ordering. Simulation-based, not real follower accounts. — [arXiv 2601.08641](https://arxiv.org/html/2601.08641v2)
- Immunefi research (via Forklog): BONKbot and Solareum users lost about $520,000 to hacks. Security loss, not trading loss. — [Forklog](https://forklog.com/en/telegram-bots-bonkbot-and-solareum-users-suffer-520000-losses-due-to-hacks/)
- Most Telegram-bot content found (Trojan tutorials, "best bots" lists) is sponsored or vendor material and was not used as evidence.

### Inferences
- Survivorship bias is likely severe: leaderboards rank by realized past PnL, and Bitquery suggests a large share is non-replicable. This is an inference from one vendor study.
- Latency of followers (entering after the leader) plus 1% fees plus slippage in thin memecoin pools is a structural penalty, but I have no measured size.

### Gaps
- No on-chain study of actual follower PnL on Telegram bots or Nansen smart-money following.
- A Speakerdeck "independent research" deck on Telegram bots was not opened; it is only a lead.
- The Bitquery date range and "74%" versus "about a quarter" framing come from press summaries and should be checked in the original.

## 4. Airdrop farming: EV per dollar and per hour, sybil filters, costs

### Takeaway
Academic work shows farmers capture much of airdrop value and sell fast, while projects increasingly filter sybils. Per-wallet payout averages exist but come from weak sources, and I found no reliable per-hour or per-dollar return figures.

### Cited Findings
- Study of nine major airdrops: as much as 95% of proceeds were sold via exchanges shortly after distribution, which the authors read as benefiting farmers. The Gemstone fake airdrop allocated 99.53% of supply to a single sybil operator. — [arXiv 2312.02752](https://arxiv.org/abs/2312.02752)
- Arbitrum: fees rose around the airdrop but per-address transactions declined after it. — [arXiv 2312.02752v4](https://arxiv.org/html/2312.02752v4)
- X-explore and Colin Wu study (via Forklog): average $9,384 per standard hunter address (median $6,497); premium hunters $18,935 (median $14,288). Methodology not seen; probably survivorship-biased toward successful farmers and does not net out costs. Low confidence. — [Forklog](https://forklog.com/en/experts-assess-incomes-of-airdrop-hunters/)
- Linea and Nansen flagged 516,960 of 1.3M eligible wallets as sybils, leaving 780,243. — [The Block](https://www.theblock.co/post/335979/)
- Nansen "Airdrop Pro" label: over $100k airdrop profit across at least 3 airdrops (30-day average valuation), with USD per nonce used to flag sybils. — [Nansen research](https://research.nansen.ai/article/47)
- ZKsync filtering was criticized, and Nansen said it was unclear whether sybil farmers drove the sell-off. — [crypto.news](https://crypto.news/nansen-top-41-zksync-airdrop-recipients-hit-sell)
- Forklog headline: experts say 40% of Celestia tokens went to airdrop hunters. Detail not seen. — [Forklog](https://forklog.com/en/news/experts-40-of-celestia-tokens-went-to-airdrop-hunters)
- Chainscore blog, claiming a Nansen analysis of 10 L2 airdrops: median net profit $47 after gas and time, mean $1,850; Arbitrum average claim $2,250, Optimism $1,540; Arbitrum daily active addresses down 88% in two months. Could not verify against Nansen; secondhand blog. Low confidence. — [Chainscore](https://www.chainscorelabs.com/blog/airdrop-strategies-and-community-building/airdrop-analytics-and-measurement/why-most-airdrop-roi-calculations-are-fundamentally-flawed)
- Arbitrum Foundation published its sybil-detection code. — [GitHub](https://www.github.com/ArbitrumFoundation/sybil-detection)

### Inferences
- The gap between the mean and the median (if the Chainscore figures are real) would indicate a heavy-tailed payoff where most small farmers net little after gas and time. That conclusion rests on a weak source.
- Heavy sybil filtering suggests multi-wallet scaling is increasingly risky, so a small account is better off with a single genuine wallet; this is my inference.

### Gaps
- No credible per-hour or per-dollar-deployed EV across airdrops, and no 2025-2026 airdrop data.
- Costs (gas, bridging, time) were not quantified from a primary source.
- A 2026 paper (faculty.washington.edu ChunyangLCC2026) appeared in results but was not examined.

## 5. Which strategies are validated by independent audits rather than marketing

### Takeaway
Only the measurement of professional MEV and of passive LP losses has independent peer-reviewed support, and both show that profits go to sophisticated players or that passive LPs lose. None of the four strategies has an independent audit showing small-account profitability.

### Cited Findings
- Peer-reviewed or conference evidence: CEX-DEX arbitrage concentration ([AFT 2025](https://drops.dagstuhl.de/storage/00lipics/lipics-vol354-aft2025/html/LIPIcs.AFT.2025.26/LIPIcs.AFT.2025.26.html)), LP losses ([arXiv 2404.05803](https://arxiv.org/html/2404.05803v2)), airdrop sell-off ([arXiv 2312.02752](https://arxiv.org/abs/2312.02752)), and copy-trading manipulation ([arXiv 2601.08641](https://arxiv.org/html/2601.08641v2), simulation).
- Most positive claims found (Telegram bot reviews, the $6,800 to $1.5M story, airdrop income studies) are vendor, sponsored, anecdotal or secondhand.

### Inferences
- The default stance for the report should be that profitability for small accounts is unproven; where profits exist, they are concentrated in professionals.

### Gaps
- No independent audit of any retail-oriented bot or platform performance claim was found.
