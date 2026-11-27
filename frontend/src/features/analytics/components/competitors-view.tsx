import { EmptyState } from "@/components/data/empty-state";
import { getI18n } from "@/i18n/server";

import { getCompetitorComparison } from "../api";
import { parseCompetitorsPlatform } from "../competitors-params";
import { CompetitorTable } from "./competitor-table";
import { PlatformTabs } from "./platform-tabs";

interface CompetitorsViewProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function CompetitorsView({ searchParams }: CompetitorsViewProps) {
  const i18n = await getI18n();
  const platform = parseCompetitorsPlatform(await searchParams);
  const rows = await getCompetitorComparison(platform);

  return (
    <div className="space-y-6">
      <PlatformTabs basePath={`/${i18n.locale}/competitors`} active={platform} i18n={i18n} />
      {rows.length === 0 ? (
        <EmptyState
          title={i18n.t.competitors.emptyTitle}
          description={i18n.t.competitors.emptyBody}
        />
      ) : (
        <CompetitorTable rows={rows} i18n={i18n} />
      )}
    </div>
  );
}
