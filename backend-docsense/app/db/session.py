"""Engine e sessão assíncrona do SQLAlchemy."""
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()

# O Neon (e a maioria dos Postgres gerenciados) exige SSL.
# ?ssl=require é ignorado se o banco local não tiver SSL configurado.
_db_url = settings.database_url
if "?" not in _db_url and "neon.tech" in _db_url:
    _db_url += "?ssl=require"

engine = create_async_engine(
    _db_url,
    echo=settings.debug,
    pool_pre_ping=True,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
