from collections.abc import Sequence
from itertools import batched
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.posts.repository import MetricSnapshotRepository, PostRepository
from app.modules.posts.schemas import (
    MetricSnapshotCreate,
    MetricSnapshotRead,
    PostCreate,
    PostMetricsRow,
    PostQuery,
    PostRead,
)
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

    async def get_post(self, post_id: UUID) -> PostRead:
        return PostRead.model_validate(await self.posts.get_or_raise(post_id))

    async def search(self, query: PostQuery) -> list[PostRead]:
        """Posts matching the query, newest first."""
        return [PostRead.model_validate(post) for post in await self.posts.search(query)]

    async def snapshots_by_post(
        self, post_ids: Sequence[UUID]
    ) -> dict[UUID, list[MetricSnapshotRead]]:
        """Every snapshot of the given posts, youngest age first."""
        grouped: dict[UUID, list[MetricSnapshotRead]] = {pid: [] for pid in post_ids}
        for batch in batched(post_ids, UPSERT_BATCH_SIZE * 10, strict=False):
            for snapshot in await self.snapshots.list_for_posts(batch):
                grouped[snapshot.post_id].append(MetricSnapshotRead.model_validate(snapshot))
        return grouped

    async def list_ids(self) -> list[UUID]:
        """Every post id, oldest post first."""
        return list(await self.posts.list_ids())

    async def get_posts(self, ids: Sequence[UUID]) -> list[PostRead]:
        """The given posts, in the order of `ids` (unknown ids are dropped)."""
        by_id = {post.id: post for post in await self.posts.get_many(ids)}
        return [PostRead.model_validate(by_id[pid]) for pid in ids if pid in by_id]

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
