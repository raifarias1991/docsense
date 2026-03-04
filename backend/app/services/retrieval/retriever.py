import os
from dataclasses import dataclass
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.document import Document
from app.services.ingestion.embedder import embed_chunks
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchAny

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION_NAME = "documents"


@dataclass
class RetrievedChunk:
    document_id: str
    filename: str
    chunk_index: int
    text: str
    score: float
    char_start: int
    char_end: int


def _get_qdrant() -> QdrantClient:
    return QdrantClient(url=QDRANT_URL)


async def retrieve(
    query: str,
    user_id: str,
    db: AsyncSession,
    top_k: int = 5,
    score_threshold: float = 0.3,
) -> list[RetrievedChunk]:
    result = await db.execute(
        select(Document.id, Document.filename)
        .where(Document.owner_id == user_id)
        .where(Document.status == "ready")
    )
    user_docs = result.all()

    if not user_docs:
        return []

    doc_ids = [str(row.id) for row in user_docs]
    doc_filenames = {str(row.id): row.filename for row in user_docs}

    query_vector = embed_chunks([query])[0]

    client = _get_qdrant()
    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="document_id",
                    match=MatchAny(any=doc_ids),
                )
            ]
        ),
        limit=top_k,
        with_payload=True,
    )

    chunks = []
    for point in results.points:
        if point.score < score_threshold:
            continue
        payload = point.payload
        doc_id = payload["document_id"]
        chunks.append(RetrievedChunk(
            document_id=doc_id,
            filename=doc_filenames.get(doc_id, "unknown"),
            chunk_index=payload["chunk_index"],
            text=payload["text"],
            score=round(point.score, 4),
            char_start=payload.get("char_start", 0),
            char_end=payload.get("char_end", 0),
        ))

    return chunks
