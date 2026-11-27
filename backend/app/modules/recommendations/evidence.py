"""Turns analytics output into evidence items worth recommending on (pure, no I/O)."""

from collections.abc import Mapping, Sequence
from dataclasses import dataclass

from app.modules.analytics.schemas import ContentGap, SegmentPattern
from app.modules.recommendations.schemas import Evidence
from app.shared.enums import DEFAULT_SNAPSHOT_AGE, PatternDimension, RecommendationCategory

ENGAGEMENT_METRIC = "engagement_score"
SAME_ACCOUNT_BASELINE = "other posts from the same account"
# Only patterns at least this strong become recommendations.
MIN_RECOMMENDATION_LIFT = 1.2

# Topic is deliberately absent: recommendations say how to tell stories, never which to cover.
CATEGORY_BY_DIMENSION: Mapping[PatternDimension, RecommendationCategory] = {
    PatternDimension.MEDIA_TYPE: RecommendationCategory.FORMAT,
    PatternDimension.STORY_TYPE: RecommendationCategory.STYLE,
    PatternDimension.HOOK_STYLE: RecommendationCategory.HOOK,
    PatternDimension.TIME_BLOCK: RecommendationCategory.TIMING,
    PatternDimension.LANGUAGE: RecommendationCategory.LANGUAGE,
}


@dataclass(frozen=True, slots=True)
class EvidenceItem:
    category: RecommendationCategory
    evidence: Evidence
    is_gap: bool


def _is_strong(pattern: SegmentPattern) -> bool:
    return (
        pattern.is_reliable
        and pattern.lift_vs_rest is not None
        and pattern.lift_vs_rest >= MIN_RECOMMENDATION_LIFT
        and pattern.rest_median_engagement_score is not None
    )


def _from_pattern(pattern: SegmentPattern) -> Evidence:
    assert pattern.lift_vs_rest is not None
    assert pattern.rest_median_engagement_score is not None
    return Evidence(
        metric=ENGAGEMENT_METRIC,
        dimension=pattern.dimension,
        segment=pattern.segment,
        baseline=SAME_ACCOUNT_BASELINE,
        segment_value=pattern.median_engagement_score,
        baseline_value=pattern.rest_median_engagement_score,
        lift=pattern.lift_vs_rest,
        sample_size=pattern.post_count,
        baseline_sample_size=pattern.rest_post_count,
        snapshot_hours=DEFAULT_SNAPSHOT_AGE,
        notes=f"Compared within {pattern.accounts_compared} accounts.",
    )


def build_evidence(
    patterns: Mapping[PatternDimension, Sequence[SegmentPattern]],
    gaps: Sequence[ContentGap],
) -> list[EvidenceItem]:
    """Content gaps first (they are the most actionable), then the strongest segment of each
    recommendable dimension."""
    items: list[EvidenceItem] = []
    gap_keys: set[tuple[PatternDimension, str]] = set()

    for gap in gaps:
        category = CATEGORY_BY_DIMENSION.get(gap.dimension)
        pattern = next(
            (p for p in patterns.get(gap.dimension, ()) if p.segment == gap.segment), None
        )
        if category is None or pattern is None or not _is_strong(pattern):
            continue
        evidence = _from_pattern(pattern).model_copy(
            update={"own_share": gap.own_share, "competitor_share": gap.competitor_share}
        )
        items.append(EvidenceItem(category=category, evidence=evidence, is_gap=True))
        gap_keys.add((gap.dimension, gap.segment))

    for dimension, category in CATEGORY_BY_DIMENSION.items():
        best = next((p for p in patterns.get(dimension, ()) if _is_strong(p)), None)
        if best is None or (dimension, best.segment) in gap_keys:
            continue
        items.append(EvidenceItem(category=category, evidence=_from_pattern(best), is_gap=False))
    return items
