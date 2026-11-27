from collections.abc import Sequence
from datetime import UTC, datetime

import pytest
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationError
from app.modules.accounts.schemas import AccountCreate
from app.modules.ingestion.service import IngestionService
from app.modules.ingestion.sources.base import SourcePost, SourceSnapshot
from app.modules.ingestion.sources.seed import SeedDataSource
from app.modules.posts.models import MetricSnapshot, Post
from app.seed.generator import seed_dataset
from app.shared.enums import Language, MediaType, Platform, SnapshotAge

FINGERPRINT_SQL = text(
    """
    SELECT md5(string_agg(
        p.external_id || ':' || s.hours_since_post || ':' || s.likes || ':' || s.comments
        || ':' || s.shares || ':' || s.views || ':' || coalesce(s.reach::text, '-'),
        ',' ORDER BY p.external_id, s.hours_since_post))
    FROM posts p JOIN metric_snapshots s ON s.post_id = p.id
    """
)


async def test_seeding_twice_gives_identical_data(db_session: AsyncSession) -> None:
    first = await IngestionService(db_session, SeedDataSource()).run()
    fingerprint = await db_session.scalar(FINGERPRINT_SQL)
    second = await IngestionService(db_session, SeedDataSource()).run()

    assert first == second
    assert await db_session.scalar(FINGERPRINT_SQL) == fingerprint
    assert await db_session.scalar(select(func.count()).select_from(Post)) == len(
        seed_dataset().posts
    )
    assert await db_session.scalar(select(func.count()).select_from(MetricSnapshot)) == 2 * len(
        seed_dataset().posts
    )


class _LeakySource:
    """A broken source that reports own-only metrics for a competitor."""

    async def fetch_accounts(self) -> Sequence[AccountCreate]:
        return [
            AccountCreate(
                platform=Platform.INSTAGRAM,
                handle="rival",
                display_name="Rival",
                is_own=False,
                followers_count=1_000,
            )
        ]

    async def fetch_posts(self, since: datetime | None = None) -> Sequence[SourcePost]:
        snapshot = SourceSnapshot(
            hours_since_post=SnapshotAge.H72, likes=1, comments=1, shares=1, views=1, reach=10
        )
        return [
            SourcePost(
                platform=Platform.INSTAGRAM,
                account_handle="rival",
                external_id="leak_1",
                media_type=MediaType.IMAGE,
                caption="x",
                language=Language.EN,
                posted_at=datetime(2026, 1, 1, tzinfo=UTC),
                url="https://example.com",
                snapshots=[snapshot],
            )
        ]


async def test_ingestion_rejects_own_only_metrics_for_competitors(
    db_session: AsyncSession,
) -> None:
    with pytest.raises(ValidationError):
        await IngestionService(db_session, _LeakySource()).run()
