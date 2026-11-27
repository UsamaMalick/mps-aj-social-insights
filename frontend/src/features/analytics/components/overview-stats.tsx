import { StatCard } from "@/components/data/stat-card";
import { formatCompact, formatPercent } from "@/lib/format";

import { ENGAGEMENT_SCORE_HINT } from "../metrics";
import { overviewTotals } from "../summary";
import type { AccountSummary } from "../types";

interface OverviewStatsProps {
  summaries: AccountSummary[];
}

export function OverviewStats({ summaries }: OverviewStatsProps) {
  const totals = overviewTotals(summaries);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Al Jazeera posts"
        value={formatCompact(totals.ownPosts)}
        hint="Instagram + Facebook, last 90 days"
      />
      <StatCard
        label="Al Jazeera median engagement"
        value={formatPercent(totals.ownMedianScore)}
        hint={ENGAGEMENT_SCORE_HINT}
      />
      <StatCard
        label="Competitor median engagement"
        value={formatPercent(totals.competitorMedianScore)}
        hint="Public metrics only"
      />
      <StatCard
        label="Al Jazeera reach"
        value={formatCompact(totals.ownReach)}
        hint={`${formatCompact(totals.ownInteractions)} interactions · own accounts only`}
      />
    </div>
  );
}
