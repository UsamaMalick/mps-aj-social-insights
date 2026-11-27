import Link from "next/link";

import { LogoMark } from "@/components/brand/logo-mark";
import { APP_TITLE } from "@/config/constants";

export function Header() {
  return (
    <header className="bg-background flex h-14 items-center border-b px-4 md:px-6">
      <Link
        href="/"
        className="font-heading focus-visible:ring-ring flex items-center gap-2.5 rounded-md text-base font-semibold tracking-tight focus-visible:ring-2 focus-visible:outline-none"
      >
        <LogoMark size={28} tileColor="var(--chart-own)" bubbleColor="var(--background)" />
        {APP_TITLE}
      </Link>
    </header>
  );
}
