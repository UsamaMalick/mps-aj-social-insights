/**
 * Labels and colours for metrics, defined once for every chart and table.
 * Competitor views must only use PUBLIC_METRICS (never clicks, reach or saves).
 */

export const PUBLIC_METRICS = ["likes", "comments", "shares", "views"] as const;
export const OWN_ONLY_METRICS = ["saves", "reach", "clicks"] as const;

export type PublicMetric = (typeof PUBLIC_METRICS)[number];
export type OwnOnlyMetric = (typeof OWN_ONLY_METRICS)[number];

export const METRIC_LABELS: Record<PublicMetric | OwnOnlyMetric, string> = {
  likes: "Likes",
  comments: "Comments",
  shares: "Shares",
  views: "Views",
  saves: "Saves",
  reach: "Reach",
  clicks: "Clicks",
};

export const ENGAGEMENT_SCORE_LABEL = "Engagement score";
export const ENGAGEMENT_SCORE_HINT = "(likes + comments + shares) ÷ followers, at 72h";
export const LIFT_HINT = "Compared with the median post of the same account";

export const SERIES_COLORS = {
  own: "var(--chart-own)",
  competitor: "var(--chart-competitor)",
} as const;
