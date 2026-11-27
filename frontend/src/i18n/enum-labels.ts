import type { components } from "@/lib/api/schema";

type Api = components["schemas"];
type Labels<Key extends string> = Record<Key, string>;
type Metric = "likes" | "comments" | "shares" | "views" | "saves" | "reach" | "clicks";

/**
 * The shape the dictionaries' label tables must have, derived from the backend's generated
 * enums. When the backend adds a value (e.g. a new story type) and `make gen-api` runs, every
 * dictionary that lacks a label for it stops compiling, in English and Arabic alike.
 */
export interface EnumLabelContract {
  enums: {
    platform: Labels<Api["Platform"]>;
    media_type: Labels<Api["MediaType"]>;
    story_type: Labels<Api["StoryType"]>;
    hook_style: Labels<Api["HookStyle"]>;
    tone: Labels<Api["Tone"]>;
    topic: Labels<Api["Topic"]>;
    region: Labels<Api["Region"]>;
    language: Labels<Api["Language"]>;
    languageCode: Labels<Api["Language"]>;
    status: Labels<Api["RecommendationStatus"]>;
    category: Labels<Api["RecommendationCategory"]>;
    sort: Labels<Api["PostSort"]>;
    metric: Labels<Metric>;
    metricLower: Labels<Metric>;
  };
  segments: {
    media_type: Labels<Api["MediaType"]>;
    story_type: Labels<Api["StoryType"]>;
    hook_style: Labels<Api["HookStyle"]>;
    language: Labels<Api["Language"]>;
    dimension: Labels<Api["PatternDimension"]>;
    /** Phrase for a time-of-day segment, e.g. "Posting {start}:00–{end}:00 UTC". */
    timeBlock: string;
  };
}
