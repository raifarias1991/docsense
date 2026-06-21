FROM python:3.12-slim

WORKDIR /app

# Instala dependências do sistema necessárias para PyMuPDF e sentence-transformers
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Instala uv (gerenciador de pacotes rápido)
RUN pip install --no-cache-dir uv

# Copia arquivos de dependência
COPY pyproject.toml .
COPY uv.lock* .

# Instala dependências de produção
RUN uv sync --frozen --no-dev 2>/dev/null || \
    uv pip install --system \
    fastapi uvicorn[standard] pydantic[email] pydantic-settings \
    sqlalchemy[asyncio] asyncpg alembic redis \
    python-jose[cryptography] python-multipart httpx bcrypt \
    pymupdf sentence-transformers qdrant-client \
    langchain-text-splitters openai python-dotenv

# Copia o código da aplicação
COPY app/ ./app/
COPY alembic.ini* ./
COPY db/ ./db/ 2>/dev/null || true

# Porta exposta pelo Railway via variável $PORT
ENV PORT=8000

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
