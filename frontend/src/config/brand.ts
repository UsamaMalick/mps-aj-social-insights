/**
 * Brand colours for generated images (favicon, Apple touch icon). Those are rendered outside
 * the page, where CSS variables don't exist, so they need literal values. In the UI, use the
 * matching tokens (`--chart-own`) instead.
 */
export const BRAND_COLORS = {
  tile: "#E09A2F",
  bubble: "#FFFFFF",
} as const;
