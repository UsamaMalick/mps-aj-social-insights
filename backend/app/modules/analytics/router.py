from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.deps import SessionDep
from app.modules.analytics.schemas import (
    AccountSummary,
    CompetitorComparison,
    CompetitorFilters,
    ContentGap,
    OverviewTotals,
    PatternFilters,
    SegmentPattern,
    SnapshotParams,
    TopPost,
    TopPostFilters,
)
from app.modules.analytics.service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


def get_analytics_service(session: SessionDep) -> AnalyticsService:
    return AnalyticsService(session)


AnalyticsServiceDep = Annotated[AnalyticsService, Depends(get_analytics_service)]


@router.get(
    "/summary", response_model=list[AccountSummary], summary="Engagement summary per account"
)
async def get_account_summaries(
    service: AnalyticsServiceDep, params: Annotated[SnapshotParams, Query()]
) -> list[AccountSummary]:
    return await service.account_summaries(params.age)


@router.get(
    "/overview", response_model=OverviewTotals, summary="Headline numbers: own vs competitors"
)
async def get_overview(
    service: AnalyticsServiceDep, params: Annotated[SnapshotParams, Query()]
) -> OverviewTotals:
    return await service.overview(params.age)


@router.get(
    "/competitors",
    response_model=list[CompetitorComparison],
    summary="All accounts side by side (public metrics only)",
)
async def get_competitor_comparison(
    service: AnalyticsServiceDep, filters: Annotated[CompetitorFilters, Query()]
) -> list[CompetitorComparison]:
    return await service.competitor_comparison(filters)


@router.get("/top-posts", response_model=list[TopPost], summary="Highest-lift posts")
async def get_top_posts(
    service: AnalyticsServiceDep, filters: Annotated[TopPostFilters, Query()]
) -> list[TopPost]:
    return await service.top_posts(filters)


@router.get(
    "/patterns", response_model=list[SegmentPattern], summary="Engagement by segment of a dimension"
)
async def get_patterns(
    service: AnalyticsServiceDep, filters: Annotated[PatternFilters, Query()]
) -> list[SegmentPattern]:
    return await service.patterns(filters)


@router.get(
    "/highlights",
    response_model=list[SegmentPattern],
    summary="Strongest segment per storytelling dimension, strongest first",
)
async def get_highlights(
    service: AnalyticsServiceDep, params: Annotated[SnapshotParams, Query()]
) -> list[SegmentPattern]:
    return await service.highlights(params.age)


@router.get(
    "/gaps", response_model=list[ContentGap], summary="Content competitors use and we do not"
)
async def get_content_gaps(
    service: AnalyticsServiceDep, params: Annotated[SnapshotParams, Query()]
) -> list[ContentGap]:
    return await service.content_gaps(params.age)
