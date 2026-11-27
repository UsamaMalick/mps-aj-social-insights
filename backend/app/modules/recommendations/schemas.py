from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.shared.enums import (
    PatternDimension,
    RecommendationCategory,
    RecommendationSource,
    RecommendationStatus,
)
from app.shared.schemas import BaseSchema


class Evidence(BaseSchema):
    """The numbers behind a recommendation (always computed by analytics, never by the LLM)."""

    metric: str
    dimension: PatternDimension
    segment: str
    baseline: str
    segment_value: float
    baseline_value: float
    lift: float
    sample_size: int = Field(ge=0)
    baseline_sample_size: int = Field(ge=0)
    snapshot_hours: int
    own_share: float | None = None
    competitor_share: float | None = None
    notes: str | None = None


class RecommendationCreate(BaseSchema):
    title: str = Field(min_length=1, max_length=200)
    suggestion: str = Field(min_length=1)
    category: RecommendationCategory
    evidence: Evidence
    source: RecommendationSource
    prompt_version: str = Field(max_length=50)
    model: str = Field(max_length=100)


class RecommendationRead(RecommendationCreate):
    id: UUID
    status: RecommendationStatus
    created_at: datetime


class RecommendationFilters(BaseSchema):
    status: RecommendationStatus | None = None
    category: RecommendationCategory | None = None


class RecommendationStatusUpdate(BaseSchema):
    status: RecommendationStatus


class RecommendationDraft(BaseSchema):
    """One item of the LLM's output: wording only, tied to an evidence item by `ref`."""

    ref: int
    title: str = Field(min_length=1, max_length=120)
    suggestion: str = Field(min_length=1, max_length=600)


class RecommendationDrafts(BaseSchema):
    items: list[RecommendationDraft]
