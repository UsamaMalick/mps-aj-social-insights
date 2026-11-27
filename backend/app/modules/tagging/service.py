from collections.abc import Sequence
from itertools import batched
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.tagging.repository import PostTagRepository
from app.modules.tagging.schemas import PostTagCreate, TagLabels

UPSERT_BATCH_SIZE = 1_000


class TaggingService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = PostTagRepository(session)

    async def save_tags(self, tags: Sequence[PostTagCreate]) -> int:
        """Insert or replace tags. Does not commit."""
        count = 0
        for batch in batched(tags, UPSERT_BATCH_SIZE, strict=False):
            count += await self.repository.upsert_many(batch)
        return count

    async def labels_by_post(self) -> dict[UUID, TagLabels]:
        """Every tagged post's labels, keyed by post id."""
        return {
            tag.post_id: TagLabels.model_validate(tag) for tag in await self.repository.list_all()
        }
