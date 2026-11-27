from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import Select, case, func, select
from sqlalchemy.dialects.postgresql import distinct_on, insert
from sqlalchemy.orm import aliased

from app.modules.analytics.metrics import engagement_score_sql
from app.modules.posts.models import MetricSnapshot, Post
from app.modules.posts.schemas import MetricSnapshotCreate, PostCreate, PostQuery
from app.shared.enums import PostSort, SnapshotAge
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

    async def list_with_metrics(self, age: SnapshotAge) -> Sequence[tuple[Post, MetricSnapshot]]:
        """Every post joined with its snapshot at `age` (posts without one are skipped)."""
        rows = await self.session.execute(
            select(Post, MetricSnapshot)
            .join(MetricSnapshot, MetricSnapshot.post_id == Post.id)
            .where(MetricSnapshot.hours_since_post == age)
            .order_by(Post.posted_at, Post.id)
        )
        return [(post, snapshot) for post, snapshot in rows.all()]

    async def search_page(
        self,
        query: PostQuery,
        *,
        sort: PostSort,
        followers_by_account: dict[UUID, int],
        offset: int,
        limit: int,
    ) -> tuple[list[tuple[Post, MetricSnapshot | None]], int]:
        """One page of matching posts with their latest snapshot, plus the total match count.

        Filtering, sorting and pagination all run in the database. Follower counts come from
        the accounts module (passed in) so this module never queries another module's tables.
        """
        filtered = self._filtered(query)
        total = await self.session.scalar(select(func.count()).select_from(filtered.subquery()))

        latest_rows = (
            select(MetricSnapshot)
            .ext(distinct_on(MetricSnapshot.post_id))
            .order_by(MetricSnapshot.post_id, MetricSnapshot.hours_since_post.desc())
            .subquery()
        )
        latest = aliased(MetricSnapshot, latest_rows)
        stmt = filtered.add_columns(latest).outerjoin(latest, latest.post_id == Post.id)

        match sort:
            case PostSort.NEWEST:
                stmt = stmt.order_by(Post.posted_at.desc(), Post.id)
            case PostSort.OLDEST:
                stmt = stmt.order_by(Post.posted_at.asc(), Post.id)
            case PostSort.MOST_ENGAGED:
                followers = case(followers_by_account, value=Post.account_id, else_=None)
                score = engagement_score_sql(
                    likes=latest.likes,
                    comments=latest.comments,
                    shares=latest.shares,
                    followers_at_post=followers,
                )
                stmt = stmt.order_by(score.desc().nulls_last(), Post.posted_at.desc(), Post.id)

        rows = await self.session.execute(stmt.offset(offset).limit(limit))
        return [(post, snapshot) for post, snapshot in rows.all()], total or 0

    @staticmethod
    def _filtered(query: PostQuery) -> Select[Post]:
        stmt = select(Post)
        if query.account_ids is not None:
            stmt = stmt.where(Post.account_id.in_(query.account_ids))
        if query.post_ids is not None:
            stmt = stmt.where(Post.id.in_(query.post_ids))
        if query.platform is not None:
            stmt = stmt.where(Post.platform == query.platform)
        if query.media_type is not None:
            stmt = stmt.where(Post.media_type == query.media_type)
        if query.language is not None:
            stmt = stmt.where(Post.language == query.language)
        if query.q:
            escaped = query.q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            stmt = stmt.where(Post.caption.ilike(f"%{escaped}%", escape="\\"))
        return stmt


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

    async def list_for_posts(self, post_ids: Sequence[UUID]) -> Sequence[MetricSnapshot]:
        rows = await self.session.scalars(
            select(MetricSnapshot)
            .where(MetricSnapshot.post_id.in_(post_ids))
            .order_by(MetricSnapshot.post_id, MetricSnapshot.hours_since_post)
        )
        return rows.all()

    async def list_for_post(self, post_id: UUID) -> Sequence[MetricSnapshot]:
        rows = await self.session.scalars(
            select(MetricSnapshot)
            .where(MetricSnapshot.post_id == post_id)
            .order_by(MetricSnapshot.hours_since_post)
        )
        return rows.all()
