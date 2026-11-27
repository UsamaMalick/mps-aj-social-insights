import Link from "next/link";

import { recommendationStatusValues } from "@/lib/api/schema";
import { formatLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

import { ALL_STATUSES, DEFAULT_STATUS } from "../search-params";
import type { RecommendationStatus } from "../types";

interface StatusTabsProps {
  active: RecommendationStatus | undefined;
}

export function StatusTabs({ active }: StatusTabsProps) {
  const tabs = [
    ...recommendationStatusValues.map((status) => ({
      label: formatLabel(status),
      value: status as RecommendationStatus | undefined,
      href: status === DEFAULT_STATUS ? "/recommendations" : `/recommendations?status=${status}`,
    })),
    { label: "All", value: undefined, href: `/recommendations?status=${ALL_STATUSES}` },
  ];

  return (
    <nav aria-label="Status" className="bg-muted inline-flex rounded-lg p-1 text-sm">
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          aria-current={tab.value === active ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 font-medium transition-colors",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
            tab.value === active
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
