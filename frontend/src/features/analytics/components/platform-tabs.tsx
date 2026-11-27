import Link from "next/link";

import { platformValues } from "@/lib/api/schema";
import { formatLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { Platform } from "../types";

interface PlatformTabsProps {
  basePath: string;
  active: Platform | undefined;
}

export function PlatformTabs({ basePath, active }: PlatformTabsProps) {
  const tabs = [
    { label: "All platforms", href: basePath, value: undefined },
    ...platformValues.map((platform) => ({
      label: formatLabel(platform),
      href: `${basePath}?platform=${platform}`,
      value: platform,
    })),
  ];

  return (
    <nav aria-label="Platform" className="bg-muted inline-flex rounded-lg p-1 text-sm">
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
