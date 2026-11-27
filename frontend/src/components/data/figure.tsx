import type { ReactNode } from "react";

import { AnimatedNumber, type NumberFormat } from "@/components/motion/animated-number";
import type { Locale } from "@/i18n/config";

interface FigureProps {
  label: string;
  value: number | null;
  format: NumberFormat;
  locale: Locale;
  /** Optional comparison shown next to the number, e.g. "vs 0.60% competitors". */
  aside?: ReactNode;
  note?: ReactNode;
}

/** A headline number set in the serif, editorial style; not a card. */
export function Figure({ label, value, format, locale, aside, note }: FigureProps) {
  return (
    <div className="space-y-2">
      <p className="eyebrow">{label}</p>
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-serif text-display tracking-tight">
          {value === null ? "—" : <AnimatedNumber value={value} format={format} locale={locale} />}
        </span>
        {aside ? <span className="text-ink-2 text-sm">{aside}</span> : null}
      </p>
      {note ? <p className="text-ink-2 max-w-xs text-sm leading-snug">{note}</p> : null}
    </div>
  );
}
