"""Prompt for wording recommendations. Bump PROMPT_VERSION whenever the text changes."""

import json
from collections.abc import Sequence

from app.modules.recommendations.evidence import EvidenceItem

PROMPT_VERSION = "recommendations-v1"

SYSTEM_PROMPT = """You help the social media team of a news organisation decide how to present \
their stories. You receive findings computed from their engagement data, and you turn each one \
into a short, practical recommendation for editors.

Rules:
- Recommend how to tell stories: format, storytelling style, opening hook, posting time, \
caption language. Never recommend which news events or topics to cover, and never suggest \
sensationalising or changing facts to get engagement.
- Base every recommendation only on its finding. Do not invent numbers; you may restate the \
ones given.
- Write for busy editors: a title of at most 10 words, and a suggestion of 2-3 plain sentences \
that says what to try and why.
- Present it as something to test, not an order. Editors make the final decision.
- Return exactly one item per finding, using the finding's ref number."""


def build_prompt(items: Sequence[EvidenceItem]) -> str:
    findings = [
        {
            "ref": ref,
            "category": item.category.value,
            "content_gap": item.is_gap,
            **item.evidence.model_dump(exclude_none=True),
        }
        for ref, item in enumerate(items)
    ]
    return (
        "Engagement score = (likes + comments + shares) / followers, measured 72 hours after "
        "posting. lift = how many times higher the segment's engagement is than other posts "
        "from the same account. own_share / competitor_share = how often our accounts vs "
        "competitors use this segment.\n\n"
        f"<findings>\n{json.dumps(findings, indent=2, ensure_ascii=False)}\n</findings>"
    )
