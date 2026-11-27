import type { ReactNode } from "react";

import { segmentName } from "@/features/analytics/segments";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { enumLabel } from "@/i18n/labels";
import { createFormat } from "@/lib/format";

import type { Recommendation } from "../types";
import { EvidencePanel } from "./evidence-panel";

interface RecommendationCardProps {
  recommendation: Recommendation;
  locale: Locale;
  actions?: ReactNode;
}

/** The wording in the reader's language (Arabic falls back to English if a row lacks it). */
function wording(recommendation: Recommendation, locale: Locale) {
  const arabic =
    locale === "ar" && recommendation.title_ar && recommendation.suggestion_ar
      ? { title: recommendation.title_ar, suggestion: recommendation.suggestion_ar }
      : null;
  return arabic
    ? { ...arabic, lang: "ar" }
    : { title: recommendation.title, suggestion: recommendation.suggestion, lang: "en" };
}

export function RecommendationCard({ recommendation, locale, actions }: RecommendationCardProps) {
  const t = getDictionary(locale);
  const fmt = createFormat(locale);
  const { evidence } = recommendation;
  const isGap = evidence.own_share != null;
  const text = wording(recommendation, locale);
  const meta = [
    enumLabel(t, "category", recommendation.category),
    ...(isGap ? [t.recommendations.contentGap] : []),
    ...(recommendation.status !== "new" ? [enumLabel(t, "status", recommendation.status)] : []),
  ];
  const source =
    recommendation.source === "llm"
      ? t.recommendations.sourceLlm
      : t.recommendations.sourceTemplate;

  return (
    <article className="border-rule space-y-5 border-t py-8 first:border-t-0 first:pt-0">
      <header className="space-y-2">
        <p className="eyebrow">{meta.join(" · ")}</p>
        <h2
          lang={text.lang}
          className="font-serif text-headline max-w-3xl tracking-tight text-balance"
        >
          {text.title}
        </h2>
      </header>
      <p
        lang={text.lang}
        // Arabic letters are narrower than "0", so `ch` lets lines run long; cap by width instead.
        className="max-w-[62ch] text-[1.0625rem] leading-relaxed [&:lang(ar)]:max-w-[32rem]"
      >
        {text.suggestion}
      </p>
      <EvidencePanel
        evidence={evidence}
        segmentLabel={segmentName(t, evidence.dimension, evidence.segment)}
        locale={locale}
      />
      <footer className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-ink-2 text-xs">
          {source} · {fmt.date(recommendation.created_at)} · {t.recommendations.editorNote}
        </p>
        {actions}
      </footer>
    </article>
  );
}
