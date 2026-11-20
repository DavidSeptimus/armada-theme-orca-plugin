"""Prints the next high tides for the port."""

from dataclasses import dataclass
from datetime import datetime, timedelta

LUNAR_HALF_DAY = timedelta(hours=12, minutes=25)


@dataclass(frozen=True)
class Tide:
    at: datetime
    height_m: float

    @property
    def label(self) -> str:
        return f"{self.at:%a %H:%M}  {self.height_m:.1f} m"


def next_tides(first: datetime, count: int = 4) -> list[Tide]:
    tides = []
    for index in range(count):
        height = 3.2 if index % 2 == 0 else 2.9
        tides.append(Tide(first + index * LUNAR_HALF_DAY, height))
    return tides


if __name__ == "__main__":
    for tide in next_tides(datetime(2026, 3, 14, 4, 10)):
        print(tide.label)
