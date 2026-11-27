import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { formatInteger } from "@/lib/format";
import { cn } from "@/lib/utils";

import { pageItems } from "../pagination";
import { POSTS_PAGE_SIZE, type PostsSearchParams, postsHref } from "../search-params";

interface PostsPaginationProps {
  params: PostsSearchParams;
  total: number;
}

const PAGE_LINK =
  "focus-visible:ring-ring inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm tabular transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none";

export function PostsPagination({ params, total }: PostsPaginationProps) {
  const pageCount = Math.max(Math.ceil(total / POSTS_PAGE_SIZE), 1);
  const first = Math.min((params.page - 1) * POSTS_PAGE_SIZE + 1, total);
  const last = Math.min(params.page * POSTS_PAGE_SIZE, total);
  const href = (page: number) => postsHref(params, { page, post: undefined });

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col-reverse items-center justify-between gap-4 sm:flex-row"
    >
      <p className="text-ink-2 tabular text-sm">
        {formatInteger(first)}–{formatInteger(last)} of {formatInteger(total)} posts
      </p>
      <div className="flex items-center gap-1">
        {params.page > 1 ? (
          <Link href={href(params.page - 1)} className={cn(PAGE_LINK, "text-ink hover:bg-paper-2")}>
            <ChevronLeft className="size-4" aria-hidden />
            <span className="sr-only">Previous page</span>
          </Link>
        ) : (
          <span className={cn(PAGE_LINK, "text-rule-strong")} aria-hidden>
            <ChevronLeft className="size-4" />
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
              {formatInteger(item)}
            </Link>
          ),
        )}
        {params.page < pageCount ? (
          <Link href={href(params.page + 1)} className={cn(PAGE_LINK, "text-ink hover:bg-paper-2")}>
            <ChevronRight className="size-4" aria-hidden />
            <span className="sr-only">Next page</span>
          </Link>
        ) : (
          <span className={cn(PAGE_LINK, "text-rule-strong")} aria-hidden>
            <ChevronRight className="size-4" />
          </span>
        )}
      </div>
    </nav>
  );
}
