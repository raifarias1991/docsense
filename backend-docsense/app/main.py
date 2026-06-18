"""Ponto de entrada da aplicação DocSense.

Principais correções em relação ao original:
- `@app.on_event("startup")` (deprecado) substituído por `lifespan`.
- A criação de tabelas e da coleção do Qdrant agora é "best effort": se o
  Postgres ou o Qdrant não estiverem acessíveis no boot, a aplicação loga
  um aviso e continua subindo (em vez de derrubar o processo). Isso evita
  que um serviço de infraestrutura temporariamente fora do ar impeça o
  `/health` de responder.
"""
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Banco de dados — cria as tabelas caso ainda não existam.
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Conexão com o banco de dados OK — tabelas verificadas.")
    except Exception:
        logger.warning(
            "Não foi possível conectar ao banco de dados no startup. "
            "Verifique DATABASE_URL no .env. A aplicação continuará subindo, "
            "mas endpoints que dependem do banco vão falhar até a conexão "
            "ser restabelecida.",
            exc_info=True,
        )

    # Qdrant — garante que a coleção de vetores exista.
    try:
        qdrant_store.ensure_collection()
        logger.info("Conexão com o Qdrant OK — coleção verificada.")
    except Exception:
        logger.warning(
            "Não foi possível conectar ao Qdrant no startup. Verifique "
            "QDRANT_URL no .env. Upload/consulta de documentos vão falhar "
            "até a conexão ser restabelecida.",
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
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://docsense-app.netlify.app",
        "https://docdocense.netlify.app",
    ],

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
