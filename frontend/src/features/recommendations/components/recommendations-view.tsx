import { EmptyState } from "@/components/data/empty-state";
import { getI18n } from "@/i18n/server";

import { listRecommendations } from "../api";
import { parseStatus } from "../search-params";
import { ReviewList } from "./review-list";
import { StatusTabs } from "./status-tabs";

interface RecommendationsViewProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function RecommendationsView({ searchParams }: RecommendationsViewProps) {
  const i18n = await getI18n();
  const { t } = i18n;
  const status = parseStatus(await searchParams);
  const recommendations = await listRecommendations(status);

  return (
    <div className="space-y-8">
      <StatusTabs active={status} i18n={i18n} />
      {recommendations.length === 0 ? (
        <EmptyState
          title={
            status === "new" ? t.recommendations.emptyNewTitle : t.recommendations.emptyOtherTitle
          }
          description={
            status === "new" ? t.recommendations.emptyNewBody : t.recommendations.emptyOtherBody
          }
        />
      ) : (
        <ReviewList
          recommendations={recommendations}
          removeOnReview={status === "new"}
          locale={i18n.locale}
        />
      )}
    </div>
  );
}
