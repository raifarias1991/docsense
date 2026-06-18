"""Ponto de entrada da aplicação DocSense."""
import logging

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import get_settings
from app.db.session import engine
from app.models import Base
from app.services.vectorstore import qdrant_store

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "https://docsense-app.netlify.app",
    "https://docdocense.netlify.app",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Conexão com o banco de dados OK — tabelas verificadas.")
    except Exception:
        logger.warning(
            "Não foi possível conectar ao banco de dados no startup.",
            exc_info=True,
        )

    try:
        qdrant_store.ensure_collection()
        logger.info("Conexão com o Qdrant OK — coleção verificada.")
    except Exception:
        logger.warning(
            "Não foi possível conectar ao Qdrant no startup.",
            exc_info=True,
        )

    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.app_version}


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
    }
