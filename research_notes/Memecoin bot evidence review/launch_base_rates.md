# Base rates for new DEX token launches (memecoins): death, rugs, honeypots, multiples, wash trading

Method caveat: arxiv.org, cointelegraph.com and soliduslabs.com were not fetchable from this session (DNS blocked). Every figure below comes from search-result snippets and secondary coverage, not from the primary documents. Primary documents were not opened. Treat all numbers as "reported by", and verify against the primary source before quoting precisely. Search tool summaries were used; where the summary flagged uncertainty I repeat it.

## What do analytics firms and academic papers report on rug pull / honeypot / pump-and-dump prevalence among new tokens?

### Takeaway
Headline "98%+ of tokens are scams" figures exist for pump.fun (Solidus) and Uniswap V2 (Mazorra et al.), but they rest on broad heuristics ("soft rug", pump-and-dump traits), not confirmed fraud. A much lower Chainalysis figure (3.59% of new tokens with rug-pull characteristics, 2024) shows the number depends heavily on definition.

### Cited Findings
- Solidus Labs 2025 Rug Pull Report (published ~May 2025; pump.fun tokens Jan 2024 to Mar 2025): about 98.6% of pump.fun tokens showed rug-pull or pump-and-dump characteristics (Solidus's own X post says 98.7%; one outlet rounded to 99%). Only about 97,000 of >7 million tokens kept at least $1,000 liquidity (<1.4%). — [Solidus report page](https://www.soliduslabs.com/reports/solana-rug-pulls-pump-dumps-crypto-compliance); [CoinDesk](https://hotfix.coindesk.com/business/2025/05/07/98-of-tokens-on-pump-fun-have-been-rug-pulls-or-an-act-of-fraud-new-report-says); [BeInCrypto](https://beincrypto.com/pump-fun-tokens-scams-solidus-labs-report/)
- Same report: about 93% (~361,000 of ~388,000) of Raydium pools showed "soft rug pull" traits (liquidity abruptly withdrawn). Median rug about $2,832; 25% of rugs under $732; largest $1.9M (MToken). One ChainCatcher summary gave a $28,000 median, which conflicts with Solidus-derived coverage; $2,832 is likely right. — [Defiant](https://thedefiant.io/alarming-99-of-memecoin-launches-on-pumpfun-are-pump-and-dumps-or-rug-pulls-report); [CryptoPotato](https://cryptopotato.com/98-of-tokens-on-pump-fun-are-rug-pulls-or-fraud-report/)
- Pump.fun publicly disputed the Solidus findings (CoinDesk headline); the rebuttal's methodology critique was not retrieved. — [CoinDesk link above](https://hotfix.coindesk.com/business/2025/05/07/98-of-tokens-on-pump-fun-have-been-rug-pulls-or-an-act-of-fraud-new-report-says)
- Chainalysis 2025 Crypto Crime Report (2024 data), via secondary coverage: about $2.57B of illicit trading volume artificially generated on DEXs, and 3.59% of newly minted tokens showed rug-pull characteristics. Definition of the 3.59% not found. — [CryptoPotato-sourced summary via search](https://cointelegraph.com/news/crypto-crime-2024-2025-chainalysis); [report PDF mirror](https://mason.gmu.edu/~jpham34/The_2025_Crypto_Crime_Report.pdf)
- Mazorra et al., "Do not rug on me" (arXiv 2201.07220): 26,957 Uniswap tokens labelled scam/rug pull vs 631 non-malicious (later version 27,588 tokens, data to Sept 2021); about 97.7% malicious. The labelling is by liquidity-pull heuristic and the sample is Uniswap V2 in 2021, so it is dated. — [arXiv](https://arxiv.org/pdf/2201.07220)
- Trapdoor (honeypot-like) study (arXiv 2309.04700): ground truth of 11,943 Trapdoor tokens vs 18,548 non-Trapdoor among UniswapV2 tokens through Jan 2023 (about 39% of that labelled set; this is a constructed set, not a population rate). — [arXiv](https://arxiv.org/html/2309.04700v4)
- Cointelegraph Magazine (2024): "1 in 6 new Base memecoins are scams, 91% have vulnerabilities" (methodology not retrieved). — [Cointelegraph](https://cointelegraph.com/magazine/base-meme-coins-scams-vulnerabilities-honeypot/)
- GoPlus (Base, earlier period): 381,790 suspected scam ERC20s of 573,484 new tokens (about 66.6%), "suspected risky" not strictly honeypot. — [GoPlus deep dive via Substack](https://defihacklabs.substack.com/p/goplus-security-deep-dive-on-how)
- GoPlus Mar 2025 issuance report: Base honeypot count peaked ~870 (Jan 2025), rose to ~1,000 by Mar 2025; BNB honeypots fell to ~60 by Mar 2025 (about 97% below peak). Counts, not shares. — [GoPlus blog](https://blog.gopluslabs.io/2025/03/14/financing/2025-03-14-SOLANA-BASE-BNB-Token-Issuance-Trend-Report/)
- FXStreet headline (Feb 2024): over 50% of Ethereum ERC-20 tokens on DEXs show pump-and-dump characteristics (study not identified in my results). — [FXStreet](https://www.fxstreet.com/cryptocurrencies/news/over-50-of-ethereums-erc-20-tokens-listed-on-dexes-show-characteristics-of-pump-and-dump-202402021358)
- DappRadar: rug-pull frequency fell in 2025 but incidents were mostly memecoins. — [Cointelegraph](https://cointelegraph.com/news/2025-shaping-up-fewer-but-more-impactful-rugpulls-dapp-radar)

### Inferences
- Reliability ranking by definition strictness: Chainalysis 3.59% (narrow, "rug characteristics") << GoPlus 66% ("suspected") << Solidus 98% (broad pattern match incl. soft rugs). A plausible base rate for outright malicious/honeypot launches is low single digits to tens of percent depending on chain; the 98% figures are better read as "almost no launches retain liquidity/price".
- Solidus's own stat (<1.4% keep $1k liquidity) is a survival measure, more defensible than the "98.6% fraud" framing.

### Gaps
- Primary documents not read (fetch blocked). No Rugcheck, Token Sniffer, Elliptic or Nansen/Messari/Galaxy/Kaiko/Paradigm numbers found. No BSC-specific 2025 honeypot share. Chainalysis 3.59% definition unverified.

## Share of pump.fun / Solana memecoins that graduate or survive; lifetime and peak multiples

### Takeaway
Graduation to a DEX is rare, about 1 to 2% over the long run, with large swings (0.26% mid-2026 per a vendor to 2.01% weekly in Mar 2026). Most tokens stop trading within 1 to 2 days.

### Cited Findings
- Long-run graduation about 1.4% (Dune-sourced, per Cointelegraph 2025). — [Cointelegraph](https://cointelegraph.com/news/pump-fun-memecoins-are-dying-at-record-rates-less-than-1-survive); [Solana Compass](https://solanacompass.com/news/pumpfun-launched-42000-tokens-in-one-day-fewer-than-2-will-ever-reach-a-dex)
- Weekly graduation rate hit 2.01% (Mar 9-15, 2026, Dune), highest since Jul 2025. — [KuCoin flash](https://www.kucoin.com/news/flash/pump-fun-meme-coin-graduation-rate-hits-2-01-highest-since-july-2025)
- Graduation reportedly fell to about 0.26% by mid-June 2026 (single vendor blog; low confidence). — [DEXTools](https://www.dextools.io/news/pump-fun-graduation-collapse-solana-fees-2026)
- CoinGecko study: 68.67% of pump.fun tokens stop trading on launch day; survivors by age bucket: 770,249 lasted 2-3 days, 642,614 4-7 days, 460,697 8-14 days; headline "only 5% survive past 90 days". — [Blockchain.News](https://blockchain.news/news/pump-fun-memecoins-lifespan-study); [Crypto Briefing](https://cryptobriefing.com/pump-fun-token-survival-rate-study/)
- Bitquery: 79% traded only on launch day; Jumpbit: 17.2% had a last trade at least 24h after launch (September launches). "Survival" is defined by last-trade, so these differ. — [KuCoin flash](https://www.kucoin.com/news/flash/solana-memecoin-frenzy-leaves-79-of-tokens-stopped-after-day-one)
- Independent audit of 832,941 pump.fun launches; reported 0.198% graduating within 24h (analyst cautions the "timeout" label is not failure). — [Brave New Coin](https://bravenewcoin.com/insights/what-auditing-832941-pump-fun-launches-taught-me-about-memecoin-success)
- MemeTrans (arXiv 2602.13480): dataset of 40k+ migrated Solana memecoin launches; high-risk launches show concentrated holdings, multi-address coordination, wash trading. — [arXiv](https://arxiv.org/html/2602.13480)

### Inferences
- Roughly 70-80% of pump.fun tokens are dead within 24h and about 1-2% graduate; "graduated" is a survivorship-biased subset.

### Gaps
- No sourced distribution of peak multiples (2x/5x/10x share) for pump.fun, nor 30 min / 1 h survival and return distributions. Searches did not surface it; Dune dashboards were not directly read.

## How much early volume is wash trading or bot activity?

### Takeaway
Estimates vary widely by definition: about 4% to 8% of pump.fun coins show wash trading by conservative tests, but sniping at launch appears very common, and wash trading is heavily concentrated among the winners.

### Cited Findings
- Cross-chain study (34,988 tokens; Ethereum, BSC, Solana, Base): 707 tokens gained >100%, and 82.8% of those showed evidence of manipulation incl. recurrent wash trading. Describes winners only. — [arXiv 2507.01963 "A Midsummer Meme's Dream"](https://arxiv.org/html/2507.01963v2); [USENIX Security 26](https://www.usenix.org/conference/usenixsecurity26/presentation/mongardini)
- Sydney SBFC 2025 paper: wash-trading bots in about 4% of projects, raising creator profit by about $432 on average. — [SBFC2025](https://sbfc.sydney.edu.au/2025/papers/SBFC2025_4G3_P154.pdf)
- CoinPaprika analysis: wash trade in 8.26% of pump.fun coins (most conservative test); 50.31% of coins with 10,000+ transactions vs 0.41% with 10 or fewer; sniper buys within first five blocks on 84% of sampled launches. Secondary vendor analysis. — [CoinPaprika](https://coinpaprika.com/ru/education/launchpad-red-flags/)
- Pine Analytics (via secondary): up to 1.75% of pump.fun launches manipulated by developer-funded sniper wallets. Conflicts with the 84% sniper figure due to definitions. — [BeInCrypto](https://beincrypto.com/pump-fun-meme-coin-snipers-systematic-problem)
- Chainalysis: about $2.57B artificially generated illicit DEX volume in 2024. — [Cointelegraph](https://cointelegraph.com/news/crypto-crime-2024-2025-chainalysis)

### Inferences
- Wash trading is a minority of coins by count but a majority of coins that reach high volume or multiples, so conditioning on "token that pumped" implies high manipulation probability.

### Gaps
- No share-of-volume (as opposed to share-of-coins) wash estimate for first 30 min / 1 h; no Base/BSC-specific bot share.

## Typical survival and return distributions at 30 min / 1 h / 24 h

### Takeaway
Only 24h survival is documented (about 21-32% still trading, definition dependent). No credible 30 min/1h data or 2x/5x/10x base rates were found.

### Cited Findings
- 24h: 68.67% stop trading on launch day (CoinGecko); 79% only trade on launch day (Bitquery); 17.2% trade after 24h (Jumpbit). Sources above.
- Of tokens that exceeded 2x, 82.8% showed manipulation (Midsummer Meme's Dream, above).

### Inferences
- An upper bound on the fraction ever reaching 2x is unknown; the 707/34,988 (about 2.0%) figure from the cross-chain study is the only nearby ratio, but its sample may not be all launches, so do not use as a base rate without checking the paper.

### Gaps
- 30 min / 1 h survival; 2x/5x/10x shares; Base/BSC/Ethereum launch-cohort return distributions. Suggested next steps: read arXiv 2507.01963 and 2602.13480 tables and the Dune pump.fun dashboards directly once network access allows.
