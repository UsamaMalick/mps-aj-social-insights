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


async def test_competitor_comparison_filters_by_platform_on_the_server(
    db_client: AsyncClient, db_session: AsyncSession
) -> None:
    await _seed_small(db_session)
    facebook = await create_account(db_session, handle="fb_rival", platform="facebook")
    post = await create_post(db_session, facebook)
    await create_snapshot(db_session, post.id)

    response = await db_client.get("/api/v1/analytics/competitors", params={"platform": "facebook"})

    assert response.status_code == 200
    assert [row["account"]["handle"] for row in response.json()] == ["fb_rival"]


async def _accounts_with_scores(db_session: AsyncSession) -> None:
    for handle, is_own, likes in (("low", False, 10), ("high", False, 500), ("own", True, 100)):
        account = await create_account(
            db_session, handle=handle, is_own=is_own, followers_count=10_000
        )
        extra = {"reach": 1_000} if is_own else {}
        post = await create_post(db_session, account)
        await create_snapshot(db_session, post.id, likes=likes, comments=0, shares=0, **extra)


async def test_summary_and_comparison_are_ranked_by_engagement_on_the_server(
    db_client: AsyncClient, db_session: AsyncSession
) -> None:
    await _accounts_with_scores(db_session)

    for path in ("/api/v1/analytics/summary", "/api/v1/analytics/competitors"):
        rows = (await db_client.get(path)).json()
        assert [row["account"]["handle"] for row in rows] == ["high", "own", "low"]


async def test_overview_totals_are_computed_on_the_server(
    db_client: AsyncClient, db_session: AsyncSession
) -> None:
    await _accounts_with_scores(db_session)

    totals = (await db_client.get("/api/v1/analytics/overview")).json()

    assert totals["own_posts"] == 1
    assert totals["own_reach"] == 1_000
    assert totals["own_median_engagement_score"] == 0.01
    assert totals["competitor_median_engagement_score"] == (0.001 + 0.05) / 2
