"""Domain enums. Stored as strings in the database and exposed to the frontend via OpenAPI."""

from enum import IntEnum, StrEnum


class Environment(StrEnum):
    LOCAL = "local"
    TEST = "test"
    PRODUCTION = "production"


class DataSourceKind(StrEnum):
    SEED = "seed"
    META = "meta"


class LLMProvider(StrEnum):
    ANTHROPIC = "anthropic"
    AZURE_OPENAI = "azure_openai"


class Platform(StrEnum):
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"


class MediaType(StrEnum):
    IMAGE = "image"
    VIDEO = "video"
    REEL = "reel"
    CAROUSEL = "carousel"


class Language(StrEnum):
    AR = "ar"
    EN = "en"


class Topic(StrEnum):
    POLITICS = "politics"
    CONFLICT = "conflict"
    ECONOMY = "economy"
    CLIMATE = "climate"
    HEALTH = "health"
    TECHNOLOGY = "technology"
    SPORTS = "sports"
    CULTURE = "culture"


class Region(StrEnum):
    MIDDLE_EAST = "middle_east"
    AFRICA = "africa"
    EUROPE = "europe"
    ASIA = "asia"
    AMERICAS = "americas"
    GLOBAL = "global"


class StoryType(StrEnum):
    BREAKING = "breaking"
    EXPLAINER = "explainer"
    HUMAN_INTEREST = "human_interest"
    ANALYSIS = "analysis"
    LIVE_UPDATE = "live_update"


class HookStyle(StrEnum):
    QUESTION = "question"
    STATISTIC = "statistic"
    QUOTE = "quote"
    BOLD_CLAIM = "bold_claim"
    STRAIGHT_NEWS = "straight_news"


class Tone(StrEnum):
    NEUTRAL = "neutral"
    URGENT = "urgent"
    EMOTIONAL = "emotional"
    INFORMATIVE = "informative"


class SnapshotAge(IntEnum):
    """Fixed post ages (hours) at which metrics are captured. Compare posts only at equal age."""

    H24 = 24
    H72 = 72


DEFAULT_SNAPSHOT_AGE = SnapshotAge.H72


class RecommendationCategory(StrEnum):
    FORMAT = "format"
    STYLE = "style"
    HOOK = "hook"
    TIMING = "timing"
    LANGUAGE = "language"


class RecommendationStatus(StrEnum):
    NEW = "new"
    ACCEPTED = "accepted"
    DISMISSED = "dismissed"


class TagSource(StrEnum):
    """Who produced a post's tags: the LLM, or the rule-based fallback."""

    LLM = "llm"
    RULES = "rules"


class RecommendationSource(StrEnum):
    LLM = "llm"
    TEMPLATE = "template"


class PatternDimension(StrEnum):
    """A post attribute that engagement patterns are grouped by."""

    MEDIA_TYPE = "media_type"
    STORY_TYPE = "story_type"
    HOOK_STYLE = "hook_style"
    TOPIC = "topic"
    LANGUAGE = "language"
    TIME_BLOCK = "time_block"


class AnalyticsScope(StrEnum):
    """Which accounts an analysis covers."""

    ALL = "all"
    OWN = "own"
    COMPETITORS = "competitors"


class PostSort(StrEnum):
    NEWEST = "newest"
    OLDEST = "oldest"
    MOST_ENGAGED = "most_engaged"
