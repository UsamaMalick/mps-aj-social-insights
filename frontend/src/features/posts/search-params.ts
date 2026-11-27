import { z } from "zod";

import {
  accountGroupKeyValues,
  languageValues,
  mediaTypeValues,
  platformValues,
  postSortValues,
  storyTypeValues,
} from "@/lib/api/schema";

export const POSTS_PAGE_SIZE = 25;
export const SEARCH_MAX_LENGTH = 100;
export const OWNERSHIP_VALUES = accountGroupKeyValues;
const DEFAULT_SORT = "newest";

function optionalEnum<T extends string>(values: readonly T[]) {
  return z
    .enum(values as unknown as [T, ...T[]])
    .optional()
    .catch(undefined);
}

/** URL search params of the posts page. Invalid values are dropped, never thrown. */
export const postsSearchParamsSchema = z.object({
  account: z.uuid().optional().catch(undefined),
  ownership: optionalEnum(OWNERSHIP_VALUES),
  platform: optionalEnum(platformValues),
  media: optionalEnum(mediaTypeValues),
  language: optionalEnum(languageValues),
  story: optionalEnum(storyTypeValues),
  q: z.string().trim().min(1).max(SEARCH_MAX_LENGTH).optional().catch(undefined),
  sort: z
    .enum(postSortValues as unknown as [string, ...string[]])
    .catch(DEFAULT_SORT)
    .default(DEFAULT_SORT),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});

export type PostsSearchParams = z.infer<typeof postsSearchParamsSchema>;
export type RawSearchParams = Record<string, string | string[] | undefined>;

export function parsePostsSearchParams(raw: RawSearchParams): PostsSearchParams {
  const firstValues = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  );
  return postsSearchParamsSchema.parse(firstValues);
}

/** Maps URL params to the backend's query parameters. */
export function toPostsQuery(params: PostsSearchParams) {
  return {
    account_id: params.account,
    is_own: params.ownership === undefined ? undefined : params.ownership === "own",
    platform: params.platform,
    media_type: params.media,
    language: params.language,
    story_type: params.story,
    q: params.q,
    sort: params.sort as (typeof postSortValues)[number],
    offset: (params.page - 1) * POSTS_PAGE_SIZE,
    limit: POSTS_PAGE_SIZE,
  };
}

/** A posts URL with some params changed; defaults are left out to keep URLs short. */
export function postsHref(
  params: PostsSearchParams,
  changes: Partial<Record<keyof PostsSearchParams, string | number | undefined>>,
): string {
  const merged: Record<string, string | number | undefined> = { ...params, ...changes };
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === "") continue;
    if (key === "sort" && value === DEFAULT_SORT) continue;
    if (key === "page" && value === 1) continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `/posts?${query}` : "/posts";
}

export const SEARCH_DEBOUNCE_MS = 350;

/** The single "Account" dropdown covers both ownership and one specific account. */
export function accountFilterValue(params: PostsSearchParams): string | undefined {
  return params.account ?? params.ownership;
}

export function accountFilterChanges(
  value: string | undefined,
): Pick<PostsSearchParams, "account" | "ownership"> {
  if (value === undefined) return { account: undefined, ownership: undefined };
  const ownership = OWNERSHIP_VALUES.find((group) => group === value);
  if (ownership !== undefined) return { account: undefined, ownership };
  return { account: value, ownership: undefined };
}
