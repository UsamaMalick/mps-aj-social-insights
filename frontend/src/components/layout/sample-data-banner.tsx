import { unstable_rethrow } from "next/navigation";

import { getMeta } from "@/features/system/api";

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
  const dataSource = await loadDataSource();

  if (dataSource === null) {
    return (
      <Strip tone="alert">
        The data service is unreachable, so the data source can&rsquo;t be confirmed.
      </Strip>
    );
  }
  if (dataSource !== SEED_DATA_SOURCE) return null;

  return (
    <Strip tone="info">
      <span className="text-ink font-medium">Sample data.</span> Accounts, posts and numbers are
      generated for this proof of concept, not taken from Instagram or Facebook.
    </Strip>
  );
}
