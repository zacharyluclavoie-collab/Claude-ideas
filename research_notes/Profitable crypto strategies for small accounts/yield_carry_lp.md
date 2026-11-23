# Yield-type crypto strategies for a $1k-$10k account: funding/basis carry, staking and lending, LP fee harvesting

Method caveat: WebFetch was blocked for every host tried (arxiv.org, www.mdpi.com, www.nasdaq.com, www.talos.com all failed DNS resolution; these hosts would need to be allowed in the session network settings). All findings below come from WebSearch result summaries only, not from reading the full papers. Treat numbers as secondary and verify against primaries. Current date context: Nov 2026.

## Perpetual funding-rate arbitrage and cash-and-carry basis (BTC/ETH/SOL, 2021-2026)

### Takeaway
Carry yields are regime-dependent: 20-40% annualised in bull spikes (early and late 2024), compressing to roughly 4-10% (near T-bill rates) in 2025-26. The trade is not risk-free (margin, ADL, exchange and collateral risk). I found no single reliable 2021-2026 multi-asset average, variance or drawdown figure.

### Cited Findings
- He and Manela (arXiv 2212.06888) derive no-arbitrage prices for perpetuals and find crypto perpetual deviations are much larger than in traditional currency markets. The authors say funding-rate arbitrage is not risk-free even disregarding margin requirements and trading costs. Funding is typically paid every 8 hours. — [arXiv 2212.06888v5](https://arxiv.org/pdf/2212.06888v5) (via search summary only)
- An MDPI Mathematics paper (2026, vol 14 issue 2) studies funding-rate dynamics across fragmented markets and risk-adjusted returns of delta-neutral funding portfolios. It says perpetuals are about 93% of crypto futures volume. I could not see its yield figures. — [MDPI](https://www.mdpi.com/2227-7390/14/2/346)
- CoinDesk, Oct 2023: BTC funding-fee arbitrage offered over 10% annualised yield. A Bloomberg-syndicated piece reported Binance BTC funding above 100% annualised for the first time in at least a year. Both are point-in-time readings. — [CoinDesk](https://www.coindesk.com/markets/2023/10/25/bitcoins-surging-perpetual-funding-rates-make-arbitrage-trades-attractive/), [Yahoo](https://malaysia.news.yahoo.com/bitcoin-funding-rates-jump-100-045732907.html)
- Talos reported funding rates and futures premiums at 20-40% annualised in early 2024, then 3-5% in a later period. — [Cointelegraph](https://cointelegraph.com/markets/sygnum-bitcoin-carry-trades-2027)
- CME front-month BTC basis was about 20-25% annualised in Nov 2024. A different source puts Q4 2024 quarterlies at 18-25% and summer 2024 at 4-6%. — [CME OpenMarkets](https://www.cmegroup.com/openmarkets/equity-index/2025/Spot-ETFs-Give-Rise-to-Crypto-Basis-Trading.html), [startupfortune](https://startupfortune.com/what-is-a-crypto-basis-trade-and-how-funds-farm-it-for-yield/), [NexusFi](https://nexusfi.com/a/cryptocurrency/bitcoin-basis-trading-cash-carry-arbitrage)
- The basis briefly dipped below zero in Feb 2025 and compressed below 10% in Apr 2025. — [CME OpenMarkets](https://www.cmegroup.com/openmarkets/equity-index/2025/Spot-ETFs-Give-Rise-to-Crypto-Basis-Trading.html), [CF Benchmarks](https://www.cfbenchmarks.com/blog/revisiting-the-bitcoin-basis-how-momentum-sentiment-impact-the-structural-drivers-of-basis-activity)
- Amberdata's Greg Magadini: basis was near 17% a year earlier and about 4.7% at report time (Jan 2026). One report says basis near 5% versus a roughly 4.5% risk-free rate left little room for arbitrage, and that the CME basis trade was unwinding. — [Advisor Perspectives, Jan 2026](https://www.advisorperspectives.com/articles/2026/01/22/wall-street-pulls-back-bitcoin-trade), [crypto.news](https://crypto.news/cme-bitcoin-futures-slump-as-basis-trade-unwinds-and-wall-street-steps-back/)
- A CryptoSlate headline cites BTC futures carry at 7.89% versus Treasuries (date and method not verified). — [CryptoSlate](https://cryptoslate.com/bitcoin-futures-carry-treasury-yield-etf-flows/)
- Oct 10, 2025 cascade (about $19B liquidations per Cointelegraph's headline): FTI Consulting says some of the best-hedged shorts were reduced or closed by exchange auto-deleveraging (ADL) to keep exchanges solvent. Galaxy covers Binance ADL. USDe fell on Binance (about $0.65 trough per Galaxy; $0.92 per KuCoin), and sources disagree on whether the depeg caused or followed the cascade. Binance reportedly blamed thin books and stressed infrastructure. — [FTI](https://www.fticonsulting.com/insights/articles/crypto-crash-october-2025-leverage-met-liquidity), [Galaxy](https://www.galaxy.com/insights/research/cryptos-flash-crash-liquidation-binance-adl-auto-deleveraging), [Cointelegraph](https://cointelegraph.com/news/19b-crypto-market-crash-leverage-china-tariffs), [Cointelegraph USDe](https://cointelegraph.com/news/usde-depeg-oracle-issues-ethena-founder)
- Glassnode has charts of annualised BTC/ETH perp funding spreads that could be used for own calculations. — [Glassnode](https://studio.glassnode.com/charts/c7693b87-3cc1-462b-73b5-4098bf17175b)

### Inferences
- With T-bills near 4-4.5%, the excess return of carry in 2025-26 is only a few percent, so after fees it is marginal for $1k-$10k. At that size, fixed costs (transfers, gas, two-venue capital split) matter. This is my inference; I found no sourced minimum-capital figure.
- Funding is the most data-rich strategy to test (free historical funding on major exchanges), but results will depend heavily on the 2021 and 2024 bull regimes.
- Delta-neutral still carries counterparty, ADL, margin-liquidation on the short leg during sharp rallies, and stablecoin-collateral risks.

### Gaps
- No sourced 2021-2026 average funding yield per asset (BTC/ETH/SOL), variance, or drawdown stats. Coinglass, Binance and Bybit funding histories were not opened.
- No sourced fee schedule or minimum-capital estimate. Exchange docs not opened.
- SOL-specific carry data not found.

## Staking and lending (ETH/SOL staking; Aave/Compound/Morpho stablecoins)

### Takeaway
2026 figures: ETH staking about 2.5-4.5%, SOL about 3.7-6%, USDC lending on Aave about 2-5% with occasional spikes. Smart-contract, depeg and slashing/liquid-staking risks apply. No source quantified the loss-event frequency.

### Cited Findings
- ETH: early-2026 typical APY about 3.2-4.5% depending on method. Staking Rewards protocol-level about 2.92%. Solo validators about 3.0-3.8%. Coinbase cbETH nets about 2.5-3.2% after a 25% commission. — [Dextools guide](https://www.dextools.io/news/how-to-stake-ethereum-complete-staking-guide-2026), [KuCoin](https://www.kucoin.com/blog/ethereum-staking-in-2026-yield-trends-validator-queue-dynamics-and-mev-impact-exlained)
- SOL: Coinbase about 3.70% (early July 2026); Staking Rewards about 5.86% (differences due to methodology/MEV); JitoSOL average about 5.66% (May 2026); Marinade "up to 8%" is an advertised ceiling, DefiLlama mSOL about 5.46%; Kraken flexible SOL 2.29%. One source notes real yield is thin after inflation. — [CoinStats](https://coinstats.app/news/7e7f54c59908780e9fd397fd4a23b2a5200beb1b00fcba08fb89627be2fd6aee_Ethereum-vs-Solana-Staking-in-2026-Yields-Rewards-and-Risks-Compared/), [Staking Rewards](https://www.stakingrewards.com/earn/solana/?page=1), [OKX](https://www.okx.com/en-us/learn/staking-yield-sol-insights)
- Aave V3 USDC supply: 30-day average about 1.90% (Aavescan rates page); about 4.60% on Ethereum on Oct 6, 2026 (DefiLlama-based guide); 4.06% on Base and 4.13% on Ink in snapshots; Ethereum spike of 9.88%/11.85% reported Oct 27-28, 2026 (anomalous, low confidence). — [Aavescan](https://aavescan.com/rates), [Aavescan Ethereum USDC](https://aavescan.com/ethereum-v3/usdc), [eco.com](https://eco.com/support/en/articles/15182156-usdc-yield-2026)
- Talos: average USDC yield spread Morpho vs Aave about 1.59% since Jan 2026; USDC on Aave outperformed ETH lent on Aave by about 50 bps since 2024; DeFi Rate snapshot shows ETH lending about 1.2%. — [Talos](https://www.talos.com/insights/stablecoins-capturing-on-chain-yield), [DeFi Rate](https://defirate.com/lend/snapshot/2026-10-23T1531/)
- DefiLlama-sourced Stable Yields report (May 2026) says DeFi stablecoin yields are compressed versus US Treasuries. — [DefiLlama dashboard](https://defillama.com/pro/h0jk73g5vsv4oq8)

### Inferences
- A small account's net after gas depends on chain: use L2s or Solana to avoid mainnet gas drag on $1k.
- Rates are variable and mean-revert to near the risk-free rate; lending is mostly a T-bill proxy with added smart-contract risk.

### Gaps
- No sourced list of smart-contract exploits, depeg events (e.g. stETH 2022, USDC Mar 2023), or Compound figures; not searched.
- Current ETH lending/staking figures vary by source; CoinMetrics SOL 11.5% figure undated and probably stale.

## Concentrated-liquidity LP profitability (Uniswap v3/v4, Orca, Raydium)

### Takeaway
Empirical evidence says fees mostly fail to cover impermanent loss/LVR on large Uniswap v3 pools; v2 does better per pair. Evidence on v4, Orca and Raydium was not found.

### Cited Findings
- Bancor/Topaze Blue (2021 data): Uniswap V3 earned $199.3M fees but over $260.1M IL across 17 pools (43% of TVL); 49.5% of LPs had negative returns; only 3 of 17 pools had fees above IL. The study was commissioned by Bancor, a competing AMM (conflict of interest), and is dated. — [Nasdaq](https://www.nasdaq.com/articles/half-of-uniswap-liquidity-providers-are-losing-money), [Investing.com](https://m.investing.com/news/cryptocurrency-news/half-of-users-providing-liquidity-on-uniswap-v3-are-suffering-negative-returns-new-study-finds-2683982?ampMode=1)
- Milionis, Moallemi, Roughgarden, Zhang, "Automated Market Making and Loss-Versus-Rebalancing" (arXiv 2208.06046): LVR is the cost of stale prices picked off by arbitrageurs; instantaneously it scales with price variance times marginal liquidity; IL is better called loss-versus-holding, not a true running cost; the model matched LP returns empirically (validated on Uniswap v2 WETH-USDC). — [arXiv](https://arxiv.org/abs/2208.06046)
- "Measuring Arbitrage Losses and Profitability of AMM Liquidity" (arXiv 2404.05803): fees do not sufficiently compensate for arbitrage losses in most of the largest Uniswap pools; v2 pools are significantly more profitable than corresponding v3 pools for the same pair/fee tier. — [arXiv](https://arxiv.org/html/2404.05803v2)
- Loesch et al., "Impermanent Loss in Uniswap v3" (arXiv 2111.09192) and a 2022 paper (2205.08904) argue profitability is possible with appropriate considerations, but IL grows faster under concentrated liquidity. — [arXiv 2111.09192](https://arxiv.org/pdf/2111.09192), [arXiv 2205.08904](https://arxiv.org/pdf/2205.08904.pdf)
- A 2025 arXiv paper (2501.07828) analyses 700 days of Uniswap v3 data to find parameters improving LP returns (results not read). A 2024 Coinmonks analysis found unhedged LP hard to keep profitable and correlated pairs such as WBTC-WETH better (low-confidence blog). — [arXiv 2501.07828](https://arxiv.org/pdf/2501.07828), [Medium](https://medium.com/coinmonks/profitable-defi-liquidity-provision-in-2024-myth-or-fact-7c1a0c0a3a31)

### Inferences
- LP on volatile pairs is effectively short volatility; small accounts get no edge and pay gas on rebalancing. Correlated pairs or stable pairs are the more plausible (low-return) niches.

### Gaps
- No Revert Finance or Gauntlet analysis found, no v4, Orca or Raydium profitability studies, no per-pool list of profitable pools, and no specific 2025-26 LP-return numbers.

## What a bot can validate on recorded real data

### Takeaway
Funding/basis carry and lending-rate strategies can be backtested from public histories; LP needs tick-level pool event data. No source specifically addressed bot validation; the points below are inferences.

### Cited Findings
- Glassnode offers funding-spread series; Aavescan and DefiLlama offer rate histories; CF Benchmarks and CME publish basis data. — [Glassnode](https://studio.glassnode.com/charts/c7693b87-3cc1-462b-73b5-4098bf17175b), [Aavescan](https://aavescan.com/rates), [CF Benchmarks](https://www.cfbenchmarks.com/blog/revisiting-the-bitcoin-basis-how-momentum-sentiment-impact-the-structural-drivers-of-basis-activity)

### Inferences
- Carry: needs 8h funding history, spot and perp prices (1m or better), fee tiers, borrow/stable rates; ADL and margin events require order-book or liquidation data, which public history rarely covers.
- Lending/staking: daily rate history from DefiLlama/Aavescan; exploit/depeg risk cannot be backtested, only stress-tested.
- LP: needs pool swap/mint/burn events (subgraph or on-chain logs), CEX prices for LVR, and gas costs; then compute fees minus LVR per tick range.
- Paper-trading live while recording data is the only way to check execution costs.

### Gaps
- No sourced data-vendor or API specifics (Coinglass, Kaiko, Amberdata) retrieved.
