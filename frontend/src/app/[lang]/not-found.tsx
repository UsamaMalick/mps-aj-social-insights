import Link from "next/link";

import { EmptyState } from "@/components/data/empty-state";
import { Button } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { locale, t } = await getI18n();
  return (
    <EmptyState
      title={t.common.notFoundTitle}
      description={t.common.notFoundBody}
      action={
        <Button asChild variant="outline">
          <Link href={`/${locale}`}>{t.common.backToBriefing}</Link>
        </Button>
      }
    />
  );
}
