"""Azure OpenAI implementation of `LLMClient`. The only module that imports the OpenAI SDK."""

from typing import Any

import openai
from openai import AsyncAzureOpenAI
from openai.types.chat import ChatCompletionMessageParam
from openai.types.shared_params import ResponseFormatJSONSchema

from app.core.exceptions import ExternalServiceError
from app.integrations.llm.base import Effort, LLMOutputError, LLMResponse

SCHEMA_NAME = "structured_output"
MODEL_PREFIX = "azure_openai/"
# Strict structured outputs reject some JSON-schema keywords. They are dropped from the
# request only: the Pydantic model still enforces them when the answer is validated.
UNSUPPORTED_SCHEMA_KEYWORDS = frozenset(
    {
        "minLength",
        "maxLength",
        "pattern",
        "format",
        "minimum",
        "maximum",
        "exclusiveMinimum",
        "exclusiveMaximum",
        "multipleOf",
        "minItems",
        "maxItems",
    }
)


def openai_strict_schema(schema: Any) -> Any:
    if isinstance(schema, list):
        return [openai_strict_schema(item) for item in schema]
    if not isinstance(schema, dict):
        return schema
    return {
        key: openai_strict_schema(value)
        for key, value in schema.items()
        if key not in UNSUPPORTED_SCHEMA_KEYWORDS or not isinstance(value, int | str)
    }


class AzureOpenAILLMClient:
    def __init__(
        self,
        *,
        endpoint: str,
        api_key: str,
        deployment: str,
        api_version: str,
        send_reasoning_effort: bool,
    ) -> None:
        self._client = AsyncAzureOpenAI(
            azure_endpoint=endpoint, api_key=api_key, api_version=api_version
        )
        self._deployment = deployment
        self._send_reasoning_effort = send_reasoning_effort

    @property
    def name(self) -> str:
        return f"{MODEL_PREFIX}{self._deployment}"

    async def complete_json(
        self, *, system: str, prompt: str, schema: dict[str, Any], effort: Effort, max_tokens: int
    ) -> LLMResponse:
        messages: list[ChatCompletionMessageParam] = [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ]
        response_format: ResponseFormatJSONSchema = {
            "type": "json_schema",
            "json_schema": {
                "name": SCHEMA_NAME,
                "schema": openai_strict_schema(schema),
                "strict": True,
            },
        }
        try:
            if self._send_reasoning_effort:
                response = await self._client.chat.completions.create(
                    model=self._deployment,
                    messages=messages,
                    response_format=response_format,
                    max_completion_tokens=max_tokens,
                    reasoning_effort=effort,
                )
            else:
                response = await self._client.chat.completions.create(
                    model=self._deployment,
                    messages=messages,
                    response_format=response_format,
                    max_completion_tokens=max_tokens,
                )
        except (openai.AuthenticationError, openai.PermissionDeniedError) as exc:
            raise ExternalServiceError("Azure OpenAI rejected the API key") from exc
        except openai.NotFoundError as exc:
            raise ExternalServiceError(
                f"Azure OpenAI deployment {self._deployment!r} was not found"
            ) from exc
        except openai.BadRequestError as exc:
            raise ExternalServiceError(f"Azure OpenAI rejected the request: {exc.message}") from exc
        except openai.RateLimitError as exc:
            raise ExternalServiceError("Azure OpenAI rate limit reached; try again later") from exc
        except openai.APIStatusError as exc:
            raise ExternalServiceError(f"Azure OpenAI API error ({exc.status_code})") from exc
        except openai.APIConnectionError as exc:
            raise ExternalServiceError("Could not reach Azure OpenAI") from exc

        if not response.choices:
            raise LLMOutputError("response contained no choices")
        choice = response.choices[0]
        if choice.message.refusal:
            raise LLMOutputError("model declined the request")
        if choice.finish_reason == "length":
            raise LLMOutputError("output was truncated at max_completion_tokens")
        if choice.finish_reason == "content_filter":
            raise LLMOutputError("output was blocked by the content filter")
        if not choice.message.content:
            raise LLMOutputError("response contained no content")
        return LLMResponse(text=choice.message.content, model=f"{MODEL_PREFIX}{response.model}")
