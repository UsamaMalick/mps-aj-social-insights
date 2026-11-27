"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import type { Locale } from "@/i18n/config";
import { createFormat } from "@/lib/format";

export type NumberFormat = "compact" | "integer" | "percent";

interface AnimatedNumberProps {
  value: number;
  format: NumberFormat;
  locale: Locale;
}

/**
 * Counts up to `value` once when it scrolls into view (Motion Primitives "number ticker").
 * The final text is server-rendered, so there is no layout shift, and nothing moves when
 * the user prefers reduced motion.
 */
export function AnimatedNumber({ value, format, locale }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduceMotion = useReducedMotion();
  const formatter = createFormat(locale)[format];
  const finalText = formatter(value);

  useEffect(() => {
    const node = ref.current;
    if (!inView || reduceMotion || node === null) return;
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        node.textContent = formatter(latest);
      },
      onComplete: () => {
        node.textContent = finalText;
      },
    });
    return () => controls.stop();
  }, [inView, reduceMotion, value, formatter, finalText]);

  return (
    <span ref={ref} className="tabular">
      {finalText}
    </span>
  );
}
