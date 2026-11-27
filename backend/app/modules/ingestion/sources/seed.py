from collections.abc import Sequence
from datetime import datetime

from app.modules.accounts.schemas import AccountCreate
from app.modules.ingestion.sources.base import SourcePost
from app.seed.generator import seed_dataset


class SeedDataSource:
    """Serves the deterministic sample dataset (POC)."""

    async def fetch_accounts(self) -> Sequence[AccountCreate]:
        return seed_dataset().accounts

    async def fetch_posts(self, since: datetime | None = None) -> Sequence[SourcePost]:
        posts = (seed.post for seed in seed_dataset().posts)
        return [post for post in posts if since is None or post.posted_at >= since]
