import { FlaskConical, PlugZap } from "lucide-react";

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

export async function SampleDataBanner() {
  const dataSource = await loadDataSource();

  if (dataSource === null) {
    return (
      <div
        role="alert"
        className="bg-destructive/10 text-destructive flex items-center gap-2 px-4 py-2 text-sm md:px-6"
      >
        <PlugZap className="size-4 shrink-0" aria-hidden />
        <p>The data service is unreachable, so the data source cannot be confirmed.</p>
      </div>
    );
  }
  if (dataSource !== SEED_DATA_SOURCE) return null;

  return (
    <div
      role="status"
      className="bg-warning text-warning-foreground flex items-center gap-2 px-4 py-2 text-sm md:px-6"
    >
      <FlaskConical className="size-4 shrink-0" aria-hidden />
      <p>
        <strong className="font-semibold">Sample data.</strong> Every account, post and number shown
        here is generated for this proof of concept, not real platform data.
      </p>
    </div>
  );
}
