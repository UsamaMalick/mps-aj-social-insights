from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.shared.enums import RecommendationCategory, RecommendationSource, RecommendationStatus
from app.shared.schemas import BaseSchema


class Evidence(BaseSchema):
    """The numbers behind a recommendation."""

    metric: str
    segment: str
    baseline: str
    segment_value: float
    baseline_value: float
    lift: float
    sample_size: int = Field(ge=0)
    baseline_sample_size: int = Field(ge=0)
    snapshot_hours: int
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
