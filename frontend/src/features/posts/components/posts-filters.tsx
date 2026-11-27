"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { AccountGroup } from "@/features/accounts/types";
import type { Locale } from "@/i18n/config";
import { type Dictionary, getDictionary } from "@/i18n/dictionaries";
import { interpolate } from "@/i18n/interpolate";
import { accountName, enumLabel } from "@/i18n/labels";
import { languageValues, mediaTypeValues, platformValues, storyTypeValues } from "@/lib/api/schema";

import {
  accountFilterChanges,
  accountFilterValue,
  activeFilterCount,
  type PostsSearchParams,
  postsHref,
} from "../search-params";
import { type FilterOptionGroup, FilterSelect } from "./filter-select";
import { SearchInput } from "./search-input";

type EnumGroup = keyof Dictionary["enums"];

function options(t: Dictionary, group: EnumGroup, values: readonly string[]): FilterOptionGroup[] {
  return [{ options: values.map((value) => ({ value, label: enumLabel(t, group, value) })) }];
}

/** Turns the backend's account groups into menu sections; no filtering or sorting here. */
function accountMenu(t: Dictionary, groups: AccountGroup[]): FilterOptionGroup[] {
  const groupText = {
    own: { heading: t.posts.groupOwn, all: t.posts.allOwnAccounts },
    competitors: { heading: t.posts.groupCompetitors, all: t.posts.allCompetitors },
  } satisfies Record<AccountGroup["key"], { heading: string; all: string }>;
  return [
    { options: groups.map((g) => ({ value: g.key, label: groupText[g.key].all })) },
    ...groups.map((g) => ({
      label: groupText[g.key].heading,
      options: g.accounts.map((a) => ({
        value: a.id,
        label: accountName(t, a.display_name, a.platform),
      })),
    })),
  ];
}

interface PostsFiltersProps {
  params: PostsSearchParams;
  accountGroups: AccountGroup[];
  locale: Locale;
}

export function PostsFilters({ params, accountGroups, locale }: PostsFiltersProps) {
  const t = getDictionary(locale);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const filterCount = activeFilterCount(params);

  function apply(changes: Partial<PostsSearchParams>) {
    startTransition(() => {
      // replace (not push): filter tweaks shouldn't fill the browser history.
      router.replace(postsHref(locale, params, { ...changes, page: 1, post: undefined }), {
        scroll: false,
      });
    });
  }

  return (
    <div className="space-y-3" aria-busy={isPending}>
      <SearchInput
        query={params.q ?? ""}
        isPending={isPending}
        locale={locale}
        onSearch={(q) => apply({ q })}
      />
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          id="filter-account"
          label={t.posts.filterAccount}
          value={accountFilterValue(params)}
          allLabel={t.posts.allAccounts}
          groups={accountMenu(t, accountGroups)}
          onChange={(value) => apply(accountFilterChanges(value))}
        />
        <FilterSelect
          id="filter-platform"
          label={t.posts.filterPlatform}
          value={params.platform}
          allLabel={t.posts.allPlatforms}
          groups={options(t, "platform", platformValues)}
          onChange={(platform) => apply({ platform: platform as PostsSearchParams["platform"] })}
        />
        <FilterSelect
          id="filter-media"
          label={t.posts.filterFormat}
          value={params.media}
          allLabel={t.posts.allFormats}
          groups={options(t, "media_type", mediaTypeValues)}
          onChange={(media) => apply({ media: media as PostsSearchParams["media"] })}
        />
        <FilterSelect
          id="filter-story"
          label={t.posts.filterStory}
          value={params.story}
          allLabel={t.posts.allStoryTypes}
          groups={options(t, "story_type", storyTypeValues)}
          onChange={(story) => apply({ story: story as PostsSearchParams["story"] })}
        />
        <FilterSelect
          id="filter-language"
          label={t.posts.filterLanguage}
          value={params.language}
          allLabel={t.posts.bothLanguages}
          groups={options(t, "language", languageValues)}
          onChange={(language) => apply({ language: language as PostsSearchParams["language"] })}
        />
        {filterCount > 0 ? (
          <Link
            href={postsHref(locale, params, {
              account: undefined,
              ownership: undefined,
              platform: undefined,
              media: undefined,
              story: undefined,
              language: undefined,
              page: 1,
              post: undefined,
            })}
            scroll={false}
            className="text-ink-2 hover:text-ink decoration-rule-strong ms-1 text-sm underline underline-offset-4"
          >
            {filterCount === 1
              ? t.posts.clearOneFilter
              : interpolate(t.posts.clearFilters, { count: filterCount })}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
