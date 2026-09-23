import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { getMe } from "@/features/auth/api/auth-endpoints";
import type { SessionUser } from "@/features/auth/api/auth-wire";
import { readSessionToken } from "@/features/auth/server/session-cookie";
import { ApiError, NetworkError } from "@/lib/http/api-error";
import { loaded, LOAD_FAILED, type Loaded } from "@/lib/loaded";

/**
 * Data access layer for "who is signed in".
 *
 * Server-rendered pages ask here instead of reading the cookie themselves, so
 * the check sits at the data source where it can't be skipped. Don't call it
 * from a layout: layouts don't re-render between navigations, so a check up
 * there silently stops running.
 */

/**
 * The signed-in member, or `null` for a visitor.
 *
 * `cache` memoises for one render pass, so a page, a header and a nested
 * component can each ask and the API still only gets hit once.
 */
/**
 * `/users/me`, asked a second time if the first attempt never answered.
 *
 * The API cold-starts, and a start slower than `API_TIMEOUT_MS` arrives here
 * as a `NetworkError` rather than as an answer - which took down every guarded
 * page, since this is what they all wait on. A read is safe to repeat, and the
 * second attempt meets a warm API. A refusal is not retried: a 401 is an
 * answer, and asking again would only get the same one.
 */
async function readMe(token: string): Promise<SessionUser> {
  try {
    return await getMe(token);
  } catch (error) {
    if (!(error instanceof NetworkError)) throw error;

    console.warn("[session] /users/me did not answer in time, asking once more");

    return await getMe(token);
  }
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const token = await readSessionToken();
  if (!token) return null;

  try {
    return await readMe(token);
  } catch (error) {
    // Expired or revoked isn't a failure, it just means nobody's signed in.
    // Leave the stale cookie alone; a render pass can't modify cookies, and it
    // gets overwritten at the next sign-in and cleared at sign-out anyway.
    if (ApiError.isApiError(error) && error.status === 401) return null;

    throw error;
  }
});

/**
 * The signed-in member, a redirect to the login page, or a failure to say so.
 *
 * Never throws, which is the point: every guarded page waits on this, so an
 * API that didn't answer used to take the page to the error boundary. Now the
 * page renders and shows the failure in its own body, with a Try again that
 * costs a refresh rather than a lost place.
 *
 * Being signed out is still a redirect, not a failure - that's an answer, and
 * the login screen is where it leads.
 *
 * @param locale needed for the redirect, since every route carries one
 */
export async function loadSession(
  locale: string,
): Promise<Loaded<SessionUser>> {
  let user: SessionUser | null;

  try {
    user = await getSession();
  } catch (error) {
    console.error("[session] could not be read", error);

    return LOAD_FAILED;
  }

  if (!user) redirect(`/${locale}/login`);

  return loaded(user);
}

/**
 * Send a member who's already signed in away from the screens that sign you in.
 *
 * Deliberately asks the API rather than checking the cookie in the proxy, and
 * that's the whole point of it living here. The proxy's check only proves a
 * cookie exists, so a stale one would bounce the member off the login page to
 * a members-only one, whose `requireSession` would ask the API, get a 401 and
 * bounce them back - around forever, since a render pass can't clear a cookie.
 * Asking here means an expired session simply reads as signed out and the login
 * page renders, which is exactly what someone holding one needs.
 *
 * @param locale needed for the redirect, since every route carries one
 */
export async function redirectIfSignedIn(locale: string): Promise<void> {
  if (await getSession()) redirect(`/${locale}`);
}
