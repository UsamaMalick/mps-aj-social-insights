"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  languageValues,
  mediaTypeValues,
  platformValues,
  postSortValues,
  storyTypeValues,
} from "@/lib/api/schema";
import type { AccountGroup } from "@/features/accounts/types";
import { formatAccountName, formatLabel } from "@/lib/format";

import {
  accountFilterChanges,
  accountFilterValue,
  type PostsSearchParams,
  postsHref,
} from "../search-params";
import { type FilterOptionGroup, FilterSelect } from "./filter-select";
import { SearchInput } from "./search-input";

const LANGUAGE_LABELS: Record<string, string> = { ar: "Arabic", en: "English" };
const SORT_LABELS: Record<string, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  most_engaged: "Most engaging",
};

function flat(values: readonly string[], labels?: Record<string, string>): FilterOptionGroup[] {
  return [
    { options: values.map((value) => ({ value, label: labels?.[value] ?? formatLabel(value) })) },
  ];
}

const GROUP_LABELS: Record<AccountGroup["key"], { heading: string; all: string }> = {
  own: { heading: "Al Jazeera", all: "All Al Jazeera accounts" },
  competitors: { heading: "Competitors", all: "All competitors" },
};

/** Turns the backend's account groups into menu sections; no filtering or sorting here. */
function accountMenu(groups: AccountGroup[]): FilterOptionGroup[] {
  return [
    { options: groups.map((g) => ({ value: g.key, label: GROUP_LABELS[g.key].all })) },
    ...groups.map((g) => ({
      label: GROUP_LABELS[g.key].heading,
      options: g.accounts.map((a) => ({
        value: a.id,
        label: formatAccountName(a.display_name, a.platform),
      })),
    })),
  ];
}

interface PostsFiltersProps {
  params: PostsSearchParams;
  accountGroups: AccountGroup[];
}

export function PostsFilters({ params, accountGroups }: PostsFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function apply(changes: Partial<PostsSearchParams>) {
    startTransition(() => {
      // replace (not push): filter tweaks shouldn't fill the browser history.
      router.replace(postsHref(params, { ...changes, page: 1 }), { scroll: false });
    });
  }

  return (
    <div className="space-y-3" aria-busy={isPending}>
      <SearchInput query={params.q ?? ""} isPending={isPending} onSearch={(q) => apply({ q })} />

      <div className="flex flex-wrap gap-3">
        <FilterSelect
          id="filter-account"
          label="Account"
          value={accountFilterValue(params)}
          allLabel="All accounts"
          groups={accountMenu(accountGroups)}
          className="flex w-full flex-col gap-1.5 sm:w-64"
          onChange={(value) => apply(accountFilterChanges(value))}
        />
        <FilterSelect
          id="filter-platform"
          label="Platform"
          value={params.platform}
          allLabel="All platforms"
          groups={flat(platformValues)}
          onChange={(platform) => apply({ platform: platform as PostsSearchParams["platform"] })}
        />
        <FilterSelect
          id="filter-media"
          label="Format"
          value={params.media}
          allLabel="All formats"
          groups={flat(mediaTypeValues)}
          onChange={(media) => apply({ media: media as PostsSearchParams["media"] })}
        />
        <FilterSelect
          id="filter-story"
          label="Story type"
          value={params.story}
          allLabel="All story types"
          groups={flat(storyTypeValues)}
          onChange={(story) => apply({ story: story as PostsSearchParams["story"] })}
        />
        <FilterSelect
          id="filter-language"
          label="Language"
          value={params.language}
          allLabel="Both languages"
          groups={flat(languageValues, LANGUAGE_LABELS)}
          onChange={(language) => apply({ language: language as PostsSearchParams["language"] })}
        />
        <FilterSelect
          id="filter-sort"
          label="Sort by"
          value={params.sort}
          groups={flat(postSortValues, SORT_LABELS)}
          onChange={(sort) => apply({ sort: sort ?? "newest" })}
        />
      </div>
    </div>
  );
}
