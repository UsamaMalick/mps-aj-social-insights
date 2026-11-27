import { SectionSkeleton } from "@/components/data/section-skeleton";
import { getI18n } from "@/i18n/server";

export default async function Loading() {
  const { t } = await getI18n();
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="bg-paper-2 h-4 w-24 animate-pulse rounded-sm" />
        <div className="bg-paper-2 h-10 w-80 animate-pulse rounded-sm" />
      </div>
      <SectionSkeleton label={t.common.loading} rows={8} />
    </div>
  );
}
