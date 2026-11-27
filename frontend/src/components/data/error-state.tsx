import type { ReactNode } from "react";

interface ErrorStateProps {
  title: string;
  message: string;
  action?: ReactNode;
}

export function ErrorState({ title, message, action }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="border-destructive/30 bg-destructive/5 flex flex-col items-start gap-3 rounded-lg border px-8 py-10"
    >
      <p className="text-destructive font-serif text-title">{title}</p>
      <p className="text-ink-2 max-w-lg text-sm leading-relaxed">{message}</p>
      {action}
    </div>
  );
}
