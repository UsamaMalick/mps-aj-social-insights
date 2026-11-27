import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="paper-grain border-rule bg-paper-2/60 flex flex-col items-start gap-3 rounded-lg border border-dashed px-8 py-12">
      <p className="font-serif text-title">{title}</p>
      {description ? (
        <p className="text-ink-2 max-w-lg text-sm leading-relaxed">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
