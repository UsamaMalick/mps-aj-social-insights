import { EmptyState } from "@/components/data/empty-state";

import { getAccountSummaries, getContentGaps, getOverviewTotals, getTopPosts } from "../api";
import { ContentGapsCard } from "./content-gaps-card";
import { EngagementByAccountChart } from "./engagement-by-account-chart";
import { OverviewStats } from "./overview-stats";
import { TopPostsList } from "./top-posts-list";

const TOP_POSTS_ON_OVERVIEW = 6;

export async function OverviewSummarySection() {
  const [summaries, totals] = await Promise.all([getAccountSummaries(), getOverviewTotals()]);
  if (summaries.length === 0) {
    return (
      <EmptyState
        title="No data yet"
        description="Load the sample dataset with `make seed`, then refresh."
      />
    );
  }
  return (
    <>
      <OverviewStats totals={totals} />
      <EngagementByAccountChart rows={summaries} />
    </>
  );
}

export async function OverviewTopPostsSection() {
  return <TopPostsList posts={await getTopPosts(TOP_POSTS_ON_OVERVIEW)} />;
}

export async function OverviewGapsSection() {
  return <ContentGapsCard gaps={await getContentGaps()} />;
}
