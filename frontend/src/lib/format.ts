const NUMBER_LOCALE = "en-US";
const DATE_LOCALE = "en-GB";

const compactFormatter = new Intl.NumberFormat(NUMBER_LOCALE, {
  notation: "compact",
  maximumFractionDigits: 1,
});
const integerFormatter = new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits: 0 });
// Engagement rates (typically 0.3%–8%) always get two decimals so they line up and compare
// at a glance (0.86%, 1.01%, 6.00%); larger shares read better with at most one (22%).
const TWO_DECIMALS_BELOW = 0.1;
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

/** A ratio → two decimals below 10% ("0.52%", "1.01%"), else at most one ("22%"). */
export function formatPercent(value: Numeric): string {
  if (isMissing(value)) return EMPTY;
  return Math.abs(value) < TWO_DECIMALS_BELOW
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
