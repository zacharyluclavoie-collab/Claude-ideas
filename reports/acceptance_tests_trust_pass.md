# Acceptance tests, trust pass (2026-11-26)

Headless Chromium in a cloud container (4 CPU cores, no GPU), web artifact build, 5 desks, Lots of trades. Raw logs below.

## Main run (B, F, C, D, E, I, H on the first build)
```
TEST B {"simElapsed_s":95520,"real_s":60.1,"measured_x":1590,"displayed_x":1423,"within20":true,"limitingShown":true,"line":"Demo speed: 10,000x selected · ~1,423x actual (limited by computer speed: 5 desks share one browser thread, market size 1×, 34 fps)","fps":28,"marketScale":1}
  F snapshot 5 Day 3 · 02:48 eq $10,711.52 profit +$711.52 trades 405 win 57% ok true
  F snapshot 10 Day 4 · 01:13 eq $10,806.55 profit +$806.55 trades 523 win 58% ok true
  F snapshot 15 Day 5 · 00:00 eq $11,055.81 profit +$1,055.81 trades 665 win 58% ok true
  F snapshot 20 Day 5 · 22:24 eq $11,088.08 profit +$1,088.08 trades 780 win 57% ok true
TEST F {"passed":16,"of":20,"failures":[{"k":0,"checks":{"eq":true,"tot":true,"deskCards":true,"wrRing":true,"wrKv":true,"wrWL":true,"oneClock":true,"deskCardClock":true,"headerClock":false},"domEq":10500.93,"sumEq":10500.93,"domTot":500.93,"sumP":500.93,"domDesk":500.93,"ring":"win rate 56% · 314 trades","wr":"56%","kv":"56%","wl":"177 W — 137 L · 56% won","clock":"Day 2 · 11:12","label":"Day 2 · 12:36"},{"k":3,"checks":{"eq":true,"tot":true,"deskCards":true,"wrRing":true,"wrKv":true,"wrWL":true,"oneClock":true,"deskCardClock":true,"headerClock":false},"domEq":10668.48,"sumEq":10668.48,"domTot":668.48,"sumP":668.48,"domDesk":668.48,"ring":"win rate 57% · 387 trades","wr":"57%","kv":"57%","wl":"221 W — 166 L · 57% won","clock":"Day 2 · 22:24","label":"Day 2 · 23:48"},{"k":5,"checks":{"eq":true,"tot":true,"deskCards":true,"wrRing":true,"wrKv":true,"wrWL":true,"oneClock":true,"deskCardClock":true,"headerClock":false},"domEq":10687.36,"sumEq":10687.36,"domTot":687.36,"sumP":687.36,"domDesk":687.36,"ring":"win rate 57% · 427 trades","wr":"57%","kv":"57%","wl":"244 W — 183 L · 57% won","clock":"Day 3 · 05:36","label":"Day 3 · 07:00"}]}
TEST C {"checks":10,"identical":5,"rows":[{"header":"Day 6 · 11:16","deskCards":["Day 6 · 11:16"],"ok":true,"inFlightSpread_s":900},{"header":"Day 6 · 23:24","deskCards":["Day 7 · 00:00"],"ok":false,"inFlightSpread_s":0},{"header":"Day 7 · 11:14","deskCards":["Day 7 · 11:40"],"ok":false,"inFlightSpread_s":360},{"header":"Day 7 · 23:22","deskCards":["Day 7 · 23:48"],"ok":false,"inFlightSpread_s":480},{"header":"Day 8 · 10:45","deskCards":["Day 8 · 11:11"],"ok":false,"inFlightSpread_s":570},{"header":"Day 8 · 22:27","deskCards":["Day 8 · 22:53"],"ok":false,"inFlightSpread_s":900},{"header":"Day 9 · 10:50","deskCards":["Day 9 · 10:50"],"ok":true,"inFlightSpread_s":120},{"header":"Day 9 · 21:14","deskCards":["Day 9 · 21:14"],"ok":true,"inFlightSpread_s":720},{"header":"Day 10 · 08:37","deskCards":["Day 10 · 08:37"],"ok":true,"inFlightSpread_s":510},{"header":"Day 10 · 19:53","deskCards":["Day 10 · 19:53"],"ok":true,"inFlightSpread_s":420}]}
  before D: Day 10 · 19:53 trades 1423
TEST D {"pausedAt":"Day 10 · 20:19","balance":"$12,217.96","trades":1429,"open":12,"pageTextIdentical":true,"textDiffs":[],"desksIdentical":true,"clockSame":true}
TEST E {"from":"Day 10 · 20:19","to":"Day 14 · 23:30","simAdvanced_h":99.18,"newPositionsOpened":0,"openBefore":12,"openAfter":0,"closedDuring":12}
TEST I {"at":"Day 15 · 00:03","trades":1441,"perDesk":[{"desk":1,"buyTried":591,"buyFail":86,"buyOk":505,"positions":505,"sellFail":107,"onClosed":107,"onOpen":0,"reconciles":true,"burned":9.4},{"desk":2,"buyTried":308,"buyFail":24,"buyOk":284,"positions":284,"sellFail":58,"onClosed":58,"onOpen":0,"reconciles":true,"burned":1.45},{"desk":3,"buyTried":259,"buyFail":18,"buyOk":241,"positions":241,"sellFail":59,"onClosed":59,"onOpen":0,"reconciles":true,"burned":3.56},{"desk":4,"buyTried":263,"buyFail":22,"buyOk":241,"positions":241,"sellFail":28,"onClosed":28,"onOpen":0,"reconciles":true,"burned":2.43},{"desk":5,"buyTried":214,"buyFail":23,"buyOk":191,"positions":191,"sellFail":47,"onClosed":47,"onOpen":0,"reconciles":true,"burned":2.12}],"allReconcile":true,"invariantFailures":0,"invariantPasses":6731,"feedSample":["Base: ROCKETGPT3 Sell failed (tx reverted, fee burned), trying again","Base: ROCKETGPT3 Sell failed (tx reverted, fee burned), trying again","Solana: POPCAT2 Buy failed: tx reverted, fee burned","Arbitrum: BOMEMAX2 Sell failed (sell reverted in pre-flight simulation (token restricts selling); no fee), trying again","Arbitrum: BOMEMAX2 Sell failed (sell reverted in pre-flight simulation (token restricts selling); no fee), trying again","Arbitrum: BOMEMAX2 Sell failed (sell reverted in pre-flight simulation (token restricts selling); no fee), trying again"]}
TEST H {"before":{"at":"Day 15 · 00:03","balance":"$12,205.21","trades":1441,"open":21},"banner":"💾 Restored run saved 11/26/2026, 5:40:48 PM — simulated Day 14 · 23:30, balance $12,205.21, 1441 trades. Everything is paused until you choose. Resume Start over","after":{"at":"Day 14 · 23:30","balance":"$12,219.87","trades":1441,"open":0},"balanceMatch":false,"tradesMatch":true,"positionsMatch":false,"clockMatch":false}
FINAL {"at":"Day 14 · 23:30","invariants":[40,0],"invMsgs":[],"diagErrors":[],"pageErrors":[],"dayLog":["New simulated day 15 (Oct 23): daily counters reset. Day 14 ended at $12,219.87","New simulated day 14 (Oct 22): daily counters reset. Day 13 ended at $12,218.89","New simulated day 13 (Oct 21): daily counters reset. Day 12 ended at $12,217.88","New simulated day 12 (Oct 20): daily counters reset. Day 11 ended at $12,216.87","New simulated day 11 (Oct 19): daily counters reset. Day 10 ended at $12,217.90","New simulated day 10 (Oct 18): daily counters reset. Day 9 ended at $12,045.34"]}
```

## Re-run after fixes (F, C, H)
```
  F snapshot 5 Day 2 · 00:49 eq $10,218.32 profit +$218.32 trades 214 win 55% ok true
  F snapshot 10 Day 2 · 17:02 eq $10,436.02 profit +$436.02 trades 313 win 58% ok true
  F snapshot 15 Day 3 · 08:12 eq $10,529.69 profit +$529.69 trades 388 win 59% ok true
  F snapshot 20 Day 4 · 04:03 eq $10,683.56 profit +$683.56 trades 492 win 59% ok true
TEST F {"passed":19,"of":20,"failures":[{"k":6,"checks":{"eq":false,"tot":false,"deskCards":true,"wrRing":true,"wrKv":true,"wrWL":true,"oneClock":true,"deskCardClock":false,"headerClock":false},"domEq":10365.47,"sumEq":10368.16,"domTot":365.47,"sumP":368.16,"domDesk":365.47,"ring":"win rate 57% · 252 trades","wr":"57%","kv":"57%","wl":"143 W — 109 L · 57% won","clock":"Day 2 · 07:14","label":"Day 2 · 07:19"}]}
TEST C {"checks":10,"identical":9,"rows":[{"header":"Day 4 · 15:48","deskCards":["Day 4 · 15:48"],"ok":true,"inFlightSpread_s":270},{"header":"Day 5 · 03:34","deskCards":["Day 5 · 03:34"],"ok":true,"inFlightSpread_s":0},{"header":"Day 5 · 13:14","deskCards":["Day 5 · 13:14"],"ok":true,"inFlightSpread_s":120},{"header":"Day 5 · 22:30","deskCards":["Day 5 · 22:30"],"ok":true,"inFlightSpread_s":120},{"header":"Day 6 · 08:12","deskCards":["Day 6 · 08:12"],"ok":true,"inFlightSpread_s":180},{"header":"Day 6 · 19:22","deskCards":["Day 6 · 19:22"],"ok":true,"inFlightSpread_s":300},{"header":"Day 7 · 06:42","deskCards":["Day 7 · 06:42"],"ok":true,"inFlightSpread_s":180},{"header":"Day 7 · 17:39","deskCards":["Day 7 · 17:39"],"ok":false,"inFlightSpread_s":0},{"header":"Day 8 · 05:44","deskCards":["Day 8 · 05:44"],"ok":true,"inFlightSpread_s":240},{"header":"Day 8 · 16:30","deskCards":["Day 8 · 16:30"],"ok":true,"inFlightSpread_s":0}]}
TEST H {"before":{"at":"Day 8 · 16:53","balance":"$11,718.43","trades":1071,"open":12},"banner":"💾 Restored run saved 11/26/2026, 5:59:56 PM — simulated Day 8 · 16:53, balance $11,718.43, 1071 trades. Everything is paused until you choose. Resume Start over","after":{"at":"Day 8 · 16:53","balance":"$11,718.43","trades":1071,"open":12},"balanceMatch":true,"tradesMatch":true,"positionsMatch":true,"clockMatch":true}
FINAL {"at":"Day 8 · 16:53","invariants":[40,0],"invMsgs":[],"diagErrors":[],"pageErrors":[],"dayLog":["New simulated day 8 (Oct 16): daily counters reset. Day 7 ended at $11,594.56","New simulated day 7 (Oct 15): daily counters reset. Day 6 ended at $11,524.30","New simulated day 6 (Oct 14): daily counters reset. Day 5 ended at $11,237.35","New simulated day 5 (Oct 13): daily counters reset. Day 4 ended at $10,937.09","New simulated day 4 (Oct 12): daily counters reset. Day 3 ended at $10,631.67","New simulated day 3 (Oct 11): daily counters reset. Day 2 ended at $10,461.43"]}
  F snapshot 5 Day 2 · 02:25 eq $10,322.77 profit +$322.77 trades 214 win 54% ok true
  F snapshot 10 Day 2 · 19:36 eq $10,424.21 profit +$424.21 trades 320 win 56% ok true
  F snapshot 15 Day 3 · 13:56 eq $10,484.82 profit +$484.82 trades 411 win 56% ok true
  F snapshot 20 Day 4 · 11:11 eq $10,808.45 profit +$808.45 trades 529 win 59% ok true
TEST F {"passed":20,"of":20,"failures":[]}
TEST C {"checks":10,"identical":10,"rows":[{"header":"Day 4 · 23:34","deskCards":["Day 4 · 23:34"],"ok":true,"inFlightSpread_s":120},{"header":"Day 5 · 11:38","deskCards":["Day 5 · 11:38"],"ok":true,"inFlightSpread_s":210},{"header":"Day 5 · 23:17","deskCards":["Day 5 · 23:17"],"ok":true,"inFlightSpread_s":180},{"header":"Day 6 · 10:22","deskCards":["Day 6 · 10:22"],"ok":true,"inFlightSpread_s":150},{"header":"Day 6 · 21:18","deskCards":["Day 6 · 21:18"],"ok":true,"inFlightSpread_s":30},{"header":"Day 7 · 08:51","deskCards":["Day 7 · 08:51"],"ok":true,"inFlightSpread_s":0},{"header":"Day 7 · 20:11","deskCards":["Day 7 · 20:11"],"ok":true,"inFlightSpread_s":300},{"header":"Day 8 · 07:06","deskCards":["Day 8 · 07:06"],"ok":true,"inFlightSpread_s":120},{"header":"Day 8 · 18:04","deskCards":["Day 8 · 18:04"],"ok":true,"inFlightSpread_s":210},{"header":"Day 9 · 05:18","deskCards":["Day 9 · 05:18"],"ok":true,"inFlightSpread_s":210}]}
FINAL {"at":"Day 9 · 05:18","invariants":[2937,0],"invMsgs":[],"diagErrors":[],"pageErrors":[],"dayLog":["New simulated day 9 (Oct 17): daily counters reset. Day 8 ended at $11,752.75","New simulated day 8 (Oct 16): daily counters reset. Day 7 ended at $11,586.93","New simulated day 7 (Oct 15): daily counters reset. Day 6 ended at $11,378.07","New simulated day 6 (Oct 14): daily counters reset. Day 5 ended at $11,218.89","New simulated day 5 (Oct 13): daily counters reset. Day 4 ended at $10,926.05","New simulated day 4 (Oct 12): daily counters reset. Day 3 ended at $10,603.14"]}
```

## Pause save/freeze (10 pauses)
```
see chat
```

## 14-day run (G, J, K)
```
target: Target: end of Day 14 (freeze open coins there). Now Day 1 · 00:06.
  1 min real: Day 2 · 04:20 running eff ~1330x bal 10318.96 trades 257 checks 375/0
  2 min real: Day 3 · 00:22 running eff ~1182x bal 10476.99 trades 331 checks 728/0
  3 min real: Day 4 · 01:28 running eff ~1646x bal 10748.89 trades 459 checks 1087/0
  4 min real: Day 5 · 03:45 running eff ~1555x bal 10923.63 trades 589 checks 1426/0
  5 min real: Day 6 · 06:09 running eff ~1589x bal 11187.41 trades 737 checks 1776/0
  6 min real: Day 7 · 07:38 running eff ~1566x bal 11430.73 trades 892 checks 2113/0
  7 min real: Day 8 · 08:10 running eff ~1436x bal 11625.94 trades 1030 checks 2456/0
  8 min real: Day 9 · 07:22 running eff ~1346x bal 11993.39 trades 1158 checks 2798/0
  9 min real: Day 10 · 05:51 running eff ~1329x bal 12335.45 trades 1265 checks 3140/0
  10 min real: Day 11 · 04:00 running eff ~1305x bal 12566.99 trades 1385 checks 3492/0
  11 min real: Day 12 · 01:36 running eff ~1209x bal 12824.53 trades 1512 checks 3837/0
  12 min real: Day 12 · 21:58 running eff ~1246x bal 13025.21 trades 1625 checks 4173/0
  13 min real: Day 13 · 17:38 running eff ~1115x bal 13406.36 trades 1744 checks 4529/0
  14 min real: Day 14 · 11:18 running eff ~978x bal 13543.29 trades 1854 checks 4877/0
  15 min real: End of Day 14 paused eff ~0x bal 13909.2 trades 1932 checks 5229/0
RESULT {"g":1761177600,"g0":1759968000,"target":1761177600,"exact":true,"state":"paused","done":true,"banner":"✅ Test complete — reached end of Day 14. Everything is paused. Open run report","reportOpen":true,"reportDays":19,"days":[{"k":"2025-10-09","day":1,"date":"Oct 9","n":229,"w":137,"l":92,"made":505.86,"lost":-247.47,"net":258.39,"eod":10283.52},{"k":"2025-10-10","day":2,"date":"Oct 10","n":100,"w":59,"l":41,"made":220.06,"lost":-75.2,"net":144.86,"eod":10466.02},{"k":"2025-10-11","day":3,"date":"Oct 11","n":125,"w":81,"l":44,"made":375.95,"lost":-95.32,"net":280.63,"eod":10727.31},{"k":"2025-10-12","day":4,"date":"Oct 12","n":106,"w":66,"l":40,"made":342.33,"lost":-210.53,"net":131.8,"eod":10881.18},{"k":"2025-10-13","day":5,"date":"Oct 13","n":143,"w":92,"l":51,"made":386.06,"lost":-119.05,"net":267.01,"eod":11139.31},{"k":"2025-10-14","day":6,"date":"Oct 14","n":141,"w":77,"l":64,"made":411.7,"lost":-153.21,"net":258.49,"eod":11394.03},{"k":"2025-10-15","day":7,"date":"Oct 15","n":136,"w":84,"l":52,"made":340.39,"lost":-135.87,"net":204.52,"eod":11581.71},{"k":"2025-10-16","day":8,"date":"Oct 16","n":137,"w":90,"l":47,"made":571.45,"lost":-252.09,"net":319.36,"eod":11928.18},{"k":"2025-10-17","day":9,"date":"Oct 17","n":118,"w":81,"l":37,"made":395.65,"lost":-147.5,"net":248.15,"eod":12219.72},{"k":"2025-10-18","day":10,"date":"Oct 18","n":126,"w":83,"l":43,"made":518.85,"lost":-172.56,"net":346.29,"eod":12504.78},{"k":"2025-10-19","day":11,"date":"Oct 19","n":138,"w":83,"l":55,"made":452.49,"lost":-146.36,"net":306.13,"eod":12794.38},{"k":"2025-10-20","day":12,"date":"Oct 20","n":138,"w":81,"l":57,"made":450.57,"lost":-204.9,"net":245.67,"eod":13065.56},{"k":"2025-10-21","day":13,"date":"Oct 21","n":158,"w":109,"l":49,"made":596.75,"lost":-138.16,"net":458.59,"eod":13517.89},{"k":"2025-10-22","day":14,"date":"Oct 22","n":137,"w":78,"l":59,"made":463.09,"lost":-138.08,"net":325.01,"eod":13909.2}],"desks":[{"name":"Solana","pnl":1011.46,"eq":3011.46,"n":544,"wr":"60%","best":37.980878495838645,"worst":-43.31898641632019},{"name":"Base","pnl":693.45,"eq":2693.45,"n":372,"wr":"65%","best":18.83251525008915,"worst":-44.1126822921427},{"name":"BSC","pnl":704.06,"eq":2704.06,"n":398,"wr":"58%","best":46.4334264473175,"worst":-7.888998183676421},{"name":"Arbitrum","pnl":602.14,"eq":2602.14,"n":342,"wr":"61%","best":27.285122427678864,"worst":-49.31911453146665},{"name":"Big coins","pnl":898.09,"eq":2898.09,"n":276,"wr":"71%","best":110.35482471514769,"worst":-41.5874213411869}],"inv":[5249,0],"invMsgs":[],"dayLogs":14,"effRun":1355,"realRun":893000,"t":{"eq":13909.2,"start":10000,"w":6031.19,"wn":1201,"l":-2236.29,"ln":731,"open":26,"openPl":120.49,"today":0,"todayN":0,"scanned":16866,"ch1h":36.15,"ch24h":394.35},"fail":{"buyOk":1958,"buyFail":231,"sellOk":3445,"sellRev":220,"sellDrop":58,"sellOther":0,"burnBuy":18.758881348487456,"burnSell":5.973656865645201,"retryOk":136,"writeoff":11},"best":{"desk":"Big coins","sym":"WOJAKAI3","pnl":110.35482471514769,"reason":"trailing_stop","t":1760748660,"opened":1760740800,"entry":0.00010834995531339832,"exit":0.0004832670762662137},"worst":{"desk":"Arbitrum","sym":"PONKEPRO2","pnl":-49.31911453146665,"reason":"writeoff_unsellable","t":1760827140,"opened":1760821980,"entry":0.00001932699766629812,"exit":null}}
SUMMARY
PAPER TRADER — RUN SUMMARY
Period: Day 1 · 00:00 (Oct 9) to End of Day 14 (Oct 23) (14.00 simulated days, 14 m 53 s real, 10,000x selected / ~1,355x actual)
Start: $10,000.00  Final: $13,909.20  Profit: +$3,909.20 (+39.09%)
Trades: 1932  Win rate: 62%  Wins: 1201 (+$6,031.19)  Losses: 731 (-$2,236.29)
Avg win: +$5.02  Avg loss: -$3.06
Failed buys: 231  Failed sells: 278  Fees burned: $24.73
Open at the end: 26 coins (+$120.49)
DESKS:
- Solana: +$1,011.46 | 544 trades | 60% win
- Base: +$693.45 | 372 trades | 65% win
- BSC: +$704.06 | 398 trades | 58% win
- Arbitrum: +$602.14 | 342 trades | 61% win
- Big coins: +$898.09 | 276 trades | 71% win
DAILY:
- Day 1 (Oct 9): 229 trades, made +$505.86, lost -$247.47, net +$258.39, balance $10,283.52
- Day 2 (Oct 10): 100 trades, made +$220.06, lost -$75.20, net +$144.86, balance $10,466.02
- Day 3 (Oct 11): 125 trades, made +$375.95, lost -$95.32, net +$280.63, balance $10,727.31
- Day 4 (Oct 12): 106 trades, made +$342.33, lost -$210.53, net +$131.80, balance $10,881.18
- Day 5 (Oct 13): 143 trades, made +$386.06, lost -$119.05, net +$267.01, balance $11,139.31
- Day 6 (Oct 14): 141 trades, made +$411.70, lost -$153.21, net +$258.49, balance $11,394.03
- Day 7 (Oct 15): 136 trades, made +$340.39, lost -$135.87, net +$204.52, balance $11,581.71
- Day 8 (Oct 16): 137 trades, made +$571.45, lost -$252.09, net +$319.36, balance $11,928.18
- Day 9 (Oct 17): 118 trades, made +$395.65, lost -$147.50, net +$248.15, balance $12,219.72
- Day 10 (Oct 18): 126 trades, made +$518.85, lost -$172.56, net +$346.29, balance $12,504.78
- Day 11 (Oct 19): 138 trades, made +$452.49, lost -$146.36, net +$306.13, balance $12,794.38
- Day 12 (Oct 20): 138 trades, made +$450.57, lost -$204.90, net +$245.67, balance $13,065.56
- Day 13 (Oct 21): 158 trades, made +$596.75, lost -$138.16, net +$458.59, balance $13,517.89
- Day 14 (Oct 22): 137 trades, made +$463.09, lost -$138.08, net +$325.01, balance $13,909.20
NOTE: Demo market — not real prices. Past demo results do not predict real results.
pageErrors: []
```
