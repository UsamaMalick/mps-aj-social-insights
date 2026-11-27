import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { interpolate } from "@/i18n/interpolate";
import type { Format } from "@/lib/format";

import { segmentName } from "./segments";
import type { OverviewTotals, SegmentPattern } from "./types";

const WINS_IN_HEADLINE = 2;

/**
 * The briefing's lead sentence, written from backend numbers (no ranking here: highlights
 * arrive strongest-first from the API).
 */
export function briefingHeadline(
  locale: Locale,
  t: Dictionary,
  fmt: Format,
  totals: OverviewTotals,
  highlights: SegmentPattern[],
): string {
  const own = totals.own_median_engagement_score;
  const rivals = totals.competitor_median_engagement_score;
  const sentences: string[] = [];
  if (own !== null && rivals !== null) {
    const template = own < rivals ? t.briefing.competitorsAhead : t.briefing.ownAhead;
    sentences.push(interpolate(template, { own: fmt.percent(own), rivals: fmt.percent(rivals) }));
  }
  const wins = highlights
    .slice(0, WINS_IN_HEADLINE)
    .map((h) => segmentName(t, h.dimension, h.segment));
  if (wins.length === 1) sentences.push(interpolate(t.briefing.oneWin, { first: wins[0] }));
  if (wins.length === 2) {
    const second = locale === "en" ? lowerFirst(wins[1]) : wins[1];
    sentences.push(interpolate(t.briefing.twoWins, { first: wins[0], second }));
  }
  return sentences.join(" ");
}

function lowerFirst(text: string): string {
  // Mid-sentence in English; keep proper nouns like "Arabic" capitalised.
  return /^(Arabic|English)\b/.test(text) ? text : text.charAt(0).toLowerCase() + text.slice(1);
}
