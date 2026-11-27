import { BarChart3, Lightbulb, type LucideIcon, Newspaper, Users } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Overview", icon: BarChart3 },
  { href: "/posts", label: "Posts", icon: Newspaper },
  { href: "/competitors", label: "Competitors", icon: Users },
  { href: "/recommendations", label: "Recommendations", icon: Lightbulb },
];
