import "server-only";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import type { Locale } from "@/config/locales";
import { ApiError, NetworkError } from "@/lib/http/api-error";

/**
 * What an admin is told when a club call fails, whichever call it was.
 *
 * Shared so every club action answers a failure the same way. Kept out of the
 * actions' own files because a `"use server"` module may only export the
 * actions themselves.
 *
 * Redirects to sign-in on a 401 rather than returning - a session that ran out
 * mid-edit isn't something a message can fix. Anything that isn't an API or
 * network failure is rethrown: it's a bug, and the error boundary should have
 * it.
 *
 * @param tag names the action in logs, e.g. `update-club`.
 */
export async function clubFailure(
  error: unknown,
  locale: Locale,
  tag: string,
): Promise<string> {
  const t = await getTranslations({ locale, namespace: "errors" });

  if (error instanceof NetworkError) {
    console.error(`[${tag}] upstream unreachable`, error.cause);
    return t("network");
  }

  if (!ApiError.isApiError(error)) throw error;

  if (error.status === 401) redirect(`/${locale}/login`);
  if (error.status === 429) return t("rateLimited");

  console.error(`[${tag}] ${error.code}: ${error.message}`, error.details);

  if (error.status === 403) return t("forbidden");
  // A clash with another club - most likely a name or short code.
  if (error.status === 409) return t("clubConflict");

  /*
   * The API turned a value down. Its message is the only thing that says which
   * one, so it's passed on - in English, since the API writes it, but far more
   * use than a "try again" that can't be acted on.
   */
  if (error.status === 400) return t("saveRejected", { reason: error.message });

  return t("unexpected");
}
