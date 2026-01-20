import asyncpg
from fastapi import FastAPI

from app.core.config import settings


async def init_db(app: FastAPI) -> None:
    app.state.pg_pool = await asyncpg.create_pool(dsn=settings.database_url, min_size=1, max_size=10)


async def close_db(app: FastAPI) -> None:
    pool = getattr(app.state, "pg_pool", None)
    if pool:
        await pool.close()


def get_pool(app: FastAPI):
    return app.state.pg_pool
