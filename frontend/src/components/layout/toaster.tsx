"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      // Long enough to reach "Undo" comfortably.
      duration={8000}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "bg-ink text-paper flex w-[22rem] max-w-[calc(100vw-2rem)] items-center gap-4 rounded-md px-4 py-3 text-sm",
          title: "font-medium",
          description: "text-paper/70",
          actionButton:
            "ms-auto shrink-0 whitespace-nowrap rounded-sm px-2 py-1 font-medium underline decoration-paper/40 underline-offset-4 hover:decoration-paper",
        },
      }}
    />
  );
}
