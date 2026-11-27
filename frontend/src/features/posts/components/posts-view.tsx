import Link from "next/link";

import { EmptyState } from "@/components/data/empty-state";
import { SegmentedLinks } from "@/components/navigation/segmented-links";
import { Button } from "@/components/ui/button";
import { listAccountGroups } from "@/features/accounts/api";
import { postSortValues } from "@/lib/api/schema";

import { getPost, listPosts } from "../api";
import { parsePostsSearchParams, postsHref, type RawSearchParams } from "../search-params";
import { PostDrawer } from "./post-drawer";
import { PostsFilters } from "./posts-filters";
import { PostsPagination } from "./posts-pagination";
import { PostsTable } from "./posts-table";

const SORT_LABELS: Record<string, string> = {
  newest: "Newest",
  oldest: "Oldest",
  most_engaged: "Most engaging",
};

interface PostsViewProps {
  searchParams: Promise<RawSearchParams>;
}

export async function PostsView({ searchParams }: PostsViewProps) {
  const params = parsePostsSearchParams(await searchParams);
  const [page, accountGroups, openPost] = await Promise.all([
    listPosts(params),
    listAccountGroups(),
    params.post ? getPost(params.post) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PostsFilters params={params} accountGroups={accountGroups} />
        <SegmentedLinks
          id="sort"
          label="Sort posts"
          items={postSortValues.map((sort) => ({
            label: SORT_LABELS[sort] ?? sort,
            href: postsHref(params, { sort, page: 1, post: undefined }),
            active: params.sort === sort,
          }))}
        />
      </div>
      {page.items.length === 0 ? (
        <EmptyState
          title="No posts match"
          description="Try removing a filter or searching for a different word."
          action={
            <Button asChild variant="outline">
              <Link href="/posts">Clear all filters</Link>
            </Button>
          }
        />
      ) : (
        <>
          <PostsTable posts={page.items} postHref={(id) => postsHref(params, { post: id })} />
          <PostsPagination params={params} total={page.total} />
        </>
      )}
      {openPost ? (
        <PostDrawer post={openPost} closeHref={postsHref(params, { post: undefined })} />
      ) : null}
    </div>
  );
}
