import Link from "next/link";

import { EmptyState } from "@/components/data/empty-state";
import { Button } from "@/components/ui/button";
import { listAccountGroups } from "@/features/accounts/api";

import { listPosts } from "../api";
import { parsePostsSearchParams, type RawSearchParams } from "../search-params";
import { PostsFilters } from "./posts-filters";
import { PostsPagination } from "./posts-pagination";
import { PostsTable } from "./posts-table";

interface PostsViewProps {
  searchParams: Promise<RawSearchParams>;
}

export async function PostsView({ searchParams }: PostsViewProps) {
  const params = parsePostsSearchParams(await searchParams);
  const [page, accountGroups] = await Promise.all([listPosts(params), listAccountGroups()]);

  return (
    <>
      <PostsFilters params={params} accountGroups={accountGroups} />
      {page.items.length === 0 ? (
        <EmptyState
          title="No posts match these filters"
          description="Try removing a filter or searching for a different word."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/posts">Clear filters</Link>
            </Button>
          }
        />
      ) : (
        <>
          <PostsTable posts={page.items} />
          <PostsPagination params={params} total={page.total} />
        </>
      )}
    </>
  );
}
