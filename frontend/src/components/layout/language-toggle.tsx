"use client";

import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale, switchLocalePath } from "@/i18n/config";

interface LanguageToggleProps {
  /** The language to switch to. */
  target: Locale;
  label: string;
  /** Accessible description, in the current language. */
  description: string;
}

/** Switches to the same page, filters and open post in the other language, and remembers it. */
export function LanguageToggle({ target, label, description }: LanguageToggleProps) {
  return (
    <a
      href={`/${target}`}
      lang={target}
      hrefLang={target}
      aria-label={description}
      onClick={(event) => {
        event.preventDefault();
        document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
        // A full page load, not a client navigation: the language is the root layout, and
        // swapping it in place re-creates <html> without the theme the boot script set
        // (a light choice turned dark on a dark-mode system). A fresh load re-runs that
        // script before first paint.
        window.location.assign(switchLocalePath(location.pathname, location.search, target));
      }}
      className="text-ink-2 hover:bg-paper-2 hover:text-ink focus-visible:ring-ring inline-flex h-9 items-center rounded-md px-2.5 text-sm font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
    >
      {label}
    </a>
  );
}
