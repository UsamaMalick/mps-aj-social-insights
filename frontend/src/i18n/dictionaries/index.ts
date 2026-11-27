import type { Locale } from "../config";
import { ar } from "./ar";
import { type Dictionary, en } from "./en";

const DICTIONARIES: Record<Locale, Dictionary> = { en, ar };

/** Plain objects, safe on server and client; client components receive `locale` as a prop. */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary };
