"""Recuperação de trechos relevantes (RAG) para uma pergunta do usuário."""
import hashlib
import json
from dataclasses import asdict, dataclass

from app.core.config import get_settings
from app.services.cache import redis_cache
from app.services.embeddings.encoder import embed_query
from app.services.vectorstore import qdrant_store

settings = get_settings()


@dataclass
class RetrievedChunk:
    document_id: str
    filename: str
    chunk_index: int
    text: str
    score: float
    char_start: int
    char_end: int


def _cache_key(user_id: str, query: str, top_k: int, score_threshold: float) -> str:
    raw = f"{user_id}:{query}:{top_k}:{score_threshold}"
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return f"docsense:query_cache:{digest}"


async def retrieve(
    query: str,
    user_id: str,
    top_k: int = 5,
    score_threshold: float = 0.3,
) -> list[RetrievedChunk]:
    cache_key = _cache_key(user_id, query, top_k, score_threshold)

    cached = await redis_cache.get(cache_key)
    if cached is not None:
        try:
            return [RetrievedChunk(**item) for item in json.loads(cached)]
        except (json.JSONDecodeError, TypeError):
            pass  # cache corrompido — ignora e recalcula

    query_vector = embed_query(query)
    points = qdrant_store.search(
        query_vector=query_vector,
        owner_id=user_id,
        top_k=top_k,
        score_threshold=score_threshold,
    )

    chunks = [
        RetrievedChunk(
            document_id=point.payload["document_id"],
            filename=point.payload["filename"],
            chunk_index=point.payload["chunk_index"],
            text=point.payload["text"],
            score=point.score,
            char_start=point.payload["char_start"],
            char_end=point.payload["char_end"],
        )
        for point in points
    ]

    await redis_cache.set(
        cache_key,
        json.dumps([asdict(c) for c in chunks]),
        ttl=settings.query_cache_ttl_seconds,
    )

    return chunks
