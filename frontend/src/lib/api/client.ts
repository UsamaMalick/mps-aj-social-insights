import "server-only";

import { unstable_rethrow } from "next/navigation";
import createClient from "openapi-fetch";
import { z } from "zod";

import { env } from "@/lib/env";

import type { components, paths } from "./schema";

export type Schemas = components["schemas"];

export const api = createClient<paths>({ baseUrl: env.API_URL });

const UNKNOWN_ERROR_CODE = "unknown_error";
const UNREACHABLE_ERROR_CODE = "api_unreachable";

const errorBodySchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiResult<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/** Awaits an openapi-fetch call and returns its data, or throws an `ApiError`. */
export async function unwrap<T>(request: Promise<ApiResult<T>>): Promise<T> {
  let result: ApiResult<T>;
  try {
    result = await request;
  } catch (cause) {
    // Let Next.js internal control-flow errors (e.g. prerender aborts) pass through.
    unstable_rethrow(cause);
    throw new ApiError(UNREACHABLE_ERROR_CODE, `Could not reach the API: ${String(cause)}`, null);
  }
  const { data, error, response } = result;
  if (error === undefined && data !== undefined) return data;

  const parsed = errorBodySchema.safeParse(error);
  if (parsed.success) {
    throw new ApiError(parsed.data.error.code, parsed.data.error.message, response.status);
  }
  throw new ApiError(
    UNKNOWN_ERROR_CODE,
    `API request failed (${response.status})`,
    response.status,
  );
}
