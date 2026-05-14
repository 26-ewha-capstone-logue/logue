from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    openai_api_key: str = ""
    openai_org_id: str | None = None

    log_level: str = "INFO"
    log_dir: str = "logs"

    discord_webhook_url: str = ""
    upstream_health_url: str = "https://ai.logue-kr.site/health"
    upstream_timeout_sec: float = 3.0


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
