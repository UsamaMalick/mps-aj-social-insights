import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ExternalServiceError
from app.integrations.llm.base import LLMClient, generate_structured
from app.modules.analytics.service import AnalyticsService
from app.modules.recommendations.evidence import EvidenceItem, build_evidence
from app.modules.recommendations.prompts import PROMPT_VERSION, SYSTEM_PROMPT, build_prompt
from app.modules.recommendations.repository import RecommendationRepository
from app.modules.recommendations.schemas import (
    RecommendationCreate,
    RecommendationDraft,
    RecommendationDrafts,
    RecommendationFilters,
    RecommendationRead,
    RecommendationStatusUpdate,
)
from app.modules.recommendations.templates import TEMPLATE_MODEL, TEMPLATE_VERSION, template_draft
from app.shared.enums import (
    DEFAULT_SNAPSHOT_AGE,
    AnalyticsScope,
    RecommendationSource,
    RecommendationStatus,
)
from app.shared.schemas import Page, PaginationParams

logger = logging.getLogger(__name__)

MAX_OUTPUT_TOKENS = 4_000


class RecommendationService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = RecommendationRepository(session)
        self.analytics = AnalyticsService(session)

    async def generate(self, llm: LLMClient | None) -> list[RecommendationRead]:
        """Build evidence from analytics and store one recommendation per finding.

        Wording comes from the LLM when configured, otherwise (or for any item it skips) from
        templates; the category and numbers always come from analytics. Unreviewed (`new`)
        recommendations from earlier runs are replaced; accepted or dismissed ones are kept.
        """
        patterns = await self.analytics.all_patterns(AnalyticsScope.ALL, DEFAULT_SNAPSHOT_AGE)
        items = build_evidence(patterns, await self.analytics.content_gaps(DEFAULT_SNAPSHOT_AGE))
        llm_drafts, llm_model = (
            await self._llm_drafts(llm, items) if llm is not None and items else ({}, None)
        )

        await self.repository.delete_with_status(RecommendationStatus.NEW)
        created = []
        for ref, item in enumerate(items):
            draft = llm_drafts.get(ref)
            created.append(await self.repository.create(_to_create(item, draft, llm_model, ref)))
        await self.session.commit()
        logger.info(
            "recommendations generated",
            extra={"count": len(created), "from_llm": len(llm_drafts)},
        )
        return [RecommendationRead.model_validate(row) for row in created]

    async def _llm_drafts(
        self, llm: LLMClient, items: list[EvidenceItem]
    ) -> tuple[dict[int, RecommendationDraft], str | None]:
        """LLM wording keyed by evidence ref, and the model that wrote it."""
        try:
            result = await generate_structured(
                llm,
                system=SYSTEM_PROMPT,
                prompt=build_prompt(items),
                output_type=RecommendationDrafts,
                effort="medium",
                max_tokens=MAX_OUTPUT_TOKENS,
            )
        except ExternalServiceError as exc:
            logger.error(
                "llm recommendations failed; using templates", extra={"error": exc.message}
            )
            return {}, None
        if result is None:
            return {}, None
        drafts = {d.ref: d for d in result.value.items if 0 <= d.ref < len(items)}
        return drafts, result.model

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


def _to_create(
    item: EvidenceItem, draft: RecommendationDraft | None, llm_model: str | None, ref: int
) -> RecommendationCreate:
    if draft is not None and llm_model is not None:
        source, prompt_version, model = RecommendationSource.LLM, PROMPT_VERSION, llm_model
    else:
        draft = template_draft(ref, item)
        source, prompt_version, model = (
            RecommendationSource.TEMPLATE,
            TEMPLATE_VERSION,
            TEMPLATE_MODEL,
        )
    return RecommendationCreate(
        title=draft.title,
        suggestion=draft.suggestion,
        category=item.category,
        evidence=item.evidence,
        source=source,
        prompt_version=prompt_version,
        model=model,
    )
