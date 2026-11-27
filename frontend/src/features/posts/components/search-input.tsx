"use client";

import { Loader2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

import { SEARCH_DEBOUNCE_MS, SEARCH_MAX_LENGTH } from "../search-params";

interface SearchInputProps {
  /** The search currently applied (from the URL). */
  query: string;
  isPending: boolean;
  locale: Locale;
  onSearch: (query: string | undefined) => void;
}

/** Caption search that applies itself once the user pauses typing. */
export function SearchInput({ query, isPending, locale, onSearch }: SearchInputProps) {
  const t = getDictionary(locale).posts;
  const [value, setValue] = useState(query);
  const [sent, setSent] = useState(query);
  const [appliedQuery, setAppliedQuery] = useState(query);

  // The URL changed from outside (e.g. "Clear filters"): show that instead of stale text.
  // Our own debounced searches are recognised via `sent`, so typing is never overwritten.
  if (query !== appliedQuery) {
    setAppliedQuery(query);
    if (query !== sent) {
      setValue(query);
      setSent(query);
    }
  }

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === query) return;
    const timer = setTimeout(() => {
      setSent(trimmed);
      onSearch(trimmed || undefined);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, query, onSearch]);

  return (
    <div role="search" className="w-full max-w-md">
      <Label htmlFor="posts-search" className="sr-only">
        {t.searchLabel}
      </Label>
      <div className="relative">
        <Search
          className="text-ink-2 pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          id="posts-search"
          type="search"
          // Typed text picks its own direction; an empty box follows the page, so the
          // mixed Arabic/English placeholder isn't reordered by an LTR default.
          dir={value ? "auto" : undefined}
          autoComplete="off"
          maxLength={SEARCH_MAX_LENGTH}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t.searchPlaceholder}
          className="border-input placeholder:text-ink-2 h-9 rounded-md bg-transparent ps-8 pe-9 shadow-none [&::-webkit-search-cancel-button]:hidden"
        />
        <div className="absolute end-1.5 top-1/2 flex -translate-y-1/2 items-center">
          {isPending ? (
            <Loader2 className="text-ink-2 size-4 animate-spin" aria-label={t.searching} />
          ) : value ? (
            <button
              type="button"
              onClick={() => setValue("")}
              className="text-ink-2 hover:text-foreground focus-visible:ring-ring rounded-sm p-1 focus-visible:ring-2 focus-visible:outline-none"
            >
              <X className="size-3.5" aria-hidden />
              <span className="sr-only">{t.clearSearch}</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
