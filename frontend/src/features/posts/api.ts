import "server-only";

import { api, unwrap } from "@/lib/api/client";

import { type PostsSearchParams, toPostsQuery } from "./search-params";

export async function listPosts(params: PostsSearchParams) {
  return unwrap(api.GET("/api/v1/posts", { params: { query: toPostsQuery(params) } }));
}

export async function getPost(postId: string) {
  return unwrap(api.GET("/api/v1/posts/{post_id}", { params: { path: { post_id: postId } } }));
}
