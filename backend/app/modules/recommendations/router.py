from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import PaginationDep, SessionDep
from app.modules.recommendations.schemas import (
    RecommendationFilters,
    RecommendationRead,
    RecommendationStatusUpdate,
)
from app.modules.recommendations.service import RecommendationService
from app.shared.schemas import Page

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


def get_recommendation_service(session: SessionDep) -> RecommendationService:
    return RecommendationService(session)


RecommendationServiceDep = Annotated[RecommendationService, Depends(get_recommendation_service)]


@router.get("", response_model=Page[RecommendationRead], summary="List recommendations")
async def list_recommendations(
    service: RecommendationServiceDep,
    pagination: PaginationDep,
    filters: Annotated[RecommendationFilters, Query()],
) -> Page[RecommendationRead]:
    return await service.list_recommendations(filters, pagination)


@router.get("/{recommendation_id}", response_model=RecommendationRead, summary="One recommendation")
async def get_recommendation(
    recommendation_id: UUID, service: RecommendationServiceDep
) -> RecommendationRead:
    return await service.get_recommendation(recommendation_id)


@router.patch(
    "/{recommendation_id}", response_model=RecommendationRead, summary="Accept or dismiss"
)
async def update_recommendation_status(
    recommendation_id: UUID, update: RecommendationStatusUpdate, service: RecommendationServiceDep
) -> RecommendationRead:
    return await service.update_status(recommendation_id, update)
