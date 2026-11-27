const NUMBER_LOCALE = "en-US";
const DATE_LOCALE = "en-GB";

const compactFormatter = new Intl.NumberFormat(NUMBER_LOCALE, {
  notation: "compact",
  maximumFractionDigits: 1,
});
const integerFormatter = new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits: 0 });
// Engagement rates are small (0.52%), so they need two decimals; larger shares read better
// with at most one (22%, 3.4%).
const SMALL_PERCENT = 0.01;
const smallPercentFormatter = new Intl.NumberFormat(NUMBER_LOCALE, {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const percentFormatter = new Intl.NumberFormat(NUMBER_LOCALE, {
  style: "percent",
  maximumFractionDigits: 1,
});
const liftFormatter = new Intl.NumberFormat(NUMBER_LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const dateFormatter = new Intl.DateTimeFormat(DATE_LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const EMPTY = "—";

type Numeric = number | null | undefined;

function isMissing(value: Numeric): value is null | undefined {
  return value === null || value === undefined || Number.isNaN(value);
}

/** 12_400 → "12.4K" */
export function formatCompact(value: Numeric): string {
  return isMissing(value) ? EMPTY : compactFormatter.format(value);
}

/** 12_400 → "12,400" */
export function formatInteger(value: Numeric): string {
  return isMissing(value) ? EMPTY : integerFormatter.format(value);
}

/** A ratio → "0.52%" below 1%, otherwise at most one decimal ("3.4%", "22%"). */
export function formatPercent(value: Numeric): string {
  if (isMissing(value)) return EMPTY;
  return Math.abs(value) < SMALL_PERCENT
    ? smallPercentFormatter.format(value)
    : percentFormatter.format(value);
}

/** A lift ratio (1.85) → "1.85×" */
export function formatLift(value: Numeric): string {
  return isMissing(value) ? EMPTY : `${liftFormatter.format(value)}×`;
}

/** ISO string → "3 Mar 2026" (UTC) */
export function formatDate(value: string | null | undefined): string {
  return value ? dateFormatter.format(new Date(value)) : EMPTY;
}

/** "human_interest" → "Human interest" */
export function formatLabel(value: string | null | undefined): string {
  if (!value) return EMPTY;
  const spaced = value.replaceAll("_", " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** "Al Jazeera", "instagram" → "Al Jazeera · Instagram" */
export function formatAccountName(displayName: string, platform: string): string {
  return `${displayName} · ${formatLabel(platform)}`;
}
