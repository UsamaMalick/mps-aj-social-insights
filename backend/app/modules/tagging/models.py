from uuid import UUID

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.shared.enums import HookStyle, Region, StoryType, TagSource, Tone, Topic
from app.shared.models import Timestamps, UUIDPrimaryKey, str_enum

PROMPT_VERSION_MAX_LENGTH = 50
MODEL_NAME_MAX_LENGTH = 100


class PostTag(UUIDPrimaryKey, Timestamps, Base):
    """Content labels for a post, with the prompt version and model that produced them."""

    __tablename__ = "post_tags"

    post_id: Mapped[UUID] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), unique=True)
    topic: Mapped[Topic] = mapped_column(str_enum(Topic))
    region: Mapped[Region] = mapped_column(str_enum(Region))
    story_type: Mapped[StoryType] = mapped_column(str_enum(StoryType))
    hook_style: Mapped[HookStyle] = mapped_column(str_enum(HookStyle))
    tone: Mapped[Tone] = mapped_column(str_enum(Tone))
    source: Mapped[TagSource] = mapped_column(str_enum(TagSource))
    prompt_version: Mapped[str] = mapped_column(String(PROMPT_VERSION_MAX_LENGTH))
    model: Mapped[str] = mapped_column(String(MODEL_NAME_MAX_LENGTH))
