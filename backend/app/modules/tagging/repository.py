from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert

from app.modules.tagging.models import PostTag
from app.modules.tagging.schemas import PostTagCreate
from app.shared.repository import BaseRepository


class PostTagRepository(BaseRepository[PostTag]):
    model = PostTag

    async def upsert_many(self, tags: Sequence[PostTagCreate]) -> int:
        """Insert or replace the tags of each post. Returns the row count."""
        if not tags:
            return 0
        stmt = insert(PostTag).values([tag.model_dump() for tag in tags])
        label_columns = (
            "topic",
            "region",
            "story_type",
            "hook_style",
            "tone",
            "source",
            "prompt_version",
            "model",
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[PostTag.post_id],
            set_={col: stmt.excluded[col] for col in label_columns} | {"updated_at": func.now()},
        )
        await self.session.execute(stmt)
        return len(tags)

    async def list_all(self) -> Sequence[PostTag]:
        return (await self.session.scalars(select(PostTag))).all()

    async def get_for_post(self, post_id: UUID) -> PostTag | None:
        return await self.session.scalar(select(PostTag).where(PostTag.post_id == post_id))

    async def tagged_post_ids(self) -> set[UUID]:
        rows = await self.session.scalars(select(PostTag.post_id))
        return set(rows.all())
