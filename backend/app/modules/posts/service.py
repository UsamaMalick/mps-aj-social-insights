from collections.abc import Sequence
from itertools import batched
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.posts.repository import MetricSnapshotRepository, PostRepository
from app.modules.posts.schemas import MetricSnapshotCreate, PostCreate, PostMetricsRow
from app.shared.enums import SnapshotAge

# Keeps each multi-row INSERT well under PostgreSQL's 32,767 bind-parameter limit.
UPSERT_BATCH_SIZE = 1_000


class PostService:
    def __init__(self, session: AsyncSession) -> None:
        self.posts = PostRepository(session)
        self.snapshots = MetricSnapshotRepository(session)

    async def upsert_posts(self, posts: Sequence[PostCreate]) -> dict[str, UUID]:
        """Insert or update posts. Does not commit; returns external_id → post id."""
        ids: dict[str, UUID] = {}
        for batch in batched(posts, UPSERT_BATCH_SIZE, strict=False):
            ids |= await self.posts.upsert_many(batch)
        return ids

    async def upsert_snapshots(self, snapshots: Sequence[MetricSnapshotCreate]) -> int:
        """Insert or update metric snapshots. Does not commit."""
        count = 0
        for batch in batched(snapshots, UPSERT_BATCH_SIZE, strict=False):
            count += await self.snapshots.upsert_many(batch)
        return count

    async def list_metrics(self, age: SnapshotAge) -> list[PostMetricsRow]:
        """Every post with its metrics at the given snapshot age."""
        return [
            PostMetricsRow(
                post_id=post.id,
                account_id=post.account_id,
                platform=post.platform,
                media_type=post.media_type,
                language=post.language,
                caption=post.caption,
                posted_at=post.posted_at,
                url=post.url,
                likes=snapshot.likes,
                comments=snapshot.comments,
                shares=snapshot.shares,
                views=snapshot.views,
                saves=snapshot.saves,
                reach=snapshot.reach,
                clicks=snapshot.clicks,
            )
            for post, snapshot in await self.posts.list_with_metrics(age)
        ]
