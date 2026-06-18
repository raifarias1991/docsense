"""Cache opcional via Redis para resultados de busca (query).

Importante: o Redis NUNCA é obrigatório para o funcionamento da aplicação.
Qualquer falha de conexão é silenciosamente tratada como "cache miss",
para que indisponibilidade do Redis nunca derrube o restante da API.
"""
import logging

from redis import asyncio as aioredis

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_client: aioredis.Redis | None = None
_disabled = False


def _get_client() -> aioredis.Redis | None:
    global _client, _disabled
    if _disabled:
        return None
    if _client is None:
        try:
            _client = aioredis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=2,
            )
        except Exception as exc:
            logger.warning("Redis indisponível, cache desabilitado: %s", exc)
            _disabled = True
            return None
    return _client


async def get(key: str) -> str | None:
    client = _get_client()
    if client is None:
        return None
    try:
        return await client.get(key)
    except Exception as exc:
        logger.warning("Falha ao ler cache do Redis: %s", exc)
        return None


async def set(key: str, value: str, ttl: int = 300) -> None:
    client = _get_client()
    if client is None:
        return
    try:
        await client.set(key, value, ex=ttl)
    except Exception as exc:
        logger.warning("Falha ao gravar cache no Redis: %s", exc)
