"""Chains LLM providers: if the primary fails, the same request goes to the next one."""

import logging
import time
from collections.abc import Callable, Sequence
from typing import Any

from app.core.exceptions import ExternalServiceError
from app.integrations.llm.base import Effort, LLMClient, LLMResponse

logger = logging.getLogger(__name__)

# After a provider fails, skip it for a while instead of failing on every request (e.g. a
# spending limit or outage would otherwise cost one failed round trip per batch).
COOLDOWN_SECONDS = 600.0


class FallbackLLMClient:
    def __init__(
        self,
        clients: Sequence[LLMClient],
        *,
        cooldown_seconds: float = COOLDOWN_SECONDS,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        if not clients:
            raise ValueError("FallbackLLMClient needs at least one client")
        self._clients = list(clients)
        self._cooldown = cooldown_seconds
        self._clock = clock
        self._unavailable_until: dict[int, float] = {}

    @property
    def name(self) -> str:
        return " -> ".join(client.name for client in self._clients)

    async def complete_json(
        self, *, system: str, prompt: str, schema: dict[str, Any], effort: Effort, max_tokens: int
    ) -> LLMResponse:
        errors: list[str] = []
        for index, client in enumerate(self._clients):
            is_last = index == len(self._clients) - 1
            if not is_last and self._unavailable_until.get(index, 0.0) > self._clock():
                continue
            try:
                return await client.complete_json(
                    system=system,
                    prompt=prompt,
                    schema=schema,
                    effort=effort,
                    max_tokens=max_tokens,
                )
            except ExternalServiceError as exc:
                errors.append(f"{client.name}: {exc.message}")
                self._unavailable_until[index] = self._clock() + self._cooldown
                if not is_last:
                    logger.warning(
                        "llm provider failed; falling back",
                        extra={"provider": client.name, "error": exc.message},
                    )
        raise ExternalServiceError("Every LLM provider failed", details=errors)
