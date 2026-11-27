import type { Dictionary } from "@/i18n/dictionaries";
import { interpolate } from "@/i18n/interpolate";

import type { PatternDimension } from "./types";

/** A segment in plain words, e.g. ("time_block", "16-20") → "Posting 16:00–20:00 UTC". */
export function segmentName(t: Dictionary, dimension: PatternDimension, segment: string): string {
  if (dimension === "time_block") {
    const [start, end] = segment.split("-");
    return interpolate(t.segments.timeBlock, { start, end });
  }
  if (dimension === "topic")
    return t.enums.topic[segment as keyof Dictionary["enums"]["topic"]] ?? segment;
  const table: Record<string, string> = t.segments[dimension];
  return table[segment] ?? segment;
}

export function dimensionName(t: Dictionary, dimension: PatternDimension): string {
  return t.segments.dimension[dimension];
}
