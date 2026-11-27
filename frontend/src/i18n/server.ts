import "server-only";

import { notFound } from "next/navigation";
import { lang } from "next/root-params";

import { createFormat, type Format } from "@/lib/format";

import { direction, isLocale, type Locale } from "./config";
import { type Dictionary, getDictionary } from "./dictionaries";

export interface I18n {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: Dictionary;
  fmt: Format;
}

/** The current language, from the `[lang]` root segment; unknown languages 404. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!isLocale(value)) notFound();
  return value;
}

/** Everything a server component needs to render in the current language. */
export async function getI18n(): Promise<I18n> {
  const locale = await getLocale();
  return { locale, dir: direction(locale), t: getDictionary(locale), fmt: createFormat(locale) };
}
