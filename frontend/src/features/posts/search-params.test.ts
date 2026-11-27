import { describe, expect, it } from "vitest";

import { parsePostsSearchParams, postsHref, toPostsQuery } from "./search-params";

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
