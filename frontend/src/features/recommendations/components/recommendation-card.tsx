import { segmentName } from "@/features/analytics/segments";
import { formatDate, formatLabel } from "@/lib/format";

import type { Recommendation } from "../types";
import { EvidencePanel } from "./evidence-panel";

const SOURCE_LABELS = { llm: "Written by AI from the numbers", template: "Template" } as const;

interface RecommendationCardProps {
  recommendation: Recommendation;
  actions?: React.ReactNode;
}

export function RecommendationCard({ recommendation, actions }: RecommendationCardProps) {
  const { evidence } = recommendation;
  const isGap = evidence.own_share != null;

  return (
    <article className="border-rule space-y-5 border-t py-8 first:border-t-0 first:pt-0">
      <header className="space-y-2">
        <p className="eyebrow">
          {formatLabel(recommendation.category)}
          {isGap ? " · content gap" : ""}
          {recommendation.status !== "new" ? ` · ${formatLabel(recommendation.status)}` : ""}
        </p>
        <h2 className="font-serif text-headline max-w-3xl tracking-tight text-balance">
          {recommendation.title}
        </h2>
      </header>
      <p className="max-w-[62ch] text-[1.0625rem] leading-relaxed">{recommendation.suggestion}</p>
      <EvidencePanel
        evidence={evidence}
        segmentLabel={segmentName(evidence.dimension, evidence.segment)}
      />
      <footer className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-ink-2 text-xs">
          {SOURCE_LABELS[recommendation.source]} · {formatDate(recommendation.created_at)} · an
          editor makes the final call
        </p>
        {actions}
      </footer>
    </article>
  );
}
