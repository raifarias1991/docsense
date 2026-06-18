"""Wrapper sobre o cliente Qdrant: criação de coleção, upsert, busca e
remoção de vetores por documento.
"""
import uuid
from typing import TYPE_CHECKING

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)

from app.core.config import get_settings
from app.services.embeddings.encoder import EMBEDDING_DIM

if TYPE_CHECKING:
    from app.services.ingestion.chunker import TextChunk

settings = get_settings()
COLLECTION_NAME = settings.qdrant_collection_name

_client: QdrantClient | None = None


def get_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key or None,
        )
    return _client


def ensure_collection() -> None:
    """Cria a coleção caso ainda não exista. Idempotente."""
    client = get_client()
    existing = [c.name for c in client.get_collections().collections]
    if COLLECTION_NAME not in existing:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE),
        )


def upsert_chunks(
    document_id: str,
    owner_id: str,
    filename: str,
    chunks: list["TextChunk"],
    embeddings: list[list[float]],
) -> None:
    client = get_client()
    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=embeddings[i],
            payload={
                "document_id": document_id,
                "owner_id": owner_id,
                "filename": filename,
                "chunk_index": chunk.index,
                "text": chunk.text,
                "char_start": chunk.char_start,
                "char_end": chunk.char_end,
            },
        )
        for i, chunk in enumerate(chunks)
    ]
    client.upsert(collection_name=COLLECTION_NAME, points=points)


def search(query_vector: list[float], owner_id: str, top_k: int, score_threshold: float):
    """Busca os top_k chunks mais similares pertencentes ao usuário `owner_id`."""
    client = get_client()
    response = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        query_filter=Filter(
            must=[FieldCondition(key="owner_id", match=MatchValue(value=owner_id))]
        ),
        limit=top_k,
        score_threshold=score_threshold,
        with_payload=True,
    )
    return response.points


def delete_document_vectors(document_id: str) -> None:
    """Remove todos os vetores associados a um documento (ex: ao deletá-lo)."""
    client = get_client()
    client.delete(
        collection_name=COLLECTION_NAME,
        points_selector=Filter(
            must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
        ),
    )
