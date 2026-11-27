from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.shared.enums import Language, MediaType, Platform, SnapshotAge
from app.shared.schemas import BaseSchema


class PostCreate(BaseSchema):
    account_id: UUID
    platform: Platform
    external_id: str = Field(min_length=1, max_length=100)
    media_type: MediaType
    caption: str
    language: Language
    posted_at: datetime
    url: str = Field(max_length=500)


class PostRead(PostCreate):
    id: UUID


class PublicMetrics(BaseSchema):
    """Metrics visible for every account, including competitors."""

    likes: int = Field(ge=0)
    comments: int = Field(ge=0)
    shares: int = Field(ge=0)
    views: int = Field(ge=0)


class OwnOnlyMetrics(BaseSchema):
    """Metrics only available for our own accounts; always None for competitors."""

    saves: int | None = Field(default=None, ge=0)
    reach: int | None = Field(default=None, ge=0)
    clicks: int | None = Field(default=None, ge=0)


class MetricSnapshotCreate(PublicMetrics, OwnOnlyMetrics):
    post_id: UUID
    hours_since_post: SnapshotAge


class MetricSnapshotRead(MetricSnapshotCreate):
    id: UUID
