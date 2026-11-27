import { SegmentedLinks } from "@/components/navigation/segmented-links";
import { recommendationStatusValues } from "@/lib/api/schema";
import { formatLabel } from "@/lib/format";

import { ALL_STATUSES, DEFAULT_STATUS } from "../search-params";
import type { RecommendationStatus } from "../types";

interface StatusTabsProps {
  active: RecommendationStatus | undefined;
}

export function StatusTabs({ active }: StatusTabsProps) {
  return (
    <SegmentedLinks
      id="status"
      label="Status"
      items={[
        ...recommendationStatusValues.map((status) => ({
          label: formatLabel(status),
          href:
            status === DEFAULT_STATUS ? "/recommendations" : `/recommendations?status=${status}`,
          active: active === status,
        })),
        {
          label: "All",
          href: `/recommendations?status=${ALL_STATUSES}`,
          active: active === undefined,
        },
      ]}
    />
  );
}
