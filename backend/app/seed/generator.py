"""Deterministic sample data: 1 own brand + 5 competitors, Instagram + Facebook, 90 days.

Engagement is log-normal, scaled by followers, and multiplied by the planted patterns in
`answer_key.py`. A fixed seed and a fixed end date mean every run produces identical data.
"""

import random
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from functools import cache

from app.modules.accounts.schemas import AccountCreate
from app.modules.ingestion.sources.base import SourcePost, SourceSnapshot
from app.modules.tagging.schemas import TagLabels
from app.seed.answer_key import (
    EVENING_END_HOUR,
    EVENING_START_HOUR,
    EXPLAINER_CONTENT_GAP,
    PLANTED_PATTERNS,
    PlantedPattern,
)
from app.seed.captions import build_caption
from app.shared.enums import (
    HookStyle,
    Language,
    MediaType,
    PatternDimension,
    Platform,
    Region,
    SnapshotAge,
    StoryType,
    Tone,
    Topic,
)

SEED = 20_260_301
PERIOD_END = datetime(2026, 11, 15, tzinfo=UTC)
PERIOD_DAYS = 90

ENGAGEMENT_SIGMA = 0.55
FIRST_POST_HOUR = 5  # UTC; newsrooms rarely post between midnight and 05:00 UTC
LAST_POST_HOUR = 23

LIKE_SHARE, COMMENT_SHARE = 0.82, 0.07  # shares get the remainder
VIDEO_VIEWS_PER_INTERACTION = (20.0, 35.0)
STATIC_VIEWS_PER_INTERACTION = (8.0, 14.0)
SHARE_OF_72H_AT_24H = (0.68, 0.85)
REACH_PER_VIEW = (0.55, 0.75)
SAVES_PER_LIKE = (0.03, 0.08)
CLICKS_PER_REACH = (0.005, 0.02)

VIDEO_FORMATS = frozenset({MediaType.VIDEO, MediaType.REEL})

MEDIA_MIX: dict[Platform, dict[MediaType, float]] = {
    Platform.INSTAGRAM: {
        MediaType.IMAGE: 0.3,
        MediaType.CAROUSEL: 0.25,
        MediaType.REEL: 0.3,
        MediaType.VIDEO: 0.15,
    },
    Platform.FACEBOOK: {
        MediaType.IMAGE: 0.4,
        MediaType.VIDEO: 0.3,
        MediaType.REEL: 0.15,
        MediaType.CAROUSEL: 0.15,
    },
}


def _story_mix(explainer_share: float) -> dict[StoryType, float]:
    others = {
        StoryType.BREAKING: 0.3,
        StoryType.HUMAN_INTEREST: 0.2,
        StoryType.ANALYSIS: 0.25,
        StoryType.LIVE_UPDATE: 0.25,
    }
    scale = (1 - explainer_share) / sum(others.values())
    return {StoryType.EXPLAINER: explainer_share} | {k: v * scale for k, v in others.items()}


OWN_STORY_MIX = _story_mix(EXPLAINER_CONTENT_GAP.own_share)
COMPETITOR_STORY_MIX = _story_mix(EXPLAINER_CONTENT_GAP.competitor_share)

REGION_MIX: dict[Region, float] = {
    Region.MIDDLE_EAST: 0.4,
    Region.AFRICA: 0.15,
    Region.EUROPE: 0.12,
    Region.ASIA: 0.13,
    Region.AMERICAS: 0.1,
    Region.GLOBAL: 0.1,
}

TONE_BY_STORY: dict[StoryType, Tone] = {
    StoryType.BREAKING: Tone.URGENT,
    StoryType.LIVE_UPDATE: Tone.URGENT,
    StoryType.HUMAN_INTEREST: Tone.EMOTIONAL,
    StoryType.EXPLAINER: Tone.INFORMATIVE,
    StoryType.ANALYSIS: Tone.NEUTRAL,
}


@dataclass(frozen=True, slots=True)
class BrandProfile:
    handle: str
    display_name: str
    is_own: bool
    followers: dict[Platform, int]
    posts_per_day: tuple[int, int]
    arabic_share: float
    base_engagement_rate: float  # interactions per follower for a typical post at 72h


BRANDS: tuple[BrandProfile, ...] = (
    BrandProfile(
        handle="aljazeera",
        display_name="Al Jazeera",
        is_own=True,
        followers={Platform.INSTAGRAM: 6_400_000, Platform.FACEBOOK: 18_500_000},
        posts_per_day=(4, 6),
        arabic_share=0.6,
        base_engagement_rate=0.0030,
    ),
    BrandProfile(
        handle="gulfnewsnetwork",
        display_name="Gulf News Network",
        is_own=False,
        followers={Platform.INSTAGRAM: 3_100_000, Platform.FACEBOOK: 9_800_000},
        posts_per_day=(3, 5),
        arabic_share=0.8,
        base_engagement_rate=0.0032,
    ),
    BrandProfile(
        handle="levanttoday",
        display_name="Levant Today",
        is_own=False,
        followers={Platform.INSTAGRAM: 1_200_000, Platform.FACEBOOK: 4_300_000},
        posts_per_day=(2, 4),
        arabic_share=1.0,
        base_engagement_rate=0.0045,
    ),
    BrandProfile(
        handle="globalwire",
        display_name="Global Wire",
        is_own=False,
        followers={Platform.INSTAGRAM: 8_900_000, Platform.FACEBOOK: 21_000_000},
        posts_per_day=(4, 6),
        arabic_share=0.0,
        base_engagement_rate=0.0021,
    ),
    BrandProfile(
        handle="horizonworld",
        display_name="Horizon World News",
        is_own=False,
        followers={Platform.INSTAGRAM: 2_400_000, Platform.FACEBOOK: 6_200_000},
        posts_per_day=(2, 4),
        arabic_share=0.3,
        base_engagement_rate=0.0038,
    ),
    BrandProfile(
        handle="desertpost",
        display_name="Desert Post",
        is_own=False,
        followers={Platform.INSTAGRAM: 900_000, Platform.FACEBOOK: 2_700_000},
        posts_per_day=(2, 3),
        arabic_share=0.7,
        base_engagement_rate=0.0050,
    ),
)


@dataclass(frozen=True, slots=True)
class SeedPost:
    post: SourcePost
    labels: TagLabels  # ground truth, used by the rule-based tagging fallback


@dataclass(frozen=True, slots=True)
class SeedDataset:
    accounts: tuple[AccountCreate, ...]
    posts: tuple[SeedPost, ...]


def _pick[T](rng: random.Random, weights: dict[T, float]) -> T:
    return rng.choices(list(weights), weights=list(weights.values()))[0]


def _segment_of(pattern: PlantedPattern, post: SourcePost, labels: TagLabels) -> str:
    match pattern.dimension:
        case PatternDimension.MEDIA_TYPE:
            return post.media_type
        case PatternDimension.STORY_TYPE:
            return labels.story_type
        case PatternDimension.LANGUAGE:
            return post.language
        case PatternDimension.TIME_BLOCK:
            in_window = EVENING_START_HOUR <= post.posted_at.hour < EVENING_END_HOUR
            return pattern.segment if in_window else ""
        case PatternDimension.HOOK_STYLE:
            return labels.hook_style
        case PatternDimension.TOPIC:
            return labels.topic


def planted_multiplier(post: SourcePost, labels: TagLabels) -> float:
    multiplier = 1.0
    for pattern in PLANTED_PATTERNS:
        if _segment_of(pattern, post, labels) == pattern.segment:
            multiplier *= pattern.multiplier
    return multiplier


def _snapshots(
    rng: random.Random, *, interactions: float, media_type: MediaType, is_own: bool
) -> list[SourceSnapshot]:
    like_share = LIKE_SHARE * rng.uniform(0.95, 1.05)
    comment_share = COMMENT_SHARE * rng.uniform(0.8, 1.2)
    likes = round(interactions * like_share)
    comments = round(interactions * comment_share)
    shares = max(round(interactions) - likes - comments, 0)
    views_range = (
        VIDEO_VIEWS_PER_INTERACTION if media_type in VIDEO_FORMATS else STATIC_VIEWS_PER_INTERACTION
    )
    views = round(interactions * rng.uniform(*views_range))

    final = SourceSnapshot(
        hours_since_post=SnapshotAge.H72, likes=likes, comments=comments, shares=shares, views=views
    )
    if is_own:
        reach = round(views * rng.uniform(*REACH_PER_VIEW))
        final.reach = reach
        final.saves = round(likes * rng.uniform(*SAVES_PER_LIKE))
        final.clicks = round(reach * rng.uniform(*CLICKS_PER_REACH))

    early_share = rng.uniform(*SHARE_OF_72H_AT_24H)
    early = SourceSnapshot.model_validate(
        {
            name: (round(value * early_share) if isinstance(value, int) else value)
            for name, value in final.model_dump(exclude={"hours_since_post"}).items()
        }
        | {"hours_since_post": SnapshotAge.H24}
    )
    return [early, final]


def _generate_post(
    rng: random.Random, brand: BrandProfile, platform: Platform, day: datetime, index: int
) -> SeedPost:
    language = Language.AR if rng.random() < brand.arabic_share else Language.EN
    labels = TagLabels(
        topic=rng.choice(list(Topic)),
        region=_pick(rng, REGION_MIX),
        story_type=_pick(rng, OWN_STORY_MIX if brand.is_own else COMPETITOR_STORY_MIX),
        hook_style=rng.choice(list(HookStyle)),
        tone=Tone.NEUTRAL,
    )
    labels.tone = TONE_BY_STORY[labels.story_type]
    posted_at = day.replace(
        hour=rng.randint(FIRST_POST_HOUR, LAST_POST_HOUR), minute=rng.randint(0, 59)
    )
    external_id = f"{platform.value[:2]}_{brand.handle}_{index:05d}"
    post = SourcePost(
        platform=platform,
        account_handle=brand.handle,
        external_id=external_id,
        media_type=_pick(rng, MEDIA_MIX[platform]),
        caption=build_caption(
            rng,
            language=language,
            hook_style=labels.hook_style,
            story_type=labels.story_type,
            topic=labels.topic,
            region=labels.region,
        ),
        language=language,
        posted_at=posted_at,
        url=f"https://www.{platform.value}.com/{brand.handle}/posts/{external_id}",
    )
    interactions = (
        brand.followers[platform]
        * brand.base_engagement_rate
        * planted_multiplier(post, labels)
        * rng.lognormvariate(0, ENGAGEMENT_SIGMA)
    )
    post.snapshots = _snapshots(
        rng, interactions=interactions, media_type=post.media_type, is_own=brand.is_own
    )
    return SeedPost(post=post, labels=labels)


def generate() -> SeedDataset:
    """Build the full sample dataset. Pure and deterministic."""
    rng = random.Random(SEED)
    accounts: list[AccountCreate] = []
    posts: list[SeedPost] = []
    first_day = (PERIOD_END - timedelta(days=PERIOD_DAYS)).replace(hour=0, minute=0)

    for brand in BRANDS:
        for platform in Platform:
            accounts.append(
                AccountCreate(
                    platform=platform,
                    handle=brand.handle,
                    display_name=brand.display_name,
                    is_own=brand.is_own,
                    followers_count=brand.followers[platform],
                )
            )
            index = 0
            for day_offset in range(PERIOD_DAYS):
                day = first_day + timedelta(days=day_offset)
                for _ in range(rng.randint(*brand.posts_per_day)):
                    index += 1
                    posts.append(_generate_post(rng, brand, platform, day, index))

    return SeedDataset(accounts=tuple(accounts), posts=tuple(posts))


@cache
def seed_dataset() -> SeedDataset:
    return generate()


@cache
def seed_labels_by_external_id() -> dict[tuple[Platform, str], TagLabels]:
    return {(p.post.platform, p.post.external_id): p.labels for p in seed_dataset().posts}
