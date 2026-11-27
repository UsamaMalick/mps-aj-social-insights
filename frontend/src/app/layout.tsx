import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import { Suspense } from "react";

import { Header } from "@/components/layout/header";
import { SampleDataBanner } from "@/components/layout/sample-data-banner";
import { Sidebar } from "@/components/layout/sidebar";
import { APP_DESCRIPTION, APP_TITLE } from "@/config/constants";
import { cn } from "@/lib/utils";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const notoArabic = Noto_Sans_Arabic({ variable: "--font-arabic", subsets: ["arabic"] });

export const metadata: Metadata = {
  title: { default: APP_TITLE, template: `%s · ${APP_TITLE}` },
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        geistSans.variable,
        geistMono.variable,
        notoArabic.variable,
        "h-full antialiased",
      )}
    >
      <body className="flex min-h-full flex-col">
        <Suspense>
          <SampleDataBanner />
        </Suspense>
        <Header />
        <div className="flex flex-1 flex-col md:flex-row">
          <Sidebar />
          <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
