import "server-only";

import { api, unwrap } from "@/lib/api/client";

import type { RecommendationStatus } from "./types";

// Generation yields one recommendation per strong finding, so a single page holds them all.
const RECOMMENDATIONS_LIMIT = 100;

export async function listRecommendations(status: RecommendationStatus | undefined) {
  const page = await unwrap(
    api.GET("/api/v1/recommendations", {
      params: { query: { status, limit: RECOMMENDATIONS_LIMIT } },
    }),
  );
  return page.items;
}
