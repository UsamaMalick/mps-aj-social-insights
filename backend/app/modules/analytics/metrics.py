"""The engagement formulas. This is the only place they are defined.

- engagement score = (likes + comments + shares) / followers_at_post
- lift = a post's engagement score / the median engagement score of its own account

Only public metrics are used, so scores are comparable across own and competitor accounts.
`followers_at_post` is the account's follower count (the POC stores no follower history).
"""

from collections.abc import Sequence
from statistics import median


def interactions(*, likes: int, comments: int, shares: int) -> int:
    return likes + comments + shares


def engagement_score(*, likes: int, comments: int, shares: int, followers_at_post: int) -> float:
    if followers_at_post <= 0:
        raise ValueError("followers_at_post must be positive")
    return interactions(likes=likes, comments=comments, shares=shares) / followers_at_post


def lift(score: float, account_median_score: float) -> float:
    if account_median_score <= 0:
        raise ValueError("account_median_score must be positive")
    return score / account_median_score


def median_score(scores: Sequence[float]) -> float:
    if not scores:
        raise ValueError("cannot take the median of no scores")
    return float(median(scores))
