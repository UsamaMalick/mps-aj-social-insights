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

interface AccountOption {
  id: string;
  display_name: string;
  platform: string;
  is_own: boolean;
}

function accountGroups(accounts: AccountOption[]): FilterOptionGroup[] {
  const toOption = (a: AccountOption) => ({
    value: a.id,
    label: formatAccountName(a.display_name, a.platform),
  });
  return [
    {
      options: [
        { value: "own", label: "All Al Jazeera accounts" },
        { value: "competitors", label: "All competitors" },
      ],
    },
    { label: "Al Jazeera", options: accounts.filter((a) => a.is_own).map(toOption) },
    { label: "Competitors", options: accounts.filter((a) => !a.is_own).map(toOption) },
  ];
}

interface PostsFiltersProps {
  params: PostsSearchParams;
  accounts: AccountOption[];
}

export function PostsFilters({ params, accounts }: PostsFiltersProps) {
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
          groups={accountGroups(accounts)}
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
