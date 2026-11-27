import pytest
from sqlalchemy import insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.accounts.repository import AccountRepository
from app.modules.accounts.schemas import AccountFilters
from app.modules.posts.models import MetricSnapshot
from app.modules.posts.repository import MetricSnapshotRepository, PostRepository
from app.modules.recommendations.repository import RecommendationRepository
from app.modules.recommendations.schemas import (
    Evidence,
    RecommendationCreate,
    RecommendationFilters,
)
from app.modules.tagging.repository import PostTagRepository
from app.shared.enums import (
    RecommendationCategory,
    RecommendationSource,
    RecommendationStatus,
    SnapshotAge,
    StoryType,
)
from tests.factories import (
    account_data,
    create_account,
    create_post,
    create_snapshot,
    create_tag,
    post_data,
    snapshot_data,
    tag_data,
)


async def test_account_upsert_updates_existing_row_by_platform_and_handle(
    db_session: AsyncSession,
) -> None:
    first = await create_account(db_session, handle="aljazeera", followers_count=10)
    second = await create_account(db_session, handle="aljazeera", followers_count=20)

    assert second.id == first.id
    assert second.followers_count == 20


async def test_account_list_filters_by_ownership(db_session: AsyncSession) -> None:
    await create_account(db_session, is_own=True)
    await create_account(db_session, is_own=False)

    rows, total = await AccountRepository(db_session).list_filtered(
        AccountFilters(is_own=True), offset=0, limit=10
    )

    assert total == 1
    assert all(row.is_own for row in rows)


async def test_post_upsert_is_idempotent(db_session: AsyncSession) -> None:
    account = await create_account(db_session)
    data = post_data(account)
    repo = PostRepository(db_session)

    first = await repo.upsert_many([data])
    second = await repo.upsert_many([data.model_copy(update={"caption": "edited"})])

    assert first == second
    post = await repo.get_or_raise(first[data.external_id])
    await db_session.refresh(post)
    assert post.caption == "edited"


async def test_snapshot_upsert_keeps_one_row_per_age(db_session: AsyncSession) -> None:
    account = await create_account(db_session)
    post = await create_post(db_session, account)
    await create_snapshot(db_session, post.id, likes=1)
    await create_snapshot(db_session, post.id, likes=5)
    await create_snapshot(db_session, post.id, hours_since_post=SnapshotAge.H24, likes=3)

    snapshots = await MetricSnapshotRepository(db_session).list_for_post(post.id)

    assert [(s.hours_since_post, s.likes) for s in snapshots] == [(24, 3), (72, 5)]


async def test_snapshot_rejects_unsupported_age(db_session: AsyncSession) -> None:
    account = await create_account(db_session)
    post = await create_post(db_session, account)
    row = snapshot_data(post.id).model_dump() | {"hours_since_post": 48}

    with pytest.raises(IntegrityError):
        await db_session.execute(insert(MetricSnapshot).values(**row))


async def test_tag_upsert_replaces_previous_labels(db_session: AsyncSession) -> None:
    account = await create_account(db_session)
    post = await create_post(db_session, account)
    await create_tag(db_session, post.id, story_type=StoryType.BREAKING)
    await PostTagRepository(db_session).upsert_many(
        [tag_data(post.id, story_type=StoryType.EXPLAINER)]
    )

    tag = await PostTagRepository(db_session).get_for_post(post.id)

    assert tag is not None
    await db_session.refresh(tag)
    assert tag.story_type is StoryType.EXPLAINER
    assert await PostTagRepository(db_session).tagged_post_ids() == {post.id}


async def test_recommendation_is_stored_with_evidence_and_new_status(
    db_session: AsyncSession,
) -> None:
    repo = RecommendationRepository(db_session)
    evidence = Evidence(
        metric="engagement_score",
        segment="reel",
        baseline="all posts",
        segment_value=0.02,
        baseline_value=0.01,
        lift=2.0,
        sample_size=40,
        baseline_sample_size=400,
        snapshot_hours=72,
    )
    await repo.create(
        RecommendationCreate(
            title="Use more reels",
            suggestion="Reels earn twice the engagement.",
            category=RecommendationCategory.FORMAT,
            evidence=evidence,
            source=RecommendationSource.TEMPLATE,
            prompt_version="test-v1",
            model="template",
        )
    )

    rows, total = await repo.list_filtered(
        RecommendationFilters(status=RecommendationStatus.NEW), offset=0, limit=10
    )

    assert total == 1
    assert rows[0].evidence["sample_size"] == 40


async def test_account_platform_is_part_of_natural_key(db_session: AsyncSession) -> None:
    repo = AccountRepository(db_session)
    instagram = await repo.upsert(account_data(handle="same"))
    facebook = await repo.upsert(account_data(handle="same", platform="facebook"))

    assert instagram.id != facebook.id
