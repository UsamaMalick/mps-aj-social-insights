"""Builders for test data. Override only the fields a test cares about."""

from datetime import UTC, datetime
from itertools import count
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.accounts.models import Account
from app.modules.accounts.repository import AccountRepository
from app.modules.accounts.schemas import AccountCreate
from app.modules.posts.models import Post
from app.modules.posts.repository import MetricSnapshotRepository, PostRepository
from app.modules.posts.schemas import MetricSnapshotCreate, PostCreate
from app.modules.tagging.repository import PostTagRepository
from app.modules.tagging.schemas import PostTagCreate
from app.shared.enums import (
    HookStyle,
    Language,
    MediaType,
    Platform,
    Region,
    SnapshotAge,
    StoryType,
    TagSource,
    Tone,
    Topic,
)

_sequence = count(1)
DEFAULT_POSTED_AT = datetime(2026, 3, 1, 12, tzinfo=UTC)


def account_data(**overrides: Any) -> AccountCreate:
    n = next(_sequence)
    fields: dict[str, Any] = {
        "platform": Platform.INSTAGRAM,
        "handle": f"account_{n}",
        "display_name": f"Account {n}",
        "is_own": False,
        "followers_count": 100_000,
    }
    return AccountCreate(**(fields | overrides))


async def create_account(session: AsyncSession, **overrides: Any) -> Account:
    return await AccountRepository(session).upsert(account_data(**overrides))


def post_data(account: Account, **overrides: Any) -> PostCreate:
    n = next(_sequence)
    fields: dict[str, Any] = {
        "account_id": account.id,
        "platform": account.platform,
        "external_id": f"post_{n}",
        "media_type": MediaType.IMAGE,
        "caption": f"Caption {n}",
        "language": Language.EN,
        "posted_at": DEFAULT_POSTED_AT,
        "url": f"https://example.com/p/{n}",
    }
    return PostCreate(**(fields | overrides))


async def create_post(session: AsyncSession, account: Account, **overrides: Any) -> Post:
    data = post_data(account, **overrides)
    ids = await PostRepository(session).upsert_many([data])
    return await PostRepository(session).get_or_raise(ids[data.external_id])


def snapshot_data(post_id: UUID, **overrides: Any) -> MetricSnapshotCreate:
    fields: dict[str, Any] = {
        "post_id": post_id,
        "hours_since_post": SnapshotAge.H72,
        "likes": 1_000,
        "comments": 100,
        "shares": 50,
        "views": 10_000,
    }
    return MetricSnapshotCreate(**(fields | overrides))


async def create_snapshot(session: AsyncSession, post_id: UUID, **overrides: Any) -> None:
    await MetricSnapshotRepository(session).upsert_many([snapshot_data(post_id, **overrides)])


def tag_data(post_id: UUID, **overrides: Any) -> PostTagCreate:
    fields: dict[str, Any] = {
        "post_id": post_id,
        "topic": Topic.POLITICS,
        "region": Region.MIDDLE_EAST,
        "story_type": StoryType.BREAKING,
        "hook_style": HookStyle.STRAIGHT_NEWS,
        "tone": Tone.NEUTRAL,
        "source": TagSource.RULES,
        "prompt_version": "test-v1",
        "model": "test-model",
    }
    return PostTagCreate(**(fields | overrides))


async def create_tag(session: AsyncSession, post_id: UUID, **overrides: Any) -> None:
    await PostTagRepository(session).upsert_many([tag_data(post_id, **overrides)])
