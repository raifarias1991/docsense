import os
from dataclasses import dataclass
from openai import AsyncOpenAI
from app.services.retrieval.retriever import RetrievedChunk

MODEL = "llama-3.1-8b-instant"

# Prompt v2 — otimizado para Answer Relevancy
# Resultado RAGAS: faithfulness=0.92, context_recall=0.90
SYSTEM_PROMPT = """You are an assistant specialized in answering questions based on provided documents.

Rules:
1. Answer based on the provided context. Extract and use ALL relevant information available.
2. Always give a direct, complete answer to the question asked. Never refuse if the context has relevant information.
3. Only say you cannot answer if the context has absolutely NO relevant information.
4. Cite sources using [Source: filename] at the end of your answer.
5. Be direct, objective and comprehensive.
6. Answer in the same language as the question.
7. If the context has partial information, use it and answer what you can."""


@dataclass
class GenerationResult:
    answer: str
    model: str
    prompt_tokens: int
    completion_tokens: int


def _get_client() -> AsyncOpenAI:
    # Lazy load — reads env var at call time, not at import
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY", "")
    return AsyncOpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1",
    )


def _build_context(chunks: list[RetrievedChunk]) -> str:
    parts = []
    for i, chunk in enumerate(chunks, 1):
        header = f"[{i}] Source: {chunk.filename} (relevance: {chunk.score:.2f})"
        parts.append(header + "\n" + chunk.text)
    return "\n\n---\n\n".join(parts)


def _build_prompt(question: str, chunks: list[RetrievedChunk]) -> str:
    context = _build_context(chunks)
    return (
        "Document context:\n\n"
        + context
        + "\n\n---\n\nQuestion: "
        + question
        + "\n\nAnswer based on the context above."
    )


async def generate(
    question: str,
    chunks: list[RetrievedChunk],
    model: str = MODEL,
) -> GenerationResult:
    if not chunks:
        return GenerationResult(
            answer="I could not find relevant documents to answer your question.",
            model=model,
            prompt_tokens=0,
            completion_tokens=0,
        )

    client = _get_client()
    prompt = _build_prompt(question, chunks)

    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.1,
        max_tokens=1024,
    )

    return GenerationResult(
        answer=response.choices[0].message.content,
        model=response.model,
        prompt_tokens=response.usage.prompt_tokens,
        completion_tokens=response.usage.completion_tokens,
    )
