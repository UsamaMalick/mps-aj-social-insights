import { interpolate } from "@/i18n/interpolate";
import type { I18n } from "@/i18n/server";

import { segmentName } from "../segments";
import type { ContentGap } from "../types";

interface ContentGapNoteProps {
  gaps: ContentGap[];
  i18n: I18n;
}

export function ContentGapNote({ gaps, i18n: { t, fmt } }: ContentGapNoteProps) {
  if (gaps.length === 0) return null;
  return (
    <aside
      aria-label={t.briefing.gapLabel}
      className="bg-paper-2 paper-grain space-y-3 rounded-lg p-6"
    >
      <p className="eyebrow">{t.briefing.gapEyebrow}</p>
      {gaps.map((gap) => (
        <p key={`${gap.dimension}-${gap.segment}`} className="font-serif text-xl leading-snug">
          {interpolate(t.briefing.gapSentence, {
            segment: segmentName(t, gap.dimension, gap.segment),
            rivals: fmt.percent(gap.competitor_share),
            own: fmt.percent(gap.own_share),
            lift: fmt.lift(gap.lift_vs_rest),
          })}
        </p>
      ))}
    </aside>
  );
}
