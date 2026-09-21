import "server-only";

import { z } from "zod";

/**
 * Server-side config, checked once at boot.
 *
 * Parsing here instead of reading `process.env` at every call site means a
 * missing or malformed value fails right away with the variable named, rather
 * than hours later as an unexplained fetch failure.
 *
 * Nothing in this file gets a `NEXT_PUBLIC_` prefix. The API base URL is
 * server-only on purpose so the backend's address stays out of the bundle.
 */
const schema = z.object({
  /** Where the API lives. Include the `/api` prefix, no trailing slash. */
  API_BASE_URL: z
    .url("API_BASE_URL must be a full URL, e.g. http://localhost:3000/api")
    .transform((value) => value.replace(/\/+$/, "")),

  /** How long one upstream call gets before we give up on it. */
  API_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid server environment:\n${issues}`);
}

export const env = parsed.data;
