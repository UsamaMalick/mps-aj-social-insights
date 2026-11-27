from collections.abc import Sequence
from itertools import batched
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.posts.repository import MetricSnapshotRepository, PostRepository
from app.modules.posts.schemas import MetricSnapshotCreate, PostCreate

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
