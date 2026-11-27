import pytest

from app.modules.analytics.metrics import engagement_score, lift, median_score


def test_engagement_score_counts_public_interactions_per_follower() -> None:
    score = engagement_score(likes=80, comments=10, shares=10, followers_at_post=10_000)

    assert score == pytest.approx(0.01)


def test_engagement_score_rejects_zero_followers() -> None:
    with pytest.raises(ValueError, match="positive"):
        engagement_score(likes=1, comments=0, shares=0, followers_at_post=0)


def test_lift_is_relative_to_account_median() -> None:
    account_scores = [0.01, 0.02, 0.03]

    assert lift(0.04, median_score(account_scores)) == pytest.approx(2.0)


def test_lift_of_median_post_is_one() -> None:
    assert lift(0.02, 0.02) == pytest.approx(1.0)


def test_median_of_no_scores_is_an_error() -> None:
    with pytest.raises(ValueError, match="no scores"):
        median_score([])
