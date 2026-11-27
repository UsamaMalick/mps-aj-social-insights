"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { api, ApiError, unwrap } from "@/lib/api/client";

import type { RecommendationStatus } from "./types";

const RECOMMENDATIONS_PATH = "/recommendations";

export interface GenerateState {
  error: string | null;
  generated: number | null;
}

export async function generateRecommendations(_previous: GenerateState): Promise<GenerateState> {
  try {
    const created = await unwrap(api.POST("/api/v1/recommendations/generate"));
    revalidatePath(RECOMMENDATIONS_PATH);
    return { error: null, generated: created.length };
  } catch (error) {
    unstable_rethrow(error);
    console.error("Generating recommendations failed", error);
    const message = error instanceof ApiError ? error.message : "Unexpected error";
    return { error: `Could not generate recommendations: ${message}`, generated: null };
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
  revalidatePath(RECOMMENDATIONS_PATH);
}
