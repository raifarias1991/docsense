import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.users import get_current_user
from app.core.config import get_settings
from app.db.session import get_db
from app.models.document import STATUS_PENDING, Document
from app.models.user import User
from app.schemas.document import DocumentListResponse, DocumentResponse
from app.services.ingestion.pipeline import process_document
from app.services.vectorstore.qdrant_store import delete_document_vectors

router = APIRouter(prefix="/documents", tags=["documents"])
settings = get_settings()

ALLOWED_EXTENSIONS = {".pdf", ".txt"}


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    filename = file.filename or "documento"
    extension = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, detail="Apenas arquivos PDF ou TXT são aceitos"
        )

    content = await file.read()

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Arquivo vazio")

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"Arquivo excede o tamanho máximo de {settings.max_upload_size_mb}MB",
        )

    content_type = file.content_type or (
        "application/pdf" if extension == ".pdf" else "text/plain"
    )

    document = Document(
        owner_id=current_user.id,
        filename=filename,
        file_size=len(content),
        content_type=content_type,
        status=STATUS_PENDING,
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    background_tasks.add_task(
        process_document,
        document_id=str(document.id),
        owner_id=str(current_user.id),
        filename=filename,
        content_type=content_type,
        content=content,
    )

    return document


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document)
        .where(Document.owner_id == current_user.id)
        .order_by(Document.created_at.desc())
    )
    documents = list(result.scalars().all())
    return DocumentListResponse(documents=documents, total=len(documents))


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(
            Document.id == document_id, Document.owner_id == current_user.id
        )
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    return document


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(
            Document.id == document_id, Document.owner_id == current_user.id
        )
    )
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    try:
        delete_document_vectors(str(document.id))
    except Exception:
        # Os vetores podem já não existir (ex: documento falhou antes de
        # gerar embeddings) — isso não deve impedir a remoção do registro.
        pass

    await db.delete(document)
    await db.commit()
