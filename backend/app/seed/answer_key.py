"""Patterns deliberately planted in the seed data.

The generator applies these multipliers to engagement; `tests/integration/test_answer_key.py`
asserts that the analytics module rediscovers every one. Change them here only.
"""

from dataclasses import dataclass

from app.shared.enums import Language, MediaType, PatternDimension, StoryType


@dataclass(frozen=True, slots=True)
class PlantedPattern:
    key: str
    dimension: PatternDimension
    segment: str
    multiplier: float
    description: str


@dataclass(frozen=True, slots=True)
class PlantedContentGap:
    """A story type that performs well but that our own accounts rarely use."""

    story_type: StoryType
    own_share: float
    competitor_share: float


EVENING_START_HOUR = 16
EVENING_END_HOUR = 20

REELS_OUTPERFORM = PlantedPattern(
    key="reels_outperform",
    dimension=PatternDimension.MEDIA_TYPE,
    segment=MediaType.REEL,
    multiplier=1.8,
    description="Reels earn about 1.8x the engagement of other formats.",
)
HUMAN_INTEREST_OUTPERFORMS = PlantedPattern(
    key="human_interest_outperforms",
    dimension=PatternDimension.STORY_TYPE,
    segment=StoryType.HUMAN_INTEREST,
    multiplier=1.7,
    description="Human-interest stories earn about 1.7x the engagement.",
)
EXPLAINERS_OUTPERFORM = PlantedPattern(
    key="explainers_outperform",
    dimension=PatternDimension.STORY_TYPE,
    segment=StoryType.EXPLAINER,
    multiplier=1.45,
    description="Explainers earn about 1.45x the engagement.",
)
EVENING_POSTS_OUTPERFORM = PlantedPattern(
    key="evening_posts_outperform",
    dimension=PatternDimension.TIME_BLOCK,
    segment=f"{EVENING_START_HOUR:02d}-{EVENING_END_HOUR:02d}",
    multiplier=1.4,
    description="Posts published 16:00-20:00 UTC (Gulf evening) earn about 1.4x.",
)
ARABIC_OUTPERFORMS = PlantedPattern(
    key="arabic_outperforms",
    dimension=PatternDimension.LANGUAGE,
    segment=Language.AR,
    multiplier=1.35,
    description="Arabic captions earn about 1.35x the engagement of English ones.",
)

PLANTED_PATTERNS: tuple[PlantedPattern, ...] = (
    REELS_OUTPERFORM,
    HUMAN_INTEREST_OUTPERFORMS,
    EXPLAINERS_OUTPERFORM,
    EVENING_POSTS_OUTPERFORM,
    ARABIC_OUTPERFORMS,
)

# Competitors post explainers often; Al Jazeera almost never does, although they work.
EXPLAINER_CONTENT_GAP = PlantedContentGap(
    story_type=StoryType.EXPLAINER, own_share=0.03, competitor_share=0.22
)
