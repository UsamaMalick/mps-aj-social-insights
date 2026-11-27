import { intlLocales, type Locale } from "@/i18n/config";

const EMPTY = "—";
// Engagement rates (typically 0.3%–8%) always get two decimals so they line up and compare
// at a glance (0.86%, 1.01%, 6.00%); larger shares read better with at most one (22%).
const TWO_DECIMALS_BELOW = 0.1;

type Numeric = number | null | undefined;

function isMissing(value: Numeric): value is null | undefined {
  return value === null || value === undefined || Number.isNaN(value);
}

export interface Format {
  /** 12_400 → "12.4K" / "12.4 ألف" */
  compact: (value: Numeric) => string;
  /** 12_400 → "12,400" */
  integer: (value: Numeric) => string;
  /** A ratio → two decimals below 10% ("0.52%"), otherwise at most one ("22%"). */
  percent: (value: Numeric) => string;
  /** A lift ratio (1.85) → "1.85×" */
  lift: (value: Numeric) => string;
  /** One decimal at most, e.g. posts per day: 3.4 */
  decimal: (value: Numeric) => string;
  /** ISO string → "3 Mar 2026" / "3 مارس 2026" (UTC) */
  date: (value: string | null | undefined) => string;
}

const cache = new Map<Locale, Format>();

const LRM = /\u200e/g;
const RLM = "\u200f";

/**
 * In Arabic the sign follows the number in reading order, so in right-to-left text it sits
 * to the left of the digits ("%0.60", like "٪٦٠"). Intl's left-to-right marks make the side
 * depend on the surrounding words; a right-to-left mark before the sign makes it consistent.
 */
function signAfterNumberRtl(text: string, sign: string): string {
  return text.replace(LRM, "").replace(sign, `${RLM}${sign}`);
}

/** All number and date formatting for one language. Pure, so client components can use it. */
export function createFormat(locale: Locale): Format {
  const cached = cache.get(locale);
  if (cached) return cached;

  const { numbers, dates } = intlLocales(locale);
  const compact = new Intl.NumberFormat(numbers, { notation: "compact", maximumFractionDigits: 1 });
  const integer = new Intl.NumberFormat(numbers, { maximumFractionDigits: 0 });
  const smallPercent = new Intl.NumberFormat(numbers, {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const percent = new Intl.NumberFormat(numbers, { style: "percent", maximumFractionDigits: 1 });
  const lift = new Intl.NumberFormat(numbers, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const decimal = new Intl.NumberFormat(numbers, { maximumFractionDigits: 1 });
  const date = new Intl.DateTimeFormat(dates, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  const rtl = locale === "ar";
  const formatPercent = (v: number) =>
    (Math.abs(v) < TWO_DECIMALS_BELOW ? smallPercent : percent).format(v);

  const format: Format = {
    compact: (v) => (isMissing(v) ? EMPTY : compact.format(v)),
    integer: (v) => (isMissing(v) ? EMPTY : integer.format(v)),
    percent: (v) => {
      if (isMissing(v)) return EMPTY;
      return rtl ? signAfterNumberRtl(formatPercent(v), "%") : formatPercent(v);
    },
    lift: (v) => {
      if (isMissing(v)) return EMPTY;
      const text = `${lift.format(v)}×`;
      return rtl ? signAfterNumberRtl(text, "×") : text;
    },
    decimal: (v) => (isMissing(v) ? EMPTY : decimal.format(v)),
    date: (v) => (v ? date.format(new Date(v)) : EMPTY),
  };
  cache.set(locale, format);
  return format;
}
