import os
import random
import tempfile
import unittest

from paper_trader.bot import Bot
from paper_trader.clock import VirtualClock
from paper_trader.config import Config
from paper_trader.execution import Simulator
from paper_trader.models import Plan, SecurityData, Snapshot
from paper_trader.portfolio import Portfolio
from paper_trader.providers_mock import MockProvider
from paper_trader.risk import RiskManager
from paper_trader import security, strategy
from paper_trader.store import Store

NOW = 1_760_000_000.0


def snap(**kw):
    d = dict(chain="base", address="0xabc", symbol="X", price_usd=1.0, liquidity_usd=100_000, ts=NOW, fdv_usd=500_000,
             volume_5m=2000, volume_1h=30_000, volume_6h=90_000, volume_24h=200_000, chg_5m=1, chg_1h=10, chg_6h=15,
             chg_24h=20, buys_1h=120, sells_1h=60, created_at=NOW - 3 * 3600, pair_address="p")
    d.update(kw)
    return Snapshot(**d)


def clean_sec(**kw):
    d = dict(is_honeypot=False, buy_tax=1, sell_tax=1, is_open_source=True, is_proxy=False, mintable=False,
             hidden_owner=False, can_take_back_ownership=False, owner_change_balance=False, transfer_pausable=False,
             cannot_sell_all=False, trading_cooldown=False, has_blacklist=False, slippage_modifiable=False,
             selfdestruct=False, external_call=False, creator_honeypot_history=False, is_in_dex=True,
             holder_count=800, top10_pct=25, creator_pct=1, owner_pct=0, lp_locked_pct=95)
    d.update(kw)
    return SecurityData(**d)


class SecurityTests(unittest.TestCase):
    cfg = Config()

    def test_clean_token_passes(self):
        self.assertTrue(security.evaluate(clean_sec(), snap(), "new", self.cfg, NOW).passed)

    def test_each_critical_flag_rejects(self):
        for field in ("is_honeypot", "hidden_owner", "mintable", "cannot_sell_all", "owner_change_balance",
                      "transfer_pausable", "creator_honeypot_history", "has_blacklist"):
            v = security.evaluate(clean_sec(**{field: True}), snap(), "new", self.cfg, NOW)
            self.assertFalse(v.passed, field)

    def test_fail_closed_on_unknown_and_missing(self):
        self.assertFalse(security.evaluate(None, snap(), "new", self.cfg, NOW).passed)
        self.assertFalse(security.evaluate(clean_sec(sell_tax=None), snap(), "new", self.cfg, NOW).passed)
        self.assertFalse(security.evaluate(clean_sec(is_honeypot=None), snap(), "new", self.cfg, NOW).passed)

    def test_holders_taxes_liquidity_lp(self):
        for kw in (dict(top10_pct=80), dict(creator_pct=30), dict(sell_tax=40), dict(lp_locked_pct=5),
                   dict(holder_count=5)):
            self.assertFalse(security.evaluate(clean_sec(**kw), snap(), "new", self.cfg, NOW).passed, kw)
        self.assertFalse(security.evaluate(clean_sec(), snap(liquidity_usd=2000), "new", self.cfg, NOW).passed)

    def test_buys_only_flow_is_honeypot_signature(self):
        v = security.evaluate(clean_sec(), snap(buys_1h=80, sells_1h=0), "new", self.cfg, NOW)
        self.assertIn("sells_exist", v.failures)


class StrategyTests(unittest.TestCase):
    cfg = Config()

    def test_trending_alone_is_not_enough(self):
        # high volume, but already extended / weak flow => no buy
        s = snap(created_at=NOW - 500 * 3600, chg_1h=60, volume_1h=80_000, liquidity_usd=500_000)
        self.assertIsNone(strategy.analyze_trending(s, NOW, self.cfg, True)[0])

    def test_too_young_and_pumped_new_rejected(self):
        self.assertIsNone(strategy.analyze_new(snap(created_at=NOW - 120), NOW, self.cfg)[0])
        self.assertIsNone(strategy.analyze_new(snap(chg_1h=900), NOW, self.cfg)[0])

    def test_plan_reward_risk(self):
        plan, _ = strategy.analyze_new(snap(liquidity_usd=150_000, volume_1h=60_000, buys_1h=300, sells_1h=100,
                                            fdv_usd=900_000), NOW, self.cfg)
        self.assertIsNotNone(plan)
        self.assertGreaterEqual(plan.rr, 1.5)


class RiskTests(unittest.TestCase):
    def setUp(self):
        self.cfg = Config()
        self.rm = RiskManager(self.cfg)
        self.pf = Portfolio(10_000)
        self.plan = Plan(10, 25, 60, 8, 70, 2.5)

    def approve(self, **kw):
        s = kw.pop("snap", snap())
        return self.rm.approve_entry(s, kw.pop("cat", "trending"), kw.pop("risk", 20), self.plan, self.pf,
                                     NOW, kw.pop("ok", True))

    def test_sizing_respects_all_caps(self):
        d = self.approve()
        self.assertTrue(d.approved)
        self.assertLessEqual(d.usd, 10_000 * 0.02 + 1e-6)                    # position cap
        self.assertLessEqual(d.usd, 100_000 * self.cfg.max_liquidity_fraction + 1e-6)
        self.assertLessEqual(d.usd * 0.10, 10_000 * 0.005 + 1e-6)            # risk-per-trade at stop

    def test_vetoes(self):
        self.assertFalse(self.approve(risk=80).approved)
        self.assertFalse(self.approve(ok=False).approved)
        self.pf.pause_until = NOW + 10
        self.assertFalse(self.approve().approved)
        self.pf.pause_until = 0
        self.pf.shutdown = True
        self.assertFalse(self.approve().approved)

    def test_no_duplicate_buys_and_cooldown(self):
        s = snap()
        self.pf.cooldowns[s.key] = NOW + 100
        self.assertFalse(self.approve().approved)

    def test_risk_never_increases_after_losses(self):
        base = self.rm.risk_multiplier(self.pf)
        self.pf.cash = 9_500
        self.pf.loss_streak = 3
        self.assertLess(self.rm.risk_multiplier(self.pf), base)
        self.assertLessEqual(base, 1.0)

    def test_drawdown_triggers_shutdown(self):
        self.pf.cash = 10_000 * (1 - 0.13)
        self.assertTrue(self.rm.check_shutdown(self.pf))

    def test_daily_loss_limit(self):
        self.pf.day_start_equity = 10_000
        self.pf.cash = 9_650
        self.assertFalse(self.approve().approved)

    def test_regime(self):
        self.assertEqual(self.rm.regime({"btc": -9}), "crash")
        self.assertEqual(self.rm.regime({"btc": -4, "eth": -3.5}), "danger")
        self.assertEqual(self.rm.regime({"btc": 0.2}), "ok")
        self.assertEqual(self.rm.regime(None), "unknown")


class ExecutionTests(unittest.TestCase):
    def test_costs_and_impact(self):
        sim = Simulator(Config(base_fail_prob=0, partial_fill_prob=0), random.Random(1))
        f = sim.buy(snap(), 1000, 2.0, False)
        self.assertTrue(f.ok)
        self.assertGreater(f.price, 1.0)                    # paid above market
        self.assertLess(f.qty, 1000 / 1.0)                  # fees + tax + slippage reduce tokens
        out = sim.sell(snap(), f.qty, 2.0, False)
        self.assertTrue(out.ok)
        self.assertLess(out.usd, 1000)                      # round trip always loses costs

    def test_partial_fill_on_thin_pool(self):
        sim = Simulator(Config(base_fail_prob=0, partial_fill_prob=0), random.Random(1))
        f = sim.buy(snap(liquidity_usd=10_000), 4_000, 0, False)
        self.assertTrue(f.partial)
        self.assertLess(f.usd, 4_000)

    def test_failed_tx_burns_gas(self):
        sim = Simulator(Config(base_fail_prob=1.0), random.Random(1))
        f = sim.buy(snap(chain="ethereum"), 100, 0, False)
        self.assertFalse(f.ok)
        self.assertGreater(f.gas_usd, 0)

    def test_selling_restriction(self):
        sim = Simulator(Config(base_fail_prob=0), random.Random(1), lambda c, a: True)
        self.assertFalse(sim.sell(snap(), 10, 0, True).ok)


class EndToEnd(unittest.TestCase):
    def run_bot(self, seed, days, **over):
        d = tempfile.mkdtemp()
        cfg = Config(provider="mock", state_dir=d, seed=seed, **over)
        clock = VirtualClock()
        bot = Bot(cfg, MockProvider(clock, random.Random(seed + 1), cfg.chains), clock, Store(d))
        end = clock.now() + days * 86400
        while clock.now() < end:
            bot.tick()
            clock.sleep(cfg.tick_interval)
            self.invariants(bot)
        return bot, d

    def invariants(self, bot):
        pf, cfg = bot.pf, bot.cfg
        eq = pf.equity()
        self.assertGreaterEqual(pf.cash, -1e-6)
        self.assertLessEqual(len(pf.positions), cfg.max_open_positions)
        if not pf.shutdown:
            self.assertLessEqual(pf.exposure(), eq * (cfg.max_total_exposure_pct + 5) / 100)

    def test_runs_and_honours_limits(self):
        bot, d = self.run_bot(3, 2)
        self.assertGreater(bot.stats["scanned"], 0)
        self.assertTrue(os.path.exists(os.path.join(d, "paper.db")))

    def test_kill_file_flattens_and_blocks(self):
        d = tempfile.mkdtemp()
        cfg = Config(provider="mock", state_dir=d, seed=5)
        clock = VirtualClock()
        bot = Bot(cfg, MockProvider(clock, random.Random(6), cfg.chains), clock, Store(d))
        for _ in range(3000):
            bot.tick(); clock.sleep(5)
            if bot.pf.positions:
                break
        open(os.path.join(d, "EMERGENCY_STOP"), "w").close()
        bought = bot.stats["bought"]
        for _ in range(400):
            bot.tick(); clock.sleep(5)
        self.assertTrue(bot.pf.shutdown)
        self.assertEqual(bot.stats["bought"], bought)           # no entries after shutdown
        self.assertEqual(len(bot.pf.positions), 0)              # everything flattened


if __name__ == "__main__":
    unittest.main()
