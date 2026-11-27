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
        {
            "items": [
                {
                    "ref": r,
                    "title": f"LLM title {r}",
                    "suggestion": "Try it.",
                    "title_ar": f"عنوان {r}",
                    "suggestion_ar": "جرّبوه.",
                }
                for r in refs
            ]
        }
    )


ARABIC_LETTER = re.compile(r"[\u0600-\u06FF]")


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
        lambda _: json.dumps(
            {
                "items": [
                    {
                        "ref": 0,
                        "title": "T",
                        "suggestion": "S",
                        "title_ar": "ع",
                        "suggestion_ar": "ن",
                    }
                ]
            }
        )
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


async def test_every_recommendation_has_arabic_wording(seeded_session: AsyncSession) -> None:
    template = await RecommendationService(seeded_session).generate(llm=None)
    llm = await RecommendationService(seeded_session).generate(FakeLLMClient(_word_every_finding))

    for rec in [*template, *llm]:
        assert rec.title_ar and ARABIC_LETTER.search(rec.title_ar)
        assert rec.suggestion_ar and ARABIC_LETTER.search(rec.suggestion_ar)
    assert llm[0].title_ar == "عنوان 0"


async def test_arabic_templates_keep_the_evidence_numbers(seeded_session: AsyncSession) -> None:
    recs = await RecommendationService(seeded_session).generate(llm=None)

    for rec in recs:
        assert rec.suggestion_ar is not None
        assert f"{rec.evidence.lift:.2f}" in rec.suggestion_ar
        assert f"{rec.evidence.sample_size:,}" in rec.suggestion_ar


async def test_reviewed_recommendations_without_arabic_are_backfilled(
    seeded_session: AsyncSession,
) -> None:
    service = RecommendationService(seeded_session)
    first = await service.generate(llm=None)
    await service.update_status(
        first[0].id, RecommendationStatusUpdate(status=RecommendationStatus.ACCEPTED)
    )
    row = await service.repository.get_or_raise(first[0].id)
    row.title_ar = None
    row.suggestion_ar = None
    await seeded_session.flush()

    await service.generate(llm=None)
    backfilled = await service.get_recommendation(first[0].id)

    assert backfilled.title_ar and ARABIC_LETTER.search(backfilled.title_ar)
    assert backfilled.title == first[0].title  # English wording untouched
