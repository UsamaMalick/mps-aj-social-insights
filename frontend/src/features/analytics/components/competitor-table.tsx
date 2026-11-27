import { type Column, DataTable } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCompact, formatLabel, formatPercent } from "@/lib/format";

import { METRIC_LABELS, PUBLIC_METRICS, type PublicMetric } from "../metrics";
import type { CompetitorComparison } from "../types";

const MEDIAN_FIELD: Record<PublicMetric, keyof CompetitorComparison> = {
  likes: "median_likes",
  comments: "median_comments",
  shares: "median_shares",
  views: "median_views",
};

const POSTS_PER_DAY_FORMAT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

const COLUMNS: Column<CompetitorComparison>[] = [
  {
    key: "account",
    header: "Account",
    cell: (row) => (
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="font-medium">{row.account.display_name}</span>
        {row.account.is_own ? <Badge>Own</Badge> : null}
      </div>
    ),
  },
  { key: "platform", header: "Platform", cell: (row) => formatLabel(row.account.platform) },
  {
    key: "followers",
    header: "Followers",
    align: "end",
    cell: (row) => formatCompact(row.account.followers_count),
  },
  {
    key: "posts-per-day",
    header: "Posts / day",
    align: "end",
    cell: (row) => POSTS_PER_DAY_FORMAT.format(row.posts_per_day),
  },
  {
    key: "score",
    header: "Median engagement",
    align: "end",
    cell: (row) => formatPercent(row.median_engagement_score),
  },
  ...PUBLIC_METRICS.map((metric): Column<CompetitorComparison> => ({
    key: metric,
    header: `Median ${METRIC_LABELS[metric].toLowerCase()}`,
    align: "end",
    cell: (row) => formatCompact(row[MEDIAN_FIELD[metric]] as number),
  })),
];

interface CompetitorTableProps {
  rows: CompetitorComparison[];
}

export function CompetitorTable({ rows }: CompetitorTableProps) {
  return (
    <DataTable
      caption="Accounts compared on public metrics at 72 hours"
      columns={COLUMNS}
      rows={rows}
      rowKey={(row) => row.account.id}
      rowClassName={(row) => (row.account.is_own ? "bg-muted/50" : undefined)}
    />
  );
}
