import { EmptyState } from "@/components/data/empty-state";

import { listRecommendations } from "../api";
import { parseStatus } from "../search-params";
import { RecommendationCard } from "./recommendation-card";
import { StatusTabs } from "./status-tabs";

interface RecommendationsViewProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function RecommendationsView({ searchParams }: RecommendationsViewProps) {
  const status = parseStatus(await searchParams);
  const recommendations = await listRecommendations(status);

  return (
    <>
      <StatusTabs active={status} />
      {recommendations.length === 0 ? (
        <EmptyState
          title={status === "new" ? "No new recommendations" : "Nothing here"}
          description={
            status === "new"
              ? "Generate recommendations to turn the latest engagement patterns into suggestions."
              : "Recommendations you accept or dismiss appear here."
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {recommendations.map((recommendation) => (
            <RecommendationCard key={recommendation.id} recommendation={recommendation} />
          ))}
        </div>
      )}
    </>
  );
}
