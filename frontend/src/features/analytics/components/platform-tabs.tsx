import { SegmentedLinks } from "@/components/navigation/segmented-links";
import { enumLabel } from "@/i18n/labels";
import type { I18n } from "@/i18n/server";
import { platformValues } from "@/lib/api/schema";

import type { Platform } from "../types";

interface PlatformTabsProps {
  basePath: string;
  active: Platform | undefined;
  i18n: I18n;
}

export function PlatformTabs({ basePath, active, i18n: { t } }: PlatformTabsProps) {
  return (
    <SegmentedLinks
      id="platform"
      label={t.competitors.platformLabel}
      items={[
        { label: t.competitors.allPlatforms, href: basePath, active: active === undefined },
        ...platformValues.map((platform) => ({
          label: enumLabel(t, "platform", platform),
          href: `${basePath}?platform=${platform}`,
          active: active === platform,
        })),
      ]}
    />
  );
}
