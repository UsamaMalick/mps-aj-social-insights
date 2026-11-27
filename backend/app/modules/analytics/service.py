from collections import defaultdict
from statistics import mean, median
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.accounts.schemas import AccountRead
from app.modules.accounts.service import AccountService
from app.modules.analytics import metrics
from app.modules.analytics.patterns import (
    ScoredPost,
    content_gaps,
    in_scope,
    score_posts,
    segment_stats,
)
from app.modules.analytics.schemas import (
    AccountSummary,
    CompetitorComparison,
    CompetitorFilters,
    ContentGap,
    OverviewTotals,
    PatternFilters,
    SegmentPattern,
    TopPost,
    TopPostFilters,
)
from app.modules.posts.service import PostService
from app.modules.tagging.service import TaggingService
from app.shared.enums import AnalyticsScope, PatternDimension, SnapshotAge

SECONDS_PER_DAY = 86_400
GAP_DIMENSIONS = (PatternDimension.STORY_TYPE, PatternDimension.MEDIA_TYPE)
# How stories are told (never which topics): the dimensions editors can act on.
HIGHLIGHT_DIMENSIONS = (
    PatternDimension.MEDIA_TYPE,
    PatternDimension.STORY_TYPE,
    PatternDimension.HOOK_STYLE,
    PatternDimension.TIME_BLOCK,
    PatternDimension.LANGUAGE,
)
NEUTRAL_LIFT = 1.0


class AnalyticsService:
    def __init__(self, session: AsyncSession) -> None:
        self.accounts = AccountService(session)
        self.posts = PostService(session)
        self.tagging = TaggingService(session)

    async def _load(self, age: SnapshotAge) -> tuple[dict[UUID, AccountRead], list[ScoredPost]]:
        accounts = {account.id: account for account in await self.accounts.list_all()}
        rows = await self.posts.list_metrics(age)
        scored = score_posts(
            rows,
            followers={a.id: a.followers_count for a in accounts.values()},
            own_accounts={a.id for a in accounts.values() if a.is_own},
            labels=await self.tagging.labels_by_post(),
        )
        return accounts, scored

    async def account_summaries(self, age: SnapshotAge) -> list[AccountSummary]:
        """Engagement totals per account, highest median engagement first. Own-only metrics
        are filled for own accounts only."""
        accounts, scored = await self._load(age)
        by_account = _group_by_account(scored)
        summaries = [
            _summarize(account, by_account[account.id])
            for account in accounts.values()
            if by_account[account.id]
        ]
        return sorted(summaries, key=_by_engagement)

    async def overview(self, age: SnapshotAge) -> OverviewTotals:
        """Headline numbers for own accounts vs competitors."""
        summaries = await self.account_summaries(age)
        own = [s for s in summaries if s.account.is_own]
        rivals = [s for s in summaries if not s.account.is_own]
        return OverviewTotals(
            own_posts=sum(s.post_count for s in own),
            own_interactions=sum(s.total_interactions for s in own),
            own_reach=sum(s.total_reach or 0 for s in own),
            own_median_engagement_score=_median_or_none([s.median_engagement_score for s in own]),
            competitor_median_engagement_score=_median_or_none(
                [s.median_engagement_score for s in rivals]
            ),
        )

    async def competitor_comparison(self, filters: CompetitorFilters) -> list[CompetitorComparison]:
        """Accounts side by side (optionally one platform), using public metrics only,
        highest median engagement first."""
        accounts, scored = await self._load(filters.age)
        by_account = _group_by_account(scored)
        rows = [
            _compare(account, by_account[account.id])
            for account in accounts.values()
            if by_account[account.id]
            and (filters.platform is None or account.platform == filters.platform)
        ]
        return sorted(rows, key=_by_engagement)

    async def top_posts(self, filters: TopPostFilters) -> list[TopPost]:
        """Highest-lift posts at the given age."""
        accounts, scored = await self._load(filters.age)
        candidates = in_scope(scored, filters.scope)
        if filters.account_id is not None:
            candidates = [p for p in candidates if p.row.account_id == filters.account_id]
        best = sorted(candidates, key=lambda p: p.lift, reverse=True)[: filters.limit]
        return [_to_top_post(post, accounts[post.row.account_id]) for post in best]

    async def patterns(self, filters: PatternFilters) -> list[SegmentPattern]:
        """Engagement by segment of one dimension, strongest lift first."""
        _, scored = await self._load(filters.age)
        stats = segment_stats(in_scope(scored, filters.scope), filters.dimension)
        return [SegmentPattern.model_validate(stat, from_attributes=True) for stat in stats]

    async def all_patterns(
        self, scope: AnalyticsScope, age: SnapshotAge
    ) -> dict[PatternDimension, list[SegmentPattern]]:
        _, scored = await self._load(age)
        posts = in_scope(scored, scope)
        return {
            dimension: [
                SegmentPattern.model_validate(stat, from_attributes=True)
                for stat in segment_stats(posts, dimension)
            ]
            for dimension in PatternDimension
        }

    async def highlights(self, age: SnapshotAge) -> list[SegmentPattern]:
        """The strongest reliable, above-average segment of each storytelling dimension,
        strongest first."""
        _, scored = await self._load(age)
        best = []
        for dimension in HIGHLIGHT_DIMENSIONS:
            top = next(
                (
                    stat
                    for stat in segment_stats(scored, dimension)
                    if stat.is_reliable and (stat.lift_vs_rest or 0.0) > NEUTRAL_LIFT
                ),
                None,
            )
            if top is not None:
                best.append(SegmentPattern.model_validate(top, from_attributes=True))
        return sorted(best, key=lambda p: p.lift_vs_rest or 0.0, reverse=True)

    async def content_gaps(self, age: SnapshotAge) -> list[ContentGap]:
        """Segments competitors use far more than we do and that outperform the rest."""
        _, scored = await self._load(age)
        return [
            ContentGap.model_validate(gap, from_attributes=True)
            for dimension in GAP_DIMENSIONS
            for gap in content_gaps(scored, dimension)
        ]


def _by_engagement(row: AccountSummary | CompetitorComparison) -> tuple[float, str, str]:
    """Highest median engagement first; ties broken by name and platform for stable order."""
    return (-row.median_engagement_score, row.account.display_name, row.account.platform)


def _median_or_none(values: list[float]) -> float | None:
    return float(median(values)) if values else None


def _group_by_account(posts: list[ScoredPost]) -> defaultdict[UUID, list[ScoredPost]]:
    grouped: defaultdict[UUID, list[ScoredPost]] = defaultdict(list)
    for post in posts:
        grouped[post.row.account_id].append(post)
    return grouped


def _own_total(posts: list[ScoredPost], field: str) -> int:
    return sum(getattr(post.row, field) or 0 for post in posts)


def _summarize(account: AccountRead, posts: list[ScoredPost]) -> AccountSummary:
    scores = [post.engagement_score for post in posts]
    summary = AccountSummary(
        account=account,
        post_count=len(posts),
        median_engagement_score=metrics.median_score(scores),
        mean_engagement_score=mean(scores),
        total_interactions=sum(
            metrics.interactions(likes=p.row.likes, comments=p.row.comments, shares=p.row.shares)
            for p in posts
        ),
        median_views=float(median(p.row.views for p in posts)),
    )
    if account.is_own:
        summary.total_reach = _own_total(posts, "reach")
        summary.total_saves = _own_total(posts, "saves")
        summary.total_clicks = _own_total(posts, "clicks")
    return summary


def _compare(account: AccountRead, posts: list[ScoredPost]) -> CompetitorComparison:
    first = min(p.row.posted_at for p in posts)
    last = max(p.row.posted_at for p in posts)
    days = max((last - first).total_seconds() / SECONDS_PER_DAY, 1.0)
    return CompetitorComparison(
        account=account,
        post_count=len(posts),
        median_engagement_score=metrics.median_score([p.engagement_score for p in posts]),
        median_likes=float(median(p.row.likes for p in posts)),
        median_comments=float(median(p.row.comments for p in posts)),
        median_shares=float(median(p.row.shares for p in posts)),
        median_views=float(median(p.row.views for p in posts)),
        posts_per_day=len(posts) / days,
    )


def _to_top_post(post: ScoredPost, account: AccountRead) -> TopPost:
    row = post.row
    return TopPost(
        post_id=row.post_id,
        account_id=row.account_id,
        account_display_name=account.display_name,
        is_own=post.is_own,
        platform=row.platform,
        media_type=row.media_type,
        language=row.language,
        caption=row.caption,
        posted_at=row.posted_at,
        url=row.url,
        likes=row.likes,
        comments=row.comments,
        shares=row.shares,
        views=row.views,
        engagement_score=post.engagement_score,
        lift=post.lift,
        labels=post.labels,
    )
