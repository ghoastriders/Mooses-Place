from __future__ import annotations

from datetime import date
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.db.session import get_pool

router = APIRouter(prefix="/v1", tags=["import"])


class ImportRequest(BaseModel):
    game_id: str
    # Supported modes: "csv" (remote CSV url), "json" (remote JSON url)
    mode: str = Field("csv", pattern="^(csv|json)$")
    source_url: str


def _require_admin(x_admin_key: str | None) -> None:
    if not settings.admin_import_key:
        raise HTTPException(status_code=400, detail="admin_import_key_not_configured")
    if not x_admin_key or x_admin_key != settings.admin_import_key:
        raise HTTPException(status_code=401, detail="unauthorized")


@router.post("/import")
async def import_draws(req: ImportRequest, x_admin_key: Optional[str] = Header(default=None)):
    _require_admin(x_admin_key)

    pool = await get_pool()
    game = await pool.fetchrow("select id from public.games where id = $1::uuid", req.game_id)
    if not game:
        raise HTTPException(status_code=404, detail="game_not_found")

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(req.source_url)
        r.raise_for_status()
        text = r.text

    # Very simple CSV parser: expect columns: draw_date, main_numbers, bonus_numbers(optional)
    # main_numbers: space or comma separated ints
    # bonus_numbers: space or comma separated ints
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if not lines:
        return {"inserted": 0}

    header = [h.strip().lower() for h in lines[0].split(",")]
    rows = lines[1:]

    idx_date = header.index("draw_date") if "draw_date" in header else None
    idx_main = header.index("main_numbers") if "main_numbers" in header else None
    idx_bonus = header.index("bonus_numbers") if "bonus_numbers" in header else None

    if idx_date is None or idx_main is None:
        raise HTTPException(status_code=400, detail="csv_missing_required_columns")

    def parse_nums(s: str) -> List[int]:
        parts = [p.strip() for p in s.replace(" ", ",").split(",") if p.strip()]
        out = []
        for p in parts:
            try:
                out.append(int(p))
            except ValueError:
                continue
        return out

    inserted = 0
    for row in rows:
        cols = [c.strip() for c in row.split(",")]
        try:
            d = date.fromisoformat(cols[idx_date])
        except Exception:
            continue
        main = parse_nums(cols[idx_main])
        bonus = parse_nums(cols[idx_bonus]) if idx_bonus is not None and idx_bonus < len(cols) else []
        numbers: Dict[str, Any] = {"main": main}
        if bonus:
            numbers["bonus"] = bonus

        # Upsert by unique(game_id, draw_date)
        await pool.execute(
            """
            insert into public.draws (game_id, draw_date, numbers)
            values ($1::uuid, $2::date, $3::jsonb)
            on conflict (game_id, draw_date) do update set numbers = excluded.numbers
            """,
            req.game_id,
            d,
            numbers,
        )
        inserted += 1

    return {"inserted": inserted}
