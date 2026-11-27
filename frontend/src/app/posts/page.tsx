import type { Metadata } from "next";

import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Posts" };

export default function Page() {
  return (
    <>
      <PageHeader
        title="Posts"
        description="Every post, filterable by account, platform, format and language."
      />
      <EmptyState title="Nothing here yet" />
    </>
  );
}
