import { interpolate } from "@/i18n/interpolate";
import type { I18n } from "@/i18n/server";

import { dimensionName, segmentName } from "../segments";
import type { SegmentPattern } from "../types";

interface WhatsWorkingProps {
  /** Strongest first, as returned by the API. */
  highlights: SegmentPattern[];
  i18n: I18n;
}

export function WhatsWorking({ highlights, i18n: { t, fmt } }: WhatsWorkingProps) {
  return (
    <section aria-labelledby="working-heading" className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="working-heading" className="font-serif text-title">
          {t.briefing.workingHeading}
        </h2>
        <p className="eyebrow">{t.briefing.workingMeta}</p>
      </div>
      {highlights.length === 0 ? (
        <p className="text-ink-2 text-sm">{t.briefing.workingEmpty}</p>
      ) : (
        <dl className="divide-rule border-rule divide-y border-y">
          {highlights.map((h) => (
            <div key={h.dimension} className="flex items-baseline justify-between gap-4 py-3">
              <div>
                <dt className="eyebrow">{dimensionName(t, h.dimension)}</dt>
                <dd className="mt-0.5 text-[0.9375rem]">
                  {segmentName(t, h.dimension, h.segment)}
                </dd>
              </div>
              <dd className="text-end">
                <span className="font-serif text-2xl leading-none">{fmt.lift(h.lift_vs_rest)}</span>
                <span className="text-ink-2 tabular block text-xs">
                  {interpolate(t.briefing.workingPosts, { count: fmt.integer(h.post_count) })}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
