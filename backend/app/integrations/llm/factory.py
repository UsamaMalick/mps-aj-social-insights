from app.core.config import Settings
from app.integrations.llm.anthropic import AnthropicLLMClient
from app.integrations.llm.base import LLMClient


def get_llm_client(settings: Settings) -> LLMClient | None:
    """The configured LLM, or None when no API key is set (callers use their fallbacks)."""
    if settings.anthropic_api_key is None or not settings.llm_enabled:
        return None
    return AnthropicLLMClient(
        api_key=settings.anthropic_api_key.get_secret_value(), model=settings.llm_model
    )
