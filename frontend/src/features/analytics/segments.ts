import type { PatternDimension } from "./types";

const MEDIA: Record<string, string> = {
  reel: "Reels",
  video: "Videos",
  image: "Single images",
  carousel: "Carousels",
};
const STORY: Record<string, string> = {
  breaking: "Breaking news",
  explainer: "Explainers",
  human_interest: "Human-interest stories",
  analysis: "Analysis",
  live_update: "Live updates",
};
const HOOK: Record<string, string> = {
  question: "Question hooks",
  statistic: "Statistic hooks",
  quote: "Quote hooks",
  bold_claim: "Bold-claim hooks",
  straight_news: "Straight-news openings",
};
const LANGUAGE: Record<string, string> = { ar: "Arabic captions", en: "English captions" };

/** A plain-English name for a segment, e.g. ("time_block", "16-20") → "Posting 16:00–20:00 UTC". */
export function segmentName(dimension: PatternDimension, segment: string): string {
  switch (dimension) {
    case "media_type":
      return MEDIA[segment] ?? segment;
    case "story_type":
      return STORY[segment] ?? segment;
    case "hook_style":
      return HOOK[segment] ?? segment;
    case "language":
      return LANGUAGE[segment] ?? segment;
    case "time_block": {
      const [start, end] = segment.split("-");
      return `Posting ${start}:00–${end}:00 UTC`;
    }
    case "topic":
      return segment.replaceAll("_", " ");
  }
}

export const DIMENSION_NAMES: Record<PatternDimension, string> = {
  media_type: "Format",
  story_type: "Story type",
  hook_style: "Opening",
  language: "Language",
  time_block: "Timing",
  topic: "Topic",
};
