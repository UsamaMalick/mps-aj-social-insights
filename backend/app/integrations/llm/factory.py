from app.core.config import Settings
from app.integrations.llm.anthropic import AnthropicLLMClient
from app.integrations.llm.azure_openai import AzureOpenAILLMClient
from app.integrations.llm.base import LLMClient
from app.integrations.llm.fallback import FallbackLLMClient
from app.shared.enums import LLMProvider


def _build(provider: LLMProvider, settings: Settings) -> LLMClient | None:
    match provider:
        case LLMProvider.ANTHROPIC:
            if settings.anthropic_api_key is None or not settings.anthropic_configured:
                return None
            return AnthropicLLMClient(
                api_key=settings.anthropic_api_key.get_secret_value(), model=settings.llm_model
            )
        case LLMProvider.AZURE_OPENAI:
            if (
                not settings.azure_openai_configured
                or settings.azure_openai_api_key is None
                or settings.azure_openai_endpoint is None
                or settings.azure_openai_deployment is None
            ):
                return None
            return AzureOpenAILLMClient(
                endpoint=settings.azure_openai_endpoint,
                api_key=settings.azure_openai_api_key.get_secret_value(),
                deployment=settings.azure_openai_deployment,
                api_version=settings.azure_openai_api_version,
                send_reasoning_effort=settings.azure_openai_reasoning,
            )


def get_llm_client(settings: Settings) -> LLMClient | None:
    """`LLM_PROVIDER` first, then any other configured provider as a fallback.

    None when no provider is configured (callers then use their rule/template fallbacks).
    """
    order = [settings.llm_provider] + [p for p in LLMProvider if p != settings.llm_provider]
    clients = [client for p in order if (client := _build(p, settings)) is not None]
    if not clients:
        return None
    if len(clients) == 1:
        return clients[0]
    return FallbackLLMClient(clients)
