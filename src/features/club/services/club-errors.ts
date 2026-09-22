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
   * The API turned a value down. `message` is usually just "Validation failed",
   * so prefer `details`, which names the fields. English, since the API writes
   * it, but far more use than a "try again" that can't be acted on.
   */
  if (error.status === 400) {
    return t("saveRejected", { reason: validationReason(error) ?? error.message });
  }

  return t("unexpected");
}

/** How much of a validation payload is worth putting in front of someone. */
const REASON_LIMIT = 300;

/** The field errors out of a 400's `details`, as one line. */
function validationReason(error: ApiError): string | undefined {
  if (!error.details) return undefined;

  let payload: unknown;

  try {
    payload = JSON.parse(error.details);
  } catch {
    // Not JSON, so the API sent a plain sentence.
    payload = error.details;
  }

  const parts = fieldMessages(payload);
  if (parts.length === 0) return undefined;

  const reason = parts.join("; ");

  return reason.length > REASON_LIMIT
    ? `${reason.slice(0, REASON_LIMIT)}…`
    : reason;
}

/**
 * Pulls `field: message` out of whichever shape the API's validator used.
 * Covers a plain string, an issue array, and Zod's flattened object.
 */
function fieldMessages(details: unknown): string[] {
  if (typeof details === "string") return details.trim() ? [details] : [];

  if (Array.isArray(details)) {
    return details.flatMap((issue) => {
      if (typeof issue === "string") return [issue];
      if (!issue || typeof issue !== "object") return [];

      const row = issue as Record<string, unknown>;
      const text = [row.message, row.msg].find((v) => typeof v === "string");

      if (typeof text !== "string") return [];

      const field = Array.isArray(row.path)
        ? row.path.join(".")
        : [row.param, row.field].find((v) => typeof v === "string");

      return [typeof field === "string" && field ? `${field}: ${text}` : text];
    });
  }

  if (details && typeof details === "object") {
    const flat = details as Record<string, unknown>;

    // Zod's flattened form keeps the per-field half under `fieldErrors`.
    if (flat.fieldErrors && typeof flat.fieldErrors === "object") {
      const fields = fieldMessages(flat.fieldErrors);

      return fields.length > 0 ? fields : fieldMessages(flat.formErrors);
    }

    return Object.entries(flat).flatMap(([field, value]) =>
      (Array.isArray(value) ? value : [value])
        .filter((text): text is string => typeof text === "string")
        .map((text) => `${field}: ${text}`),
    );
  }

  return [];
}
