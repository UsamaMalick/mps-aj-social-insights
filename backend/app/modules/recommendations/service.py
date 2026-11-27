from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.recommendations.repository import RecommendationRepository
from app.modules.recommendations.schemas import (
    RecommendationFilters,
    RecommendationRead,
    RecommendationStatusUpdate,
)
from app.shared.schemas import Page, PaginationParams


class RecommendationService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = RecommendationRepository(session)

    async def list_recommendations(
        self, filters: RecommendationFilters, pagination: PaginationParams
    ) -> Page[RecommendationRead]:
        rows, total = await self.repository.list_filtered(
            filters, offset=pagination.offset, limit=pagination.limit
        )
        return Page[RecommendationRead](
            items=[RecommendationRead.model_validate(row) for row in rows],
            total=total,
            offset=pagination.offset,
            limit=pagination.limit,
        )

    async def get_recommendation(self, recommendation_id: UUID) -> RecommendationRead:
        return RecommendationRead.model_validate(
            await self.repository.get_or_raise(recommendation_id)
        )

    async def update_status(
        self, recommendation_id: UUID, update: RecommendationStatusUpdate
    ) -> RecommendationRead:
        """Record an editor's decision on a recommendation."""
        recommendation = await self.repository.get_or_raise(recommendation_id)
        recommendation.status = update.status
        await self.session.commit()
        await self.session.refresh(recommendation)
        return RecommendationRead.model_validate(recommendation)
