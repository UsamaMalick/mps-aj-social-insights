import json

from pydantic import BaseModel

from app.integrations.llm.base import LLMOutputError, generate_structured, strict_json_schema
from app.modules.tagging.prompts import build_prompt
from app.modules.tagging.schemas import TaggingOutput
from tests.fakes import FakeLLMClient


class _Answer(BaseModel):
    value: int


def test_strict_schema_inlines_enums_and_closes_objects() -> None:
    schema = strict_json_schema(TaggingOutput)

    item = schema["properties"]["items"]["items"]
    assert "$defs" not in json.dumps(schema)
    assert item["additionalProperties"] is False
    assert set(item["required"]) == {"ref", "topic", "region", "story_type", "hook_style", "tone"}
    assert "explainer" in item["properties"]["story_type"]["enum"]


async def test_invalid_output_is_retried_once() -> None:
    replies = iter(["not json", '{"value": 3}'])
    client = FakeLLMClient(lambda _: next(replies))

    result = await generate_structured(
        client, system="s", prompt="p", output_type=_Answer, effort="low", max_tokens=10
    )

    assert result == _Answer(value=3)
    assert len(client.calls) == 2


async def test_output_invalid_twice_is_skipped() -> None:
    client = FakeLLMClient(lambda _: '{"value": "three"}')

    result = await generate_structured(
        client, system="s", prompt="p", output_type=_Answer, effort="low", max_tokens=10
    )

    assert result is None
    assert len(client.calls) == 2


async def test_refusals_count_as_invalid_output() -> None:
    def refuse(_: str) -> str:
        raise LLMOutputError("declined")

    result = await generate_structured(
        FakeLLMClient(refuse),
        system="s",
        prompt="p",
        output_type=_Answer,
        effort="low",
        max_tokens=10,
    )

    assert result is None


def test_prompt_wraps_each_caption_in_tags() -> None:
    prompt = build_prompt([(0, "First"), (1, "عاجل: ثاني")])

    assert '<caption ref="0">\nFirst\n</caption>' in prompt
    assert '<caption ref="1">\nعاجل: ثاني\n</caption>' in prompt
