import { cn } from "@/lib/utils";

interface CaptionProps {
  text: string;
  className?: string;
}

/** Post caption text; Arabic or English, so direction comes from the content itself. */
export function Caption({ text, className }: CaptionProps) {
  return (
    <p dir="auto" className={cn("text-start", className)}>
      {text}
    </p>
  );
}
