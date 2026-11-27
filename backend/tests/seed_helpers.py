"""Shared setup for tests that need the full seeded dataset."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ingestion.service import IngestionService
from app.modules.ingestion.sources.seed import SeedDataSource
from app.modules.posts.models import Post
from app.modules.tagging.schemas import PostTagCreate
from app.modules.tagging.service import TaggingService
from app.seed.generator import seed_labels_by_external_id
from app.shared.enums import TagSource


async def seed_and_tag_with_ground_truth(session: AsyncSession) -> None:
    await IngestionService(session, SeedDataSource()).run()
    truth = seed_labels_by_external_id()
    rows = await session.execute(select(Post.id, Post.platform, Post.external_id))
    tags = [
        PostTagCreate(
            post_id=post_id,
            source=TagSource.RULES,
            prompt_version="ground-truth",
            model="seed",
            **truth[(platform, external_id)].model_dump(),
        )
        for post_id, platform, external_id in rows.all()
    ]
    await TaggingService(session).save_tags(tags)
