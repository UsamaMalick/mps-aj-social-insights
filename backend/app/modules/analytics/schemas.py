from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.modules.accounts.schemas import AccountRead
from app.modules.tagging.schemas import TagLabels
from app.shared.enums import (
    DEFAULT_SNAPSHOT_AGE,
    AnalyticsScope,
    Language,
    MediaType,
    PatternDimension,
    Platform,
    SnapshotAge,
)
from app.shared.schemas import BaseSchema

DEFAULT_TOP_POSTS = 10
MAX_TOP_POSTS = 50


class SnapshotParams(BaseSchema):
    age: SnapshotAge = DEFAULT_SNAPSHOT_AGE


class AccountSummary(BaseSchema):
    """Per-account totals. Own-only fields are None for competitors."""

    account: AccountRead
    post_count: int
    median_engagement_score: float
    mean_engagement_score: float
    total_interactions: int
    median_views: float
    total_reach: int | None = None
    total_saves: int | None = None
    total_clicks: int | None = None


class TopPostFilters(SnapshotParams):
    scope: AnalyticsScope = AnalyticsScope.ALL
    account_id: UUID | None = None
    limit: int = Field(default=DEFAULT_TOP_POSTS, ge=1, le=MAX_TOP_POSTS)


class TopPost(BaseSchema):
    post_id: UUID
    account_id: UUID
    account_display_name: str
    is_own: bool
    platform: Platform
    media_type: MediaType
    language: Language
    caption: str
    posted_at: datetime
    url: str
    likes: int
    comments: int
    shares: int
    views: int
    engagement_score: float
    lift: float
    labels: TagLabels | None


class PatternFilters(SnapshotParams):
    dimension: PatternDimension
    scope: AnalyticsScope = AnalyticsScope.ALL


class SegmentPattern(BaseSchema):
    dimension: PatternDimension
    segment: str
    post_count: int
    share: float
    median_engagement_score: float
    median_lift: float
    lift_vs_rest: float | None
    rest_post_count: int
    rest_median_engagement_score: float | None
    accounts_compared: int
    is_reliable: bool


class ContentGap(BaseSchema):
    dimension: PatternDimension
    segment: str
    own_share: float
    competitor_share: float
    own_post_count: int
    competitor_post_count: int
    lift_vs_rest: float | None


class CompetitorComparison(BaseSchema):
    """Public metrics only, so own and competitor accounts are comparable."""

    account: AccountRead
    post_count: int
    median_engagement_score: float
    median_likes: float
    median_comments: float
    median_shares: float
    median_views: float
    posts_per_day: float
