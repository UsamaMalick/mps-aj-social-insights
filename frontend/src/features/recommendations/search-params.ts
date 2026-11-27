import { z } from "zod";

import { recommendationStatusValues } from "@/lib/api/schema";

import type { RecommendationStatus } from "./types";

export const DEFAULT_STATUS: RecommendationStatus = "new";
export const ALL_STATUSES = "all";

const statusSchema = z
  .enum([...recommendationStatusValues, ALL_STATUSES] as unknown as [string, ...string[]])
  .catch(DEFAULT_STATUS)
  .default(DEFAULT_STATUS);

/** The status tab from the URL; `undefined` means every status. */
export function parseStatus(
  raw: Record<string, string | string[] | undefined>,
): RecommendationStatus | undefined {
  const value = Array.isArray(raw.status) ? raw.status[0] : raw.status;
  const status = statusSchema.parse(value);
  return status === ALL_STATUSES ? undefined : (status as RecommendationStatus);
}
