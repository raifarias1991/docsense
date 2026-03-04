import uuid
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.document import Document
from app.services.ingestion.extractor import extract_text
from app.services.ingestion.chunker import chunk_text
from app.services.ingestion.embedder import embed_chunks, VECTOR_SIZE
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct
)

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION_NAME = "documents"


def _get_qdrant() -> QdrantClient:
    return QdrantClient(url=QDRANT_URL)


def _ensure_collection(client: QdrantClient) -> None:
    existing = [c.name for c in client.get_collections().collections]
    if COLLECTION_NAME not in existing:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE,
            ),
        )


async def process_document(
    document_id: str,
    file_path: str,
    content_type: str,
    db: AsyncSession,
) -> None:
    """
    Pipeline completo: extração → chunking → embedding → Qdrant.
    Atualiza status do documento no PostgreSQL.
    """
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        return

    try:
        doc.status = "processing"
        await db.commit()

        text = extract_text(file_path, content_type)
        if not text.strip():
            raise ValueError("Documento sem texto extraível")

        # chunk_size=256 — melhor Context Recall (0.90 medido com RAGAS)
        chunks = chunk_text(text, chunk_size=256, overlap=32)
        if not chunks:
            raise ValueError("Nenhum chunk gerado")

        texts = [c.text for c in chunks]
        vectors = embed_chunks(texts)

        client = _get_qdrant()
        _ensure_collection(client)

        points = [
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vectors[i],
                payload={
                    "document_id": str(document_id),
                    "chunk_index": chunk.index,
                    "text": chunk.text,
                    "char_start": chunk.char_start,
                    "char_end": chunk.char_end,
                },
            )
            for i, chunk in enumerate(chunks)
        ]
        client.upsert(collection_name=COLLECTION_NAME, points=points)

        doc.status = "ready"
        doc.chunk_count = len(chunks)
        await db.commit()

    except Exception as e:
        doc.status = "failed"
        doc.error_message = str(e)[:500]
        await db.commit()
        raise

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
