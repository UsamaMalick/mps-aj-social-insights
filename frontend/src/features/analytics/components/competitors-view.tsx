import { EmptyState } from "@/components/data/empty-state";

import { getCompetitorComparison } from "../api";
import { parseCompetitorsPlatform } from "../competitors-params";
import { CompetitorTable } from "./competitor-table";
import { EngagementByAccountChart } from "./engagement-by-account-chart";
import { PlatformTabs } from "./platform-tabs";

interface CompetitorsViewProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function CompetitorsView({ searchParams }: CompetitorsViewProps) {
  const platform = parseCompetitorsPlatform(await searchParams);
  const rows = await getCompetitorComparison(platform);

  return (
    <>
      <PlatformTabs basePath="/competitors" active={platform} />
      {rows.length === 0 ? (
        <EmptyState title="No accounts to compare" description="Run `make seed` first." />
      ) : (
        <>
          <EngagementByAccountChart rows={rows} title="Median engagement by account" />
          <CompetitorTable rows={rows} />
        </>
      )}
    </>
  );
}
