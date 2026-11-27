import { EmptyState } from "@/components/data/empty-state";

import { listRecommendations } from "../api";
import { parseStatus } from "../search-params";
import { ReviewList } from "./review-list";
import { StatusTabs } from "./status-tabs";

interface RecommendationsViewProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function RecommendationsView({ searchParams }: RecommendationsViewProps) {
  const status = parseStatus(await searchParams);
  const recommendations = await listRecommendations(status);

  return (
    <div className="space-y-8">
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
        <ReviewList recommendations={recommendations} removeOnReview={status === "new"} />
      )}
    </div>
  );
}
