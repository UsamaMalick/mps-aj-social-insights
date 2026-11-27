import { formatPercent } from "@/lib/format";

import { segmentName } from "./segments";
import type { OverviewTotals, SegmentPattern } from "./types";

const WINS_IN_HEADLINE = 2;

/**
 * The briefing's lead sentence, written from backend numbers (no ranking here: highlights
 * arrive strongest-first from the API).
 */
export function briefingHeadline(totals: OverviewTotals, highlights: SegmentPattern[]): string {
  const own = totals.own_median_engagement_score;
  const rivals = totals.competitor_median_engagement_score;
  let comparison = "";
  if (own !== null && rivals !== null) {
    comparison =
      own < rivals
        ? `Competitors are out-engaging Al Jazeera, ${formatPercent(rivals)} to ${formatPercent(own)}.`
        : `Al Jazeera is out-engaging competitors, ${formatPercent(own)} to ${formatPercent(rivals)}.`;
  }
  const wins = highlights
    .slice(0, WINS_IN_HEADLINE)
    .map((h) => segmentName(h.dimension, h.segment));
  const winsSentence =
    wins.length === 0
      ? ""
      : wins.length === 1
        ? `${wins[0]} are the clearest win.`
        : `${wins[0]} and ${lowerFirst(wins[1])} are the clearest wins.`;
  return [comparison, winsSentence].filter(Boolean).join(" ");
}

function lowerFirst(text: string): string {
  // Keep proper nouns like "Arabic" capitalised.
  return /^(Arabic|English)\b/.test(text) ? text : text.charAt(0).toLowerCase() + text.slice(1);
}
