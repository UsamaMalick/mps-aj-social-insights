import { describe, expect, it } from "vitest";

import { briefingHeadline } from "./briefing";
import type { OverviewTotals, SegmentPattern } from "./types";

const TOTALS: OverviewTotals = {
  own_posts: 891,
  own_interactions: 1,
  own_reach: 1,
  own_median_engagement_score: 0.005,
  competitor_median_engagement_score: 0.006,
};

function highlight(dimension: SegmentPattern["dimension"], segment: string): SegmentPattern {
  return {
    dimension,
    segment,
    post_count: 100,
    share: 0.2,
    median_engagement_score: 0.01,
    median_lift: 1.5,
    lift_vs_rest: 1.5,
    rest_post_count: 400,
    rest_median_engagement_score: 0.005,
    accounts_compared: 12,
    is_reliable: true,
  };
}

describe("briefingHeadline", () => {
  it("leads with who is ahead and the two strongest wins, in API order", () => {
    const text = briefingHeadline(TOTALS, [
      highlight("media_type", "reel"),
      highlight("language", "ar"),
      highlight("time_block", "16-20"),
    ]);

    expect(text).toBe(
      "Competitors are out-engaging Al Jazeera, 0.60% to 0.50%. Reels and Arabic captions are the clearest wins.",
    );
  });

  it("says Al Jazeera leads when it does", () => {
    const text = briefingHeadline({ ...TOTALS, own_median_engagement_score: 0.008 }, [
      highlight("story_type", "human_interest"),
    ]);

    expect(text).toBe(
      "Al Jazeera is out-engaging competitors, 0.80% to 0.60%. Human-interest stories are the clearest win.",
    );
  });

  it("copes with no data", () => {
    const empty = { ...TOTALS, own_median_engagement_score: null };
    expect(briefingHeadline(empty, [])).toBe("");
  });
});
