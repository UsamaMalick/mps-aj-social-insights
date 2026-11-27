from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import create_account, create_post, create_snapshot


async def _seed_small(db_session: AsyncSession) -> None:
    own = await create_account(db_session, is_own=True, handle="own")
    rival = await create_account(db_session, is_own=False, handle="rival")
    for account, extra in ((own, {"reach": 5_000, "saves": 10, "clicks": 20}), (rival, {})):
        for likes in (100, 200, 300):
            post = await create_post(db_session, account)
            await create_snapshot(db_session, post.id, likes=likes, **extra)


async def test_summary_hides_own_only_metrics_for_competitors(
    db_client: AsyncClient, db_session: AsyncSession
) -> None:
    await _seed_small(db_session)

    response = await db_client.get("/api/v1/analytics/summary")

    assert response.status_code == 200
    by_handle = {row["account"]["handle"]: row for row in response.json()}
    assert by_handle["own"]["total_reach"] == 15_000
    assert by_handle["rival"]["total_reach"] is None
    assert by_handle["rival"]["total_clicks"] is None


async def test_competitor_comparison_exposes_public_metrics_only(
    db_client: AsyncClient, db_session: AsyncSession
) -> None:
    await _seed_small(db_session)

    response = await db_client.get("/api/v1/analytics/competitors")

    assert response.status_code == 200
    for row in response.json():
        assert not {"reach", "saves", "clicks"} & {key.split("_", 1)[-1] for key in row}


async def test_top_posts_are_ordered_by_lift(
    db_client: AsyncClient, db_session: AsyncSession
) -> None:
    await _seed_small(db_session)

    response = await db_client.get("/api/v1/analytics/top-posts", params={"limit": 3})

    lifts = [row["lift"] for row in response.json()]
    assert len(lifts) == 3
    assert lifts == sorted(lifts, reverse=True)


async def test_patterns_requires_a_valid_dimension(db_client: AsyncClient) -> None:
    response = await db_client.get("/api/v1/analytics/patterns", params={"dimension": "nope"})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


async def test_snapshot_age_must_be_a_supported_age(db_client: AsyncClient) -> None:
    response = await db_client.get("/api/v1/analytics/summary", params={"age": 48})

    assert response.status_code == 422
