"use client";

import { motion } from "motion/react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export interface SegmentLink {
  label: string;
  href: string;
  active: boolean;
}

interface SegmentedLinksProps {
  /** Unique per page: keys the sliding indicator animation. */
  id: string;
  label: string;
  items: SegmentLink[];
}

/** URL-driven segmented control; the active segment slides like a physical switch. */
export function SegmentedLinks({ id, label, items }: SegmentedLinksProps) {
  return (
    <nav aria-label={label} className="bg-paper-2 inline-flex rounded-md p-1 text-sm">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          scroll={false}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "focus-visible:ring-ring relative rounded-sm px-3.5 py-1.5 whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none",
            item.active ? "text-ink font-medium" : "text-ink-2 hover:text-ink",
          )}
        >
          {item.active ? (
            <motion.span
              layoutId={`segment-${id}`}
              className="bg-paper border-rule absolute inset-0 rounded-sm border"
              transition={{ type: "tween", duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : null}
          <span className="relative">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
