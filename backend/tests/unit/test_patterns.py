from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest

from app.modules.analytics.patterns import (
    content_gaps,
    score_posts,
    segment_stats,
    time_block_label,
)
from app.modules.posts.schemas import PostMetricsRow
from app.modules.tagging.schemas import TagLabels
from app.shared.enums import (
    HookStyle,
    Language,
    MediaType,
    PatternDimension,
    Platform,
    Region,
    StoryType,
    Tone,
    Topic,
)

FOLLOWERS = 10_000


def _row(account_id: UUID, interactions: int, **overrides: object) -> PostMetricsRow:
    fields: dict[str, object] = {
        "post_id": uuid4(),
        "account_id": account_id,
        "platform": Platform.INSTAGRAM,
        "media_type": MediaType.IMAGE,
        "language": Language.EN,
        "caption": "c",
        "posted_at": datetime(2026, 1, 1, 10, tzinfo=UTC),
        "url": "https://example.com",
        "likes": interactions,
        "comments": 0,
        "shares": 0,
        "views": interactions * 10,
    }
    return PostMetricsRow.model_validate(fields | overrides)


def _labels(story_type: StoryType) -> TagLabels:
    return TagLabels(
        topic=Topic.POLITICS,
        region=Region.GLOBAL,
        story_type=story_type,
        hook_style=HookStyle.QUESTION,
        tone=Tone.NEUTRAL,
    )


def test_time_blocks_are_four_hours_wide() -> None:
    assert time_block_label(0) == "00-04"
    assert time_block_label(17) == "16-20"
    assert time_block_label(23) == "20-24"


def test_lift_vs_rest_compares_within_each_account() -> None:
    # An Arabic-only account with high engagement and an English-only one with low
    # engagement must NOT make Arabic look better: there is no within-account contrast.
    arabic_account, english_account, mixed_account = uuid4(), uuid4(), uuid4()
    rows = (
        [_row(arabic_account, 500, language=Language.AR) for _ in range(10)]
        + [_row(english_account, 100) for _ in range(10)]
        + [_row(mixed_account, 200, language=Language.AR) for _ in range(10)]
        + [_row(mixed_account, 100) for _ in range(10)]
    )
    accounts = {arabic_account, english_account, mixed_account}
    scored = score_posts(
        rows, followers=dict.fromkeys(accounts, FOLLOWERS), own_accounts=set(), labels={}
    )

    stats = {s.segment: s for s in segment_stats(scored, PatternDimension.LANGUAGE)}

    assert stats["ar"].lift_vs_rest == pytest.approx(2.0)
    assert stats["ar"].accounts_compared == 1


def test_tag_dimensions_skip_untagged_posts() -> None:
    account = uuid4()
    tagged = _row(account, 100)
    rows = [tagged, _row(account, 100)]
    scored = score_posts(
        rows,
        followers={account: FOLLOWERS},
        own_accounts=set(),
        labels={tagged.post_id: _labels(StoryType.EXPLAINER)},
    )

    stats = segment_stats(scored, PatternDimension.STORY_TYPE)

    assert [(s.segment, s.post_count) for s in stats] == [("explainer", 1)]


def test_content_gap_requires_low_own_share_and_high_lift() -> None:
    own, rival = uuid4(), uuid4()
    rows: list[PostMetricsRow] = []
    labels: dict[UUID, TagLabels] = {}

    def add(account: UUID, story: StoryType, interactions: int, count: int) -> None:
        for _ in range(count):
            row = _row(account, interactions)
            rows.append(row)
            labels[row.post_id] = _labels(story)

    add(own, StoryType.BREAKING, 100, 40)
    add(own, StoryType.EXPLAINER, 200, 2)
    add(rival, StoryType.BREAKING, 100, 20)
    add(rival, StoryType.EXPLAINER, 200, 20)
    scored = score_posts(
        rows, followers={own: FOLLOWERS, rival: FOLLOWERS}, own_accounts={own}, labels=labels
    )

    gaps = content_gaps(scored, PatternDimension.STORY_TYPE)

    assert [gap.segment for gap in gaps] == ["explainer"]
    assert gaps[0].competitor_share == pytest.approx(0.5)
