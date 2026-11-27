"""Pure pattern detection over scored posts (no DB, no I/O)."""

from collections import defaultdict
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from math import exp, log
from statistics import median
from uuid import UUID

from app.modules.analytics import metrics
from app.modules.posts.schemas import PostMetricsRow
from app.modules.tagging.schemas import TagLabels
from app.shared.enums import AnalyticsScope, PatternDimension

TIME_BLOCK_HOURS = 4
# Per account, a segment and its complement each need this many posts to be compared.
MIN_POSTS_PER_SIDE = 5
# Below this sample size a pattern is shown but flagged as unreliable.
MIN_RELIABLE_SAMPLE = 30
# Content gap: competitors use a segment at least this much more often (share points)...
MIN_SHARE_GAP = 0.10
# ...and it outperforms the rest by at least this lift.
MIN_GAP_LIFT = 1.2

TAG_DIMENSIONS = frozenset(
    {PatternDimension.STORY_TYPE, PatternDimension.HOOK_STYLE, PatternDimension.TOPIC}
)


@dataclass(frozen=True, slots=True)
class ScoredPost:
    row: PostMetricsRow
    is_own: bool
    engagement_score: float
    lift: float
    labels: TagLabels | None


@dataclass(frozen=True, slots=True)
class SegmentStat:
    dimension: PatternDimension
    segment: str
    post_count: int
    share: float
    median_engagement_score: float
    median_lift: float
    lift_vs_rest: float | None
    rest_post_count: int
    accounts_compared: int
    is_reliable: bool


@dataclass(frozen=True, slots=True)
class GapStat:
    dimension: PatternDimension
    segment: str
    own_share: float
    competitor_share: float
    own_post_count: int
    competitor_post_count: int
    lift_vs_rest: float | None


def time_block_label(hour: int) -> str:
    start = hour - hour % TIME_BLOCK_HOURS
    return f"{start:02d}-{start + TIME_BLOCK_HOURS:02d}"


def segment_of(post: ScoredPost, dimension: PatternDimension) -> str | None:
    """The post's value for a dimension; None when it is unknown (e.g. not tagged yet)."""
    match dimension:
        case PatternDimension.MEDIA_TYPE:
            return post.row.media_type.value
        case PatternDimension.LANGUAGE:
            return post.row.language.value
        case PatternDimension.TIME_BLOCK:
            return time_block_label(post.row.posted_at.hour)
    if post.labels is None:
        return None
    match dimension:
        case PatternDimension.STORY_TYPE:
            return post.labels.story_type.value
        case PatternDimension.HOOK_STYLE:
            return post.labels.hook_style.value
        case _:
            return post.labels.topic.value


def score_posts(
    rows: Sequence[PostMetricsRow],
    *,
    followers: dict[UUID, int],
    own_accounts: set[UUID],
    labels: dict[UUID, TagLabels],
) -> list[ScoredPost]:
    """Attach engagement score and lift (relative to each account's median) to every post."""
    scores = {
        row.post_id: metrics.engagement_score(
            likes=row.likes,
            comments=row.comments,
            shares=row.shares,
            followers_at_post=followers[row.account_id],
        )
        for row in rows
    }
    by_account: dict[UUID, list[float]] = defaultdict(list)
    for row in rows:
        by_account[row.account_id].append(scores[row.post_id])
    medians = {account: metrics.median_score(values) for account, values in by_account.items()}

    return [
        ScoredPost(
            row=row,
            is_own=row.account_id in own_accounts,
            engagement_score=scores[row.post_id],
            lift=metrics.lift(scores[row.post_id], medians[row.account_id]),
            labels=labels.get(row.post_id),
        )
        for row in rows
    ]


def in_scope(posts: Iterable[ScoredPost], scope: AnalyticsScope) -> list[ScoredPost]:
    match scope:
        case AnalyticsScope.ALL:
            return list(posts)
        case AnalyticsScope.OWN:
            return [p for p in posts if p.is_own]
        case AnalyticsScope.COMPETITORS:
            return [p for p in posts if not p.is_own]


def _within_account_lift(
    posts: Sequence[ScoredPost], dimension: PatternDimension, segment: str
) -> tuple[float | None, int]:
    """Segment-vs-rest lift computed inside each account, then combined.

    Comparing within an account removes differences between accounts (e.g. an all-Arabic
    account against an all-English one). Per-account ratios of medians are combined as a
    geometric mean weighted by the segment's post count. Returns (lift, accounts compared).
    """
    by_account: dict[UUID, tuple[list[float], list[float]]] = defaultdict(lambda: ([], []))
    for post in posts:
        value = segment_of(post, dimension)
        if value is None:
            continue
        inside, outside = by_account[post.row.account_id]
        (inside if value == segment else outside).append(post.engagement_score)

    weighted_log_sum = 0.0
    total_weight = 0
    accounts = 0
    for inside, outside in by_account.values():
        if len(inside) < MIN_POSTS_PER_SIDE or len(outside) < MIN_POSTS_PER_SIDE:
            continue
        rest_median = median(outside)
        if rest_median <= 0:
            continue
        weighted_log_sum += len(inside) * log(median(inside) / rest_median)
        total_weight += len(inside)
        accounts += 1
    if total_weight == 0:
        return None, 0
    return exp(weighted_log_sum / total_weight), accounts


def segment_stats(posts: Sequence[ScoredPost], dimension: PatternDimension) -> list[SegmentStat]:
    """One row per segment of a dimension, strongest lift first."""
    groups: dict[str, list[ScoredPost]] = defaultdict(list)
    for post in posts:
        value = segment_of(post, dimension)
        if value is not None:
            groups[value].append(post)
    known = sum(len(group) for group in groups.values())

    stats = []
    for segment, group in groups.items():
        lift_vs_rest, accounts = _within_account_lift(posts, dimension, segment)
        stats.append(
            SegmentStat(
                dimension=dimension,
                segment=segment,
                post_count=len(group),
                share=len(group) / known,
                median_engagement_score=float(median(p.engagement_score for p in group)),
                median_lift=float(median(p.lift for p in group)),
                lift_vs_rest=lift_vs_rest,
                rest_post_count=known - len(group),
                accounts_compared=accounts,
                is_reliable=len(group) >= MIN_RELIABLE_SAMPLE and lift_vs_rest is not None,
            )
        )
    return sorted(stats, key=lambda s: (s.lift_vs_rest or 0.0, s.post_count), reverse=True)


def content_gaps(posts: Sequence[ScoredPost], dimension: PatternDimension) -> list[GapStat]:
    """Segments competitors use much more than we do and that outperform the rest."""
    own = [p for p in posts if p.is_own and segment_of(p, dimension) is not None]
    rivals = [p for p in posts if not p.is_own and segment_of(p, dimension) is not None]
    if not own or not rivals:
        return []

    gaps = []
    for stat in segment_stats(posts, dimension):
        own_count = sum(segment_of(p, dimension) == stat.segment for p in own)
        rival_count = sum(segment_of(p, dimension) == stat.segment for p in rivals)
        own_share, rival_share = own_count / len(own), rival_count / len(rivals)
        if rival_share - own_share < MIN_SHARE_GAP:
            continue
        if stat.lift_vs_rest is None or stat.lift_vs_rest < MIN_GAP_LIFT:
            continue
        gaps.append(
            GapStat(
                dimension=dimension,
                segment=stat.segment,
                own_share=own_share,
                competitor_share=rival_share,
                own_post_count=own_count,
                competitor_post_count=rival_count,
                lift_vs_rest=stat.lift_vs_rest,
            )
        )
    return gaps
