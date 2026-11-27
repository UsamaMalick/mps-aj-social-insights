"""Recommendations must reflect the planted patterns and always carry their evidence."""

import json
import re

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.recommendations.prompts import PROMPT_VERSION
from app.modules.recommendations.schemas import RecommendationRead, RecommendationStatusUpdate
from app.modules.recommendations.service import RecommendationService
from app.seed.answer_key import EXPLAINER_CONTENT_GAP, PLANTED_PATTERNS
from app.shared.enums import (
    PatternDimension,
    RecommendationCategory,
    RecommendationSource,
    RecommendationStatus,
)
from tests.fakes import FakeLLMClient

REF = re.compile(r'"ref": (\d+)')


def _segments(recs: list[RecommendationRead]) -> set[tuple[PatternDimension, str]]:
    return {(r.evidence.dimension, r.evidence.segment) for r in recs}


def _word_every_finding(prompt: str) -> str:
    refs = [int(ref) for ref in REF.findall(prompt)]
    return json.dumps(
        {"items": [{"ref": r, "title": f"LLM title {r}", "suggestion": "Try it."} for r in refs]}
    )


async def test_template_recommendations_cover_every_planted_pattern(
    seeded_session: AsyncSession,
) -> None:
    recs = await RecommendationService(seeded_session).generate(llm=None)

    expected = {(p.dimension, str(p.segment)) for p in PLANTED_PATTERNS}
    found = _segments(recs)
    # Each planted dimension yields its strongest segment (the gap adds explainers).
    for dimension, segment in expected:
        strongest = max(
            (p for p in PLANTED_PATTERNS if p.dimension == dimension), key=lambda p: p.multiplier
        )
        if str(strongest.segment) == segment:
            assert (dimension, segment) in found
    assert (PatternDimension.STORY_TYPE, EXPLAINER_CONTENT_GAP.story_type) in found
    assert all(r.source is RecommendationSource.TEMPLATE for r in recs)


async def test_recommendations_carry_evidence_and_never_cover_topics(
    seeded_session: AsyncSession,
) -> None:
    recs = await RecommendationService(seeded_session).generate(llm=None)

    assert recs
    for rec in recs:
        assert rec.evidence.sample_size >= 30
        assert rec.evidence.lift >= 1.2
        assert rec.evidence.snapshot_hours == 72
        assert rec.evidence.dimension is not PatternDimension.TOPIC
    # Hook style has no planted pattern, so nothing is strong enough to recommend.
    assert RecommendationCategory.HOOK not in {r.category for r in recs}


async def test_gap_recommendation_mentions_both_shares(seeded_session: AsyncSession) -> None:
    recs = await RecommendationService(seeded_session).generate(llm=None)

    gap = next(r for r in recs if r.evidence.segment == EXPLAINER_CONTENT_GAP.story_type)
    assert gap.evidence.own_share is not None
    assert gap.evidence.competitor_share is not None
    assert "Competitors use them in" in gap.suggestion


async def test_llm_writes_wording_but_numbers_come_from_analytics(
    seeded_session: AsyncSession,
) -> None:
    template = await RecommendationService(seeded_session).generate(llm=None)
    llm = FakeLLMClient(_word_every_finding)

    recs = await RecommendationService(seeded_session).generate(llm)

    assert all(r.source is RecommendationSource.LLM for r in recs)
    assert all(r.prompt_version == PROMPT_VERSION and r.model == "fake-model" for r in recs)
    assert [r.evidence for r in recs] == [r.evidence for r in template]
    assert "Never recommend which news" in llm.calls[0]["system"]


async def test_items_the_llm_skips_fall_back_to_templates(seeded_session: AsyncSession) -> None:
    only_first = FakeLLMClient(
        lambda _: json.dumps({"items": [{"ref": 0, "title": "T", "suggestion": "S"}]})
    )

    recs = await RecommendationService(seeded_session).generate(only_first)

    assert recs[0].source is RecommendationSource.LLM
    assert {r.source for r in recs[1:]} == {RecommendationSource.TEMPLATE}


async def test_regenerating_replaces_new_but_keeps_reviewed(seeded_session: AsyncSession) -> None:
    service = RecommendationService(seeded_session)
    first = await service.generate(llm=None)
    await service.update_status(
        first[0].id, RecommendationStatusUpdate(status=RecommendationStatus.ACCEPTED)
    )

    second = await service.generate(llm=None)
    accepted = await service.get_recommendation(first[0].id)

    assert accepted.status is RecommendationStatus.ACCEPTED
    assert len(second) == len(first)
    assert first[1].id not in {r.id for r in second}
