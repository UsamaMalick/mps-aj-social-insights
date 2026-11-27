import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { interpolate } from "@/i18n/interpolate";
import type { I18n } from "@/i18n/server";
import { cn } from "@/lib/utils";

import { pageItems } from "../pagination";
import { POSTS_PAGE_SIZE, type PostsSearchParams, postsHref } from "../search-params";

interface PostsPaginationProps {
  params: PostsSearchParams;
  total: number;
  i18n: I18n;
}

const PAGE_LINK =
  "focus-visible:ring-ring inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm tabular transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none";
// Arrows point the reading direction: mirrored in Arabic.
const ARROW = "size-4 rtl:rotate-180";

export function PostsPagination({ params, total, i18n: { locale, t, fmt } }: PostsPaginationProps) {
  const pageCount = Math.max(Math.ceil(total / POSTS_PAGE_SIZE), 1);
  const first = Math.min((params.page - 1) * POSTS_PAGE_SIZE + 1, total);
  const last = Math.min(params.page * POSTS_PAGE_SIZE, total);
  const href = (page: number) => postsHref(locale, params, { page, post: undefined });

  return (
    <nav
      aria-label={t.posts.paginationLabel}
      className="flex flex-col-reverse items-center justify-between gap-4 sm:flex-row"
    >
      <p className="text-ink-2 tabular text-sm">
        {interpolate(t.posts.range, {
          first: fmt.integer(first),
          last: fmt.integer(last),
          total: fmt.integer(total),
        })}
      </p>
      <div className="flex items-center gap-1">
        {params.page > 1 ? (
          <Link href={href(params.page - 1)} className={cn(PAGE_LINK, "text-ink hover:bg-paper-2")}>
            <ChevronLeft className={ARROW} aria-hidden />
            <span className="sr-only">{t.posts.previousPage}</span>
          </Link>
        ) : (
          <span className={cn(PAGE_LINK, "text-rule-strong")} aria-hidden>
            <ChevronLeft className={ARROW} />
          </span>
        )}
        {pageItems(params.page, pageCount).map((item, index) =>
          item === "gap" ? (
            <span key={`gap-${index}`} className="text-ink-2 px-1" aria-hidden>
              …
            </span>
          ) : (
            <Link
              key={item}
              href={href(item)}
              aria-current={item === params.page ? "page" : undefined}
              className={cn(
                PAGE_LINK,
                item === params.page
                  ? "bg-ink text-paper font-medium"
                  : "text-ink-2 hover:bg-paper-2 hover:text-ink",
              )}
            >
              {fmt.integer(item)}
            </Link>
          ),
        )}
        {params.page < pageCount ? (
          <Link href={href(params.page + 1)} className={cn(PAGE_LINK, "text-ink hover:bg-paper-2")}>
            <ChevronRight className={ARROW} aria-hidden />
            <span className="sr-only">{t.posts.nextPage}</span>
          </Link>
        ) : (
          <span className={cn(PAGE_LINK, "text-rule-strong")} aria-hidden>
            <ChevronRight className={ARROW} />
          </span>
        )}
      </div>
    </nav>
  );
}
