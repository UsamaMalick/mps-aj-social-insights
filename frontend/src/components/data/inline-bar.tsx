import { cn } from "@/lib/utils";

interface InlineBarProps {
  /** 0–1 share of the row's maximum. */
  ratio: number;
  emphasis: "own" | "rival";
  label: string;
  className?: string;
}

/** A thin horizontal bar for ranked lists. Own accounts are solid ink, rivals a tint. */
export function InlineBar({ ratio, emphasis, label, className }: InlineBarProps) {
  const percent = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("bg-rule/60 h-1.5 w-full overflow-hidden rounded-full", className)}
    >
      <div
        className={cn(
          "h-full rounded-full",
          emphasis === "own" ? "bg-series-own" : "bg-series-rival",
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
