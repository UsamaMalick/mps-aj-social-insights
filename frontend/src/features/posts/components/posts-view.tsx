import Link from "next/link";

import { EmptyState } from "@/components/data/empty-state";
import { SegmentedLinks } from "@/components/navigation/segmented-links";
import { Button } from "@/components/ui/button";
import { listAccountGroups } from "@/features/accounts/api";
import { enumLabel } from "@/i18n/labels";
import { getI18n } from "@/i18n/server";
import { postSortValues } from "@/lib/api/schema";

import { getPost, listPosts } from "../api";
import { parsePostsSearchParams, postsHref, type RawSearchParams } from "../search-params";
import { PostDrawer } from "./post-drawer";
import { PostsFilters } from "./posts-filters";
import { PostsPagination } from "./posts-pagination";
import { PostsTable } from "./posts-table";

interface PostsViewProps {
  searchParams: Promise<RawSearchParams>;
}

export async function PostsView({ searchParams }: PostsViewProps) {
  const i18n = await getI18n();
  const { locale, t } = i18n;
  const params = parsePostsSearchParams(await searchParams);
  const [page, accountGroups, openPost] = await Promise.all([
    listPosts(params),
    listAccountGroups(),
    params.post ? getPost(params.post) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PostsFilters params={params} accountGroups={accountGroups} locale={locale} />
        <SegmentedLinks
          id="sort"
          label={t.posts.sortLabel}
          items={postSortValues.map((sort) => ({
            label: enumLabel(t, "sort", sort),
            href: postsHref(locale, params, { sort, page: 1, post: undefined }),
            active: params.sort === sort,
          }))}
        />
      </div>
      {page.items.length === 0 ? (
        <EmptyState
          title={t.posts.emptyTitle}
          description={t.posts.emptyBody}
          action={
            <Button asChild variant="outline">
              <Link href={`/${locale}/posts`}>{t.posts.clearAll}</Link>
            </Button>
          }
        />
      ) : (
        <>
          <PostsTable
            posts={page.items}
            postHref={(id) => postsHref(locale, params, { post: id })}
            i18n={i18n}
          />
          <PostsPagination params={params} total={page.total} i18n={i18n} />
        </>
      )}
      {openPost ? (
        <PostDrawer
          post={openPost}
          closeHref={postsHref(locale, params, { post: undefined })}
          locale={locale}
        />
      ) : null}
    </div>
  );
}
