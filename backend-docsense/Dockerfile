FROM python:3.12-slim

WORKDIR /code

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libffi-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    fastapi \
    "uvicorn[standard]" \
    "pydantic[email]" \
    pydantic-settings \
    "sqlalchemy[asyncio]" \
    asyncpg \
    alembic \
    redis \
    "python-jose[cryptography]" \
    python-multipart \
    httpx \
    bcrypt \
    pymupdf \
    sentence-transformers \
    qdrant-client \
    langchain-text-splitters \
    openai \
    python-dotenv \
    groq

# Contexto é backend-docsense/ — copia tudo direto
COPY . .

ENV PORT=8000

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
