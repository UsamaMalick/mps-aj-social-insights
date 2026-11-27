import type { AccountSummary } from "./types";

export interface OverviewTotals {
  ownPosts: number;
  ownInteractions: number;
  ownReach: number;
  ownMedianScore: number | null;
  competitorMedianScore: number | null;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/** Headline numbers for the overview. Reach is summed over own accounts only. */
export function overviewTotals(summaries: AccountSummary[]): OverviewTotals {
  const own = summaries.filter((s) => s.account.is_own);
  const competitors = summaries.filter((s) => !s.account.is_own);
  return {
    ownPosts: own.reduce((sum, s) => sum + s.post_count, 0),
    ownInteractions: own.reduce((sum, s) => sum + s.total_interactions, 0),
    ownReach: own.reduce((sum, s) => sum + (s.total_reach ?? 0), 0),
    ownMedianScore: median(own.map((s) => s.median_engagement_score)),
    competitorMedianScore: median(competitors.map((s) => s.median_engagement_score)),
  };
}
