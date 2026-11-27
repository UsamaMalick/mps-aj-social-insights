import type { Metadata } from "next";
import {
  IBM_Plex_Sans_Arabic,
  Instrument_Serif,
  Noto_Naskh_Arabic,
  Schibsted_Grotesk,
} from "next/font/google";
import { Suspense } from "react";

import { InlineScript } from "@/components/layout/inline-script";
import { Masthead } from "@/components/layout/masthead";
import { SampleDataBanner } from "@/components/layout/sample-data-banner";
import { Toaster } from "@/components/layout/toaster";
import { THEME_BOOT_SCRIPT } from "@/config/theme";
import { LOCALES } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/utils";

import "../globals.css";

// Schibsted Grotesk was drawn for a news publisher: neutral enough for data, with character.
const schibsted = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin"] });
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
// Arabic counterpart of the editorial serif, for headlines and figures in Arabic.
const naskhArabic = Noto_Naskh_Arabic({
  variable: "--font-naskh-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: t.meta.title, template: `%s · ${t.meta.title}` },
    description: t.meta.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { locale, dir } = await getI18n();
  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={cn(
        schibsted.variable,
        instrumentSerif.variable,
        plexArabic.variable,
        naskhArabic.variable,
      )}
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
        <Toaster dir={dir} />
      </body>
    </html>
  );
}
