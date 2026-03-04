import uuid
import tempfile
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models.document import Document
from app.models.user import User
from app.api.v1.endpoints.users import get_current_user
from app.services.ingestion.pipeline import process_document

router = APIRouter()

ALLOWED_TYPES = {"application/pdf", "text/plain"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


class DocumentResponse(BaseModel):
    id: UUID
    filename: str
    file_size: int
    content_type: str
    status: str
    chunk_count: int | None
    error_message: str | None

    model_config = {"from_attributes": True}


@router.post("/upload", response_model=DocumentResponse, status_code=202)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        # Also accept by extension for some clients
        fname = (file.filename or "").lower()
        if not (fname.endswith(".pdf") or fname.endswith(".txt")):
            raise HTTPException(
                status_code=415,
                detail=f"Tipo nao suportado. Aceitos: {', '.join(ALLOWED_TYPES)}"
            )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Arquivo muito grande. Maximo: 10MB")

    # Determine content type from extension if needed
    effective_content_type = file.content_type
    if effective_content_type not in ALLOWED_TYPES:
        fname = (file.filename or "").lower()
        effective_content_type = "application/pdf" if fname.endswith(".pdf") else "text/plain"

    doc = Document(
        id=uuid.uuid4(),
        owner_id=current_user.id,
        filename=file.filename or "document",
        file_size=len(content),
        content_type=effective_content_type,
        status="pending",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    suffix = ".pdf" if effective_content_type == "application/pdf" else ".txt"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    await process_document(
        document_id=str(doc.id),
        file_path=tmp_path,
        content_type=effective_content_type,
        db=db,
    )
    await db.refresh(doc)
    return doc


@router.get("/", response_model=list[DocumentResponse])
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document)
        .where(Document.owner_id == current_user.id)
        .order_by(Document.created_at.desc())
    )
    return result.scalars().all()
