"""Template wording for recommendations, used when no LLM is configured or it skips an item."""

from collections.abc import Mapping

from app.modules.recommendations.evidence import EvidenceItem
from app.modules.recommendations.schemas import RecommendationDraft
from app.shared.enums import Language, PatternDimension, RecommendationCategory

TEMPLATE_VERSION = "templates-v2"
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


# --- Arabic -----------------------------------------------------------------------------
# Sentences avoid putting nouns right after numbers: Arabic counted-noun forms change with
# the number, so sample sizes are given as "حجم العينة: 910 مقابل 3,139 منشورًا".

_SEGMENTS_AR: Mapping[PatternDimension, Mapping[str, str]] = {
    PatternDimension.MEDIA_TYPE: {
        "reel": "الريلز",
        "video": "الفيديو",
        "image": "الصور المفردة",
        "carousel": "الكاروسيل",
    },
    PatternDimension.STORY_TYPE: {
        "breaking": "الأخبار العاجلة",
        "explainer": "المحتوى التفسيري",
        "human_interest": "القصص الإنسانية",
        "analysis": "التحليلات",
        "live_update": "التغطية المباشرة",
    },
    PatternDimension.HOOK_STYLE: {
        "question": "السؤال",
        "statistic": "الرقم اللافت",
        "quote": "الاقتباس",
        "bold_claim": "العبارة الجريئة",
        "straight_news": "العنوان الخبري المباشر",
    },
    PatternDimension.LANGUAGE: {"ar": "العربية", "en": "الإنجليزية"},
}


def _segment_name_ar(item: EvidenceItem) -> str:
    segment = item.evidence.segment
    if item.evidence.dimension is PatternDimension.TIME_BLOCK:
        start, end = segment.split("-")
        return f"بين الساعة {start}:00 و{end}:00 بتوقيت غرينتش"
    return _SEGMENTS_AR.get(item.evidence.dimension, {}).get(segment, segment)


_SUBJECTS_AR: Mapping[RecommendationCategory, str] = {
    RecommendationCategory.FORMAT: "منشورات {segment}",
    RecommendationCategory.STYLE: "{segment}",
    RecommendationCategory.HOOK: "التعليقات التي تُفتتح بأسلوب {segment}",
    RecommendationCategory.TIMING: "المنشورات المنشورة {segment}",
    RecommendationCategory.LANGUAGE: "المنشورات المكتوبة باللغة {segment}",
}

_TITLES_AR: Mapping[RecommendationCategory, str] = {
    RecommendationCategory.FORMAT: "انشروا مزيدًا من منشورات {segment}",
    RecommendationCategory.STYLE: "جرّبوا مزيدًا من {segment}",
    RecommendationCategory.HOOK: "افتتحوا التعليقات بأسلوب {segment}",
    RecommendationCategory.TIMING: "جدولوا المنشورات المهمة {segment}",
    RecommendationCategory.LANGUAGE: "اكتبوا مزيدًا من التعليقات باللغة {segment}",
}

_ACTIONS_AR: Mapping[RecommendationCategory, str] = {
    RecommendationCategory.FORMAT: "فكّروا في تقديم مزيد من القصص بصيغة {segment}.",
    RecommendationCategory.STYLE: "فكّروا في تقديم مزيد من القصص بأسلوب {segment}.",
    RecommendationCategory.HOOK: "فكّروا في افتتاح مزيد من التعليقات بأسلوب {segment}.",
    RecommendationCategory.TIMING: "فكّروا في نشر المنشورات المهمة {segment}.",
    RecommendationCategory.LANGUAGE: "فكّروا في كتابة مزيد من التعليقات باللغة {segment}.",
}


def _arabic(item: EvidenceItem) -> tuple[str, str]:
    segment = _segment_name_ar(item)
    evidence = item.evidence
    subject = _SUBJECTS_AR[item.category].format(segment=segment)
    finding = (
        f"تحقق {subject} تفاعلًا يعادل {evidence.lift:.2f}× تفاعل المنشورات الأخرى من الحساب "
        f"نفسه (حجم العينة: {evidence.sample_size:,} مقابل {evidence.baseline_sample_size:,} "
        f"منشورًا، بعد {evidence.snapshot_hours} ساعة من النشر)."
    )
    if item.is_gap and evidence.own_share is not None and evidence.competitor_share is not None:
        finding += (
            f" يستخدمها المنافسون في {evidence.competitor_share:.0%} من منشوراتهم، "
            f"بينما تستخدمها الجزيرة في {evidence.own_share:.0%} فقط."
        )
    title = _TITLES_AR[item.category].format(segment=segment)
    suggestion = (
        f"{finding} {_ACTIONS_AR[item.category].format(segment=segment)} "
        "جرّبوا ذلك وقارنوا النتائج قبل تغيير الخطة."
    )
    return title, suggestion


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
    title_ar, suggestion_ar = _arabic(item)
    return RecommendationDraft(
        ref=ref,
        title=_TITLES[item.category].format(segment=segment),
        suggestion=f"{finding} {_ACTIONS[item.category].format(segment=segment)} "
        "Test it and compare results before changing the plan.",
        title_ar=title_ar,
        suggestion_ar=suggestion_ar,
    )
