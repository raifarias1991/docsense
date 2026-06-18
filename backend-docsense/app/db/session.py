"""Engine e sessão assíncrona do SQLAlchemy.

Este módulo não existia no projeto original — era importado em
app/main.py, app/api/v1/endpoints/auth.py e query.py, mas nunca foi
criado, fazendo a aplicação inteira falhar ao subir (ModuleNotFoundError).
"""
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency do FastAPI: fornece uma sessão por request.

    Os endpoints são responsáveis por chamar `commit()` explicitamente
    após escritas — em caso de exceção, a sessão é revertida (rollback).
    """
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
