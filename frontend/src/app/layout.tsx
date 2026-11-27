import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Instrument_Serif, Schibsted_Grotesk } from "next/font/google";
import { Suspense } from "react";

import { InlineScript } from "@/components/layout/inline-script";
import { Masthead } from "@/components/layout/masthead";
import { SampleDataBanner } from "@/components/layout/sample-data-banner";
import { Toaster } from "@/components/layout/toaster";
import { APP_DESCRIPTION, APP_TITLE } from "@/config/constants";
import { THEME_BOOT_SCRIPT } from "@/config/theme";
import { cn } from "@/lib/utils";

import "./globals.css";

// Schibsted Grotesk was drawn for a news publisher: neutral enough for data, with character.
const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: { default: APP_TITLE, template: `%s · ${APP_TITLE}` },
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(schibsted.variable, instrumentSerif.variable, plexArabic.variable)}
    >
      <head>
        <InlineScript html={THEME_BOOT_SCRIPT} />
      </head>
      <body className="min-h-dvh">
        <Suspense>
          <SampleDataBanner />
        </Suspense>
        <Masthead />
        <main className="mx-auto max-w-7xl space-y-10 px-4 pt-8 pb-20 md:px-8 md:pt-12">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
