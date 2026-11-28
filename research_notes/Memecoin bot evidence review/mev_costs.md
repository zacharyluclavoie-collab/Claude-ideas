# Trading costs and adversaries for small bots trading new DEX tokens (snipers, MEV/sandwich, latency, fees)

**Evidence-quality warning for the report writer:** WebFetch was blocked for every host tried (arxiv.org, cnitarot.github.io, cryptobriefing.com, chorus.one, mirror.xyz, beincrypto.com: DNS failure, not in the session's allowed domains). All findings below therefore come from search-result summaries, not from reading the primary documents. Every number is second-hand and should be verified against the linked primary source before publication. Several search summaries also contradicted each other, noted inline. I found no usable data for Base and BSC victim loss, Ethereum retail round-trip costs, or Base gas.

## Measured sandwich frequency and average loss per victim by chain

### Takeaway
Solana has by far the largest sandwich volume, but per-victim losses on Jito-observed data are small (roughly $7-15 per attack by my division of reported totals). Ethereum private-channel sandwiches average about $140 per attack. Rollups (incl. Base) show little evidence of meaningful sandwiching, and BSC has no per-victim data in my results. Totals vary by orders of magnitude depending on scope and detection heuristic.

### Cited Findings
- IMC '26 measurement study of Sandwiching on Jito: about four months of early-2025 data, 521,903 sandwich attacks costing Solana users more than $7.7M; it also reports some user defensive behaviors offered little benefit beyond blocking sandwiches (second-hand summary of search result) — [IMC'26 paper PDF](https://cnitarot.github.io/papers/imc26_solana.pdf) (not fetched)
- MEV Monitor, one week in April 2025: 87,061 identified Solana sandwiches extracting about $620k measurable value — [MEV Monitor, Mirror](https://mirror.xyz/0x7c855e1bF411Ab5975235bC8C74E032615073044/mwh7Bkqp_nmsOkW6T7ee4tqXyXYgaRwLQd8zi38HbcY) (single source, not fetched)
- Jito banned 15 additional validators after data emerged of widespread sandwiching; a report estimated 222,272 victims of "wide" sandwiches — [CryptoRank news](https://cryptorank.io/news/feed/4d1c4-jito-bans-15-additional-validators-after-data-emerges-of-widespread-sandwich-attacks) (news aggregator)
- Anza's Max Resnick said Solana sandwich attacks were "way down" — [Blockworks](https://www.blockworks.com/news/solana-sandwich-attacks-down) (headline only; no figures retrieved)
- arXiv 2609.28115 ("No Place to Hide: protected order flow sandwich attacks"): Solana has by far the most protected-order-flow sandwiches in its dataset; victims concentrated among users of a few apps; coverage cites 28 million Solana sandwiches over three years (the 28M figure is from news coverage only, unverified) — [arXiv](https://arxiv.org/pdf/2609.28115); [CryptoBriefing coverage](https://cryptobriefing.com/jupiter-ultra-sandwich-attacks-study/)
- One unverified news piece claims up to $500M drained over 16 months and a 60-70% cut in attacker profitability in 2025; I could not trace a primary source — [MEXC news](https://www.mexc.com/news/339517) (weak)
- Ethereum private-channel sandwiches, Nov-Dec 2024: 2,932 attacks, $409,236 victim losses, $293,786 attacker profit; one bot accounts for nearly two-thirds of private frontruns; one victim address hit 28 times — [Mancino & Rezzoli, arXiv 2512.17602](https://arxiv.org/pdf/2512.17602)
- Rollups: Gogol et al. (Jan 2026) find no evidence of sustained or economically meaningful sandwiching across L2s and argue naive heuristics vastly overstate activity — [arXiv 2601.19570](https://arxiv.org/html/2601.19570v1)
- Base: arXiv 2609.28115 reportedly identifies four sandwich bot contracts in three groups on Base; no loss figure in the snippet — [arXiv](https://arxiv.org/pdf/2609.28115) (snippet only)
- BSC: cross-chain (bridge) sandwiching has greatest impact on BSC, with BSC-destination attacks the most profitable — [arXiv 2511.15245](https://arxiv.org/html/2511.15245v1) (scope is bridges, not ordinary swaps)
- BSC claims about frequency conflict: a 48 Club team member says front-running fell after their private RPC; a forum reply says BSC attack proportion is comparable to Ethereum — [BNB Chain forum](https://forum.bnbchain.org/t/call-for-proposal-addressing-malicious-mev-attacks-on-bnb-chain/3167) (self-interested, unverified)

### Inferences
- Average loss per sandwich, my arithmetic: Solana IMC $7.7M / 521,903 = about $14.8; MEV Monitor $620k / 87,061 = about $7.1; Ethereum private $409,236 / 2,932 = about $140. These are per attack, not per trade; the share of all swaps sandwiched was not found. For a $50-$500 position, a ~$7-15 average Solana loss is roughly 3-30% of position, but the distribution is unknown (mean may be skewed by large victims, so typical small-trade loss may be lower).
- Conflicting Solana totals ($7.7M over 4 months vs $500M headline) reflect different scope and likely heuristics; do not mix them.

### Gaps
- No primary-source read of IMC'26 or arXiv 2609.28115 (fetch blocked); share of swaps sandwiched, median loss, and attacker tip costs unknown.
- No Base or BSC per-victim loss or frequency numbers; no EigenPhi, Flashbots or Dune figures retrieved.
- Ethereum public-mempool sandwich totals not retrieved (only the private-channel subset).

## Snipers, insiders and bundlers in the first blocks

### Takeaway
Evidence is fragmentary: first-block outside buying hits roughly a third to over half of new Solana tokens depending on source, and snipers dump fast (85% within five minutes per Pine). No study found that reports the percent of supply captured at launch with a consistent definition.

### Cited Findings
- Bitquery-based study: share of new coins receiving an outside buy in their first block fell from 42% to 32% as Solana blocks sped up, while within about 1.3 seconds it stayed about 53% vs 52%; authors call outside buying a proxy — [CryptoSlate](https://cryptoslate.com/solana-study-finds-rapid-pump-fun-buying-persisted-as-blocks-sped-up/) (secondary summary)
- ChainCatcher analysis: over 50% of tokens sniped in the creation block — [ChainCatcher](https://www.chaincatcher.com/en/article/2185070) (single source)
- Pine Analytics via BeInCrypto: 50% of Pump.fun launches involve sniping (mostly bots), but the Korean edition says up to 1.75% of launch activity, so figures conflict; snipers sell 85% within five minutes and 90% within one or two swap events — [BeInCrypto](https://beincrypto.com/pump-fun-meme-coin-snipers-systematic-problem); [Korean edition](https://kr.beincrypto.com/pump-fun-meme-coin-snipers-systematic-problem/); [Pine Analytics](https://pineanalytics.substack.com/p/exit-liquidity-machines)
- DEXTools (June 2026): bots rush 1 in 4 Pump.fun tokens at launch, almost none succeed — [DEXTools FR](https://www.dextools.io/news/pumpfun-new-token-bot-activity-data-june-2026-fr) (headline only)
- Vendor heuristics, not studies: Mobula says 50%+ supply held by snipers is highly likely to see a coordinated dump; Madeonsol says top-10 holders typically control 30-50% on high-risk Pump.fun tokens — [Mobula](https://docs.mobula.io/almanac/detecting-snipers-bundlers); [Madeonsol](https://madeonsol.com/blog/why-pumpfun-tokens-fail-first-hour-find-survivors)
- arXiv 2607.02795 studies coordinated sniper cohorts and first-hour buyer flow, with 1,012 persistent wallet rings detected; results not retrieved — [arXiv](https://arxiv.org/abs/2607.02795)
- arXiv 2602.14860 on predicting success of new tokens exists but results not read — [arXiv](https://arxiv.org/html/2602.14860v1)
- Bubblemaps cases of 90+ wallet launch-sniping clusters — [Cointelegraph](https://cointelegraph.com/news/bubblemaps-flags-mystery-over-90-wallet-launch-sniping-cluster)

### Inferences
- A retail bot buying seconds after launch is almost always buying from or after a sniper cohort that exits within minutes, so it is the likely exit liquidity; this is consistent with, not proven by, the sources above.

### Gaps
- No consistent % of supply taken by snipers/bundlers in blocks 0-3, and no Ethereum, Base or BSC equivalents. No measured P&L for later buyers.

## Priority fees, tips, failure rate, latency, and effect of private routing

### Takeaway
Solana bots fail often (58.43% failure in a study of 1.5B failed transactions); sniping tips are 0.01-0.05 SOL per vendor guides; private routing helps but is not complete. Most landing-rate numbers are vendor anecdotes.

### Cited Findings
- Bots on Solana show a 58.43% transaction failure rate (all bot transactions, not Jito bundles) — [arXiv 2504.18055](https://arxiv.org/html/2504.18055v1)
- Vendor case: dynamic Jito tip calibration raised bundle acceptance from 34% to 81% and 3-slot landing from 61% to 94% over four weeks (anecdotal) — [RPCFast](https://rpcfast.com/blog/how-to-improve-your-jito-bundle-landing-rate-on-solana)
- Priority fee 0.001-0.005 SOL suggested in heavy congestion; sniping Jito tip 0.01-0.05 SOL (guide example 0.05 SOL); base fee 5,000 lamports per signature; typical swap cost $0.001-0.05 depending on priority — [Madeonsol](https://madeonsol.com/blog/solana-priority-fees-guide); [Bitquery](https://docs.bitquery.io/docs/blockchain/Solana/solana-fee-anatomy/)
- Jito tips are not charged if the bundle does not land (single vendor claim) — [Alchemy docs](https://www.alchemy.com/docs/chains/solana/solana-jito-bundles-and-transactions.md); competitive searchers reportedly give 50-70% of profit to tips (unsourced) — [Troop Messenger](https://www.troopmessenger.com/blogs/solana-mev-bot-wrong-infrastructure) (weak)
- Chorus One report compares latency under swQoS, priority fees and Jito tips; numbers not retrieved — [Chorus One](https://chorus.one/reports-research/transaction-latency-on-solana-do-swqos-priority-fees-and-jito-tips-make-your-transactions-land-faster)
- Jupiter Ultra: "excess ratio" of victimization 0.7 overall vs Axiom 18.9, Photon 11.1, BullX and GMGN above 10 (news summary of arXiv 2609.28115); Jupiter separately claims +0.63 bps average positive slippage over seven days (internal) — [CryptoBriefing](https://cryptobriefing.com/jupiter-ultra-sandwich-attacks-study/); [Jupiter Ultra v3](https://dev.jup.ag/blog/ultra-v3)
- Ethereum: Flashbots Protect routes to a private mempool hiding transactions from sandwich bots; trade-off is trust in relay/builders and only opt-in users are protected — [Flashbots docs](https://docs.flashbots.net/flashbots-protect/overview); [QuickNode](https://www.quicknode.com/builders-guide/tools/flashbots-protect-by-flashbots)
- Private-channel sandwiches still occur on Ethereum (see section 1), so private routing is not a guarantee — [arXiv 2512.17602](https://arxiv.org/pdf/2512.17602)
- BSC: BNB Chain lists PancakeSwap, 48 Club and Merkle as free private RPCs with sandwich protection — [BNB Chain blog](https://bnbchain.org/en/blog/protecting-users-from-sandwich-attacks-bnb-chain-introduces-mev-protection-with-several-wallets)
- CoW DAO benchmark of Flashbots, MEV Blocker, Blink and Merkle execution quality exists; results not retrieved — [arXiv 2505.19708](https://arxiv.org/html/2505.19708v1)

### Inferences
- The Jupiter result suggests app-level order handling matters more than the user's own settings; the "protected order flow" paper title implies protected channels are themselves being sandwiched on Solana.

### Gaps
- No independent median tip, landing rate, or latency for retail bots; no quantified Flashbots Protect or Jito bundle effectiveness; no data for Base sequencer or BSC latency.

## Round-trip cost of small trades and break-even size by chain

### Takeaway
Not answerable quantitatively from what I retrieved. Only Solana fee components were found, and they imply network cost is small ($0.001-0.05 per swap, up to roughly 0.05 SOL tip when sniping) next to DEX fees, slippage and sandwich loss.

### Cited Findings
- Solana fee components and ranges as above — [Madeonsol](https://madeonsol.com/blog/solana-priority-fees-guide); [Bitquery](https://docs.bitquery.io/docs/blockchain/Solana/solana-fee-anatomy/)
- Jito tip is a separate SOL transfer and does not appear in the Fee field, so all-in cost must add it — [Bitquery](https://docs.bitquery.io/docs/blockchain/Solana/solana-fee-anatomy/)

### Inferences
- Illustrative only, assuming sandwich average loss of $7-15 per hit (section 1) and a round trip exposing two swaps: a single sandwich on a $100 position costs 7-15% on one leg, far above network fees; fixed-cost break-even is therefore dominated by sandwich probability and pool-fee/price impact, not gas. This is my reasoning, not a sourced break-even.

### Gaps
- No round-trip totals including DEX fee (e.g. 1% Pump.fun fee), price impact, or tips; no Base, Ethereum or BSC gas figures; no break-even trade sizes; no SOL price used.
