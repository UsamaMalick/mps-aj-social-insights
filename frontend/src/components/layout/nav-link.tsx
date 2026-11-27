"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: ReactNode;
}

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "focus-visible:ring-ring relative flex h-12 items-center px-1 text-sm whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none",
        isActive ? "text-ink font-medium" : "text-ink-2 hover:text-ink",
      )}
    >
      {children}
      {isActive ? (
        // The one "you are here" marker in burnt orange; slides between sections.
        <motion.span
          layoutId="nav-marker"
          className="bg-pop absolute inset-x-0 -bottom-px h-0.5"
          transition={{ type: "tween", duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : null}
    </Link>
  );
}
