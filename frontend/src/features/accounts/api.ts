import "server-only";

import { api, unwrap } from "@/lib/api/client";

/** Accounts grouped into own and competitors, ordered by the backend. */
export async function listAccountGroups() {
  return unwrap(api.GET("/api/v1/accounts/groups"));
}
