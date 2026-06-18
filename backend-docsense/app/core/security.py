"""Funções de segurança: hashing de senha (bcrypt) e tokens JWT.

Este módulo não existia no projeto original (era importado por
app/api/v1/endpoints/auth.py mas nunca foi criado), causando ImportError
em todas as rotas de autenticação.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()

# bcrypt tem limite de 72 bytes por senha — truncamos com segurança.
_MAX_PASSWORD_BYTES = 72


def hash_password(password: str) -> str:
    raw = password.encode("utf-8")[:_MAX_PASSWORD_BYTES]
    return bcrypt.hashpw(raw, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        raw = password.encode("utf-8")[:_MAX_PASSWORD_BYTES]
        return bcrypt.checkpw(raw, hashed_password.encode("utf-8"))
    except (ValueError, AttributeError):
        return False


def _create_token(subject: str, token_type: str, expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(subject: str) -> str:
    return _create_token(
        subject, "access", timedelta(minutes=settings.access_token_expire_minutes)
    )


def create_refresh_token(subject: str) -> str:
    return _create_token(
        subject, "refresh", timedelta(days=settings.refresh_token_expire_days)
    )


def decode_token(token: str) -> dict[str, Any]:
    """Decodifica e valida um JWT. Lança ValueError se inválido/expirado."""
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc


def subject_to_uuid(payload: dict[str, Any]) -> uuid.UUID:
    """Converte o campo 'sub' do payload do token em UUID.

    Lança ValueError se o campo estiver ausente ou malformado.
    """
    sub = payload.get("sub")
    if not sub:
        raise ValueError("Token payload missing 'sub'")
    return uuid.UUID(sub)
