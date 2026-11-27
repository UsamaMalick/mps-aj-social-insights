/** Fills `{name}` placeholders: interpolate("{a} to {b}", { a: "1", b: "2" }) → "1 to 2". */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
