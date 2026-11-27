"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  languageValues,
  mediaTypeValues,
  platformValues,
  postSortValues,
  storyTypeValues,
} from "@/lib/api/schema";
import { formatAccountName, formatLabel } from "@/lib/format";

import {
  OWNERSHIP_VALUES,
  type PostsSearchParams,
  postsHref,
  SEARCH_MAX_LENGTH,
} from "../search-params";
import { type FilterOption, FilterSelect } from "./filter-select";

const LANGUAGE_LABELS: Record<string, string> = { ar: "Arabic", en: "English" };
const OWNERSHIP_LABELS: Record<string, string> = { own: "Al Jazeera", competitors: "Competitors" };

function options(values: readonly string[], labels?: Record<string, string>): FilterOption[] {
  return values.map((value) => ({ value, label: labels?.[value] ?? formatLabel(value) }));
}

interface AccountOption {
  id: string;
  display_name: string;
  platform: string;
}

interface PostsFiltersProps {
  params: PostsSearchParams;
  accounts: AccountOption[];
}

export function PostsFilters({ params, accounts }: PostsFiltersProps) {
  const router = useRouter();

  function apply(changes: Partial<Record<keyof PostsSearchParams, string | undefined>>) {
    router.push(postsHref(params, { ...changes, page: 1 }));
  }

  return (
    <div className="space-y-3">
      <form
        role="search"
        className="flex max-w-xl items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const query = new FormData(event.currentTarget).get("q");
          apply({ q: typeof query === "string" ? query.trim() : undefined });
        }}
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="posts-search" className="text-muted-foreground text-xs">
            Search captions
          </Label>
          <Input
            id="posts-search"
            name="q"
            type="search"
            dir="auto"
            maxLength={SEARCH_MAX_LENGTH}
            defaultValue={params.q ?? ""}
            placeholder="e.g. ceasefire, عاجل"
          />
        </div>
        <Button type="submit" variant="secondary">
          <Search aria-hidden />
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-3">
        <FilterSelect
          id="filter-ownership"
          label="Accounts"
          value={params.ownership}
          allLabel="All accounts"
          options={options(OWNERSHIP_VALUES, OWNERSHIP_LABELS)}
          onChange={(ownership) => apply({ ownership, account: undefined })}
        />
        <FilterSelect
          id="filter-account"
          label="Account"
          value={params.account}
          allLabel="Any account"
          options={accounts.map((a) => ({
            value: a.id,
            label: formatAccountName(a.display_name, a.platform),
          }))}
          onChange={(account) => apply({ account })}
        />
        <FilterSelect
          id="filter-platform"
          label="Platform"
          value={params.platform}
          allLabel="All platforms"
          options={options(platformValues)}
          onChange={(platform) => apply({ platform })}
        />
        <FilterSelect
          id="filter-media"
          label="Format"
          value={params.media}
          allLabel="All formats"
          options={options(mediaTypeValues)}
          onChange={(media) => apply({ media })}
        />
        <FilterSelect
          id="filter-story"
          label="Story type"
          value={params.story}
          allLabel="All story types"
          options={options(storyTypeValues)}
          onChange={(story) => apply({ story })}
        />
        <FilterSelect
          id="filter-language"
          label="Language"
          value={params.language}
          allLabel="Both languages"
          options={options(languageValues, LANGUAGE_LABELS)}
          onChange={(language) => apply({ language })}
        />
        <FilterSelect
          id="filter-sort"
          label="Sort by"
          value={params.sort}
          options={options(postSortValues)}
          onChange={(sort) => apply({ sort })}
        />
      </div>
    </div>
  );
}
