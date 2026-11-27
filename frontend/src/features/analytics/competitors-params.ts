import { z } from "zod";

import { platformValues } from "@/lib/api/schema";

import type { Platform } from "./types";

const platformSchema = z
  .enum(platformValues as unknown as [Platform, ...Platform[]])
  .optional()
  .catch(undefined);

export function parseCompetitorsPlatform(
  raw: Record<string, string | string[] | undefined>,
): Platform | undefined {
  const value = raw.platform;
  return platformSchema.parse(Array.isArray(value) ? value[0] : value);
}
