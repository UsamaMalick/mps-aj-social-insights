import { SegmentedLinks } from "@/components/navigation/segmented-links";
import { enumLabel } from "@/i18n/labels";
import type { I18n } from "@/i18n/server";
import { recommendationStatusValues } from "@/lib/api/schema";

import { ALL_STATUSES, DEFAULT_STATUS } from "../search-params";
import type { RecommendationStatus } from "../types";

interface StatusTabsProps {
  active: RecommendationStatus | undefined;
  i18n: I18n;
}

export function StatusTabs({ active, i18n: { locale, t } }: StatusTabsProps) {
  const base = `/${locale}/recommendations`;
  return (
    <SegmentedLinks
      id="status"
      label={t.recommendations.statusLabel}
      items={[
        ...recommendationStatusValues.map((status) => ({
          label: enumLabel(t, "status", status),
          href: status === DEFAULT_STATUS ? base : `${base}?status=${status}`,
          active: active === status,
        })),
        {
          label: t.recommendations.statusAll,
          href: `${base}?status=${ALL_STATUSES}`,
          active: active === undefined,
        },
      ]}
    />
  );
}
