"""Application settings. Read them only through `get_settings()`."""

from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.shared.enums import DataSourceKind, Environment, LLMProvider

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

    # Primary LLM; the other configured provider is used as a fallback.
    llm_provider: LLMProvider = LLMProvider.ANTHROPIC

    anthropic_api_key: SecretStr | None = None
    llm_model: str = "claude-opus-5"

    azure_openai_endpoint: str | None = None
    azure_openai_api_key: SecretStr | None = None
    azure_openai_deployment: str | None = None
    azure_openai_api_version: str = "2025-04-01-preview"
    # Send `reasoning_effort` (reasoning models such as gpt-5 / o-series); disable for gpt-4o.
    azure_openai_reasoning: bool = True

    @property
    def anthropic_configured(self) -> bool:
        return _has_secret(self.anthropic_api_key)

    @property
    def azure_openai_configured(self) -> bool:
        return (
            _has_secret(self.azure_openai_api_key)
            and bool(self.azure_openai_endpoint)
            and bool(self.azure_openai_deployment)
        )

    @property
    def llm_enabled(self) -> bool:
        return self.anthropic_configured or self.azure_openai_configured


def _has_secret(value: SecretStr | None) -> bool:
    return value is not None and bool(value.get_secret_value())


@lru_cache
def get_settings() -> Settings:
    return Settings()
