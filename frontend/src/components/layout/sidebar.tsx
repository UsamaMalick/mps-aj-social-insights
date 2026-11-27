import { NAV_ITEMS } from "@/config/nav";

import { NavLink } from "./nav-link";

export function Sidebar() {
  return (
    <nav
      aria-label="Main"
      className="bg-sidebar border-sidebar-border flex gap-1 overflow-x-auto border-b p-2 md:w-56 md:shrink-0 md:flex-col md:border-r md:border-b-0 md:p-3"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <NavLink key={href} href={href} icon={<Icon className="size-4 shrink-0" aria-hidden />}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
