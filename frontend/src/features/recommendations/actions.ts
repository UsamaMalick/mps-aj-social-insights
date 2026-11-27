"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { api, ApiError, unwrap } from "@/lib/api/client";

import type { RecommendationStatus } from "./types";

// Server Actions can't read the [lang] root param, so the route is revalidated for every
// language at once, and messages are composed by the client in the reader's language.
const RECOMMENDATIONS_ROUTE = "/[lang]/recommendations";

export interface GenerateState {
  /** Raw API error message, or null; the client wraps it in localized text. */
  error: string | null;
  failed: boolean;
  generated: number | null;
}

export async function generateRecommendations(_previous: GenerateState): Promise<GenerateState> {
  try {
    const created = await unwrap(api.POST("/api/v1/recommendations/generate"));
    revalidatePath(RECOMMENDATIONS_ROUTE, "page");
    return { error: null, failed: false, generated: created.length };
  } catch (error) {
    unstable_rethrow(error);
    console.error("Generating recommendations failed", error);
    return {
      error: error instanceof ApiError ? error.message : null,
      failed: true,
      generated: null,
    };
  }
}

export async function setRecommendationStatus(
  id: string,
  status: RecommendationStatus,
): Promise<void> {
  await unwrap(
    api.PATCH("/api/v1/recommendations/{recommendation_id}", {
      params: { path: { recommendation_id: id } },
      body: { status },
    }),
  );
  revalidatePath(RECOMMENDATIONS_ROUTE, "page");
}
