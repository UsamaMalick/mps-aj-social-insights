import { InlineBar } from "@/components/data/inline-bar";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { interpolate } from "@/i18n/interpolate";
import { createFormat } from "@/lib/format";

import type { Evidence } from "../types";

interface EvidencePanelProps {
  evidence: Evidence;
  segmentLabel: string;
  locale: Locale;
}

/** The numbers behind a recommendation: segment vs baseline, lift and sample sizes. */
export function EvidencePanel({ evidence, segmentLabel, locale }: EvidencePanelProps) {
  const t = getDictionary(locale).recommendations;
  const fmt = createFormat(locale);
  const top = Math.max(evidence.segment_value, evidence.baseline_value);
  const isGap = evidence.own_share != null && evidence.competitor_share != null;
  const details = [
    interpolate(t.sample, {
      segment: fmt.integer(evidence.sample_size),
      baseline: fmt.integer(evidence.baseline_sample_size),
    }),
    ...(isGap
      ? [
          interpolate(t.gapUsage, {
            own: fmt.percent(evidence.own_share),
            rivals: fmt.percent(evidence.competitor_share),
          }),
        ]
      : []),
    t.withinAccount,
  ];

  return (
    <div className="border-rule grid gap-6 border-t pt-5 sm:grid-cols-[1fr_auto]">
      <div className="space-y-3">
        <p className="eyebrow">
          {interpolate(t.evidenceEyebrow, { hours: fmt.integer(evidence.snapshot_hours) })}
        </p>
        <div className="grid grid-cols-[minmax(0,11rem)_1fr_3.5rem] items-center gap-x-3 gap-y-2 text-sm">
          <span className="truncate" title={segmentLabel}>
            {segmentLabel}
          </span>
          <InlineBar
            ratio={top > 0 ? evidence.segment_value / top : 0}
            emphasis="own"
            label={interpolate(t.medianBarLabel, {
              label: segmentLabel,
              value: fmt.percent(evidence.segment_value),
            })}
          />
          <span className="tabular text-end font-medium">
            {fmt.percent(evidence.segment_value)}
          </span>
          <span className="text-ink-2 truncate">{t.otherPosts}</span>
          <InlineBar
            ratio={top > 0 ? evidence.baseline_value / top : 0}
            emphasis="rival"
            label={interpolate(t.medianBarLabel, {
              label: t.otherPosts,
              value: fmt.percent(evidence.baseline_value),
            })}
          />
          <span className="text-ink-2 tabular text-end">
            {fmt.percent(evidence.baseline_value)}
          </span>
        </div>
        <p className="text-ink-2 text-xs">{details.join(" · ")}</p>
      </div>
      <div className="sm:border-rule sm:border-s sm:ps-6 sm:text-end">
        <p className="eyebrow">{t.lift}</p>
        <p className="font-serif text-4xl leading-none">{fmt.lift(evidence.lift)}</p>
      </div>
    </div>
  );
}
