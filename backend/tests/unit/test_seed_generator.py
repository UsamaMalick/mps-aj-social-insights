from collections import Counter
from statistics import median

from app.seed.answer_key import EXPLAINER_CONTENT_GAP, REELS_OUTPERFORM
from app.seed.generator import BRANDS, PERIOD_DAYS, SeedPost, generate, seed_dataset
from app.shared.enums import Language, MediaType, Platform, SnapshotAge, StoryType


def _final(post: SeedPost) -> int:
    snap = next(s for s in post.post.snapshots if s.hours_since_post == SnapshotAge.H72)
    return snap.likes + snap.comments + snap.shares


def test_generator_is_deterministic() -> None:
    assert generate() == generate()


def test_dataset_has_one_own_brand_and_five_competitors_on_both_platforms() -> None:
    accounts = seed_dataset().accounts

    assert len(accounts) == len(BRANDS) * len(Platform) == 12
    assert sum(account.is_own for account in accounts) == len(Platform)


def test_posts_span_the_configured_period() -> None:
    days = {post.post.posted_at.date() for post in seed_dataset().posts}

    assert len(days) == PERIOD_DAYS


def test_competitor_snapshots_have_no_own_only_metrics() -> None:
    own_handles = {brand.handle for brand in BRANDS if brand.is_own}
    for seed in seed_dataset().posts:
        is_own = seed.post.account_handle in own_handles
        for snap in seed.post.snapshots:
            assert (snap.reach is not None) == is_own
            assert (snap.saves is not None) == is_own
            assert (snap.clicks is not None) == is_own


def test_every_post_has_24h_and_72h_snapshots_that_grow() -> None:
    for seed in seed_dataset().posts:
        early, final = seed.post.snapshots
        assert (early.hours_since_post, final.hours_since_post) == (24, 72)
        assert early.likes <= final.likes


def test_reels_are_visibly_stronger_in_raw_data() -> None:
    posts = [p for p in seed_dataset().posts if p.post.account_handle == "globalwire"]
    reels = [_final(p) for p in posts if p.post.media_type == MediaType.REEL]
    images = [_final(p) for p in posts if p.post.media_type == MediaType.IMAGE]

    assert median(reels) / median(images) > (1 + REELS_OUTPERFORM.multiplier) / 2


def test_own_brand_rarely_posts_explainers() -> None:
    own = [p for p in seed_dataset().posts if p.post.account_handle == "aljazeera"]
    share = Counter(p.labels.story_type for p in own)[StoryType.EXPLAINER] / len(own)

    assert share < EXPLAINER_CONTENT_GAP.competitor_share / 2


def test_captions_use_both_languages() -> None:
    languages = Counter(p.post.language for p in seed_dataset().posts)

    assert languages[Language.AR] > 0
    assert languages[Language.EN] > 0
