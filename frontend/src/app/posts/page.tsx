import type { Metadata } from "next";
import { Suspense } from "react";

import { SectionSkeleton } from "@/components/data/section-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { PostsView } from "@/features/posts/components/posts-view";

export const metadata: Metadata = { title: "Posts" };

export default function PostsPage({ searchParams }: PageProps<"/posts">) {
  return (
    <>
      <PageHeader
        meta="All accounts · metrics at the latest snapshot"
        title="Posts"
        description="Every post from Al Jazeera and the five competitors. Search, filter and open any post for its 24 and 72-hour numbers."
      />
      <Suspense fallback={<SectionSkeleton label="Loading posts" rows={10} />}>
        <PostsView searchParams={searchParams} />
      </Suspense>
    </>
  );
}
