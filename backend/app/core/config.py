"""Application settings. Read them only through `get_settings()`."""

from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.shared.enums import DataSourceKind, Environment

APP_TITLE = "AJ Social Insights"
API_PREFIX = "/api/v1"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"), env_file_encoding="utf-8", extra="ignore"
    )

    environment: Environment = Environment.LOCAL
    log_level: str = "INFO"

    database_url: str = (
        "postgresql+asyncpg://social_insights:social_insights@localhost:5440/social_insights"
    )
    test_database_url: str = (
        "postgresql+asyncpg://social_insights:social_insights@localhost:5441/social_insights_test"
    )

    data_source: DataSourceKind = DataSourceKind.SEED

    anthropic_api_key: SecretStr | None = None
    llm_model: str = "claude-opus-5"
    llm_max_tokens: int = 2048

    @property
    def llm_enabled(self) -> bool:
        return self.anthropic_api_key is not None and bool(
            self.anthropic_api_key.get_secret_value()
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
