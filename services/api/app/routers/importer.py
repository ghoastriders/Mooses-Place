from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

import asyncpg
import httpx
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.db.deps import get_pg_conn

router = APIRouter()


class ImportRequest(BaseModel):
    mode: Literal["seed", "csv_url"] = "seed"
    game_key: Optional[str] = None
    csv_url: Optional[str] = None
    source: Optional[str] = "manual_import"


@router.post("/import")
async def import_data(
    body: ImportRequest,
    x_admin_key: str = Header(default="", convert_underscores=False),
    conn: asyncpg.Connection = Depends(get_pg_conn),
):
    expected = settings.admin_import_key
    if not expected or x_admin_key != expected:
        raise HTTPException(status_code=401, detail="unauthorized")

    if body.mode == "seed":
        # Run seed.sql externally; this endpoint just checks connectivity
        return {"ok": True, "message": "Seed is run via SQL (supabase/seed.sql)."}

    if body.mode == "csv_url":
        if not body.game_key or not body.csv_url:
            raise HTTPException(status_code=400, detail="csv_url mode requires game_key and csv_url")

        game_row = await conn.fetchrow("select id from public.games where key=$1", body.game_key)
        if not game_row:
            raise HTTPException(status_code=404, detail="unknown game_key")

        game_id = str(game_row["id"])

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(body.csv_url)
            resp.raise_for_status()
            csv_text = resp.text

        # Expected CSV columns: draw_date, main_1..main_5, bonus_1 (or similar). You can adapt per source.
        # This importer is intentionally conservative for launch safety.
        imported = 0
        for line in csv_text.splitlines():
            if not line.strip() or line.lower().startswith("draw"):
                continue
            parts = [p.strip() for p in line.split(",")]
            if len(parts) < 6:
                continue
            draw_date = parts[0]
            try:
                main = list(map(int, parts[1:6]))
                bonus = [int(parts[6])] if len(parts) > 6 and parts[6].isdigit() else []
            except ValueError:
                continue

            numbers = {"main": main}
            if bonus:
                numbers["bonus"] = bonus

            await conn.execute(
                """
                insert into public.draws (game_id, draw_date, numbers, source)
                values ($1, $2::date, $3::jsonb, $4)
                on conflict (game_id, draw_date) do update set numbers=excluded.numbers, source=excluded.source
                """,
                game_id,
                draw_date,
                numbers,
                body.source or "manual_import",
            )
            imported += 1

        await conn.execute(
            """
            insert into public.game_sources (game_id, source_type, source_url, notes, last_import_at)
            values ($1, 'official_csv', $2, $3, $4)
            """,
            game_id,
            body.csv_url,
            "Imported via Mooses Place admin import.",
            datetime.utcnow(),
        )

        return {"ok": True, "imported": imported, "game_id": game_id}
