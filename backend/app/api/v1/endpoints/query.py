import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.api.v1.endpoints.users import get_current_user
from app.services.retrieval.retriever import retrieve
from app.services.generation.generator import generate

router = APIRouter(prefix="/query", tags=["query"])


class QueryRequest(BaseModel):
    question: str
    top_k: int = 5
    score_threshold: float = 0.3
    generate_answer: bool = True


class ChunkResult(BaseModel):
    document_id: str
    filename: str
    chunk_index: int
    text: str
    score: float
    char_start: int
    char_end: int


class QueryResponse(BaseModel):
    question: str
    answer: str | None
    chunks: list[ChunkResult]
    total_found: int
    model: str | None
    prompt_tokens: int | None
    completion_tokens: int | None


@router.post("/", response_model=QueryResponse)
async def query_documents(
    request: QueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chunks = await retrieve(
        query=request.question,
        user_id=str(current_user.id),
        db=db,
        top_k=request.top_k,
        score_threshold=request.score_threshold,
    )

    answer = None
    model = None
    prompt_tokens = None
    completion_tokens = None

    if request.generate_answer:
        api_key = os.getenv("OPENAI_API_KEY", "") or os.getenv("GROQ_API_KEY", "")
        if not api_key:
            raise HTTPException(
                status_code=503,
                detail="API key not configured. Set OPENAI_API_KEY in .env"
            )
        result = await generate(
            question=request.question,
            chunks=chunks,
        )
        answer = result.answer
        model = result.model
        prompt_tokens = result.prompt_tokens
        completion_tokens = result.completion_tokens

    return QueryResponse(
        question=request.question,
        answer=answer,
        chunks=[ChunkResult(**vars(c)) for c in chunks],
        total_found=len(chunks),
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
    )
