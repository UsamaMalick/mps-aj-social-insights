import { describe, expect, it } from "vitest";

import {
  accountFilterChanges,
  accountFilterValue,
  parsePostsSearchParams,
  postsHref,
  toPostsQuery,
} from "./search-params";

describe("posts search params", () => {
  it("parses valid params and applies defaults", () => {
    const params = parsePostsSearchParams({ platform: "instagram", q: " عاجل " });

    expect(params).toMatchObject({ platform: "instagram", q: "عاجل", sort: "newest", page: 1 });
  });

  it("drops invalid values instead of failing", () => {
    const params = parsePostsSearchParams({ platform: "myspace", page: "-3", sort: "random" });

    expect(params.platform).toBeUndefined();
    expect(params.page).toBe(1);
    expect(params.sort).toBe("newest");
  });

  it("uses the first value of repeated params", () => {
    expect(parsePostsSearchParams({ language: ["ar", "en"] }).language).toBe("ar");
  });

  it("maps ownership and page to the API query", () => {
    const query = toPostsQuery(parsePostsSearchParams({ ownership: "competitors", page: "3" }));

    expect(query.is_own).toBe(false);
    expect(query.offset).toBe(50);
  });

  it("builds short URLs that reset nothing implicitly", () => {
    const params = parsePostsSearchParams({ media: "reel", page: "2" });

    expect(postsHref(params, { page: 1 })).toBe("/posts?media=reel");
    expect(postsHref(params, { media: undefined, sort: "most_engaged" })).toBe(
      "/posts?sort=most_engaged&page=2",
    );
  });
});

describe("account filter", () => {
  it("shows a specific account before ownership", () => {
    const params = parsePostsSearchParams({ ownership: "own" });
    expect(accountFilterValue(params)).toBe("own");
  });

  it("selecting a group clears the specific account", () => {
    expect(accountFilterChanges("competitors")).toEqual({
      account: undefined,
      ownership: "competitors",
    });
  });

  it("selecting an account clears the group", () => {
    const id = "6f1c2b9e-1d2a-4c3b-9e8f-0a1b2c3d4e5f";
    expect(accountFilterChanges(id)).toEqual({ account: id, ownership: undefined });
  });

  it("selecting all clears both", () => {
    expect(accountFilterChanges(undefined)).toEqual({ account: undefined, ownership: undefined });
  });
});
