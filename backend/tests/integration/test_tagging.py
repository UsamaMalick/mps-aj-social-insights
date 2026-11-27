from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ExternalServiceError
from app.modules.tagging.prompts import PROMPT_VERSION
from app.modules.tagging.repository import PostTagRepository
from app.modules.tagging.service import TaggingService
from app.shared.enums import StoryType, TagSource
from tests.factories import create_account, create_post
from tests.fakes import FakeLLMClient


async def _posts(db_session: AsyncSession, count: int) -> None:
    account = await create_account(db_session)
    for _ in range(count):
        await create_post(db_session, account)


async def test_llm_tags_every_untagged_post_with_traceability(db_session: AsyncSession) -> None:
    await _posts(db_session, 30)
    llm = FakeLLMClient()

    result = await TaggingService(db_session).tag_untagged(llm)

    assert (result.source, result.tagged, result.skipped) == (TagSource.LLM, 30, 0)
    assert len(llm.calls) == 2  # 25 captions per request
    tags = await PostTagRepository(db_session).list_all()
    assert {(t.prompt_version, t.model, t.story_type) for t in tags} == {
        (PROMPT_VERSION, "fake-model", StoryType.EXPLAINER)
    }


async def test_tagging_skips_already_tagged_posts(db_session: AsyncSession) -> None:
    await _posts(db_session, 3)
    service = TaggingService(db_session)
    await service.tag_untagged(FakeLLMClient())
    llm = FakeLLMClient()

    result = await service.tag_untagged(llm)

    assert result.tagged == 0
    assert llm.calls == []


async def test_invalid_llm_output_is_never_stored(db_session: AsyncSession) -> None:
    await _posts(db_session, 2)

    result = await TaggingService(db_session).tag_untagged(
        FakeLLMClient(lambda _: '{"items": [{"ref": 0, "topic": "gossip"}]}')
    )

    assert (result.tagged, result.skipped) == (0, 2)
    assert await PostTagRepository(db_session).list_all() == []


async def test_api_failure_skips_the_batch_and_continues(db_session: AsyncSession) -> None:
    await _posts(db_session, 2)

    def fail(_: str) -> str:
        raise ExternalServiceError("down")

    result = await TaggingService(db_session).tag_untagged(FakeLLMClient(fail))

    assert result.skipped == 2


async def test_rule_fallback_skips_posts_without_seed_metadata(db_session: AsyncSession) -> None:
    await _posts(db_session, 2)

    result = await TaggingService(db_session).tag_untagged(llm=None)

    assert (result.source, result.tagged, result.skipped) == (TagSource.RULES, 0, 2)


async def test_rule_fallback_tags_all_seed_posts(seeded_session: AsyncSession) -> None:
    tagged = await PostTagRepository(seeded_session).tagged_post_ids()

    assert len(tagged) > 4_000
