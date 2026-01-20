from __future__ import annotations

from fastapi import APIRouter, Depends, Query
import asyncpg

from app.db.deps import get_pg_conn
from app.services.scoring import compute_number_stats

router = APIRouter()


@router.get("/analytics")
async def analytics(
    game_id: str = Query(...),
    window: int = Query(150, ge=20, le=2000),
    conn: asyncpg.Connection = Depends(get_pg_conn),
):
    game = await conn.fetchrow(
        """
        select rules
        from public.games
        where id::text = $1
        """,
        game_id,
    )
    if not game:
        return {"error": "game_not_found"}
    rules = game["rules"] or {}
    main_count = rules.get("main_count")
    main_min = rules.get("main_min")
    main_max = rules.get("main_max")
    if not (isinstance(main_count, int) and isinstance(main_min, int) and isinstance(main_max, int)):
        # Non-numeric games (e.g., Alaska charitable templates)
        return {"window_draws": 0, "main": {"top_hot": [], "top_cold": []}, "note": "non_numeric_game"}

    rows = await conn.fetch(
        """
        select numbers
        from public.draws
        where game_id::text = $1
        order by draw_date desc
        limit $2
        """,
        game_id,
        window,
    )
    draws_main = []
    for r in rows:
        nums = r["numbers"] or {}
        main = nums.get("main")
        if isinstance(main, list) and all(isinstance(x, int) for x in main):
            draws_main.append(main)

    if not draws_main:
        return {"window_draws": 0, "main": {"top_hot": [], "top_cold": []}}

    stats = compute_number_stats(draws_main, main_min=main_min, main_max=main_max)
    hot = sorted(((n, s.count) for n, s in stats.items()), key=lambda x: (-x[1], x[0]))[:10]
    cold = sorted(
        ((n, s.last_seen_draws_ago) for n, s in stats.items()),
        key=lambda x: (-(x[1] if x[1] is not None else 10**9), x[0]),
    )[:10]

    return {
        "window_draws": len(draws_main),
        "main": {
            "top_hot": [{"n": n, "count": c} for n, c in hot],
            "top_cold": [{"n": n, "last_seen_draws_ago": a} for n, a in cold],
        },
    }
