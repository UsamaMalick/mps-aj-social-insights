import { formatInteger, formatLift, formatPercent } from "@/lib/format";

import type { Evidence } from "../types";

interface EvidencePanelProps {
  evidence: Evidence;
}

export function EvidencePanel({ evidence }: EvidencePanelProps) {
  const rows: { label: string; value: string }[] = [
    { label: "Lift", value: formatLift(evidence.lift) },
    {
      label: "Median engagement",
      value: `${formatPercent(evidence.segment_value)} vs ${formatPercent(evidence.baseline_value)}`,
    },
    {
      label: "Sample",
      value: `${formatInteger(evidence.sample_size)} posts vs ${formatInteger(
        evidence.baseline_sample_size,
      )}`,
    },
    { label: "Measured at", value: `${evidence.snapshot_hours}h after posting` },
  ];
  if (evidence.own_share != null && evidence.competitor_share != null) {
    rows.push({
      label: "Usage",
      value: `Al Jazeera ${formatPercent(evidence.own_share)} · competitors ${formatPercent(
        evidence.competitor_share,
      )}`,
    });
  }

  return (
    <div className="bg-muted/50 rounded-md p-3 text-sm">
      <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
        Evidence
      </p>
      <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-[auto_1fr]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-muted-foreground mt-2 text-xs">
        Baseline: {evidence.baseline}. {evidence.notes}
      </p>
    </div>
  );
}
