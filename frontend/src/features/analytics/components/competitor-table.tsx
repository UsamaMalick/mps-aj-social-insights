import { type Column, DataTable } from "@/components/data/data-table";
import { InlineBar } from "@/components/data/inline-bar";
import { formatCompact, formatLabel, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

import { METRIC_LABELS, PUBLIC_METRICS, type PublicMetric } from "../metrics";
import type { CompetitorComparison } from "../types";

const MEDIAN_FIELD: Record<PublicMetric, keyof CompetitorComparison> = {
  likes: "median_likes",
  comments: "median_comments",
  shares: "median_shares",
  views: "median_views",
};

const POSTS_PER_DAY_FORMAT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

function columns(topScore: number, ranks: Map<string, number>): Column<CompetitorComparison>[] {
  return [
    {
      key: "rank",
      header: "#",
      className: "w-8",
      cell: (row) => <span className="text-ink-2 tabular">{ranks.get(row.account.id)}</span>,
    },
    {
      key: "account",
      header: "Account",
      cell: (row) => (
        <div className="whitespace-nowrap">
          <span className={cn(row.account.is_own && "font-semibold")}>
            {row.account.display_name}
          </span>
          <span className="text-ink-2"> · {formatLabel(row.account.platform)}</span>
          {row.account.is_own ? <span className="eyebrow ms-2">Own account</span> : null}
        </div>
      ),
    },
    {
      key: "score",
      header: "Median engagement",
      className: "min-w-56",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <InlineBar
            ratio={topScore > 0 ? row.median_engagement_score / topScore : 0}
            emphasis={row.account.is_own ? "own" : "rival"}
            label={`${formatPercent(row.median_engagement_score)} median engagement`}
          />
          <span className="tabular w-14 shrink-0 text-end font-medium">
            {formatPercent(row.median_engagement_score)}
          </span>
        </div>
      ),
    },
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
    ...PUBLIC_METRICS.map((metric): Column<CompetitorComparison> => ({
      key: metric,
      header: `Median ${METRIC_LABELS[metric].toLowerCase()}`,
      align: "end",
      cell: (row) => formatCompact(row[MEDIAN_FIELD[metric]] as number),
    })),
  ];
}

interface CompetitorTableProps {
  /** Ranked by the API, highest median engagement first. */
  rows: CompetitorComparison[];
}

export function CompetitorTable({ rows }: CompetitorTableProps) {
  const ranks = new Map(rows.map((row, index) => [row.account.id, index + 1]));
  return (
    <DataTable
      caption="Accounts ranked by median engagement, public metrics only, at 72 hours"
      columns={columns(rows[0]?.median_engagement_score ?? 0, ranks)}
      rows={rows}
      rowKey={(row) => row.account.id}
      rowClassName={(row) => (row.account.is_own ? "bg-paper-2/70" : undefined)}
    />
  );
}
