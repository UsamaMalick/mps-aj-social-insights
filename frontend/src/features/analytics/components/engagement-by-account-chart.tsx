import { BarChartCard, type BarDatum } from "@/components/charts/bar-chart-card";
import { formatAccountName } from "@/lib/format";

import { ENGAGEMENT_SCORE_HINT, ENGAGEMENT_SCORE_LABEL, SERIES_COLORS } from "../metrics";

interface AccountScore {
  account: { display_name: string; platform: string; is_own: boolean };
  median_engagement_score: number;
}

interface EngagementByAccountChartProps {
  rows: AccountScore[];
  title?: string;
}

export function EngagementByAccountChart({
  rows,
  title = "Al Jazeera vs competitors",
}: EngagementByAccountChartProps) {
  // Rows arrive ranked by engagement from the API.
  const data: BarDatum[] = rows.map((row) => ({
    label: `${formatAccountName(row.account.display_name, row.account.platform)}${
      row.account.is_own ? " (own)" : ""
    }`,
    value: row.median_engagement_score,
    color: row.account.is_own ? SERIES_COLORS.own : SERIES_COLORS.competitor,
    note: row.account.is_own ? "Al Jazeera" : "Competitor",
  }));

  return (
    <BarChartCard
      title={title}
      description={`Median ${ENGAGEMENT_SCORE_LABEL.toLowerCase()} per account: ${ENGAGEMENT_SCORE_HINT}`}
      data={data}
      valueLabel={ENGAGEMENT_SCORE_LABEL}
      valueFormat="percent"
      legend={[
        { label: "Al Jazeera (own)", color: SERIES_COLORS.own },
        { label: "Competitor", color: SERIES_COLORS.competitor },
      ]}
    />
  );
}
