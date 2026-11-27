import { type NextRequest, NextResponse } from "next/server";

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";

/** Highest-weighted supported language from an Accept-Language header. */
export function preferredLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  let best: { locale: Locale; q: number } | null = null;
  for (const part of acceptLanguage.split(",")) {
    const [tag, ...params] = part.trim().split(";");
    const base = tag.trim().toLowerCase().split("-")[0];
    const qParam = params.find((p) => p.trim().startsWith("q="));
    const q = qParam ? Number(qParam.split("=")[1]) : 1;
    if (!isLocale(base) || Number.isNaN(q)) continue;
    if (best === null || q > best.q) best = { locale: base, q };
  }
  return best?.locale ?? DEFAULT_LOCALE;
}
/** Adds a language to URLs that lack one: the saved choice first, then the browser's. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];
  if (isLocale(first)) return NextResponse.next();

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(saved) ? saved : preferredLocale(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except Next internals, generated icons and files with an extension.
  matcher: ["/((?!_next|icon|apple-icon|favicon\\.ico|.*\\.[\\w]+$).*)"],
};
