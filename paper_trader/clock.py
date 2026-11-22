import time


class RealClock:
    def now(self) -> float:
        return time.time()

    def sleep(self, s: float) -> None:
        time.sleep(s)


class VirtualClock:
    """Used with the synthetic provider so months of market time run in seconds."""
    def __init__(self, start: float = 1_760_000_000.0):
        self.t = start

    def now(self) -> float:
        return self.t

    def sleep(self, s: float) -> None:
        self.t += s
