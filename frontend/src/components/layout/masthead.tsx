import Link from "next/link";
import { Suspense } from "react";

import { LogoMark } from "@/components/brand/logo-mark";
import { NAV_ITEMS } from "@/config/nav";
import { getI18n } from "@/i18n/server";

import { LanguageToggle } from "./language-toggle";
import { NavLink } from "./nav-link";
import { ThemeToggle } from "./theme-toggle";

interface SectionLink {
  href: string;
  label: string;
  exact: boolean;
}

/**
 * The active-section marker reads the current URL, which Cache Components only allows
 * inside Suspense; the fallback is the same links without the marker (no layout shift).
 */
function SectionLinks({ links, markerId }: { links: SectionLink[]; markerId: string }) {
  const plain = links.map((link) => (
    <Link
      key={link.href}
      href={link.href}
      className="text-ink-2 hover:text-ink flex h-12 items-center px-1 text-sm whitespace-nowrap"
    >
      {link.label}
    </Link>
  ));
  return (
    <Suspense fallback={plain}>
      {links.map((link) => (
        <NavLink key={link.href} href={link.href} exact={link.exact} markerId={markerId}>
          {link.label}
        </NavLink>
      ))}
    </Suspense>
  );
}

export async function Masthead() {
  const { locale, t } = await getI18n();
  const links: SectionLink[] = NAV_ITEMS.map((item) => ({
    href: `/${locale}${item.path}`,
    label: t.nav[item.key],
    exact: item.path === "",
  }));

  return (
    <header className="bg-paper border-rule sticky top-0 z-40 border-b">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 md:px-8">
        <Link
          href={`/${locale}`}
          className="focus-visible:ring-ring flex h-14 shrink-0 items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:outline-none"
        >
          <LogoMark size={26} tileColor="var(--ink)" bubbleColor="var(--paper)" />
          <span lang="en" className="font-serif text-xl leading-none tracking-tight">
            {t.meta.title}
          </span>
        </Link>
        <nav aria-label={t.nav.label} className="ms-auto hidden items-center gap-7 md:flex">
          <SectionLinks links={links} markerId="nav-marker-desktop" />
        </nav>
        <div className="ms-auto flex items-center gap-1 md:ms-0">
          <LanguageToggle
            target={locale === "en" ? "ar" : "en"}
            label={t.shell.languageSwitch}
            description={t.shell.languageSwitchLabel}
          />
          <ThemeToggle label={t.shell.themeToggle} />
        </div>
      </div>
      {/* Small screens: the same sections as a scrollable row under the brand. */}
      <nav
        aria-label={t.nav.label}
        className="border-rule flex gap-6 overflow-x-auto border-t px-4 md:hidden"
      >
        <SectionLinks links={links} markerId="nav-marker-mobile" />
      </nav>
    </header>
  );
}
