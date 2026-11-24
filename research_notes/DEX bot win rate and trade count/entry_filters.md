# Evidence-based entry filters for short-term trading of new and small DEX tokens

Method caveat: arxiv.org, memefees.com and themoonlight.io did not resolve from this session, because they are outside the session's allowed network domains. Every arXiv figure below comes from search-result summaries of abstracts and snippets, not from full-text tables. The only page read in full was a GitHub README (mahad1z/memecoin-survival). Recheck all figures against the primary PDFs once arxiv.org is allowed. This file adds to the earlier notes in `Memecoin bot evidence review/signals_evidence.md` and `launch_base_rates.md` and does not repeat them. Those notes already cover: the Mazorra Gini/HHI heuristics, GoPlus catching about 60% of trapdoor tokens, Pine sniper data, Solidus 98.6%, the Bitquery 26% replicable-gains figure, the CoinGecko and Bitquery 24h death rates, and the 82.8% manipulation share among tokens that gained more than 100%.

## Holder distribution (top-10, dev, bundles, snipers) and measured link to rugs or returns

### Takeaway
Raw top-10 concentration is a weak and even inconsistent signal. In one pump.fun survival model, higher top-10 concentration was mildly *protective* (HR 0.90). The informative version is bundle-adjusted or cluster-adjusted concentration. Merging bundled accounts raises the measured top-10 share by about 24 points for high-risk launches versus about 6 points for low-risk ones. A testable rule is therefore "bundle-adjusted top-10 minus raw top-10 > ~15 pts → skip". That threshold is my interpolation between the two reported means and has not been validated.

### Cited Findings
- MELT/MemeTrans (40k+ migrated Solana launches, 122 pre-migration features grouped into holding concentration, bundle statistics and other categories): merging bundled accounts raises top-10 holder share by about 24 pts for high-risk launches versus about 6 pts for low-risk ones. In an earlier version, bundled accounts held about 36.5% of total supply. Feature-importance rankings were not visible in the snippets. — [arXiv 2602.13480v2](https://arxiv.org/html/2602.13480v2); [v1](https://arxiv.org/html/2602.13480v1) (snippet only)
- Pump.fun survival analysis (352,621 launches, 1-7 Oct 2026, Dune SQL, Cox PH; landmark cohort of 6,014 tokens alive at 5 min). For first-5-minute features: top-10 holder concentration HR 0.90 (mildly protective); creator sold within 5 min seen in 56% of 5-minute survivors, univariate log-rank p = 0.15, death hazard about +12% after controlling for demand; serial deployer (more launches in prior 30 days) HR 0.92 (slightly longer survival). The author calls these associations and notes the proportional-hazards assumption is violated, so HRs are time-averaged. — [GitHub mahad1z/memecoin-survival](https://github.com/mahad1z/memecoin-survival) (README read in full; personal project, not peer-reviewed)
- Meme Coin Factories (pump.fun): clustering creator addresses raises the top-1% creators' share of coins created from 38.89% (no clustering) to 58.57% (3-hop clustering). At least 10% of coins are copycats. The paper also documents "market-manipulation-as-a-service" tools. — [arXiv 2609.10246](https://arxiv.org/abs/2609.10246) (snippet only)
- Coordinated Sniper Cohorts (166,098 launches, 1,578,333 buyer observations, 11-25 Jun 2026): 1,012 persistent rings (2-12 wallets, 2,965 addresses) repeatedly buy early together. Contamination-adjusted first-30-minute lift is +16.1% in buyer count, but SOL inflow lift is only +6.3% (CI -0.5% to +15.1%, not distinguishable from zero). About half of the naive contrast was arithmetic contamination. No profit figures. — [RePEc/arXiv 2607.02795](https://ideas.repec.org/p/arx/papers/2607.02795.html) (abstract only)
- Bubblemaps single-token forensics, not a population statistic: BRETT had more than 80% of supply accumulated by over 100 insider-linked wallets within hours; LIBRA had 82% in one cluster; Ava AI had about 40% in 23 deployer-linked wallets; Atlas had 47% across 68 coordinated wallets; XST had 74% in a small cluster. No aggregate crash-rate dataset was found. — [AMBCrypto BRETT](https://ambcrypto.com/brett-holders-should-hold-their-breath-new-data-shows-80-insider-accumulation-at-launch/); [Bubblemaps case studies](https://bubblemaps.io/case-studies); [Cointelegraph Ava](https://cointelegraph.com/news/bubblemaps-ava-ai-token-sniping-deployer-wallets-solana); [CoinStats XST](https://coinstats.app/news/ba929201866c7830c6445772f5264c1a899686b8cbc88d2429ac586c2fc4c5f3_Bubblemaps-Flags-XST-Memecoin-74-Supply-Concentration-Sparks-RugPull-Concerns)
- Serial deployers on Ethereum/BSC DEXs coordinate multiple rug pulls ("attack of the clones"), which supports deployer-history filters. Effect sizes were not seen. — [arXiv 2412.10993](https://arxiv.org/html/2412.10993v1) (snippet only)
- Practitioner thresholds, unvalidated: top-10 non-pool holders above 30-40% of supply is a red flag; any dev wallet above 5% is a red flag; a deployer wallet younger than 7 days with no prior DeFi activity is claimed to be the strongest predictor (no data given). — [defade.org](https://defade.org/blog/how-to-spot-solana-rug-pull); [j.tools](https://j.tools/en/blog/solana-rugpull-detection-8-checks) (vendor blogs; low confidence)

### Inferences
- Conflict: the practitioner "top-10 > 30%" rule is not backed by the only survival model found, which shows slight protection. This is likely because concentration in tiny tokens correlates with a real early buyer, and because raw concentration misses bundled or split wallets. Hidden concentration (the bundle-adjusted gap) is what separates high-risk from low-risk launches.
- Candidate rules to backtest: (1) skip if bundle-adjusted top-10 exceeds raw top-10 by more than about 15 pts; (2) skip if any single funder cluster holds more than about 20-30% of supply (from the Bubblemaps cases, unvalidated); (3) the dev-sold-in-first-5-min filter has a small effect (+12% hazard) and is a weak standalone filter.
- Sniper rings raise buyer counts but not money inflow, so "many early buyers" can be inflated by coordinated rings.

### Gaps
- No feature-importance table (SHAP or gain) was retrieved for MELT, Catching the Rug (arXiv 2608.20271) or Early Rug Pull Detection on Solana (arXiv 2611.13342). Fetches were blocked and the snippets did not show rankings.
- No study links holder or bundle metrics to forward *returns* (as opposed to risk labels or survival).
- No Solidus or Chainalysis data specific to bundles was found.

## Liquidity locks / LP burn, mint and freeze authority, contract verification

### Takeaway
There is no measured "rug probability reduction" from LP lock or burn, or from revoked authorities. On Solana, authority abuse is a tiny share of confirmed rugs (freeze abuse was about 2 of 117). Most rugs are pump-and-dumps or liquidity pulls that static checks do not catch. Treat authority and LP checks as necessary hygiene that removes a small slice of risk, not as a positive filter.

### Cited Findings
- "From Hype to Collapse" / SolRugDetector (Solana): a manually verified benchmark of 117 confirmed rug tokens splits into 89 pump-and-dump (76%), 26 liquidity withdrawal (22%) and 2 freeze-authority abuse (about 2%). Applied to 100,063 new tokens on Orca, Raydium and Meteora (H1 2025), the pipeline flagged 76,469 (about 76%) as rugs; that is a detector output, not a validated rate. The paper notes that existing tools rely mainly on static metadata such as mint or freeze authority. — [arXiv 2603.24625](https://arxiv.org/html/2603.24625) (snippet only)
- No study-based mint-authority share was found; a scanner's "~96% of rug patterns caught" claim is unsourced marketing. — same search; [alchemii.io](https://www.alchemii.io/token-audit) (low confidence)
- Ethereum/BSC "1-day rug pulls" (USENIX Security 2023, 2022 data): 272,349 potential rug pulls on BSC and 21,742 on Ethereum, where a single LP removes all liquidity. Rugging costs about $10.5 on average on BSC (peaks about $600) versus about $400 on Ethereum (peaks over $2,000), so cheap chains produce more disposable scams. Lock status was not analysed. — [USENIX Sec'23 / arXiv 2206.08202](https://www.usenix.org/system/files/usenixsecurity23-cernera.pdf) (snippet only)
- The claim attributed to Chainalysis that tokens with more than half their liquidity locked for 12 months rug much less often could not be traced to Chainalysis and is unverified. — [dominozone.net](https://dominozone.net/liquidity-lock-and-rug-pull-prevention-a-complete-guide-for) (low confidence)
- Already in prior notes, repeated for contrast: on Uniswap (2021), about 90% of tokens using locking contracts eventually became rugs or malicious. — [arXiv 2201.07220](https://arxiv.org/pdf/2201.07220)

### Inferences
- On pump.fun-style launchpads, mint and freeze authorities are revoked and the LP is handled by protocol, so these checks pass trivially and carry no information there. They matter mainly for Raydium/Meteora/Orca direct launches and for EVM tokens (honeypot tax, blacklist, owner-mint).
- The dominant rug mode, pump-and-dump (about 76% of verified Solana rugs), is a holder-behaviour problem, so holder and flow filters matter more than contract filters.

### Gaps
- No locked-vs-unlocked or burned-vs-unburned LP rug-rate comparison exists in any source found.
- No measured effect of EVM contract verification (Etherscan "verified source") on rug rate.
- No RugCheck score calibration data (score versus realised rug rate).

## Launchpad graduation and minimum age: survival and returns after graduation

### Takeaway
Graduation filters for survival, not for returns. Buying *at* graduation was a losing trade on average in late 2026: only about 26% of graduates were at or above their graduation market cap 1 hour later, and about 9% after 24 hours. The pump.fun median graduate was down about 96% at 24h. Waiting for activity does sharply improve survival: tokens with 21+ unique traders in the first 5 minutes have a median remaining life of about 18h, versus about 40 min for tokens with 20 or fewer. Even so, the outcome is hard to predict (AUC 0.67).

### Cited Findings
- MemeFees (graduations 3 Sep - 7 Nov 2026, all launchpads with a graduation feed): 26.4% of 50,749 graduates were at or above graduation market cap at +1h, and 8.8% of 50,005 at +24h (24,337 tokens excluded at the 24h mark). The pump.fun median graduate was at 3.8% of graduation market cap at +24h, a 96.2% drop. — [MemeFees study](https://memefees.com/research/memecoin-survival-2026) (could not fetch; numbers come from a search-engine summary. A follow-up search could not corroborate the 8.8% figure. LOW-MEDIUM confidence.)
- Pump.fun survival (352,621 launches, Oct 2026): 57% stop trading within 5 min, 14% never get more than one trade, 75% are dead within 1h, 89% within 24h and 97% within 7d. 2.5% ever graduate, and 88% of those do so within the first hour. Unique traders in the first 5 min is the strongest predictor (HR 0.77 per SD; split at 21+). Mayhem Mode launches (about 24% of the total) are 81% dead within 1h. Logistic AUC is 0.67 out of sample for predicting death within 24h. Graduates were not followed onto PumpSwap. A cluster of active tokens dies at 23.5-23.8h, which the author suggests may come from fixed-length bot campaigns. — [GitHub mahad1z/memecoin-survival](https://github.com/mahad1z/memecoin-survival)
- About 40% of graduating memecoins graduate in under 5 minutes. — [CCN](https://www.ccn.com/analysis/crypto/meme-coins-pump-fun-solana-platform/) (snippet only)
- Graduation-rate context: after BOOST incentives (post-migration buy-and-burn) the rate hit 6.7% on one day (about 8x June's average) and averaged about 4.7% over the following four days. The Block notes that a higher rate says nothing about value retention. — [The Block](https://www.theblock.co/news/defi/2026-07-29-pump-fun-token-graduation-rate-jumps-boost-changes-launch-incentives-409815); [Cryptoticker](https://cryptoticker.io/en/what-is-pump-fun/)
- Early-Buyer Groups / Fast-Wallet Teams (200,443 launches, 15.9M curve trades, 88.3h): fast-wallet pools are associated with a 2-4x higher chance of the curve reaching 20 SOL, a smaller excess at 60 SOL, and *no* excess for graduation. — [arXiv 2610.39458](https://arxiv.org/abs/2610.39458) (abstract only)

### Inferences
- Rule to test: do not buy the graduation or migration event itself. At the reported +1h base rate (about 26% above graduation market cap), an at-graduation entry needs large asymmetric winners to pay off.
- Rule to test: require 21+ unique traders in the first 5 min (or a time-scaled equivalent) as a minimum-activity filter. It buys survival time (hours, not minutes), which an exit system needs. It does not establish a positive expected return.
- Age filter: since 75% die within 1h, any position opened in the first hour carries a high base rate of death. Waiting 1h shrinks the universe about 4x but conditions on survivors. No source measured the returns of post-1h entries.

### Gaps
- No return distribution (2x/5x shares, or mean/median) for entries at fixed ages (5 min, 1h, 6h) or at graduation +N minutes.
- No Base (Zora/Clanker/Virtuals) or BSC (four.meme, Flap.sh) post-graduation survival breakdown, though MemeFees reportedly tracks these.

## Volume authenticity / wash trading: prevalence, heuristics, measured effects

### Takeaway
Wash trading is pervasive by volume share: at least 17% of pump.fun transactions in one study and 21.4% in another (Solana, 200M txs). It is concentrated in higher-volume tokens. Detectable patterns are within-transaction buy+sell, self-loops, matched pairs and circular flows. A BSC paper uses these features as an early rug warning. Funding-link graphs alone are explicitly *not* a wash detector.

### Cited Findings
- Meme Coin Factories: at least 17% of all pump.fun trading transactions are wash trades. — [arXiv 2609.10246](https://arxiv.org/abs/2609.10246) (snippet only)
- MemeTrans: 21.4% of 200M Solana memecoin transactions are wash trades. Detection nets account balance changes within a single transaction: a buy and a sell swap in the same tx counts as a wash trade. — [arXiv 2602.13480v1](https://arxiv.org/html/2602.13480v1) (snippet only)
- BSC early rug warning: features are Self (self-looping or highly self-associated addresses), Matched (frequent paired transfers) and Circular (multi-address cyclic fund flows), with weak supervision labels. An aggregator reports a 3.81h lead time; this is unverified. — [arXiv 2603.13830](https://arxiv.org/abs/2603.13830) (abstract only; metrics not seen)
- Cross-chain "Midsummer Meme's Dream" (zero-risk-position wash method): 181 Solana, 52 BSC, 28 Ethereum and 21 Base tokens flagged. Pump-and-dump detector: 91 operations on 60 tokens (54 Solana, 3 BSC, 2 Base, 1 Ethereum). 82.6% of high-performing tokens show manipulation indicators. — [arXiv 2507.01963](https://arxiv.org/html/2507.01963v2) (snippet only)
- Bitquery case study: one Solana memecoin faked over $500k of volume in 12h via a few wallets. The heuristics used were trades per trader and two-sided wallet share. — [Bitquery](https://bitquery.io/blog/solana-volume-numbers-are-a-lie) (blog)
- Funding-network paper: directed funding links "are not a wash-trading detector". — [arXiv 2611.11436](https://arxiv.org/abs/2611.11436) (snippet only)

### Inferences
- Testable volume-authenticity filters: (a) the share of txs with same-tx buy+sell, or the share of volume from wallets that both bought and sold within N minutes; skip if above roughly 20% (around the population base rate; threshold unvalidated); (b) the volume / unique-trader ratio (high = few wallets churning); (c) trades per trader concentration, where the top 3 wallets carry a large share of volume.
- Unique traders (the strongest survival predictor above) is harder to fake than volume, but sniper rings and multi-wallet bots inflate it too (+16% buyer-count lift with no significant inflow lift).

### Gaps
- No measured change in winner/rug share from applying a wash filter.
- No Base-specific prevalence study beyond small counts.

## Smart-money / wallet-quality signals

### Takeaway
The evidence is weak to negative. Early-buyer and fast-wallet teams predict reaching an intermediate curve level (20 SOL), but not graduation, and they add nothing beyond the early curve state, with signals often arriving after 20 SOL. Retrospective team-following made money in only about half the cases even with hindsight-built graphs. Public signals decay within minutes.

### Cited Findings
- Early-Buyer Groups (23,710 wallet groups found via co-buying, shared funding, joint signing, transfers and consolidation): hold-out precision of team rules is about 0.5-0.75, but many signals arrive after the curve already holds 20 SOL and add no information beyond the early curve state. There is no excess for graduation. — [arXiv 2610.39458](https://arxiv.org/abs/2610.39458) (abstract only)
- Team-following retrospective (10 windows, Apr 2024 - Sep 2026, 1 SOL start each, finite-capital simulation from real reserves): 9 of 19 teams were identifiable only after their last launch. Of the rest, 10 cases ended above 1 SOL and 7 had free cash above 1 SOL. Selection-matched nulls were rejected in only 3 of 40 tests after Holm adjustment, and the funding graph uses the full window (look-ahead). — [arXiv 2611.11436](https://arxiv.org/abs/2611.11436) (abstract only)
- Bitquery (about 2.9M ordinary buyers, 10 launch weeks): 74% held less SOL after two weeks, a net loss of about $269M. Buying earlier helped "only a little" (not quantified in coverage). The coverage also conflicts on sample details (another account cites 43.3M txs, 148k tokens, 31 days, $287M). — [Bitquery](https://bitquery.io/investigations/solana-memecoin-traders-lose-money); [Analytics Insight](https://www.analyticsinsight.net/cryptocurrency-analytics-insight/why-most-memecoin-traders-fail-inside-the-95-loss-rate-problem) (secondary; conflicting)
- Signal vendor self-report: 43% of 1,386 top-tier signalled tokens were "dead" 30 min after the signal (14 days). This is unaudited. — [Green Onions on X](https://x.com/bitecong/status/2112826815219953866) (low confidence)
- Latency: public memecoin signals lose value when execution is slow, and coordinated wallets lose their edge once visible. — [Surf analysis](https://asksurf.ai/pulse/en/public-memecoin-alpha-execution-latency) (analysis post, not a controlled study)

### Inferences
- Wallet-quality signals should be treated as hypotheses. At minimum, test them with point-in-time wallet labels (no look-ahead), the actual delay from signal to fill, and the condition "signal fires before curve > X SOL". The best study found no incremental value over curve state, so a bot should first beat a curve-state-only baseline.
- Leaderboard "smart money" is contaminated by wash loops and transferred-token sales (see prior notes: Bitquery 26%).

### Gaps
- No independent study measuring forward returns of tokens bought by historically profitable wallets with point-in-time labels, or the half-life of that signal.
- No Nansen, GMGN or Cielo label-accuracy audit.
