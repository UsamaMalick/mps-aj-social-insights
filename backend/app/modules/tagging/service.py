import logging
from collections.abc import Sequence
from itertools import batched
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.llm.base import LLMClient
from app.modules.posts.service import PostService
from app.modules.tagging.repository import PostTagRepository
from app.modules.tagging.schemas import PostTagCreate, TaggingResult, TagLabels
from app.modules.tagging.taggers import LLMTagger, SeedRuleTagger, Tagger

logger = logging.getLogger(__name__)

UPSERT_BATCH_SIZE = 1_000
# Posts tagged per commit, so a long LLM run keeps its progress if interrupted.
POSTS_PER_COMMIT = 200


class TaggingService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repository = PostTagRepository(session)
        self.posts = PostService(session)

    async def tag_untagged(self, llm: LLMClient | None, limit: int | None = None) -> TaggingResult:
        """Tag every post without tags, oldest first: via the LLM, or seed rules without one."""
        tagger: Tagger = LLMTagger(llm) if llm is not None else SeedRuleTagger()
        tagged_ids = await self.repository.tagged_post_ids()
        pending = [pid for pid in await self.posts.list_ids() if pid not in tagged_ids]
        if limit is not None:
            pending = pending[:limit]

        tagged = 0
        for chunk in batched(pending, POSTS_PER_COMMIT, strict=False):
            tags = await tagger.tag(await self.posts.get_posts(chunk))
            tagged += await self.save_tags(tags)
            await self.session.commit()
            logger.debug("tagging progress", extra={"tagged": tagged, "pending": len(pending)})

        return TaggingResult(source=tagger.source, tagged=tagged, skipped=len(pending) - tagged)

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
