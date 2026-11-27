"""The analytics module must rediscover every pattern planted in the seed data."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.analytics.schemas import PatternFilters
from app.modules.analytics.service import AnalyticsService
from app.seed.answer_key import EXPLAINER_CONTENT_GAP, PLANTED_PATTERNS, PlantedPattern
from app.shared.enums import DEFAULT_SNAPSHOT_AGE, AnalyticsScope, PatternDimension


def _detection_threshold(pattern: PlantedPattern) -> float:
    # Found = measured lift recovers at least half of the planted effect.
    return 1 + (pattern.multiplier - 1) / 2


def _strongest_planted(dimension: PatternDimension) -> PlantedPattern:
    return max(
        (p for p in PLANTED_PATTERNS if p.dimension == dimension), key=lambda p: p.multiplier
    )


@pytest.mark.parametrize("pattern", PLANTED_PATTERNS, ids=lambda p: p.key)
async def test_analytics_finds_planted_pattern(
    seeded_session: AsyncSession, pattern: PlantedPattern
) -> None:
    stats = await AnalyticsService(seeded_session).patterns(
        PatternFilters(dimension=pattern.dimension, scope=AnalyticsScope.ALL)
    )
    found = next(s for s in stats if s.segment == pattern.segment)

    assert found.is_reliable
    assert found.lift_vs_rest is not None
    assert found.lift_vs_rest >= _detection_threshold(pattern)
    if pattern is _strongest_planted(pattern.dimension):
        assert stats[0].segment == pattern.segment


async def test_analytics_finds_planted_content_gap(seeded_session: AsyncSession) -> None:
    gaps = await AnalyticsService(seeded_session).content_gaps(DEFAULT_SNAPSHOT_AGE)

    gap = next(g for g in gaps if g.segment == EXPLAINER_CONTENT_GAP.story_type)
    assert gap.own_share < EXPLAINER_CONTENT_GAP.competitor_share / 2
    assert gap.competitor_share > EXPLAINER_CONTENT_GAP.own_share * 3


async def test_unplanted_dimensions_show_no_strong_pattern(seeded_session: AsyncSession) -> None:
    for dimension in (PatternDimension.HOOK_STYLE, PatternDimension.TOPIC):
        stats = await AnalyticsService(seeded_session).patterns(PatternFilters(dimension=dimension))
        assert all(s.lift_vs_rest is not None and s.lift_vs_rest < 1.15 for s in stats)
