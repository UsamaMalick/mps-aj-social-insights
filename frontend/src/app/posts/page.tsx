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
        title="Posts"
        description="Every post from Al Jazeera and competitors, with metrics at the latest snapshot."
      />
      <Suspense fallback={<SectionSkeleton label="Loading posts" height="lg" />}>
        <PostsView searchParams={searchParams} />
      </Suspense>
    </>
  );
}
