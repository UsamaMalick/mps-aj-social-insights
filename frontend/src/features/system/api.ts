import "server-only";

import { api, unwrap } from "@/lib/api/client";

export async function getMeta() {
  return unwrap(api.GET("/api/v1/meta"));
}
