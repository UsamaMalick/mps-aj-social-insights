export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Cookie remembering the reader's language choice (read by `proxy.ts`). */
export const LOCALE_COOKIE = "locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (LOCALES as readonly string[]).includes(value);
}

export function direction(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/**
 * Intl locales for numbers and dates. Arabic uses Western digits (0–9), like Al Jazeera's
 * Arabic site, so figures read the same in both languages. English numbers use en-US
 * ("12.4K"), dates en-GB ("14 Nov 2026").
 */
export function intlLocales(locale: Locale): { numbers: string; dates: string } {
  return locale === "ar"
    ? { numbers: "ar-u-nu-latn", dates: "ar-u-nu-latn" }
    : { numbers: "en-US", dates: "en-GB" };
}

/** The same page in another language: swaps the first path segment, keeps the query. */
export function switchLocalePath(pathname: string, search: string, target: Locale): string {
  const segments = pathname.split("/");
  if (isLocale(segments[1])) segments[1] = target;
  else segments.splice(1, 0, target);
  const path = segments.join("/").replace(/\/$/, "") || `/${target}`;
  return `${path}${search}`;
}
