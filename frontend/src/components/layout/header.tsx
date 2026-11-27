import Link from "next/link";

import { APP_TITLE } from "@/config/constants";

export function Header() {
  return (
    <header className="bg-background flex h-14 items-center border-b px-4 md:px-6">
      <Link href="/" className="font-heading text-base font-semibold tracking-tight">
        {APP_TITLE}
      </Link>
    </header>
  );
}
