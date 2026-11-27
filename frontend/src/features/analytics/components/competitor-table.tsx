import { type Column, DataTable } from "@/components/data/data-table";
import { InlineBar } from "@/components/data/inline-bar";
import { interpolate } from "@/i18n/interpolate";
import { enumLabel } from "@/i18n/labels";
import type { I18n } from "@/i18n/server";
import { cn } from "@/lib/utils";

import { PUBLIC_METRICS, type PublicMetric } from "../metrics";
import type { CompetitorComparison } from "../types";

const MEDIAN_FIELD: Record<PublicMetric, keyof CompetitorComparison> = {
  likes: "median_likes",
  comments: "median_comments",
  shares: "median_shares",
  views: "median_views",
};

function columns(
  { t, fmt }: I18n,
  topScore: number,
  ranks: Map<string, number>,
): Column<CompetitorComparison>[] {
  return [
    {
      key: "rank",
      header: t.competitors.columnRank,
      className: "w-8",
      cell: (row) => (
        <span className="text-ink-2 tabular">{fmt.integer(ranks.get(row.account.id))}</span>
      ),
    },
    {
      key: "account",
      header: t.competitors.columnAccount,
      cell: (row) => (
        <div className="whitespace-nowrap">
          <span className={cn(row.account.is_own && "font-semibold")}>
            {row.account.display_name}
          </span>
          <span className="text-ink-2"> · {enumLabel(t, "platform", row.account.platform)}</span>
          {row.account.is_own ? <span className="eyebrow ms-2">{t.common.ownAccount}</span> : null}
        </div>
      ),
    },
    {
      key: "score",
      header: t.competitors.columnEngagement,
      className: "min-w-56",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <InlineBar
            ratio={topScore > 0 ? row.median_engagement_score / topScore : 0}
            emphasis={row.account.is_own ? "own" : "rival"}
            label={interpolate(t.competitors.engagementBarLabel, {
              value: fmt.percent(row.median_engagement_score),
            })}
          />
          <span className="tabular w-14 shrink-0 text-end font-medium">
            {fmt.percent(row.median_engagement_score)}
          </span>
        </div>
      ),
    },
    {
      key: "followers",
      header: t.competitors.columnFollowers,
      align: "end",
      cell: (row) => fmt.compact(row.account.followers_count),
    },
    {
      key: "posts-per-day",
      header: t.competitors.columnPostsPerDay,
      align: "end",
      cell: (row) => fmt.decimal(row.posts_per_day),
    },
    ...PUBLIC_METRICS.map((metric): Column<CompetitorComparison> => ({
      key: metric,
      header: interpolate(t.competitors.columnMedianOf, { metric: t.enums.metricLower[metric] }),
      align: "end",
      cell: (row) => fmt.compact(row[MEDIAN_FIELD[metric]] as number),
    })),
  ];
}

interface CompetitorTableProps {
  /** Ranked by the API, highest median engagement first. */
  rows: CompetitorComparison[];
  i18n: I18n;
}

export function CompetitorTable({ rows, i18n }: CompetitorTableProps) {
  const ranks = new Map(rows.map((row, index) => [row.account.id, index + 1]));
  return (
    <DataTable
      caption={i18n.t.competitors.tableCaption}
      columns={columns(i18n, rows[0]?.median_engagement_score ?? 0, ranks)}
      rows={rows}
      rowKey={(row) => row.account.id}
      rowClassName={(row) => (row.account.is_own ? "bg-paper-2/70" : undefined)}
    />
  );
}
