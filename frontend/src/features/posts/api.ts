import "server-only";

import { api, unwrap } from "@/lib/api/client";

import { type PostsSearchParams, toPostsQuery } from "./search-params";

export async function listPosts(params: PostsSearchParams) {
  return unwrap(api.GET("/api/v1/posts", { params: { query: toPostsQuery(params) } }));
}
