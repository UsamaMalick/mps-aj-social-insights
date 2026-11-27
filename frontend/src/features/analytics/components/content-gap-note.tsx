import { formatLift, formatPercent } from "@/lib/format";

import { segmentName } from "../segments";
import type { ContentGap } from "../types";

interface ContentGapNoteProps {
  gaps: ContentGap[];
}

export function ContentGapNote({ gaps }: ContentGapNoteProps) {
  if (gaps.length === 0) return null;
  return (
    <aside aria-label="Content gaps" className="bg-paper-2 paper-grain space-y-3 rounded-lg p-6">
      <p className="eyebrow">Content gap</p>
      {gaps.map((gap) => (
        <p key={`${gap.dimension}-${gap.segment}`} className="font-serif text-xl leading-snug">
          {segmentName(gap.dimension, gap.segment)} make up{" "}
          <span className="tabular">{formatPercent(gap.competitor_share)}</span> of
          competitors&rsquo; posts but only{" "}
          <span className="tabular">{formatPercent(gap.own_share)}</span> of Al Jazeera&rsquo;s, and
          earn {formatLift(gap.lift_vs_rest)} the engagement.
        </p>
      ))}
    </aside>
  );
}
