from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    question: str = Field(min_length=1)
    top_k: int = Field(default=5, ge=1, le=20)
    score_threshold: float = Field(default=0.3, ge=0.0, le=1.0)
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
