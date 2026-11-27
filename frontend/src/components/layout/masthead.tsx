import Link from "next/link";

import { LogoMark } from "@/components/brand/logo-mark";
import { APP_TITLE } from "@/config/constants";
import { NAV_ITEMS } from "@/config/nav";

import { NavLink } from "./nav-link";
import { ThemeToggle } from "./theme-toggle";

export function Masthead() {
  return (
    <header className="bg-paper border-rule sticky top-0 z-40 border-b">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 md:px-8">
        <Link
          href="/"
          className="focus-visible:ring-ring flex h-14 shrink-0 items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:outline-none"
        >
          <LogoMark size={26} tileColor="var(--ink)" bubbleColor="var(--paper)" />
          <span className="font-serif text-xl leading-none tracking-tight">{APP_TITLE}</span>
        </Link>
        <nav aria-label="Main" className="ms-auto hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} markerId="nav-marker-desktop">
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ms-auto md:ms-0">
          <ThemeToggle />
        </div>
      </div>
      {/* Small screens: the same four sections as a scrollable row under the brand. */}
      <nav
        aria-label="Main"
        className="border-rule flex gap-6 overflow-x-auto border-t px-4 md:hidden"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} href={item.href} markerId="nav-marker-mobile">
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
