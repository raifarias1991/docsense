from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "DocSense"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = False

    # Security
    secret_key: str = "supersecretkey123"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # Database
    database_url: str = "postgresql+asyncpg://docsense:docsense@localhost:5432/docsense"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Groq / OpenAI-compatible
    openai_api_key: str = ""

    # Qdrant
    qdrant_url: str = "http://localhost:6333"

    # CORS — allows both Next.js dev and prod
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
