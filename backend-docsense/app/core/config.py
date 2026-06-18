from functools import lru_cache


from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────
    app_name: str = "DocSense"
    app_version: str = "0.2.0"
    environment: str = "development"
    debug: bool = False

    # ── Security / JWT ───────────────────────────────────────────────────
    secret_key: str = "supersecretkey123"  # ⚠️ sempre sobrescreva no .env
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    # ── Database (PostgreSQL) ────────────────────────────────────────────
    database_url: str = "postgresql+asyncpg://docsense:docsense@localhost:5432/docsense"

    # ── Redis (cache opcional — app funciona mesmo se indisponível) ───────
    redis_url: str = "redis://localhost:6379"
    query_cache_ttl_seconds: int = 300

    # ── LLM — Groq (prioridade) ou OpenAI ────────────────────────────────
    groq_api_key: str = ""
    openai_api_key: str = ""

    # ── Qdrant (vector store) ────────────────────────────────────────────
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str = ""
    qdrant_collection_name: str = "docsense_chunks"

    # ── Pipeline de ingestão / embeddings ────────────────────────────────
    # Modelo multilíngue leve (ONNX via fastembed) — funciona bem em PT-BR
    # e não exige PyTorch, o que mantém a imagem Docker pequena e o boot
    # rápido mesmo em planos gratuitos de hospedagem.
    embedding_model: str = "intfloat/multilingual-e5-small"
    chunk_size: int = 1000
    chunk_overlap: int = 150
    max_upload_size_mb: int = 10

    # ── CORS ─────────────────────────────────────────────────────────────
    # Guardado como str para evitar que o pydantic_settings tente fazer
    # JSON parse automático antes do nosso tratamento (o que causaria crash
    # quando a variável estivesse vazia ou ausente no ambiente).
    # Use a property  para obter a lista real.
    _CORS_DEFAULTS: str = (
    "http://localhost:3000,http://localhost:3001,"
    "http://127.0.0.1:3000,https://docsense-app.netlify.app,"
    "https://docdocense.netlify.app"
    )
    allowed_origins_raw: str = ""

    @property
    def allowed_origins(self) -> list[str]:
        raw = self.allowed_origins_raw.strip()
        if not raw:
            return [o.strip() for o in self._CORS_DEFAULTS.split(",") if o.strip()]
        if raw.startswith("["):
            import json as _json
            try:
                return _json.loads(raw)
            except _json.JSONDecodeError:
                pass
        return [o.strip() for o in raw.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def active_api_key(self) -> str:
        """Retorna a primeira chave disponível (Groq tem prioridade)."""
        return self.groq_api_key or self.openai_api_key


@lru_cache
def get_settings() -> Settings:
    return Settings()
