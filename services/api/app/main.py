from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import init_db, close_db
from app.routers import games, draws, analytics, generator, importer

app = FastAPI(title=settings.app_name)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup():
    await init_db(app)


@app.on_event("shutdown")
async def _shutdown():
    await close_db(app)


@app.get("/health")
async def health():
    return {"ok": True, "name": settings.app_name, "environment": settings.environment}


app.include_router(games.router, prefix="/v1", tags=["games"])
app.include_router(draws.router, prefix="/v1", tags=["draws"])
app.include_router(analytics.router, prefix="/v1", tags=["analytics"])
app.include_router(generator.router, prefix="/v1", tags=["generator"])
app.include_router(importer.router, prefix="/v1", tags=["import"])
