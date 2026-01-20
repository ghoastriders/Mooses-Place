from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

import numpy as np


@dataclass
class NumberStats:
    count: int
    last_seen_draws_ago: int | None


def compute_number_stats(draws: List[List[int]], main_min: int, main_max: int) -> Dict[int, NumberStats]:
    """Compute frequency and last-seen (draws ago) for each number.

    draws: list of draw main number lists, ordered most-recent-first.
    """
    counts = {n: 0 for n in range(main_min, main_max + 1)}
    last_seen: Dict[int, int] = {}

    for idx, nums in enumerate(draws):
        for n in nums:
            if n in counts:
                counts[n] += 1
                if n not in last_seen:
                    last_seen[n] = idx

    stats: Dict[int, NumberStats] = {}
    for n in range(main_min, main_max + 1):
        stats[n] = NumberStats(count=counts[n], last_seen_draws_ago=last_seen.get(n))
    return stats


def make_weights(
    stats: Dict[int, NumberStats],
    strategy: str,
    alpha: float = 1.0,
    beta: float = 1.0,
) -> Dict[int, float]:
    """Convert stats to sampling weights.

    - hot: weights by frequency
    - cold: weights by "overdue" (draws since last seen)
    - balanced: combine both
    - random: uniform
    """
    numbers = sorted(stats.keys())
    counts = np.array([stats[n].count for n in numbers], dtype=float)
    # last_seen_draws_ago: larger means more "overdue"; None => never seen in window, treat as max+1
    last_seen = np.array([
        (stats[n].last_seen_draws_ago if stats[n].last_seen_draws_ago is not None else len(numbers))
        for n in numbers
    ], dtype=float)

    if strategy == "random":
        w = np.ones_like(counts)
    elif strategy == "hot":
        w = (counts + 1.0) ** alpha
    elif strategy == "cold":
        w = (last_seen + 1.0) ** beta
    else:  # balanced
        w = ((counts + 1.0) ** alpha) * (((last_seen + 1.0) ** beta) ** 0.5)

    # normalize to positive weights
    w = np.maximum(w, 1e-9)

    return {n: float(w[i]) for i, n in enumerate(numbers)}


def top_hot_cold(stats: Dict[int, NumberStats], k: int = 10) -> Tuple[List[dict], List[dict]]:
    hot = sorted(stats.items(), key=lambda kv: kv[1].count, reverse=True)[:k]
    cold = sorted(
        stats.items(),
        key=lambda kv: (kv[1].last_seen_draws_ago if kv[1].last_seen_draws_ago is not None else 10**9),
        reverse=True,
    )[:k]
    hot_out = [{"n": n, "count": s.count} for n, s in hot]
    cold_out = [{"n": n, "last_seen_draws_ago": s.last_seen_draws_ago} for n, s in cold]
    return hot_out, cold_out
