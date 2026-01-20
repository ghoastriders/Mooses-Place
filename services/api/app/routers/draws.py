from __future__ import annotations

from datetime import date
from fastapi import APIRouter, Depends, Query
import asyncpg

from app.db.deps import get_pg_conn

router = APIRouter()


@router.get("/draws")
async def list_draws(
    game_id: str = Query(...),
    limit: int = Query(50, ge=1, le=500),
    conn: asyncpg.Connection = Depends(get_pg_conn),
):
    rows = await conn.fetch(
        """
        select draw_date, numbers
        from public.draws
        where game_id = $1::uuid
        order by draw_date desc
        limit $2
        """,
        game_id,
        limit,
    )
    draws = [{"draw_date": r["draw_date"].isoformat(), "numbers": r["numbers"]} for r in rows]
    return {"draws": draws}
