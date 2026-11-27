"""Read model for the posts screens: posts joined with their account, snapshots and tags.

Kept apart from `PostService` because it composes the accounts and tagging services, while
tagging itself depends on `PostService`.
"""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.accounts.schemas import AccountRead
from app.modules.accounts.service import AccountService
from app.modules.analytics import metrics
from app.modules.posts.schemas import (
    MetricSnapshotRead,
    PostAccount,
    PostDetail,
    PostFilters,
    PostListItem,
    PostQuery,
    PostRead,
)
from app.modules.posts.service import PostService
from app.modules.tagging.schemas import TagLabels
from app.modules.tagging.service import TaggingService
from app.shared.schemas import Page, PaginationParams


class PostListingService:
    def __init__(self, session: AsyncSession) -> None:
        self.accounts = AccountService(session)
        self.posts = PostService(session)
        self.tagging = TaggingService(session)

    async def list_posts(
        self, filters: PostFilters, pagination: PaginationParams
    ) -> Page[PostListItem]:
        """Filtered, searched, sorted and paginated posts (all in the database), each with its
        account, latest snapshot and tags."""
        accounts = {account.id: account for account in await self.accounts.list_all()}
        rows, total = await self.posts.search_page(
            await self._to_query(filters, accounts),
            sort=filters.sort,
            followers_by_account={a.id: a.followers_count for a in accounts.values()},
            pagination=pagination,
        )
        labels = await self.tagging.labels_for_posts([post.id for post, _ in rows])
        items = [
            _to_item(post, accounts, [snapshot] if snapshot else [], labels)
            for post, snapshot in rows
        ]
        return Page[PostListItem](
            items=items, total=total, offset=pagination.offset, limit=pagination.limit
        )

    async def get_post(self, post_id: UUID) -> PostDetail:
        """One post with every snapshot."""
        post = await self.posts.get_post(post_id)
        account = await self.accounts.get_account(post.account_id)
        snapshots = (await self.posts.snapshots_by_post([post.id]))[post.id]
        labels = await self.tagging.labels_for_posts([post.id])
        item = _to_item(post, {account.id: account}, snapshots, labels)
        return PostDetail(**item.model_dump(), snapshots=snapshots)

    async def _to_query(self, filters: PostFilters, accounts: dict[UUID, AccountRead]) -> PostQuery:
        account_ids: list[UUID] | None = None
        if filters.is_own is not None:
            account_ids = [a.id for a in accounts.values() if a.is_own == filters.is_own]
        if filters.account_id is not None:
            account_ids = [
                aid for aid in (account_ids or list(accounts)) if aid == filters.account_id
            ]
        post_ids = None
        if filters.story_type is not None:
            post_ids = await self.tagging.post_ids_with_story_type(filters.story_type)
        return PostQuery(
            account_ids=account_ids,
            post_ids=post_ids,
            platform=filters.platform,
            media_type=filters.media_type,
            language=filters.language,
            q=filters.q,
        )


def _to_item(
    post: PostRead,
    accounts: dict[UUID, AccountRead],
    snapshots: list[MetricSnapshotRead],
    labels: dict[UUID, TagLabels],
) -> PostListItem:
    account = accounts[post.account_id]
    latest = snapshots[-1] if snapshots else None
    score = (
        metrics.engagement_score(
            likes=latest.likes,
            comments=latest.comments,
            shares=latest.shares,
            followers_at_post=account.followers_count,
        )
        if latest is not None
        else None
    )
    return PostListItem(
        **post.model_dump(),
        account=PostAccount.model_validate(account, from_attributes=True),
        latest_snapshot=latest,
        engagement_score=score,
        labels=labels.get(post.id),
    )
