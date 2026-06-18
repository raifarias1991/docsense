# DocSense — Backend

API de chat com documentos (RAG): faça upload de PDFs/TXT, e pergunte sobre
o conteúdo deles em linguagem natural. O backend extrai o texto, divide em
trechos, gera embeddings, indexa num banco vetorial e usa um LLM para
responder com base nos trechos mais relevantes.

## Arquitetura

```
Cliente (frontend Next.js)
        │
        ▼
   FastAPI (app/main.py)
        │
   ┌────┼─────────────────────────────┐
   ▼    ▼                             ▼
 Auth  Documentos                   Query
 (JWT) │                              │
       ▼                              ▼
  Pipeline de ingestão           Retriever (RAG)
  (background task):             │   │
  extrai → divide em        embeddings  cache
  trechos → embeddings           │   (Redis,
  → indexa no Qdrant             ▼    opcional)
                              Qdrant
                            (busca vetorial)
                                 │
                                 ▼
                          Geração da resposta
                          (Groq ou OpenAI)
```

- **PostgreSQL** — usuários e metadados dos documentos (status, contagem de
  trechos, mensagens de erro).
- **Qdrant** — armazena os embeddings dos trechos de cada documento.
- **Redis** *(opcional)* — cache de respostas de consultas repetidas. Se
  estiver fora do ar, a aplicação simplesmente não usa cache; nada quebra.
- **Groq ou OpenAI** — geração da resposta final em linguagem natural a
  partir dos trechos recuperados.

## Quickstart (Docker Compose)

```bash
cp .env.example .env
# edite o .env: preencha GROQ_API_KEY (https://console.groq.com/keys)
# e troque o SECRET_KEY antes de ir para produção

docker compose up --build
```

Isso sobe Postgres, Qdrant, Redis e o backend. A API fica disponível em
`http://localhost:8000`, com documentação interativa em
`http://localhost:8000/docs`.

## Setup manual (sem Docker)

Requer Python 3.12+, um PostgreSQL e um Qdrant acessíveis.

```bash
cp .env.example .env
# edite DATABASE_URL, QDRANT_URL, GROQ_API_KEY etc.

pip install -e .
uvicorn app.main:app --reload
```

As tabelas do banco são criadas automaticamente no startup (não é
necessário rodar `alembic upgrade head` na primeira vez — embora as
migrations estejam disponíveis em `db/migrations/` para evoluções futuras
do schema).

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `ENVIRONMENT` | `development` | `production` ativa comportamentos mais estritos |
| `DEBUG` | `false` | Ativa logs SQL e mais verbosidade |
| `SECRET_KEY` | — | Chave usada para assinar os JWTs. **Gere uma nova em produção**: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Validade do token de acesso |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Validade do token de refresh |
| `GROQ_API_KEY` | — | Chave da Groq (prioridade sobre OpenAI) |
| `OPENAI_API_KEY` | — | Chave da OpenAI (usada se não houver `GROQ_API_KEY`) |
| `DATABASE_URL` | `postgresql+asyncpg://docsense:docsense@localhost:5432/docsense` | String de conexão assíncrona do Postgres |
| `QDRANT_URL` | `http://localhost:6333` | Endereço do Qdrant |
| `QDRANT_API_KEY` | — | Necessário ao usar Qdrant Cloud |
| `QDRANT_COLLECTION_NAME` | `docsense_chunks` | Nome da coleção de vetores |
| `REDIS_URL` | `redis://localhost:6379` | Cache opcional de respostas |
| `QUERY_CACHE_TTL_SECONDS` | `300` | TTL do cache de consultas |
| `EMBEDDING_MODEL` | `intfloat/multilingual-e5-small` | Modelo de embeddings (fastembed) |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | `1000` / `150` | Tamanho e sobreposição dos trechos de texto |
| `MAX_UPLOAD_SIZE_MB` | `10` | Tamanho máximo de upload |
| `ALLOWED_ORIGINS` | inclui `localhost:3000` e o domínio Netlify | Origens permitidas no CORS (lista JSON ou separada por vírgulas) |

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Status da aplicação |
| `POST` | `/api/v1/auth/register` | Cria um usuário |
| `POST` | `/api/v1/auth/login` | Retorna `access_token` + `refresh_token` |
| `POST` | `/api/v1/auth/refresh` | Renova os tokens |
| `GET` | `/api/v1/users/me` | Dados do usuário autenticado |
| `POST` | `/api/v1/documents/upload` | Envia um PDF ou TXT (máx. 10MB por padrão) |
| `GET` | `/api/v1/documents` | Lista os documentos do usuário |
| `GET` | `/api/v1/documents/{id}` | Detalhe de um documento (inclui `status`) |
| `DELETE` | `/api/v1/documents/{id}` | Remove o documento e seus vetores |
| `POST` | `/api/v1/query` | Faz uma pergunta sobre os documentos do usuário |

`POST /api/v1/query` aceita:
```json
{
  "question": "Qual o prazo de entrega mencionado no contrato?",
  "top_k": 5,
  "score_threshold": 0.3,
  "generate_answer": true
}
```
- `top_k` — número de trechos recuperados (1–20)
- `score_threshold` — limiar mínimo de relevância (0–1)
- `generate_answer` — se `false`, retorna só os trechos, sem chamar o LLM

Todos os endpoints de documentos e query exigem o header
`Authorization: Bearer <access_token>`.

## Upload e processamento de documentos

O upload retorna imediatamente com o documento em status `pending`; a
extração de texto, divisão em trechos, geração de embeddings e indexação no
Qdrant acontecem em segundo plano. Consulte `GET /api/v1/documents/{id}`
para acompanhar a transição `pending → processing → completed` (ou
`failed`, com `error_message` preenchido).

## Testes

```bash
pip install -e ".[dev]"

# tests/unit/ não precisa de infraestrutura externa
pytest tests/unit -v

# tests/integration/ precisa de um Postgres em docsense_test
pytest -v
```

## Deploy em produção

Um setup comum e de baixo custo:

- **Backend**: [Render](https://render.com) (Web Service apontando para
  este repositório; o `Dockerfile` já está pronto para isso)
- **PostgreSQL**: um Postgres gerenciado (Render Postgres, [Neon](https://neon.tech)
  ou [Supabase](https://supabase.com))
- **Qdrant**: [Qdrant Cloud](https://cloud.qdrant.io) (free tier disponível)
- **Frontend**: Netlify

Ao configurar o serviço no Render (ou similar), defina as variáveis de
ambiente do `.env.example` no painel — **não** copie o `.env` local, pois
`DATABASE_URL`/`QDRANT_URL` em produção devem apontar para os serviços
gerenciados, nunca para `localhost`. Lembre-se também de incluir a URL do
seu frontend em `ALLOWED_ORIGINS`.

## Solução de problemas

**"API key not configured. Set GROQ_API_KEY or OPENAI_API_KEY in .env"**
Nenhuma das duas chaves está definida no ambiente onde o backend está
rodando. Defina `GROQ_API_KEY` (gratuita em https://console.groq.com/keys)
ou `OPENAI_API_KEY` e reinicie o serviço.

**`[Errno 111] Connection refused` ao enviar um documento**
`DATABASE_URL`, `QDRANT_URL` ou `REDIS_URL` está apontando para um host que
não existe no ambiente atual (geralmente `localhost`, que só faz sentido
quando os serviços rodam na mesma máquina/container). Em produção, esses
valores precisam apontar para o host real do seu Postgres/Qdrant/Redis
gerenciados.

**Documento fica para sempre em `processing`**
Confira os logs do backend — a exceção é capturada e o documento muda para
`failed` com `error_message`, mas se o próprio worker em background travar
(ex: o processo foi reiniciado no meio do processamento), o status pode
ficar parado. Reenviar o documento resolve.
