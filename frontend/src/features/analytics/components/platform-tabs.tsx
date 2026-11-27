import { SegmentedLinks } from "@/components/navigation/segmented-links";
import { platformValues } from "@/lib/api/schema";
import { formatLabel } from "@/lib/format";

import type { Platform } from "../types";

interface PlatformTabsProps {
  basePath: string;
  active: Platform | undefined;
}

export function PlatformTabs({ basePath, active }: PlatformTabsProps) {
  return (
    <SegmentedLinks
      id="platform"
      label="Platform"
      items={[
        { label: "All platforms", href: basePath, active: active === undefined },
        ...platformValues.map((platform) => ({
          label: formatLabel(platform),
          href: `${basePath}?platform=${platform}`,
          active: active === platform,
        })),
      ]}
    />
  );
}
