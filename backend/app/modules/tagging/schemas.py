from uuid import UUID

from pydantic import Field

from app.shared.enums import HookStyle, Region, StoryType, TagSource, Tone, Topic
from app.shared.schemas import BaseSchema


class TagLabels(BaseSchema):
    """The labels themselves; also the structured output the LLM must return."""

    topic: Topic
    region: Region
    story_type: StoryType
    hook_style: HookStyle
    tone: Tone


class PostTagCreate(TagLabels):
    post_id: UUID
    source: TagSource
    prompt_version: str = Field(max_length=50)
    model: str = Field(max_length=100)


class PostTagRead(PostTagCreate):
    id: UUID


class TaggedCaption(TagLabels):
    """One item of the LLM's tagging output; `ref` points back to a caption in the prompt."""

    ref: int


class TaggingOutput(BaseSchema):
    items: list[TaggedCaption]


class TaggingResult(BaseSchema):
    source: TagSource
    tagged: int
    skipped: int
