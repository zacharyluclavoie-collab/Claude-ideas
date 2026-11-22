# paper_trader — autonomous crypto PAPER-trading bot

Fully automatic, **simulated money only**. No wallet, private key, signing or transaction
broadcast code exists in this package (`PAPER_ONLY = True`); all market/blockchain access is
read-only public HTTP GETs. No approval is needed for individual simulated trades.

```
python -m paper_trader run                       # live public data, runs until Ctrl-C
python -m paper_trader run --config my.json      # override any key of config.Config
python -m paper_trader run --provider mock --days 5 --fresh --state-dir /tmp/pt   # offline synthetic market
python -m paper_trader report                    # P&L, win rate, drawdown, exits, failed txs
python -m paper_trader reset-shutdown            # re-arm after an emergency shutdown
python -m unittest paper_trader.tests.test_safety
```
Requires only Python 3.10+ (stdlib). State (SQLite journal of every decision/trade, resumable
portfolio) lives in `state/`. `touch state/EMERGENCY_STOP` flattens everything and halts entries.

## Pipeline (per loop, strict priority)
1. **Safety latches** – kill file, max drawdown, max total loss → emergency shutdown (flatten, then keep monitoring, no entries).
2. **Monitor open positions** every `monitor_interval` – stops, take-profits, emergency exits (always runs, even with nothing to buy).
3. **Scan** new-token feed every `new_scan_interval` (first), trending feed every `trending_scan_interval`.

Per candidate: market data → strategy analysis → **mandatory security checks** → risk score →
**risk manager sizing/veto** → simulated buy. Any failed mandatory check or unknown data rejects.

| Scanner | Sources (live) | Entry requires |
|---|---|---|
| New tokens | GeckoTerminal `new_pools` per chain, DexScreener latest profiles | age 10m–24h, liquidity, ≥50 txns/h, buy pressure, not already pumped, FDV/liq sane, score |
| Trending | GeckoTerminal trending + top-volume pools | ≥72h history, volume acceleration, moderate 1h/6h momentum (no chasing), hourly-candle breakout bonus, score |

Security (GoPlus; fail-closed): honeypot, buy/sell tax, hidden owner, ownership take-back, mint,
pausable transfers, can't-sell-all, blacklist, slippage modifiable, unverified source, creator's
honeypot history, holder count, top-10 concentration, creator/owner share, LP locked/burned %,
min liquidity, buys-only order flow, wash-trading ratio, vertical pumps. Solana: mint/freeze/close
authority, non-transferable, balance authority, transfer fee.

## Risk management (final authority, cannot be bypassed by strategy)
Risk per trade 0.5% of equity at the stop; position ≤2% (new tokens ≤1%) and ≤2% of pool liquidity;
total exposure ≤30%, new-token exposure ≤10%, per-chain ≤15%, 20% cash reserve, ≤8 positions,
entry rate limits, no duplicate buys, re-entry cooldown, daily loss limit (halts entries), loss-streak
pause, max drawdown 12% / total loss 20% → emergency shutdown. Size multiplier only shrinks after
losses (never above 1.0); stops only ever move up. Dangerous market regime (majors' 1h change)
pauses entries and tightens stops; a crash exits everything; unknown regime blocks entries.

## Simulated execution
DEX fee, per-chain gas, constant-product price impact from pool liquidity, latency drift, partial fills,
failed/reverted transactions (gas burned), slippage-limit reverts, token buy/sell tax, pool-size-limited
sells (a rugged pool returns little), pre-flight revert detection for sell restrictions, repeated sell failure
→ emergency → write-off. Positions are marked at liquidation value (net of sell tax).

## Honest limits
* Live providers could not be exercised in the build sandbox (egress to the API hosts was blocked); parsing
  follows the public API docs. Run live for a short time and check `state/bot.log` for `HTTP`/`GET failed`
  warnings. If CoinGecko (regime feed) is unreachable the bot deliberately takes no new entries.
* Public free APIs are rate limited (throttled in `providers_live.Http`) and DexScreener/GeckoTerminal data
  can lag; the sim cannot see MEV, hidden transfer logic that GoPlus misses, or true sell-ability.
* The `mock` provider is synthetic (pre-seeded scams, rugs, stealth honeypots) — use it to test the machinery, not to estimate returns.
* Paper results do not predict live results; new-token trading is extremely high-risk.
