# DocSense — Plataforma RAG de Produção

Plataforma RAG (Retrieval-Augmented Generation) completa com FastAPI + Next.js.

## Stack

**Backend:** Python 3.12 + FastAPI + PostgreSQL/pgvector + Qdrant + Redis + Groq LLaMA3  
**Frontend:** Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui + Zustand

---

## Pré-requisitos

- Python 3.12+
- Node.js 18+
- Docker Desktop
- uv (`pip install uv`)
- Chave Groq: https://console.groq.com/keys (criar sem expiração)

---

## Setup

### 1. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Editar .env e colocar sua chave Groq em OPENAI_API_KEY
```

### 2. Subir serviços Docker

```bash
docker compose up -d
docker compose ps   # aguardar 3 healthy
```

### 3. Backend

```bash
cd backend

# Instalar dependências
uv sync

# Rodar migrações
export $(grep -v '^#' ../.env | xargs)
uv run alembic upgrade head

# Subir servidor
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Verificar: http://localhost:8000/health → `{"status":"ok"}`  
Docs: http://localhost:8000/docs

### 4. Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Subir servidor de desenvolvimento
npm run dev
```

Acessar: http://localhost:3000

---

## Estrutura

```
docsense/
├── .env.example
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   ← auth, users, documents, query
│   │   ├── core/               ← config, security
│   │   ├── models/             ← user, document
│   │   └── services/           ← ingestion, retrieval, generation
│   └── tests/
└── frontend/
    ├── app/                    ← Next.js App Router
    ├── components/             ← auth, chat, documents, layout, ui
    ├── lib/                    ← api client, stores, types, utils
    └── hooks/
```

---

## Endpoints

```
GET  /health
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
GET  /api/v1/users/me
POST /api/v1/documents/upload   (PDF ou TXT, max 10MB)
GET  /api/v1/documents/
POST /api/v1/query/
```

---

## Testes

```bash
cd backend
uv run pytest tests/integration/test_auth.py -v
```

---

## Notas importantes

- A chave Groq (OPENAI_API_KEY) expira. Gere sempre com "No expiration" em console.groq.com/keys
- O backend deve ser iniciado de dentro da pasta `backend/`
- O export das variáveis de ambiente deve usar caminho absoluto: `export $(grep -v '^#' /caminho/absoluto/.env | xargs)`
