import { describe, expect, it } from "vitest";

import { overviewTotals } from "./summary";
import type { AccountSummary } from "./types";

function summary(isOwn: boolean, score: number, reach: number | null): AccountSummary {
  return {
    account: {
      id: crypto.randomUUID(),
      platform: "instagram",
      handle: "h",
      display_name: "Name",
      is_own: isOwn,
      followers_count: 1000,
    },
    post_count: 10,
    median_engagement_score: score,
    mean_engagement_score: score,
    total_interactions: 100,
    median_views: 1000,
    total_reach: reach,
    total_saves: null,
    total_clicks: null,
  };
}

describe("overviewTotals", () => {
  it("separates own and competitor accounts", () => {
    const totals = overviewTotals([
      summary(true, 0.02, 500),
      summary(true, 0.04, 700),
      summary(false, 0.01, null),
      summary(false, 0.03, null),
      summary(false, 0.05, null),
    ]);

    expect(totals.ownPosts).toBe(20);
    expect(totals.ownReach).toBe(1200);
    expect(totals.ownMedianScore).toBeCloseTo(0.03);
    expect(totals.competitorMedianScore).toBeCloseTo(0.03);
  });

  it("returns null medians when there is no data", () => {
    expect(overviewTotals([]).ownMedianScore).toBeNull();
  });
});
