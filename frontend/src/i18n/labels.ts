import type { Dictionary } from "./dictionaries";
import { interpolate } from "./interpolate";

type EnumGroup = keyof Dictionary["enums"];

/** Dictionary label for an API enum value, e.g. ("story_type", "human_interest"). */
export function enumLabel(
  t: Dictionary,
  group: EnumGroup,
  value: string | null | undefined,
): string {
  if (!value) return "—";
  const table: Record<string, string> = t.enums[group];
  return table[value] ?? value;
}

/** "Al Jazeera · Instagram" / "Al Jazeera · إنستغرام" */
export function accountName(t: Dictionary, displayName: string, platform: string): string {
  return interpolate(t.common.accountOnPlatform, {
    account: displayName,
    platform: enumLabel(t, "platform", platform),
  });
}
