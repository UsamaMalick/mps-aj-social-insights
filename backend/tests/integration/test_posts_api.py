from datetime import UTC, datetime
from uuid import uuid4

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.enums import Language, SnapshotAge, StoryType
from tests.factories import create_account, create_post, create_snapshot, create_tag


async def test_posts_include_account_latest_snapshot_score_and_tags(
    db_client: AsyncClient, db_session: AsyncSession
) -> None:
    account = await create_account(db_session, followers_count=1_000)
    post = await create_post(db_session, account)
    await create_snapshot(db_session, post.id, hours_since_post=SnapshotAge.H24, likes=10)
    await create_snapshot(db_session, post.id, likes=80, comments=10, shares=10)
    await create_tag(db_session, post.id, story_type=StoryType.EXPLAINER)

    response = await db_client.get("/api/v1/posts")

    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["account"]["handle"] == account.handle
    assert item["latest_snapshot"]["hours_since_post"] == 72
    assert item["engagement_score"] == 0.1
    assert item["labels"]["story_type"] == "explainer"


async def test_posts_filter_by_ownership_language_story_and_search(
    db_client: AsyncClient, db_session: AsyncSession
) -> None:
    own = await create_account(db_session, is_own=True)
    rival = await create_account(db_session)
    target = await create_post(db_session, own, language=Language.AR, caption="عاجل: خبر مهم")
    await create_tag(db_session, target.id, story_type=StoryType.BREAKING)
    other = await create_post(db_session, own, caption="Breaking in English")
    await create_tag(db_session, other.id, story_type=StoryType.BREAKING)
    await create_post(db_session, rival, language=Language.AR, caption="عاجل")

    response = await db_client.get(
        "/api/v1/posts",
        params={"is_own": True, "language": "ar", "story_type": "breaking", "q": "عاجل"},
    )

    assert [item["id"] for item in response.json()["items"]] == [str(target.id)]


async def test_search_treats_wildcards_literally(
    db_client: AsyncClient, db_session: AsyncSession
) -> None:
    account = await create_account(db_session)
    await create_post(db_session, account, caption="100% sure")
    await create_post(db_session, account, caption="100 percent")

    response = await db_client.get("/api/v1/posts", params={"q": "100%"})

    assert response.json()["total"] == 1


async def test_posts_sort_by_engagement_and_paginate(
    db_client: AsyncClient, db_session: AsyncSession
) -> None:
    account = await create_account(db_session)
    for day, likes in enumerate((5, 50, 20), start=1):
        post = await create_post(db_session, account, posted_at=datetime(2026, 1, day, tzinfo=UTC))
        await create_snapshot(db_session, post.id, likes=likes, comments=0, shares=0)

    response = await db_client.get(
        "/api/v1/posts", params={"sort": "most_engaged", "limit": 2, "offset": 0}
    )

    body = response.json()
    assert body["total"] == 3
    assert [item["latest_snapshot"]["likes"] for item in body["items"]] == [50, 20]


async def test_post_detail_lists_every_snapshot(
    db_client: AsyncClient, db_session: AsyncSession
) -> None:
    account = await create_account(db_session)
    post = await create_post(db_session, account)
    await create_snapshot(db_session, post.id, hours_since_post=SnapshotAge.H24)
    await create_snapshot(db_session, post.id)

    response = await db_client.get(f"/api/v1/posts/{post.id}")

    assert [s["hours_since_post"] for s in response.json()["snapshots"]] == [24, 72]


async def test_unknown_post_returns_not_found_error_shape(db_client: AsyncClient) -> None:
    response = await db_client.get(f"/api/v1/posts/{uuid4()}")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


async def test_page_size_is_capped(db_client: AsyncClient) -> None:
    response = await db_client.get("/api/v1/posts", params={"limit": 1_000})

    assert response.status_code == 422


async def test_pagination_runs_in_the_database_with_a_correct_total(
    db_client: AsyncClient, db_session: AsyncSession
) -> None:
    account = await create_account(db_session)
    for day in range(1, 8):
        await create_post(db_session, account, posted_at=datetime(2026, 1, day, tzinfo=UTC))

    first = (await db_client.get("/api/v1/posts", params={"limit": 3})).json()
    last = (await db_client.get("/api/v1/posts", params={"limit": 3, "offset": 6})).json()

    assert (first["total"], len(first["items"])) == (7, 3)
    assert first["items"][0]["posted_at"].startswith("2026-01-07")
    assert (last["total"], len(last["items"])) == (7, 1)
    assert last["items"][0]["posted_at"].startswith("2026-01-01")


async def test_engagement_sort_uses_each_accounts_followers_and_puts_unmeasured_last(
    db_client: AsyncClient, db_session: AsyncSession
) -> None:
    big = await create_account(db_session, followers_count=100_000)
    small = await create_account(db_session, followers_count=1_000)
    many_likes = await create_post(db_session, big)
    await create_snapshot(db_session, many_likes.id, likes=1_000, comments=0, shares=0)
    few_likes = await create_post(db_session, small)
    await create_snapshot(db_session, few_likes.id, likes=100, comments=0, shares=0)
    unmeasured = await create_post(db_session, small)

    response = await db_client.get("/api/v1/posts", params={"sort": "most_engaged"})

    ids = [item["id"] for item in response.json()["items"]]
    # 100 / 1,000 = 10% beats 1,000 / 100,000 = 1%; a post without snapshots comes last.
    assert ids == [str(few_likes.id), str(many_likes.id), str(unmeasured.id)]
