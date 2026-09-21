import "server-only";

import { z } from "zod";

import { env } from "@/config/env";
import { ApiError, NetworkError } from "@/lib/http/api-error";

/**
 * One way to call the Membra API.
 *
 * Every endpoint wants the same things: base URL, timeout, no caching, JSON in
 * and out, a typed error when the API refuses and a parsed body when it doesn't.
 * Doing it once here keeps a feature's endpoints file reading as a list of
 * endpoints instead of the same plumbing over and over.
 *
 * Knows nothing about auth on purpose. Callers pass whatever headers they need,
 * so this still works for members, events, and whatever comes next.
 */

/** Envelope every non-2xx response from the API uses. */
const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    /**
     * Anything at all - the spec types it `any`, and validation failures send
     * an object. Typed as a string, an object here failed the whole envelope,
     * so a real VALIDATION error arrived as `UNKNOWN` with its message lost.
     */
    details: z.unknown().optional(),
  }),
});

/** Details as the log-friendly string `ApiError` carries. */
function detailsText(details: unknown): string | undefined {
  if (details === undefined || details === null) return undefined;
  if (typeof details === "string") return details;

  try {
    return JSON.stringify(details);
  } catch {
    return String(details);
  }
}

export type RequestInit_ = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /**
   * Serialised to JSON. Omit for a body-less request.
   *
   * `FormData` is the exception: it goes up untouched, for the endpoints that
   * take a file rather than a JSON object.
   */
  body?: unknown;
  headers?: Record<string, string>;
};

export type ApiResponse<T> = {
  data: T;
  /** Raw `Set-Cookie` headers, for endpoints that issue a session. */
  setCookie: string[];
};

/**
 * Check a body against the shape the API accepts before sending it.
 *
 * A failure here is never the member's fault. Their values already passed the
 * form's own schema, so the two schemas have drifted and that's ours to fix.
 *
 * Throws `ApiError` rather than letting Zod throw, which matters: a raw
 * `ZodError` matches none of the branches callers write, so it escapes their
 * `catch` and takes the page down with it. As an `ApiError` it lands wherever
 * every other upstream failure does and the member keeps a usable form. Status
 * is 0 since nothing was sent.
 */
export function requestBody<T>(
  schema: z.ZodType<T>,
  path: string,
  input: unknown,
): T {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    throw new ApiError(
      0,
      "CONTRACT_MISMATCH",
      `The request body for ${path} did not match the shape the API accepts`,
      parsed.error.message,
    );
  }

  return parsed.data;
}

/** Enough of a body to recognise it, not so much that it floods a log. */
function summarise(body: string, limit = 600): string {
  const text = body.trim();

  if (!text) return "<empty body>";

  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

/**
 * Call `path` and parse the response against `schema`.
 *
 * @throws {NetworkError} the API was unreachable or ran out of time
 * @throws {ApiError} the API answered with a failure, or with a body that
 *   doesn't match `schema`. A mismatch means the two repos have drifted, and
 *   failing beats rendering half an object.
 */
export async function api<T>(
  schema: z.ZodType<T>,
  path: string,
  init: RequestInit_ = {},
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers = {} } = init;

  /*
   * Multipart is the one body we leave alone. `fetch` writes its own
   * `content-type` for `FormData`, boundary and all, and a hand-written one
   * would leave the API unable to tell the parts apart.
   */
  const multipart = body instanceof FormData;

  let response: Response;

  try {
    response = await fetch(`${env.API_BASE_URL}${path}`, {
      method,
      headers: {
        accept: "application/json",
        ...(body === undefined || multipart
          ? {}
          : { "content-type": "application/json" }),
        ...headers,
      },
      ...(body === undefined
        ? {}
        : { body: multipart ? (body as FormData) : JSON.stringify(body) }),
      signal: AbortSignal.timeout(env.API_TIMEOUT_MS),
      // Anything behind a session is per-request by definition.
      cache: "no-store",
    });
  } catch (cause) {
    throw new NetworkError("The Membra API could not be reached", { cause });
  }

  /*
   * Read the body as text first, then parse it ourselves.
   *
   * `response.json()` throws away whatever it couldn't parse, and that is
   * exactly the body worth keeping: a failure the API didn't wrap in its own
   * envelope is the one we can't otherwise explain. An HTML page from a proxy,
   * a validation layer answering in a shape of its own, an empty 400 - all of
   * them arrive here as `null` and leave no trace of what they said.
   */
  const raw = await response.text().catch(() => "");

  let payload: unknown = null;

  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    // Not JSON. Left as null; `raw` still holds whatever came back.
  }

  if (!response.ok) {
    const parsed = errorResponseSchema.safeParse(payload);

    /*
     * An unrecognised error body is still an error, just one we can't explain.
     * The raw body rides along as `details` so a log can say what the envelope
     * couldn't - server-side only, and never shown to a member.
     */
    throw new ApiError(
      response.status,
      parsed.success ? parsed.data.error.code : "UNKNOWN",
      parsed.success
        ? parsed.data.error.message
        : `The API returned ${response.status} with an unrecognised body`,
      parsed.success ? detailsText(parsed.data.error.details) : summarise(raw),
    );
  }

  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    throw new ApiError(
      response.status,
      "CONTRACT_MISMATCH",
      `The API returned a body for ${path} that did not match the expected shape`,
      parsed.error.message,
    );
  }

  return { data: parsed.data, setCookie: response.headers.getSetCookie() };
}
