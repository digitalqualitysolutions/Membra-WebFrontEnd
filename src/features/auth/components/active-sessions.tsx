import { getTranslations } from "next-intl/server";

import { Icon } from "@/components/icons";
import type { Locale } from "@/config/locales";
import { listActiveSessions } from "@/features/auth/api/auth-endpoints";
import type { ActiveSession } from "@/features/auth/api/auth-wire";
import { RevokeSessionButton } from "@/features/auth/components/revoke-session-button";
import { readSessionToken } from "@/features/auth/server/session-cookie";

/**
 * Everywhere this member is signed in, and a way to end the ones that aren't
 * here.
 *
 * The current session gets a label instead of a button. Revoking it upstream
 * would leave our cookie behind - signed out everywhere but this tab - and
 * signing this device out is what the account menu's "Log out" already does,
 * cookie and all.
 *
 * Rows are thinner than they ought to be: the API returns an id and two
 * timestamps, no user agent, IP or last-used. So a member can see *that* there
 * are three other sessions but not *which* is the old phone. Add the fields
 * upstream and this list gets useful without changing shape.
 */
export async function ActiveSessions({ locale }: { locale: Locale }) {
  const t = await getTranslations("settings");

  const token = await readSessionToken();

  // The page above already required a session, so this is belt and braces.
  if (!token) return null;

  let sessions: ActiveSession[];

  try {
    sessions = await listActiveSessions(token);
  } catch (error) {
    // Inline rather than thrown. One widget failing shouldn't take the whole
    // settings page down with it.
    console.error("[active-sessions] could not be listed", error);

    return (
      <p role="alert" className="text-[13px] text-danger">
        {t("sessions.unavailable")}
      </p>
    );
  }

  // This device first; the rest newest first, since a session the member didn't
  // expect is more likely to be a recent one.
  const ordered = [...sessions].sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;

    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
      {ordered.map((session) => (
        <li
          key={session.id}
          className="flex items-center justify-between gap-4 px-4 py-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Icon name="session" className="shrink-0 text-ink-muted" />

            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink">
                {session.isCurrent
                  ? t("sessions.thisDevice")
                  : t("sessions.otherDevice")}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-subtle">
                {t("sessions.startedAt", {
                  when: formatMoment(session.createdAt, locale),
                })}
                {" · "}
                {t("sessions.expiresAt", {
                  when: formatMoment(session.expiresAt, locale),
                })}
              </p>
            </div>
          </div>

          {session.isCurrent ? (
            <span className="shrink-0 rounded-full bg-badge px-2.5 py-1 text-[11px] font-semibold text-ink">
              {t("sessions.current")}
            </span>
          ) : (
            <RevokeSessionButton sessionId={session.id} locale={locale} />
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * One of the API's timestamps, as a date a person reads.
 *
 * They arrive as `2026-09-10 16:27:30.686942+05:30` - ISO 8601 but for the
 * space where the `T` belongs, which is the one thing `Date` isn't required to
 * accept. Swapping it in makes parsing defined rather than up to the engine.
 *
 * Formatted on the server, so what ships is finished text and no second pass in
 * the browser can disagree with it. That does mean the server's time zone, not
 * the reader's - the trade for text that can't mismatch.
 */
function formatMoment(value: string, locale: Locale): string {
  const parsed = new Date(value.replace(" ", "T"));

  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}
