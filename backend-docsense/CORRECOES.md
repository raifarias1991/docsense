# Correções aplicadas ao DocSense (reconstrução completa)

O projeto enviado não subia: faltavam módulos inteiros que outros arquivos
importavam (`ModuleNotFoundError` em cascata), e o `.env` apontava todos os
serviços de infraestrutura para `localhost`, o que em produção (Render,
Railway etc.) gera `Connection refused` — exatamente os dois erros das
capturas de tela ("API key not configured" e "Errno 111: Connection
refused" no upload de documentos).

Em vez de tentar remendar o projeto incompleto, o backend foi **reconstruído
do zero**, preservando o contrato de API já usado pelo frontend (rotas,
nomes de campos, comportamento dos sliders de busca) e o stack tecnológico
original (FastAPI, SQLAlchemy async, Qdrant, Groq/OpenAI), com uma troca
pontual na biblioteca de embeddings (ver tabela abaixo).

## Módulos que não existiam e foram criados

Estes arquivos eram importados por outros módulos do projeto original, mas
não existiam — cada um causava um `ModuleNotFoundError` que derrubava a
aplicação inteira no boot:

| Arquivo | Função |
|---------|--------|
| `app/db/session.py` | Engine assíncrono, `async_session_factory`, dependency `get_db` |
| `app/models/base.py`, `user.py`, `document.py` | Modelos SQLAlchemy (schema idêntico à migration Alembic já existente) |
| `app/core/security.py` | Hash de senha (bcrypt), criação/decodificação de JWT |
| `app/api/v1/endpoints/users.py` | `get_current_user` (dependency de autenticação) e `GET /users/me` |
| `app/api/v1/__init__.py` | Agregador de rotas (`api_router`) — nunca existia, então nenhuma rota era registrada |
| `app/api/v1/endpoints/documents.py` | Upload, listagem, detalhe e remoção de documentos |
| `app/services/ingestion/extractor.py` | Extração de texto de PDF (PyMuPDF) e TXT |
| `app/services/ingestion/chunker.py` | Divisão do texto em trechos, preservando offsets |
| `app/services/ingestion/pipeline.py` | Orquestra extração → chunking → embeddings → indexação no Qdrant |
| `app/services/embeddings/encoder.py` | Geração de embeddings (fastembed) |
| `app/services/vectorstore/qdrant_store.py` | Cliente Qdrant: criação de coleção, upsert, busca, remoção |
| `app/services/cache/redis_cache.py` | Cache opcional de respostas (best-effort) |
| `app/services/retrieval/retriever.py` | Busca semântica (RAG) combinando embeddings + Qdrant + cache |
| `app/schemas/*.py` | Schemas Pydantic de request/response (auth, documentos, query) |

## Outras correções

| Problema | Correção |
|---|---|
| `.env` com `DATABASE_URL`/`QDRANT_URL`/`REDIS_URL` em `localhost` | Documentado no `.env.example` com aviso explícito; `docker-compose.yml` novo sobrescreve essas variáveis automaticamente para os nomes dos serviços (`postgres`, `qdrant`, `redis`) |
| `pyproject.toml` sem seção `[build-system]` | Adicionada (`hatchling`) — sem isso, `pip install .`/`uv pip install .` cai num build legado inconsistente com a seção `tool.hatch.build` já presente |
| `Dockerfile` instalava o pacote (`uv pip install -e .`) **antes** de copiar o código-fonte | Ordem invertida: copia tudo, depois instala (modo não-editável) |
| `@app.on_event("startup")` (depreciado) | Substituído por `lifespan` |
| Conexão com Postgres/Qdrant indisponível derrubava o processo no boot | `lifespan` agora captura a exceção e apenas loga um aviso — `/health` responde mesmo com a infraestrutura fora do ar |
| `sentence-transformers` (≈2GB, requer PyTorch) | Substituído por `fastembed` (ONNX Runtime, leve) com o modelo multilíngue `intfloat/multilingual-e5-small` — mantém boa qualidade em português com uma imagem Docker muito menor, importante para hospedagens com pouca RAM (ex: free tier do Render) |
| Geração de resposta sem chave de API configurada | `POST /api/v1/query` retorna `503` com mensagem clara (`"API key not configured. Set GROQ_API_KEY or OPENAI_API_KEY in .env"`) em vez de quebrar |
| Falha do Redis derrubava buscas | Cache é "best-effort": qualquer erro de conexão com o Redis é tratado como cache-miss, nunca propaga para o endpoint |

## Arquivos novos de infraestrutura/operação

| Arquivo | O que é |
|---|---|
| `docker-compose.yml` | Sobe Postgres, Qdrant, Redis e o backend com um único comando |
| `db/migrations/env.py` | Agora lê a URL do banco a partir do `.env` (via `app.core.config`) em vez do valor fixo do `alembic.ini` |
| `tests/unit/test_chunker.py` | Teste unitário do chunking (não depende de banco/Qdrant) |

---

## Como rodar

### Opção 1 — Docker Compose (recomendado)
```bash
cp .env.example .env
# edite o .env e preencha GROQ_API_KEY (e troque o SECRET_KEY em produção)

docker compose up --build
# → http://localhost:8000/docs
```

### Opção 2 — Manualmente (Postgres/Qdrant já instalados)
```bash
cp .env.example .env
# edite o .env: DATABASE_URL, QDRANT_URL, GROQ_API_KEY etc.

pip install -e .
uvicorn app.main:app --reload
# → http://localhost:8000/docs
```

### Rodar os testes (precisa de um Postgres em `docsense_test`)
```bash
pip install -e ".[dev]"
pytest
```

## Chave Groq (gratuita)
Crie uma em https://console.groq.com/keys e coloque em `GROQ_API_KEY` no
`.env`. O modelo usado é `llama-3.1-8b-instant` (rápido e sem custo no free
tier). Se preferir, defina `OPENAI_API_KEY` em vez disso — o backend usa
Groq como prioridade e cai para OpenAI automaticamente.

## Deploy em produção
Veja o `README.md` para o guia completo de deploy (Render + Postgres
gerenciado + Qdrant Cloud + Netlify).
