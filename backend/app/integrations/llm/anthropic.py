"""Anthropic implementation of `LLMClient`. The only module that imports the SDK."""

from typing import Any, Final

import anthropic
from anthropic import AsyncAnthropic
from anthropic.types.beta import BetaMessageParam, BetaOutputConfigParam

from app.core.exceptions import ExternalServiceError
from app.integrations.llm.base import Effort, LLMOutputError

# Server-side fallback: if the model declines for policy reasons, the API re-runs the
# request on Anthropic's recommended substitute model instead of returning a refusal.
FALLBACK_BETA = "server-side-fallback-2026-07-01"
DEFAULT_FALLBACKS: Final = "default"


class AnthropicLLMClient:
    def __init__(self, *, api_key: str, model: str) -> None:
        self._client = AsyncAnthropic(api_key=api_key)
        self._model = model

    @property
    def model(self) -> str:
        return self._model

    async def complete_json(
        self, *, system: str, prompt: str, schema: dict[str, Any], effort: Effort, max_tokens: int
    ) -> str:
        messages: list[BetaMessageParam] = [{"role": "user", "content": prompt}]
        output_config: BetaOutputConfigParam = {
            "effort": effort,
            "format": {"type": "json_schema", "schema": schema},
        }
        try:
            response = await self._client.beta.messages.create(
                model=self._model,
                max_tokens=max_tokens,
                system=system,
                messages=messages,
                output_config=output_config,
                betas=[FALLBACK_BETA],
                fallbacks=DEFAULT_FALLBACKS,
            )
        except (anthropic.AuthenticationError, anthropic.PermissionDeniedError) as exc:
            raise ExternalServiceError("Anthropic rejected the API key") from exc
        except anthropic.BadRequestError as exc:
            raise ExternalServiceError(f"Anthropic rejected the request: {exc.message}") from exc
        except anthropic.RateLimitError as exc:
            raise ExternalServiceError("Anthropic rate limit reached; try again later") from exc
        except anthropic.APIStatusError as exc:
            raise ExternalServiceError(f"Anthropic API error ({exc.status_code})") from exc
        except anthropic.APIConnectionError as exc:
            raise ExternalServiceError("Could not reach the Anthropic API") from exc

        if response.stop_reason == "refusal":
            raise LLMOutputError("model declined the request")
        if response.stop_reason == "max_tokens":
            raise LLMOutputError("output was truncated at max_tokens")
        text: str | None = next(
            (block.text for block in response.content if block.type == "text"), None
        )
        if text is None:
            raise LLMOutputError("response contained no text block")
        return text
