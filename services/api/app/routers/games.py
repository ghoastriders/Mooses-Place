from __future__ import annotations

from fastapi import APIRouter, Depends
import asyncpg

from app.db.deps import get_pg_conn

router = APIRouter()


@router.get("/games")
async def list_games(conn: asyncpg.Connection = Depends(get_pg_conn)):
    rows = await conn.fetch(
        """
        select id::text as id, key, name, region, game_type, rules
        from public.games
        where is_active = true
        order by game_type, name
        """
    )
    games = [dict(r) for r in rows]
    return {"games": games}
