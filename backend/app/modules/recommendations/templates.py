"""Template wording for recommendations, used when no LLM is configured or it skips an item."""

from collections.abc import Mapping

from app.modules.recommendations.evidence import EvidenceItem
from app.modules.recommendations.schemas import RecommendationDraft
from app.shared.enums import Language, PatternDimension, RecommendationCategory

TEMPLATE_VERSION = "templates-v1"
TEMPLATE_MODEL = "template"

LANGUAGE_NAMES: Mapping[str, str] = {Language.AR: "Arabic", Language.EN: "English"}


def _segment_name(item: EvidenceItem) -> str:
    segment = item.evidence.segment
    match item.evidence.dimension:
        case PatternDimension.LANGUAGE:
            return LANGUAGE_NAMES.get(segment, segment)
        case PatternDimension.TIME_BLOCK:
            start, end = segment.split("-")
            return f"{start}:00-{end}:00 UTC"
        case _:
            return segment.replace("_", " ")


_SUBJECTS: Mapping[RecommendationCategory, str] = {
    RecommendationCategory.FORMAT: "{segment} posts",
    RecommendationCategory.STYLE: "{segment} stories",
    RecommendationCategory.HOOK: "Captions opening with a {segment} hook",
    RecommendationCategory.TIMING: "Posts published {segment}",
    RecommendationCategory.LANGUAGE: "Posts with {segment} captions",
}

_TITLES: Mapping[RecommendationCategory, str] = {
    RecommendationCategory.FORMAT: "Make more {segment} posts",
    RecommendationCategory.STYLE: "Try more {segment} stories",
    RecommendationCategory.HOOK: "Open captions with a {segment} hook",
    RecommendationCategory.TIMING: "Schedule key posts for {segment}",
    RecommendationCategory.LANGUAGE: "Lean into {segment} captions",
}

_ACTIONS: Mapping[RecommendationCategory, str] = {
    RecommendationCategory.FORMAT: "Consider packaging more stories as {segment} posts.",
    RecommendationCategory.STYLE: "Consider telling more stories in {segment} form.",
    RecommendationCategory.HOOK: "Consider opening more captions with a {segment}.",
    RecommendationCategory.TIMING: "Consider publishing important posts between {segment}.",
    RecommendationCategory.LANGUAGE: "Consider publishing more posts with {segment} captions.",
}


def template_draft(ref: int, item: EvidenceItem) -> RecommendationDraft:
    segment = _segment_name(item)
    evidence = item.evidence
    subject = _SUBJECTS[item.category].format(segment=segment)
    finding = (
        f"{subject[0].upper()}{subject[1:]} earn {evidence.lift:.2f}x the engagement of "
        f"{evidence.baseline} ({evidence.sample_size:,} posts vs "
        f"{evidence.baseline_sample_size:,}, measured at {evidence.snapshot_hours}h)."
    )
    if item.is_gap and evidence.own_share is not None and evidence.competitor_share is not None:
        finding += (
            f" Competitors use them in {evidence.competitor_share:.0%} of posts; "
            f"Al Jazeera in {evidence.own_share:.0%}."
        )
    return RecommendationDraft(
        ref=ref,
        title=_TITLES[item.category].format(segment=segment),
        suggestion=f"{finding} {_ACTIONS[item.category].format(segment=segment)} "
        "Test it and compare results before changing the plan.",
    )
