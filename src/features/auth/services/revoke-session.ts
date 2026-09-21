"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isLocale } from "@/config/locales";
import { listActiveSessions, logOut } from "@/features/auth/api/auth-endpoints";
import { readSessionToken } from "@/features/auth/server/session-cookie";
import type { RevokeSessionState } from "@/features/auth/services/state";
import { ApiError, NetworkError } from "@/lib/http/api-error";

/**
 * End one of the member's *other* sessions - the phone they left signed in.
 *
 * Never this one. The button for the current session isn't rendered, and the
 * check below is the part that actually holds: a session id arrives from the
 * client, so nothing stops a crafted request naming the current session, and
 * honouring that would revoke it upstream while our cookie stayed put - signed
 * out everywhere except the tab doing the revoking. Signing this device out is
 * `logOutAction`'s job, which clears the cookie too.
 */
export async function revokeSessionAction(
  locale: string,
  _previous: RevokeSessionState,
  sessionId: string,
): Promise<RevokeSessionState> {
  if (!isLocale(locale)) return { error: "Unsupported locale" };

  const tErrors = await getTranslations({ locale, namespace: "errors" });

  const token = await readSessionToken();
  if (!token) redirect(`/${locale}/login`);

  try {
    const sessions = await listActiveSessions(token);
    const target = sessions.find((session) => session.id === sessionId);

    // Gone already, or never theirs to end. Either way the list is stale rather
    // than wrong, and a refresh shows the truth.
    if (!target) {
      revalidatePath(`/${locale}/settings`);
      return {};
    }

    if (target.isCurrent) {
      console.warn("[revoke-session] refused to revoke the current session");
      return { error: tErrors("unexpected") };
    }

    await logOut(target.id, token);
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error("[revoke-session] upstream unreachable", error.cause);
      return { error: tErrors("network") };
    }

    if (ApiError.isApiError(error)) {
      // Our own session died while we were revoking someone else's.
      if (error.status === 401) redirect(`/${locale}/login`);

      console.error(`[revoke-session] ${error.code}: ${error.message}`, error.details);
      return { error: tErrors("unexpected") };
    }

    throw error;
  }

  revalidatePath(`/${locale}/settings`);

  return {};
}
