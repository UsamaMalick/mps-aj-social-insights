import logging
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationError
from app.modules.accounts.schemas import AccountRead
from app.modules.accounts.service import AccountService
from app.modules.ingestion.sources.base import DataSource, SourcePost, SourceSnapshot
from app.modules.posts.schemas import MetricSnapshotCreate, PostCreate
from app.modules.posts.service import PostService
from app.shared.enums import Platform

logger = logging.getLogger(__name__)

OWN_ONLY_METRICS = ("saves", "reach", "clicks")


@dataclass(frozen=True, slots=True)
class IngestionResult:
    accounts: int
    posts: int
    snapshots: int


class IngestionService:
    def __init__(self, session: AsyncSession, source: DataSource) -> None:
        self.session = session
        self.source = source
        self.accounts = AccountService(session)
        self.posts = PostService(session)

    async def run(self, since: datetime | None = None) -> IngestionResult:
        """Pull accounts and posts from the data source and upsert them in one transaction."""
        accounts = await self.accounts.upsert_accounts(await self.source.fetch_accounts())
        source_posts = await self.source.fetch_posts(since)

        post_rows = [self._to_post(post, accounts) for post in source_posts]
        post_ids = await self.posts.upsert_posts(post_rows)
        snapshot_rows = [
            self._to_snapshot(snapshot, post_ids[post.external_id])
            for post in source_posts
            for snapshot in self._checked_snapshots(post, accounts)
        ]
        snapshot_count = await self.posts.upsert_snapshots(snapshot_rows)
        await self.session.commit()

        result = IngestionResult(
            accounts=len(accounts), posts=len(post_ids), snapshots=snapshot_count
        )
        logger.info(
            "ingestion finished",
            extra={"accounts": result.accounts, "posts": result.posts, "snapshots": snapshot_count},
        )
        return result

    @staticmethod
    def _account_for(
        post: SourcePost, accounts: dict[tuple[Platform, str], AccountRead]
    ) -> AccountRead:
        account = accounts.get((post.platform, post.account_handle))
        if account is None:
            raise ValidationError(
                f"Post {post.external_id} references unknown account {post.account_handle}"
            )
        return account

    def _to_post(
        self, post: SourcePost, accounts: dict[tuple[Platform, str], AccountRead]
    ) -> PostCreate:
        return PostCreate(
            account_id=self._account_for(post, accounts).id,
            **post.model_dump(exclude={"account_handle", "snapshots"}),
        )

    def _checked_snapshots(
        self, post: SourcePost, accounts: dict[tuple[Platform, str], AccountRead]
    ) -> list[SourceSnapshot]:
        """Enforce the domain rule: competitors never carry own-only metrics."""
        if not self._account_for(post, accounts).is_own:
            for snapshot in post.snapshots:
                leaked = [name for name in OWN_ONLY_METRICS if getattr(snapshot, name) is not None]
                if leaked:
                    raise ValidationError(
                        f"Competitor post {post.external_id} has own-only metrics: {leaked}"
                    )
        return post.snapshots

    @staticmethod
    def _to_snapshot(snapshot: SourceSnapshot, post_id: UUID) -> MetricSnapshotCreate:
        return MetricSnapshotCreate(post_id=post_id, **snapshot.model_dump())
