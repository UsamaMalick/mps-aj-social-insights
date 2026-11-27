from typing import Any

import pytest
from pydantic import SecretStr

from app.core.config import Settings
from app.core.exceptions import ExternalServiceError
from app.integrations.llm.anthropic import AnthropicLLMClient
from app.integrations.llm.azure_openai import AzureOpenAILLMClient, openai_strict_schema
from app.integrations.llm.base import strict_json_schema
from app.integrations.llm.factory import get_llm_client
from app.integrations.llm.fallback import FallbackLLMClient
from app.modules.recommendations.schemas import RecommendationDrafts
from app.shared.enums import LLMProvider
from tests.fakes import FakeLLMClient

AZURE = {
    "azure_openai_endpoint": "https://example.openai.azure.com",
    "azure_openai_api_key": SecretStr("azure-key"),
    "azure_openai_deployment": "gpt-test",
}


def _settings(**overrides: Any) -> Settings:
    fields: dict[str, Any] = {
        "anthropic_api_key": None,
        "azure_openai_endpoint": None,
        "azure_openai_api_key": None,
        "azure_openai_deployment": None,
    }
    return Settings(_env_file=None, **(fields | overrides))


def _failing(_: str) -> str:
    raise ExternalServiceError("limit reached")


async def _ask(client: FallbackLLMClient) -> str:
    response = await client.complete_json(
        system="s", prompt="p", schema={}, effort="low", max_tokens=10
    )
    return response.model


def test_no_provider_means_no_llm() -> None:
    assert get_llm_client(_settings()) is None


def test_single_provider_is_used_directly() -> None:
    assert isinstance(get_llm_client(_settings(**AZURE)), AzureOpenAILLMClient)


def test_both_providers_chain_with_the_primary_first() -> None:
    client = get_llm_client(
        _settings(anthropic_api_key=SecretStr("k"), llm_provider=LLMProvider.AZURE_OPENAI, **AZURE)
    )

    assert isinstance(client, FallbackLLMClient)
    assert client.name.startswith("azure_openai/gpt-test -> anthropic/")


def test_incomplete_azure_settings_are_ignored() -> None:
    client = get_llm_client(
        _settings(anthropic_api_key=SecretStr("k"), azure_openai_api_key=SecretStr("x"))
    )

    assert isinstance(client, AnthropicLLMClient)


async def test_fallback_uses_the_next_provider_when_the_primary_fails() -> None:
    primary = FakeLLMClient(_failing, model="primary")
    chain = FallbackLLMClient([primary, FakeLLMClient(model="secondary")])

    assert await _ask(chain) == "secondary"


async def test_failed_provider_is_skipped_during_cooldown() -> None:
    now = [0.0]
    primary = FakeLLMClient(_failing, model="primary")
    chain = FallbackLLMClient(
        [primary, FakeLLMClient(model="secondary")], cooldown_seconds=60, clock=lambda: now[0]
    )
    await _ask(chain)
    await _ask(chain)
    assert len(primary.calls) == 1

    now[0] = 61
    await _ask(chain)
    assert len(primary.calls) == 2


async def test_fallback_raises_when_every_provider_fails() -> None:
    chain = FallbackLLMClient([FakeLLMClient(_failing), FakeLLMClient(_failing)])

    with pytest.raises(ExternalServiceError) as caught:
        await _ask(chain)
    assert len(caught.value.details) == 2


def test_openai_schema_drops_unsupported_keywords_but_keeps_fields() -> None:
    schema = openai_strict_schema(strict_json_schema(RecommendationDrafts))

    item = schema["properties"]["items"]["items"]
    assert set(item["properties"]) == {"ref", "title", "suggestion", "title_ar", "suggestion_ar"}
    assert "maxLength" not in item["properties"]["title"]
    assert item["additionalProperties"] is False
