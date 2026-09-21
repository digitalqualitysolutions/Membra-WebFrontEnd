import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { getMe } from "@/features/auth/api/auth-endpoints";
import type { SessionUser } from "@/features/auth/api/auth-wire";
import { readSessionToken } from "@/features/auth/server/session-cookie";
import { ApiError } from "@/lib/http/api-error";

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
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const token = await readSessionToken();
  if (!token) return null;

  try {
    return await getMe(token);
  } catch (error) {
    // Expired or revoked isn't a failure, it just means nobody's signed in.
    // Leave the stale cookie alone; a render pass can't modify cookies, and it
    // gets overwritten at the next sign-in and cleared at sign-out anyway.
    if (ApiError.isApiError(error) && error.status === 401) return null;

    throw error;
  }
});

/**
 * The signed-in member, or a redirect to the login page.
 *
 * @param locale needed for the redirect, since every route carries one
 */
export async function requireSession(locale: string): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect(`/${locale}/login`);

  return user;
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
