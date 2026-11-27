import "server-only";

import { api, unwrap } from "@/lib/api/client";

import type { PatternDimension, Platform } from "./types";

export async function getAccountSummaries() {
  return unwrap(api.GET("/api/v1/analytics/summary"));
}

export async function getOverviewTotals() {
  return unwrap(api.GET("/api/v1/analytics/overview"));
}

export async function getCompetitorComparison(platform: Platform | undefined) {
  return unwrap(api.GET("/api/v1/analytics/competitors", { params: { query: { platform } } }));
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
