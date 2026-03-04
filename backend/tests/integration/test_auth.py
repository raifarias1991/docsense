import pytest
from httpx import AsyncClient


async def test_health(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


async def test_register_success(client: AsyncClient):
    response = await client.post("/api/v1/auth/register", json={
        "email": "new@test.com",
        "password": "Test123!",
        "full_name": "New User",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new@test.com"
    assert data["full_name"] == "New User"
    assert data["is_active"] is True
    assert "hashed_password" not in data
    assert "id" in data


async def test_register_duplicate_email(client: AsyncClient, registered_user: dict):
    response = await client.post("/api/v1/auth/register", json={
        "email": "user@test.com",
        "password": "Test123!",
        "full_name": "Duplicate",
    })
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


async def test_login_success(client: AsyncClient, registered_user: dict):
    response = await client.post("/api/v1/auth/login", json={
        "email": "user@test.com",
        "password": "Test123!",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


async def test_login_wrong_password(client: AsyncClient, registered_user: dict):
    response = await client.post("/api/v1/auth/login", json={
        "email": "user@test.com",
        "password": "WrongPassword!",
    })
    assert response.status_code == 401


async def test_login_nonexistent_user(client: AsyncClient):
    response = await client.post("/api/v1/auth/login", json={
        "email": "ghost@test.com",
        "password": "Test123!",
    })
    assert response.status_code == 401


async def test_get_me_authenticated(client: AsyncClient, auth_token: str):
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "user@test.com"
    assert "hashed_password" not in data


async def test_get_me_unauthenticated(client: AsyncClient):
    response = await client.get("/api/v1/users/me")
    assert response.status_code in (401, 403)

async def test_get_me_invalid_token(client: AsyncClient):
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer token.invalido.aqui"}
    )
    assert response.status_code == 401