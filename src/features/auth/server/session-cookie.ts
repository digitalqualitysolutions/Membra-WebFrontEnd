import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/features/auth/cookie-name";
import { parseSetCookie } from "@/lib/http/parse-set-cookie";

/**
 * The only place the session cookie gets created, read and cleared.
 *
 * The API mints the value, we decide how it's stored. Keeping that decision in
 * one file stops the flags drifting between endpoints, and means whatever
 * `Domain` the API sends never reaches the browser.
 */

// Re-exported so callers that only care about the session need one import.
export { SESSION_COOKIE };

const baseOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  // Plain http on localhost in dev, TLS everywhere else.
  secure: process.env.NODE_ENV === "production",
} as const;

/**
 * Store the session the API just issued, under our own flags.
 *
 * @param headers every `Set-Cookie` from the upstream response. Get these from
 *   `response.headers.getSetCookie()`, which keeps them separate;
 *   `.get("set-cookie")` folds them into one unparseable string.
 * @returns whether a session cookie was found and stored
 */
export async function setSessionFromUpstream(headers: string[]): Promise<boolean> {
  const session = headers
    .map((header) => parseSetCookie(header))
    .find((cookie) => cookie?.name === SESSION_COOKIE);

  if (!session) return false;

  const store = await cookies();
  store.set(SESSION_COOKIE, session.value, {
    ...baseOptions,
    ...(session.expires ? { expires: session.expires } : {}),
  });

  return true;
}

/** The raw session value, or `undefined` if the visitor hasn't got one. */
export async function readSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

/** Forget the session on this device. */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
