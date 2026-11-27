from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert

from app.modules.posts.models import MetricSnapshot, Post
from app.modules.posts.schemas import MetricSnapshotCreate, PostCreate
from app.shared.enums import SnapshotAge
from app.shared.repository import BaseRepository


class PostRepository(BaseRepository[Post]):
    model = Post

    async def upsert_many(self, posts: Sequence[PostCreate]) -> dict[str, UUID]:
        """Insert or update by (platform, external_id). Returns external_id → post id."""
        if not posts:
            return {}
        insert_stmt = insert(Post).values([post.model_dump() for post in posts])
        stmt = insert_stmt.on_conflict_do_update(
            index_elements=[Post.platform, Post.external_id],
            set_={
                "media_type": insert_stmt.excluded.media_type,
                "caption": insert_stmt.excluded.caption,
                "language": insert_stmt.excluded.language,
                "posted_at": insert_stmt.excluded.posted_at,
                "url": insert_stmt.excluded.url,
                "updated_at": func.now(),
            },
        ).returning(Post.external_id, Post.id)
        rows = await self.session.execute(stmt)
        return dict(rows.all())

    async def list_ids(self) -> Sequence[UUID]:
        """Every post id, oldest post first."""
        rows = await self.session.scalars(select(Post.id).order_by(Post.posted_at, Post.id))
        return rows.all()

    async def get_many(self, ids: Sequence[UUID]) -> Sequence[Post]:
        rows = await self.session.scalars(select(Post).where(Post.id.in_(ids)))
        return rows.all()


class MetricSnapshotRepository(BaseRepository[MetricSnapshot]):
    model = MetricSnapshot

    async def upsert_many(self, snapshots: Sequence[MetricSnapshotCreate]) -> int:
        """Insert or update by (post_id, hours_since_post). Returns the row count."""
        if not snapshots:
            return 0
        stmt = insert(MetricSnapshot).values([snap.model_dump() for snap in snapshots])
        metric_columns = ("likes", "comments", "shares", "views", "saves", "reach", "clicks")
        stmt = stmt.on_conflict_do_update(
            index_elements=[MetricSnapshot.post_id, MetricSnapshot.hours_since_post],
            set_={col: stmt.excluded[col] for col in metric_columns} | {"updated_at": func.now()},
        )
        await self.session.execute(stmt)
        return len(snapshots)

    async def list_for_post(self, post_id: UUID) -> Sequence[MetricSnapshot]:
        rows = await self.session.scalars(
            select(MetricSnapshot)
            .where(MetricSnapshot.post_id == post_id)
            .order_by(MetricSnapshot.hours_since_post)
        )
        return rows.all()

    async def get_at_age(self, post_id: UUID, age: SnapshotAge) -> MetricSnapshot | None:
        return await self.session.scalar(
            select(MetricSnapshot).where(
                MetricSnapshot.post_id == post_id, MetricSnapshot.hours_since_post == age
            )
        )
