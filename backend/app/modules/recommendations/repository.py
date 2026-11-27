from collections.abc import Sequence

from sqlalchemy import delete, func, select

from app.modules.recommendations.models import Recommendation
from app.modules.recommendations.schemas import RecommendationCreate, RecommendationFilters
from app.shared.enums import RecommendationStatus
from app.shared.repository import BaseRepository


class RecommendationRepository(BaseRepository[Recommendation]):
    model = Recommendation

    async def create(self, data: RecommendationCreate) -> Recommendation:
        return await self.add(Recommendation(**data.model_dump(mode="json")))

    async def list_filtered(
        self, filters: RecommendationFilters, *, offset: int, limit: int
    ) -> tuple[Sequence[Recommendation], int]:
        stmt = select(Recommendation)
        if filters.status is not None:
            stmt = stmt.where(Recommendation.status == filters.status)
        if filters.category is not None:
            stmt = stmt.where(Recommendation.category == filters.category)
        total = await self.session.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        rows = await self.session.scalars(
            stmt.order_by(Recommendation.created_at.desc(), Recommendation.title)
            .offset(offset)
            .limit(limit)
        )
        return rows.all(), total

    async def delete_with_status(self, status: RecommendationStatus) -> None:
        await self.session.execute(delete(Recommendation).where(Recommendation.status == status))
