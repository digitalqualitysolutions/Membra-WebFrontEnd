"use client";

import { useActionState, startTransition } from "react";
import { useTranslations } from "next-intl";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/config/locales";
import { revokeSessionAction } from "@/features/auth/services/revoke-session";
import { initialRevokeSessionState } from "@/features/auth/services/state";

/**
 * Ends one other session.
 *
 * Its own action state, one button per row, so a failure names the row it
 * belongs to instead of a single message at the top of a list of four.
 */
export function RevokeSessionButton({
  sessionId,
  locale,
}: {
  sessionId: string;
  locale: Locale;
}) {
  const t = useTranslations("settings");

  const [state, revoke, isPending] = useActionState(
    revokeSessionAction.bind(null, locale),
    initialRevokeSessionState,
  );

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={() => startTransition(() => revoke(sessionId))}
      >
        {isPending ? (
          <Icon name="pending" className="animate-spin" />
        ) : (
          <Icon name="signOut" />
        )}
        {t("sessions.revoke")}
      </Button>

      {state.error && !isPending ? (
        // Announced: the row it belongs to is the only thing that changes.
        <p role="alert" className="text-[12px] font-medium text-danger">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
