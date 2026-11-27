import { unstable_rethrow } from "next/navigation";

import { getMeta } from "@/features/system/api";
import { getI18n } from "@/i18n/server";

const SEED_DATA_SOURCE = "seed";

async function loadDataSource(): Promise<string | null> {
  try {
    return (await getMeta()).data_source;
  } catch (error) {
    unstable_rethrow(error);
    console.error("Could not load app metadata", error);
    return null;
  }
}

function Strip({ children, tone }: { children: React.ReactNode; tone: "info" | "alert" }) {
  return (
    <div
      role={tone === "alert" ? "alert" : "status"}
      className={
        tone === "alert"
          ? "bg-destructive/10 text-destructive border-b border-current/20 text-center text-xs"
          : "bg-paper-2 text-ink-2 border-rule border-b border-dashed text-center text-xs"
      }
    >
      <p className="mx-auto max-w-7xl px-4 py-1.5 md:px-8">{children}</p>
    </div>
  );
}

export async function SampleDataBanner() {
  const [dataSource, { t }] = await Promise.all([loadDataSource(), getI18n()]);

  if (dataSource === null) return <Strip tone="alert">{t.shell.apiUnreachable}</Strip>;
  if (dataSource !== SEED_DATA_SOURCE) return null;

  return (
    <Strip tone="info">
      <span className="text-ink font-medium">{t.shell.sampleDataLead}</span>{" "}
      {t.shell.sampleDataBody}
    </Strip>
  );
}
