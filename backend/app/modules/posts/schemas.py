from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.modules.tagging.schemas import TagLabels
from app.shared.enums import Language, MediaType, Platform, PostSort, SnapshotAge, StoryType
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


class PostMetricsRow(PublicMetrics, OwnOnlyMetrics):
    """A post with its metrics at one snapshot age (input to analytics)."""

    post_id: UUID
    account_id: UUID
    platform: Platform
    media_type: MediaType
    language: Language
    caption: str
    posted_at: datetime
    url: str


SEARCH_MAX_LENGTH = 100


class PostFilters(BaseSchema):
    account_id: UUID | None = None
    is_own: bool | None = None
    platform: Platform | None = None
    media_type: MediaType | None = None
    language: Language | None = None
    story_type: StoryType | None = None
    q: str | None = Field(default=None, max_length=SEARCH_MAX_LENGTH, description="Caption search")
    sort: PostSort = PostSort.NEWEST


class PostQuery(BaseSchema):
    """What the posts repository can filter on by itself (no other module's data)."""

    account_ids: list[UUID] | None = None
    post_ids: list[UUID] | None = None
    platform: Platform | None = None
    media_type: MediaType | None = None
    language: Language | None = None
    q: str | None = None


class PostAccount(BaseSchema):
    id: UUID
    handle: str
    display_name: str
    is_own: bool
    followers_count: int


class PostListItem(PostRead):
    account: PostAccount
    latest_snapshot: MetricSnapshotRead | None
    engagement_score: float | None
    labels: TagLabels | None


class PostDetail(PostListItem):
    snapshots: list[MetricSnapshotRead]
