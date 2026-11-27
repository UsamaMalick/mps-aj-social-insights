"""Test doubles. Tests never call the real LLM API."""

import json
import re
from collections.abc import Callable
from typing import Any

from app.integrations.llm.base import Effort

CAPTION_REF = re.compile(r'<caption ref="(\d+)">')

DEFAULT_LABELS = {
    "topic": "politics",
    "region": "middle_east",
    "story_type": "explainer",
    "hook_style": "question",
    "tone": "informative",
}


def label_every_caption(prompt: str) -> str:
    """A well-behaved tagger: returns default labels for every caption in the prompt."""
    refs = [int(ref) for ref in CAPTION_REF.findall(prompt)]
    return json.dumps({"items": [{"ref": ref, **DEFAULT_LABELS} for ref in refs]})


class FakeLLMClient:
    def __init__(self, respond: Callable[[str], str] = label_every_caption) -> None:
        self.respond = respond
        self.calls: list[dict[str, Any]] = []

    @property
    def model(self) -> str:
        return "fake-model"

    async def complete_json(
        self, *, system: str, prompt: str, schema: dict[str, Any], effort: Effort, max_tokens: int
    ) -> str:
        self.calls.append({"system": system, "prompt": prompt, "schema": schema})
        return self.respond(prompt)
