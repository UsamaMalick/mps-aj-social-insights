/**
 * Metric groups, defined once for every table. Labels live in the dictionaries
 * (`enums.metric`). Competitor views must only use PUBLIC_METRICS (never clicks, reach or
 * saves).
 */

export const PUBLIC_METRICS = ["likes", "comments", "shares", "views"] as const;
export const OWN_ONLY_METRICS = ["saves", "reach", "clicks"] as const;

export type PublicMetric = (typeof PUBLIC_METRICS)[number];
export type OwnOnlyMetric = (typeof OWN_ONLY_METRICS)[number];
