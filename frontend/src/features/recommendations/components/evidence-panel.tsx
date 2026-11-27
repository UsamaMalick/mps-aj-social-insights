import { InlineBar } from "@/components/data/inline-bar";
import { formatInteger, formatLift, formatPercent } from "@/lib/format";

import type { Evidence } from "../types";

interface EvidencePanelProps {
  evidence: Evidence;
  segmentLabel: string;
}

/** The numbers behind a recommendation: segment vs baseline, lift and sample sizes. */
export function EvidencePanel({ evidence, segmentLabel }: EvidencePanelProps) {
  const top = Math.max(evidence.segment_value, evidence.baseline_value);
  const isGap = evidence.own_share != null && evidence.competitor_share != null;

  return (
    <div className="border-rule grid gap-6 border-t pt-5 sm:grid-cols-[1fr_auto]">
      <div className="space-y-3">
        <p className="eyebrow">Evidence · measured {evidence.snapshot_hours}h after posting</p>
        <div className="grid grid-cols-[minmax(0,11rem)_1fr_3.5rem] items-center gap-x-3 gap-y-2 text-sm">
          <span className="truncate" title={segmentLabel}>
            {segmentLabel}
          </span>
          <InlineBar
            ratio={top > 0 ? evidence.segment_value / top : 0}
            emphasis="own"
            label={`${segmentLabel}: ${formatPercent(evidence.segment_value)} median engagement`}
          />
          <span className="tabular text-end font-medium">
            {formatPercent(evidence.segment_value)}
          </span>
          <span className="text-ink-2 truncate">Other posts</span>
          <InlineBar
            ratio={top > 0 ? evidence.baseline_value / top : 0}
            emphasis="rival"
            label={`Other posts: ${formatPercent(evidence.baseline_value)} median engagement`}
          />
          <span className="text-ink-2 tabular text-end">
            {formatPercent(evidence.baseline_value)}
          </span>
        </div>
        <p className="text-ink-2 text-xs">
          {formatInteger(evidence.sample_size)} posts vs{" "}
          {formatInteger(evidence.baseline_sample_size)}
          {isGap
            ? ` · used in ${formatPercent(evidence.own_share)} of Al Jazeera posts vs ${formatPercent(evidence.competitor_share)} of competitors'`
            : ""}
          . Compared within each account.
        </p>
      </div>
      <div className="sm:border-rule sm:border-s sm:ps-6 sm:text-end">
        <p className="eyebrow">Lift</p>
        <p className="font-serif text-4xl leading-none">{formatLift(evidence.lift)}</p>
      </div>
    </div>
  );
}
