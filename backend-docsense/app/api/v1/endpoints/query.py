from fastapi import APIRouter, Depends, HTTPException

from app.api.v1.endpoints.users import get_current_user
from app.core.config import get_settings
from app.models.user import User
from app.schemas.query import ChunkResult, QueryRequest, QueryResponse
from app.services.generation.generator import generate
from app.services.retrieval.retriever import retrieve

router = APIRouter(prefix="/query", tags=["query"])
settings = get_settings()


@router.post("", response_model=QueryResponse)
async def query_documents(
    payload: QueryRequest,
    current_user: User = Depends(get_current_user),
):
    if payload.generate_answer and not settings.active_api_key:
        raise HTTPException(
            status_code=503,
            detail="API key not configured. Set GROQ_API_KEY or OPENAI_API_KEY in .env",
        )

    chunks = await retrieve(
        query=payload.question,
        user_id=str(current_user.id),
        top_k=payload.top_k,
        score_threshold=payload.score_threshold,
    )

    answer = None
    model = None
    prompt_tokens = None
    completion_tokens = None

    if payload.generate_answer:
        result = await generate(payload.question, chunks)
        answer = result.answer
        model = result.model
        prompt_tokens = result.prompt_tokens
        completion_tokens = result.completion_tokens

    return QueryResponse(
        question=payload.question,
        answer=answer,
        chunks=[
            ChunkResult(
                document_id=c.document_id,
                filename=c.filename,
                chunk_index=c.chunk_index,
                text=c.text,
                score=c.score,
                char_start=c.char_start,
                char_end=c.char_end,
            )
            for c in chunks
        ],
        total_found=len(chunks),
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
    )
