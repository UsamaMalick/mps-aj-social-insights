import { EmptyState } from "@/components/data/empty-state";

import { getCompetitorComparison } from "../api";
import { parseCompetitorsPlatform } from "../competitors-params";
import { CompetitorTable } from "./competitor-table";
import { PlatformTabs } from "./platform-tabs";

interface CompetitorsViewProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function CompetitorsView({ searchParams }: CompetitorsViewProps) {
  const platform = parseCompetitorsPlatform(await searchParams);
  const rows = await getCompetitorComparison(platform);

  return (
    <div className="space-y-6">
      <PlatformTabs basePath="/competitors" active={platform} />
      {rows.length === 0 ? (
        <EmptyState title="No accounts to compare" description="Run `make seed` first." />
      ) : (
        <CompetitorTable rows={rows} />
      )}
    </div>
  );
}
