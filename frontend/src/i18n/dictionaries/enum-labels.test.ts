import { describe, expect, it } from "vitest";

import { OWN_ONLY_METRICS, PUBLIC_METRICS } from "@/features/analytics/metrics";
import {
  hookStyleValues,
  languageValues,
  mediaTypeValues,
  patternDimensionValues,
  platformValues,
  postSortValues,
  recommendationCategoryValues,
  recommendationStatusValues,
  regionValues,
  storyTypeValues,
  toneValues,
  topicValues,
} from "@/lib/api/schema";

import { ar } from "./ar";
import { en } from "./en";

/** Every runtime enum value from the backend, paired with the table that must label it. */
const TABLES: [string, readonly string[], (d: typeof en) => Record<string, string>][] = [
  ["enums.platform", platformValues, (d) => d.enums.platform],
  ["enums.media_type", mediaTypeValues, (d) => d.enums.media_type],
  ["enums.story_type", storyTypeValues, (d) => d.enums.story_type],
  ["enums.hook_style", hookStyleValues, (d) => d.enums.hook_style],
  ["enums.tone", toneValues, (d) => d.enums.tone],
  ["enums.topic", topicValues, (d) => d.enums.topic],
  ["enums.region", regionValues, (d) => d.enums.region],
  ["enums.language", languageValues, (d) => d.enums.language],
  ["enums.languageCode", languageValues, (d) => d.enums.languageCode],
  ["enums.status", recommendationStatusValues, (d) => d.enums.status],
  ["enums.category", recommendationCategoryValues, (d) => d.enums.category],
  ["enums.sort", postSortValues, (d) => d.enums.sort],
  ["enums.metric", [...PUBLIC_METRICS, ...OWN_ONLY_METRICS], (d) => d.enums.metric],
  ["segments.media_type", mediaTypeValues, (d) => d.segments.media_type],
  ["segments.story_type", storyTypeValues, (d) => d.segments.story_type],
  ["segments.hook_style", hookStyleValues, (d) => d.segments.hook_style],
  ["segments.language", languageValues, (d) => d.segments.language],
  ["segments.dimension", patternDimensionValues, (d) => d.segments.dimension],
];

describe.each([
  ["English", en],
  ["Arabic", ar],
])("%s labels", (_, dictionary) => {
  it.each(TABLES)("%s covers every backend value", (_name, values, table) => {
    const labels = table(dictionary);
    const missing = values.filter((value) => !labels[value]?.trim());
    expect(missing, `no label for: ${missing.join(", ")}`).toEqual([]);
  });
});
