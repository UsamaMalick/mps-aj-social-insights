"""Shared setup for tests that need the full seeded dataset."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ingestion.service import IngestionService
from app.modules.ingestion.sources.seed import SeedDataSource
from app.modules.tagging.service import TaggingService


async def seed_and_tag_with_rules(session: AsyncSession) -> None:
    """Load the seed dataset and tag it with the rule-based fallback (ground-truth labels)."""
    await IngestionService(session, SeedDataSource()).run()
    await TaggingService(session).tag_untagged(llm=None)
