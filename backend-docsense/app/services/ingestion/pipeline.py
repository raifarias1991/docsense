"""Pipeline de processamento de documentos.

Executado em background (FastAPI BackgroundTasks) após o upload.
Cria sua própria sessão de banco — a sessão da requisição original já
estará fechada quando esta função rodar.
"""
import logging

from sqlalchemy import select

from app.core.config import get_settings
from app.db.session import async_session_factory
from app.models.document import (
    STATUS_COMPLETED,
    STATUS_FAILED,
    STATUS_PROCESSING,
    Document,
)
from app.services.embeddings.encoder import embed_documents
from app.services.ingestion.chunker import chunk_text
from app.services.ingestion.extractor import ExtractionError, extract_text
from app.services.vectorstore import qdrant_store

logger = logging.getLogger(__name__)
settings = get_settings()


async def process_document(
    document_id: str,
    owner_id: str,
    filename: str,
    content_type: str,
    content: bytes,
) -> None:
    async with async_session_factory() as db:
        result = await db.execute(select(Document).where(Document.id == document_id))
        document = result.scalar_one_or_none()
        if document is None:
            logger.error("Documento %s não encontrado para processamento", document_id)
            return

        try:
            document.status = STATUS_PROCESSING
            await db.commit()

            text = extract_text(content, content_type, filename)
            if not text or not text.strip():
                raise ExtractionError("O documento não contém texto extraível")

            chunks = chunk_text(text, settings.chunk_size, settings.chunk_overlap)
            if not chunks:
                raise ExtractionError("Não foi possível dividir o documento em trechos")

            embeddings = embed_documents([c.text for c in chunks])

            qdrant_store.ensure_collection()
            qdrant_store.upsert_chunks(document_id, owner_id, filename, chunks, embeddings)

            document.status = STATUS_COMPLETED
            document.chunk_count = len(chunks)
            document.error_message = None
            await db.commit()
            logger.info("Documento %s processado com sucesso (%d chunks)", document_id, len(chunks))

        except Exception as exc:
            logger.exception("Falha ao processar documento %s", document_id)
            await db.rollback()
            document.status = STATUS_FAILED
            document.error_message = str(exc)[:500]
            await db.commit()
