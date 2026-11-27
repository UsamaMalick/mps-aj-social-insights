import { describe, expect, it } from "vitest";

import { ar } from "./ar";
import { en } from "./en";

type Tree = { [key: string]: string | Tree };

function leaves(tree: Tree, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out.set(path, value);
    else for (const [k, v] of leaves(value, path)) out.set(k, v);
  }
  return out;
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

const english = leaves(en as unknown as Tree);
const arabic = leaves(ar as unknown as Tree);

describe("dictionaries", () => {
  it("have exactly the same keys", () => {
    expect([...arabic.keys()].sort()).toEqual([...english.keys()].sort());
  });

  it("have no empty strings", () => {
    for (const [key, value] of [...english, ...arabic]) {
      expect(value.trim(), key).not.toBe("");
    }
  });

  it("use the same placeholders in both languages", () => {
    for (const [key, value] of english) {
      expect(placeholders(arabic.get(key) ?? ""), key).toEqual(placeholders(value));
    }
  });

  it("actually translate the Arabic text", () => {
    // Brand name, symbols and placeholders may stay as they are; everything else is Arabic.
    const allowedLatin = new Set(["meta.title", "shell.languageSwitch", "competitors.columnRank"]);
    const pureFormat = /^[\s{}\w·:%()+÷×–#,.-]*$/;
    for (const [key, value] of arabic) {
      if (allowedLatin.has(key) || pureFormat.test(value.replace(/\{\w+\}/g, ""))) continue;
      expect(/[؀-ۿ]/.test(value), `${key}: "${value}"`).toBe(true);
    }
  });
});
