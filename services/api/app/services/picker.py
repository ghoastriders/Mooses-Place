from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional

import numpy as np

from app.services.scoring import NumberStats


@dataclass
class Constraints:
    odd_even: str = "any"  # any | balanced | more_odd | more_even
    avoid_runs: bool = True


def _odd_count(nums: List[int]) -> int:
    return sum(1 for n in nums if n % 2 == 1)


def _has_long_run(nums: List[int], max_run: int = 3) -> bool:
    # long consecutive run like 12,13,14,15
    if len(nums) < max_run + 1:
        return False
    s = sorted(nums)
    run = 1
    for i in range(1, len(s)):
        if s[i] == s[i - 1] + 1:
            run += 1
            if run > max_run:
                return True
        else:
            run = 1
    return False


def _odd_even_ok(nums: List[int], mode: str) -> bool:
    if mode == "any":
        return True
    odd = _odd_count(nums)
    even = len(nums) - odd
    if mode == "balanced":
        return abs(odd - even) <= 1
    if mode == "more_odd":
        return odd >= even
    if mode == "more_even":
        return even >= odd
    return True


def _build_weights(stats: Dict[int, NumberStats], main_min: int, main_max: int, strategy: str) -> np.ndarray:
    nums = np.arange(main_min, main_max + 1)
    counts = np.array([stats[n].count for n in nums], dtype=float)

    # last_seen: higher -> more "overdue"; None treated as a large number
    last_seen = np.array(
        [
            (stats[n].last_seen_draws_ago if stats[n].last_seen_draws_ago is not None else (counts.max() + 50))
            for n in nums
        ],
        dtype=float,
    )

    if counts.max() > 0:
        freq = counts / counts.max()
    else:
        freq = np.ones_like(counts)

    overdue = last_seen / (last_seen.max() if last_seen.max() > 0 else 1.0)

    if strategy == "random":
        w = np.ones_like(freq)
    elif strategy == "hot":
        w = 0.85 * freq + 0.15 * (1.0 - overdue)
    elif strategy == "cold":
        w = 0.25 * freq + 0.75 * overdue
    else:  # balanced
        w = 0.55 * freq + 0.45 * overdue

    w = np.clip(w, 1e-6, None)
    return w


def _sample_unique(rng: np.random.Generator, nums: np.ndarray, weights: np.ndarray, k: int) -> List[int]:
    p = weights / weights.sum()
    choice = rng.choice(nums, size=k, replace=False, p=p)
    return sorted(int(x) for x in choice)


def generate_lines(
    *,
    stats_main: Dict[int, NumberStats],
    main_count: int,
    main_min: int,
    main_max: int,
    strategy: str,
    n_lines: int,
    constraints: Constraints,
    bonus_count: int = 0,
    bonus_min: int = 0,
    bonus_max: int = 0,
    stats_bonus: Optional[Dict[int, NumberStats]] = None,
    rng_seed: int | None = None,
) -> List[dict]:
    """Generate lines for a numeric lottery.

    Output format matches the web app expectations:
    { main: [...], bonus?: [...], meta: { strategy, score_hint } }

    score_hint is NOT a probability; it is a relative internal sampling score.
    """
    rng = np.random.default_rng(rng_seed)

    main_nums = np.arange(main_min, main_max + 1)
    main_w = _build_weights(stats_main, main_min, main_max, strategy)

    bonus_nums = np.arange(bonus_min, bonus_max + 1) if bonus_count and bonus_min and bonus_max else None
    bonus_w = None
    if bonus_nums is not None and stats_bonus is not None:
        bonus_w = _build_weights(stats_bonus, bonus_min, bonus_max, strategy)

    out: List[dict] = []
    attempts = 0
    while len(out) < n_lines and attempts < n_lines * 300:
        attempts += 1
        main = _sample_unique(rng, main_nums, main_w, main_count)

        if not _odd_even_ok(main, constraints.odd_even):
            continue
        if constraints.avoid_runs and _has_long_run(main):
            continue

        bonus = None
        if bonus_nums is not None:
            if bonus_w is None:
                bonus = _sample_unique(rng, bonus_nums, np.ones_like(bonus_nums, dtype=float), bonus_count)
            else:
                bonus = _sample_unique(rng, bonus_nums, bonus_w, bonus_count)

        # score_hint: average weight for chosen numbers (relative, not a probability)
        idxs = [m - main_min for m in main]
        score_hint = float(np.mean(main_w[idxs]))

        out.append({"main": main, "bonus": bonus, "meta": {"strategy": strategy, "score_hint": score_hint}})

    return out
