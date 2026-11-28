from __future__ import annotations

import argparse
import logging
import os
import random
import signal
import sys

from . import report
from .bot import Bot
from .clock import RealClock, VirtualClock
from .config import Config
from .store import Store


def make_provider(cfg: Config, clock):
    if cfg.provider == "mock":
        from .providers_mock import MockProvider
        return MockProvider(clock, random.Random(cfg.seed + 1), cfg.chains)
    from .providers_live import LiveProvider
    return LiveProvider()


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="paper_trader", description="Autonomous crypto PAPER trading bot (virtual money only)")
    ap.add_argument("command", choices=["run", "report", "reset-shutdown"])
    ap.add_argument("--config", help="JSON config file (see Config for keys)")
    ap.add_argument("--provider", choices=["live", "mock"], help="override config provider")
    ap.add_argument("--state-dir", help="override state directory")
    ap.add_argument("--days", type=float, help="mock provider only: simulated days to run (default 3)")
    ap.add_argument("--fresh", action="store_true", help="delete saved state first")
    a = ap.parse_args(argv)

    cfg = Config.load(a.config)
    if a.provider:
        cfg.provider = a.provider
    if a.state_dir:
        cfg.state_dir = a.state_dir
    if a.fresh and a.command == "run":
        for f in ("paper.db", "bot.log"):
            try:
                os.remove(os.path.join(cfg.state_dir, f))
            except FileNotFoundError:
                pass
    os.makedirs(cfg.state_dir, exist_ok=True)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s",
                        handlers=[logging.StreamHandler(sys.stdout),
                                  logging.FileHandler(os.path.join(cfg.state_dir, "bot.log"))])
    store = Store(cfg.state_dir)

    if a.command == "report":
        print(report.build(store))
        return 0
    if a.command == "reset-shutdown":
        saved = store.get("portfolio")
        if saved:
            saved["shutdown"], saved["shutdown_reason"] = False, ""
            saved["peak_equity"] = saved["cash"] + sum(p["qty"] * p["last_price"] for p in saved["positions"].values())
            store.set("portfolio", saved)
        try:
            os.remove(os.path.join(cfg.state_dir, "EMERGENCY_STOP"))
        except FileNotFoundError:
            pass
        print("shutdown latch cleared (peak equity re-based)")
        return 0

    clock = VirtualClock() if cfg.provider == "mock" else RealClock()
    bot = Bot(cfg, make_provider(cfg, clock), clock, store)
    stop = {"flag": False}
    signal.signal(signal.SIGINT, lambda *_: stop.__setitem__("flag", True))
    signal.signal(signal.SIGTERM, lambda *_: stop.__setitem__("flag", True))
    logging.info("PAPER TRADING ONLY - simulated money, provider=%s, capital=$%.0f", cfg.provider, bot.pf.equity())
    end = clock.now() + (a.days or 3) * 86400 if cfg.provider == "mock" else float("inf")
    while not stop["flag"] and clock.now() < end:
        try:
            bot.tick()
        except Exception:                      # never die: keep monitoring open positions
            logging.exception("tick failed")
        clock.sleep(cfg.tick_interval)
    bot._save()
    print(report.build(store))
    return 0


if __name__ == "__main__":
    sys.exit(main())
