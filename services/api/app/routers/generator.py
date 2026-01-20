from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
import asyncpg

from app.db.deps import get_pg_conn
from app.services.scoring import compute_number_stats
from app.services.picker import Constraints, generate_lines

router = APIRouter()


class GenerateRequest(BaseModel):
    game_id: str
    n_lines: int = Field(5, ge=1, le=100)
    strategy: str = Field("balanced")  # balanced|hot|cold|random
    constraints: dict = Field(default_factory=dict)


@router.post("/generate")
async def generate(req: GenerateRequest, conn: asyncpg.Connection = Depends(get_pg_conn)):
    game = await conn.fetchrow(
        """
        select id::text as id, rules
        from public.games
        where id = $1::uuid
        """,
        req.game_id,
    )
    if not game:
        return {"lines": []}

    rules = game["rules"] or {}
    main_count = rules.get("main_count")
    main_min = rules.get("main_min")
    main_max = rules.get("main_max")
    bonus_count = rules.get("bonus_count")
    bonus_min = rules.get("bonus_min")
    bonus_max = rules.get("bonus_max")

    if not (main_count and main_min and main_max):
        # Non-numeric / custom game template
        return {
            "lines": [],
            "warning": "This game uses a custom (non-numeric) format. Generator is enabled only for numeric games.",
        }

    draw_rows = await conn.fetch(
        """
        select numbers
        from public.draws
        where game_id = $1::uuid
        order by draw_date desc
        limit 2000
        """,
        req.game_id,
    )

    draws_main: list[list[int]] = []
    draws_bonus: list[list[int]] = []
    for r in draw_rows:
        numbers = r["numbers"] or {}
        if isinstance(numbers.get("main"), list):
            draws_main.append([int(x) for x in numbers.get("main")])
        if isinstance(numbers.get("bonus"), list):
            draws_bonus.append([int(x) for x in numbers.get("bonus")])

    stats_main = compute_number_stats(draws_main, int(main_min), int(main_max))
    stats_bonus = None
    if bonus_count and bonus_min and bonus_max:
        stats_bonus = compute_number_stats(draws_bonus, int(bonus_min), int(bonus_max))

    constraints = Constraints(
        odd_even=req.constraints.get("odd_even", "any"),
        avoid_runs=bool(req.constraints.get("avoid_runs", True)),
    )

    lines = generate_lines(
        n_lines=req.n_lines,
        strategy=req.strategy,
        main_count=int(main_count),
        main_min=int(main_min),
        main_max=int(main_max),
        stats_main=stats_main,
        bonus_count=int(bonus_count) if bonus_count else 0,
        bonus_min=int(bonus_min) if bonus_min else 0,
        bonus_max=int(bonus_max) if bonus_max else 0,
        stats_bonus=stats_bonus,
        constraints=constraints,
    )

    return {"lines": lines}
