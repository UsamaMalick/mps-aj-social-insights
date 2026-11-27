"use client";

import { Moon, Sun } from "lucide-react";

import { THEME_STORAGE_KEY, type Theme } from "@/config/theme";

function currentTheme(): Theme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this page only.
  }
  return next;
}

interface ThemeToggleProps {
  label: string;
}

/** The icon is chosen by CSS (dark: variant), so server and client render the same markup. */
export function ThemeToggle({ label }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="text-ink-2 hover:bg-paper-2 hover:text-ink focus-visible:ring-ring inline-flex size-9 items-center justify-center rounded-md transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
    >
      <Moon className="size-4 dark:hidden" aria-hidden />
      <Sun className="hidden size-4 dark:block" aria-hidden />
      <span className="sr-only">{label}</span>
    </button>
  );
}
