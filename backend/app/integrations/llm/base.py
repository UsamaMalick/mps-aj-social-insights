"""The LLM interface every module uses, plus validated structured generation."""

import logging
from copy import deepcopy
from dataclasses import dataclass
from typing import Any, Literal, Protocol

from pydantic import BaseModel
from pydantic import ValidationError as PydanticValidationError

logger = logging.getLogger(__name__)

Effort = Literal["low", "medium", "high"]

# Invalid output is retried once, then skipped.
MAX_ATTEMPTS = 2


class LLMOutputError(Exception):
    """The model answered but produced no usable output (refusal, truncation, no text)."""


@dataclass(frozen=True, slots=True)
class LLMResponse:
    text: str
    model: str  # the model that actually answered (stored with results for traceability)


@dataclass(frozen=True, slots=True)
class StructuredResult[T: BaseModel]:
    value: T
    model: str


class LLMClient(Protocol):
    @property
    def name(self) -> str:
        """Provider and configured model, for logs."""
        ...

    async def complete_json(
        self, *, system: str, prompt: str, schema: dict[str, Any], effort: Effort, max_tokens: int
    ) -> LLMResponse:
        """Return the model's JSON answer. Raises `LLMOutputError` or `ExternalServiceError`
        (API failures)."""
        ...


def strict_json_schema(model: type[BaseModel]) -> dict[str, Any]:
    """A JSON schema for structured outputs: refs inlined, every object closed and complete."""
    schema = model.model_json_schema()
    definitions: dict[str, Any] = schema.pop("$defs", {})

    def resolve(node: Any) -> Any:
        if isinstance(node, list):
            return [resolve(item) for item in node]
        if not isinstance(node, dict):
            return node
        if "$ref" in node:
            return resolve(deepcopy(definitions[node["$ref"].rsplit("/", 1)[-1]]))
        # Drop Pydantic's "title" annotations (strings), but keep a *field* named "title".
        resolved = {
            key: resolve(value)
            for key, value in node.items()
            if not (key == "title" and isinstance(value, str))
        }
        if resolved.get("type") == "object" and "properties" in resolved:
            resolved["additionalProperties"] = False
            resolved["required"] = list(resolved["properties"])
        return resolved

    result: dict[str, Any] = resolve(schema)
    return result


async def generate_structured[T: BaseModel](
    client: LLMClient,
    *,
    system: str,
    prompt: str,
    output_type: type[T],
    effort: Effort,
    max_tokens: int,
) -> StructuredResult[T] | None:
    """Ask for JSON matching `output_type` and validate it.

    Invalid output is retried once; after that it is logged and None is returned, so nothing
    unvalidated is ever stored. API errors propagate as `ExternalServiceError`.
    """
    schema = strict_json_schema(output_type)
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            response = await client.complete_json(
                system=system, prompt=prompt, schema=schema, effort=effort, max_tokens=max_tokens
            )
            return StructuredResult(
                value=output_type.model_validate_json(response.text), model=response.model
            )
        except (LLMOutputError, PydanticValidationError) as exc:
            logger.warning(
                "invalid llm output",
                extra={"attempt": attempt, "output_type": output_type.__name__, "error": str(exc)},
            )
    logger.error(
        "llm output still invalid after retry; skipping",
        extra={"output_type": output_type.__name__, "llm": client.name},
    )
    return None
