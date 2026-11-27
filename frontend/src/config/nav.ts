/** Masthead sections. Labels live in the dictionaries (`nav.<key>`). */
export interface NavItem {
  key: "briefing" | "posts" | "competitors" | "recommendations";
  /** Path after the language prefix. */
  path: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { key: "briefing", path: "" },
  { key: "posts", path: "/posts" },
  { key: "competitors", path: "/competitors" },
  { key: "recommendations", path: "/recommendations" },
];
