"""Caption templates for sample posts, by language, hook style, story type and topic.

A caption is `<hook> <body>`: the hook reflects the hook style, the body the story type,
so both a human and an LLM tagger can recover the labels from the text.
"""

import random

from app.shared.enums import HookStyle, Language, Region, StoryType, Topic

HOOKS: dict[Language, dict[HookStyle, tuple[str, ...]]] = {
    Language.EN: {
        HookStyle.QUESTION: (
            "What does {subject} mean for {region}?",
            "Why is everyone talking about {subject}?",
        ),
        HookStyle.STATISTIC: (
            "{number},000 people are directly affected by {subject}.",
            "{number}% of people in {region} say {subject} has changed their lives.",
        ),
        HookStyle.QUOTE: (
            '"We have never seen anything like this," a witness in {region} said of {subject}.',
            '"This changes everything," an expert says of {subject}.',
        ),
        HookStyle.BOLD_CLAIM: (
            "{subject} is reshaping {region} faster than anyone expected.",
            "Nobody saw {subject} coming.",
        ),
        HookStyle.STRAIGHT_NEWS: (
            "Latest on {subject} in {region}.",
            "{subject}: here is what we know.",
        ),
    },
    Language.AR: {
        HookStyle.QUESTION: (
            "ماذا تعني {subject} بالنسبة إلى {region}؟",
            "لماذا يتحدث الجميع عن {subject}؟",
        ),
        HookStyle.STATISTIC: (
            "{number} ألف شخص يتأثرون مباشرة بـ{subject}.",
            "{number}% من سكان {region} يقولون إن {subject} غيّرت حياتهم.",
        ),
        HookStyle.QUOTE: (
            "«لم نرَ شيئاً كهذا من قبل»، يقول شاهد عيان في {region} عن {subject}.",
            "«هذا يغيّر كل شيء»، يقول خبير عن {subject}.",
        ),
        HookStyle.BOLD_CLAIM: (
            "{subject} تعيد تشكيل {region} أسرع مما توقّع أحد.",
            "لم يتوقّع أحد {subject}.",
        ),
        HookStyle.STRAIGHT_NEWS: (
            "آخر المستجدات حول {subject} في {region}.",
            "{subject}: إليكم ما نعرفه حتى الآن.",
        ),
    },
}

BODIES: dict[Language, dict[StoryType, tuple[str, ...]]] = {
    Language.EN: {
        StoryType.BREAKING: (
            "BREAKING: officials confirm new developments. More to follow.",
            "Breaking news, details are still emerging.",
        ),
        StoryType.EXPLAINER: (
            "We explain the background in 60 seconds.",
            "Explained: what you need to know, step by step.",
        ),
        StoryType.HUMAN_INTEREST: (
            "Meet the families whose lives have been changed.",
            "One woman's story of courage and hope.",
        ),
        StoryType.ANALYSIS: (
            "Analysis: our correspondent looks at what comes next.",
            "Experts weigh the long-term consequences.",
        ),
        StoryType.LIVE_UPDATE: (
            "LIVE: follow our live updates throughout the day.",
            "Live coverage: the latest as it happens.",
        ),
    },
    Language.AR: {
        StoryType.BREAKING: (
            "عاجل: مسؤولون يؤكدون تطورات جديدة. التفاصيل تتبع.",
            "خبر عاجل، والتفاصيل ما زالت تتكشف.",
        ),
        StoryType.EXPLAINER: (
            "نشرح لكم الخلفية في 60 ثانية.",
            "ببساطة: كل ما تحتاج معرفته خطوة بخطوة.",
        ),
        StoryType.HUMAN_INTEREST: (
            "تعرّفوا على العائلات التي تغيّرت حياتها.",
            "قصة امرأة عن الشجاعة والأمل.",
        ),
        StoryType.ANALYSIS: (
            "تحليل: مراسلنا يستعرض ما قد يحدث لاحقاً.",
            "خبراء يقيّمون التداعيات على المدى البعيد.",
        ),
        StoryType.LIVE_UPDATE: (
            "مباشر: تابعوا تغطيتنا المباشرة على مدار اليوم.",
            "تغطية مباشرة: آخر التطورات لحظة بلحظة.",
        ),
    },
}

SUBJECTS: dict[Language, dict[Topic, tuple[str, ...]]] = {
    Language.EN: {
        Topic.POLITICS: ("the election results", "the new coalition government"),
        Topic.CONFLICT: ("the ceasefire talks", "the humanitarian corridor"),
        Topic.ECONOMY: ("rising food prices", "the currency crisis"),
        Topic.CLIMATE: ("the record heatwave", "the water shortage"),
        Topic.HEALTH: ("the vaccination campaign", "the hospital shortages"),
        Topic.TECHNOLOGY: ("the AI boom", "the new satellite launch"),
        Topic.SPORTS: ("the World Cup qualifiers", "the marathon record"),
        Topic.CULTURE: ("the film festival", "the restored heritage site"),
    },
    Language.AR: {
        Topic.POLITICS: ("نتائج الانتخابات", "الحكومة الائتلافية الجديدة"),
        Topic.CONFLICT: ("محادثات وقف إطلاق النار", "الممرات الإنسانية"),
        Topic.ECONOMY: ("ارتفاع أسعار الغذاء", "أزمة العملة"),
        Topic.CLIMATE: ("موجة الحر القياسية", "أزمة شح المياه"),
        Topic.HEALTH: ("حملة التطعيم", "النقص في المستشفيات"),
        Topic.TECHNOLOGY: ("طفرة الذكاء الاصطناعي", "إطلاق القمر الصناعي الجديد"),
        Topic.SPORTS: ("تصفيات كأس العالم", "الرقم القياسي في الماراثون"),
        Topic.CULTURE: ("مهرجان الأفلام", "ترميم الموقع التراثي"),
    },
}

REGION_NAMES: dict[Language, dict[Region, str]] = {
    Language.EN: {
        Region.MIDDLE_EAST: "the Middle East",
        Region.AFRICA: "Africa",
        Region.EUROPE: "Europe",
        Region.ASIA: "Asia",
        Region.AMERICAS: "the Americas",
        Region.GLOBAL: "the world",
    },
    Language.AR: {
        Region.MIDDLE_EAST: "الشرق الأوسط",
        Region.AFRICA: "أفريقيا",
        Region.EUROPE: "أوروبا",
        Region.ASIA: "آسيا",
        Region.AMERICAS: "الأمريكتين",
        Region.GLOBAL: "العالم",
    },
}

_STAT_RANGE = (5, 95)


def build_caption(
    rng: random.Random,
    *,
    language: Language,
    hook_style: HookStyle,
    story_type: StoryType,
    topic: Topic,
    region: Region,
) -> str:
    subject = rng.choice(SUBJECTS[language][topic])
    hook = rng.choice(HOOKS[language][hook_style]).format(
        subject=subject,
        region=REGION_NAMES[language][region],
        number=rng.randint(*_STAT_RANGE),
    )
    body = rng.choice(BODIES[language][story_type])
    hook = hook[0].upper() + hook[1:]
    return f"{hook} {body}"
