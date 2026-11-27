import { Skeleton } from "@/components/ui/skeleton";

interface SectionSkeletonProps {
  label: string;
  height?: "sm" | "md" | "lg";
}

const HEIGHTS = { sm: "h-24", md: "h-64", lg: "h-96" } as const;

export function SectionSkeleton({ label, height = "md" }: SectionSkeletonProps) {
  return (
    <div aria-busy="true" aria-label={label}>
      <Skeleton className={HEIGHTS[height]} />
    </div>
  );
}
