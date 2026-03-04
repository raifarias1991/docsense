# backend/tests/conftest.py
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import text
from app.main import app
from app.models.base import Base
from app.db.session import get_db

TEST_DATABASE_URL = "postgresql+asyncpg://docsense:docsense@localhost:5432/docsense_test"


@pytest.fixture
async def client():
    # Engine criado dentro do fixture — mesmo event loop garantido
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async def override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()

    # Cleanup no mesmo loop
    async with engine.begin() as conn:
        await conn.execute(text("TRUNCATE TABLE documents, users RESTART IDENTITY CASCADE"))
    
    await engine.dispose()


@pytest.fixture
async def registered_user(client: AsyncClient) -> dict:
    response = await client.post("/api/v1/auth/register", json={
        "email": "user@test.com",
        "password": "Test123!",
        "full_name": "Test User",
    })
    assert response.status_code == 201
    return response.json()


@pytest.fixture
async def auth_token(client: AsyncClient, registered_user: dict) -> str:
    response = await client.post("/api/v1/auth/login", json={
        "email": "user@test.com",
        "password": "Test123!",
    })
    assert response.status_code == 200
    return response.json()["access_token"]