import "server-only";

import { api, unwrap } from "@/lib/api/client";

// The POC tracks a dozen accounts, so one page of the maximum size holds them all.
const ALL_ACCOUNTS_LIMIT = 100;

export async function listAccounts() {
  const page = await unwrap(
    api.GET("/api/v1/accounts", { params: { query: { limit: ALL_ACCOUNTS_LIMIT } } }),
  );
  return page.items;
}
