from typing import AsyncIterator

import asyncpg
from fastapi import Depends, Request


async def get_pg_pool(request: Request) -> asyncpg.Pool:
    return request.app.state.pg_pool


async def get_pg_conn(pool: asyncpg.Pool = Depends(get_pg_pool)) -> AsyncIterator[asyncpg.Connection]:
    async with pool.acquire() as conn:
        yield conn
