from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.recommendations.repository import RecommendationRepository
from app.modules.recommendations.schemas import Evidence, RecommendationCreate
from app.shared.enums import PatternDimension, RecommendationCategory, RecommendationSource
from tests.factories import create_account


async def test_accounts_list_own_first_and_filter(
    db_client: AsyncClient, db_session: AsyncSession
) -> None:
    await create_account(db_session, display_name="Zeta", is_own=False)
    await create_account(db_session, display_name="Alpha", is_own=True)

    everything = (await db_client.get("/api/v1/accounts")).json()
    competitors = (await db_client.get("/api/v1/accounts", params={"is_own": False})).json()

    assert [a["display_name"] for a in everything["items"]] == ["Alpha", "Zeta"]
    assert [a["display_name"] for a in competitors["items"]] == ["Zeta"]


async def test_recommendation_status_can_be_updated(
    db_client: AsyncClient, db_session: AsyncSession
) -> None:
    created = await RecommendationRepository(db_session).create(
        RecommendationCreate(
            title="Post more reels",
            suggestion="Reels outperform.",
            category=RecommendationCategory.FORMAT,
            evidence=Evidence(
                metric="engagement_score",
                dimension=PatternDimension.MEDIA_TYPE,
                segment="reel",
                baseline="other formats",
                segment_value=0.02,
                baseline_value=0.01,
                lift=1.8,
                sample_size=100,
                baseline_sample_size=900,
                snapshot_hours=72,
            ),
            source=RecommendationSource.TEMPLATE,
            prompt_version="t",
            model="template",
        )
    )

    response = await db_client.patch(
        f"/api/v1/recommendations/{created.id}", json={"status": "accepted"}
    )
    listed = await db_client.get("/api/v1/recommendations", params={"status": "accepted"})

    assert response.json()["status"] == "accepted"
    assert listed.json()["total"] == 1


async def test_generate_with_no_data_returns_no_recommendations(db_client: AsyncClient) -> None:
    response = await db_client.post("/api/v1/recommendations/generate")

    assert response.status_code == 201
    assert response.json() == []


async def test_account_groups_are_built_on_the_server(
    db_client: AsyncClient, db_session: AsyncSession
) -> None:
    await create_account(db_session, display_name="Rival", is_own=False)
    await create_account(db_session, display_name="Al Jazeera", is_own=True)

    response = await db_client.get("/api/v1/accounts/groups")

    assert response.status_code == 200
    groups = response.json()
    assert [g["key"] for g in groups] == ["own", "competitors"]
    assert [a["display_name"] for a in groups[0]["accounts"]] == ["Al Jazeera"]
    assert [a["display_name"] for a in groups[1]["accounts"]] == ["Rival"]
