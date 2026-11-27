import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatInteger } from "@/lib/format";

import { POSTS_PAGE_SIZE, type PostsSearchParams, postsHref } from "../search-params";

interface PostsPaginationProps {
  params: PostsSearchParams;
  total: number;
}

export function PostsPagination({ params, total }: PostsPaginationProps) {
  const pageCount = Math.max(Math.ceil(total / POSTS_PAGE_SIZE), 1);
  const first = (params.page - 1) * POSTS_PAGE_SIZE + 1;
  const last = Math.min(params.page * POSTS_PAGE_SIZE, total);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 text-sm">
      <p className="text-muted-foreground tabular-nums">
        {formatInteger(first)}–{formatInteger(last)} of {formatInteger(total)} posts
      </p>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground tabular-nums">
          Page {formatInteger(params.page)} of {formatInteger(pageCount)}
        </span>
        {params.page > 1 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={postsHref(params, { page: params.page - 1 })}>Previous</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
        )}
        {params.page < pageCount ? (
          <Button asChild variant="outline" size="sm">
            <Link href={postsHref(params, { page: params.page + 1 })}>Next</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        )}
      </div>
    </nav>
  );
}
