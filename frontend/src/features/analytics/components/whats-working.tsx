import { formatInteger, formatLift } from "@/lib/format";

import { DIMENSION_NAMES, segmentName } from "../segments";
import type { SegmentPattern } from "../types";

interface WhatsWorkingProps {
  /** Strongest first, as returned by the API. */
  highlights: SegmentPattern[];
}

export function WhatsWorking({ highlights }: WhatsWorkingProps) {
  return (
    <section aria-labelledby="working-heading" className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="working-heading" className="font-serif text-title">
          What&rsquo;s working
        </h2>
        <p className="eyebrow">vs other posts, same account</p>
      </div>
      {highlights.length === 0 ? (
        <p className="text-ink-2 text-sm">No pattern is strong enough to call yet.</p>
      ) : (
        <dl className="divide-rule border-rule divide-y border-y">
          {highlights.map((h) => (
            <div key={h.dimension} className="flex items-baseline justify-between gap-4 py-3">
              <div>
                <dt className="eyebrow">{DIMENSION_NAMES[h.dimension]}</dt>
                <dd className="mt-0.5 text-[0.9375rem]">{segmentName(h.dimension, h.segment)}</dd>
              </div>
              <dd className="text-end">
                <span className="font-serif text-2xl leading-none">
                  {formatLift(h.lift_vs_rest)}
                </span>
                <span className="text-ink-2 tabular block text-xs">
                  {formatInteger(h.post_count)} posts
                </span>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
