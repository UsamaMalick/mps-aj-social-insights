import { StatCard } from "@/components/data/stat-card";
import { formatCompact, formatPercent } from "@/lib/format";

import { ENGAGEMENT_SCORE_HINT } from "../metrics";
import type { OverviewTotals } from "../types";

interface OverviewStatsProps {
  totals: OverviewTotals;
}

export function OverviewStats({ totals }: OverviewStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Al Jazeera posts"
        value={formatCompact(totals.own_posts)}
        hint="Instagram + Facebook, last 90 days"
      />
      <StatCard
        label="Al Jazeera median engagement"
        value={formatPercent(totals.own_median_engagement_score)}
        hint={ENGAGEMENT_SCORE_HINT}
      />
      <StatCard
        label="Competitor median engagement"
        value={formatPercent(totals.competitor_median_engagement_score)}
        hint="Public metrics only"
      />
      <StatCard
        label="Al Jazeera reach"
        value={formatCompact(totals.own_reach)}
        hint={`${formatCompact(totals.own_interactions)} interactions · own accounts only`}
      />
    </div>
  );
}
