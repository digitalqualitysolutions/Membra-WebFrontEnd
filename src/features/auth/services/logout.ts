"use server";

import { redirect } from "next/navigation";

import { defaultLocale, isLocale } from "@/config/locales";
import { listActiveSessions, logOut } from "@/features/auth/api/auth-endpoints";
import { clearSession, readSessionToken } from "@/features/auth/server/session-cookie";
import { ApiError, NetworkError } from "@/lib/http/api-error";

/**
 * Sign out: end the session upstream, then forget it here.
 *
 * Two calls, because `POST /auth/logout` revokes a session by id and nothing
 * else hands out our own - `GET /auth/active-sessions` flags it `isCurrent`.
 *
 * Every upstream failure is swallowed on purpose, and that's the important part
 * of this function. Dropping our cookie is what signs the member out of this
 * browser, and it has to happen whether or not the API can be reached: someone
 * signing out on a shared machine must not be left signed in because a network
 * call timed out. A session we couldn't revoke expires on its own; a cookie we
 * didn't clear is a stranger reading their profile.
 */
export async function logOutAction(locale: string): Promise<void> {
  const token = await readSessionToken();

  if (token) {
    try {
      const sessions = await listActiveSessions(token);
      const current = sessions.find((session) => session.isCurrent);

      if (current) {
        await logOut(current.id, token);
      } else {
        // The cookie no longer matches a live session, so there's nothing to
        // revoke. Worth knowing about: it means the two ends disagree.
        console.warn("[logout] no active session matched this cookie");
      }
    } catch (error) {
      // 401 is the ordinary case - the session was already expired or revoked,
      // and the member is signed out either way. The rest we want to hear about.
      if (!(ApiError.isApiError(error) && error.status === 401)) {
        const reason = error instanceof NetworkError ? error.cause : error;
        console.error("[logout] could not revoke the session upstream", reason);
      }
    }
  }

  // Unconditional, and after the attempt above rather than before it: revoking
  // needs the token this deletes.
  await clearSession();

  // The locale arrives from the client, so don't paste it into a path unchecked.
  redirect(`/${isLocale(locale) ? locale : defaultLocale}/login`);
}
