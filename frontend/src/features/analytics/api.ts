import "server-only";

import { api, unwrap } from "@/lib/api/client";

import type { PatternDimension } from "./types";

export async function getAccountSummaries() {
  return unwrap(api.GET("/api/v1/analytics/summary"));
}

export async function getCompetitorComparison() {
  return unwrap(api.GET("/api/v1/analytics/competitors"));
}

export async function getTopPosts(limit: number) {
  return unwrap(api.GET("/api/v1/analytics/top-posts", { params: { query: { limit } } }));
}

export async function getPatterns(dimension: PatternDimension) {
  return unwrap(api.GET("/api/v1/analytics/patterns", { params: { query: { dimension } } }));
}

export async function getContentGaps() {
  return unwrap(api.GET("/api/v1/analytics/gaps"));
}
