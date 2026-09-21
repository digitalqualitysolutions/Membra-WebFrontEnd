"use client";

import { useTranslations } from "next-intl";

import { Icon } from "@/components/icons";

/**
 * TEMPORARY - see `server/empty-view-mode.ts`. Delete with the rest.
 *
 * Shown where a save would have happened, when empty view mode stopped it. The
 * mode exists to look at empty screens; a click made while testing them must
 * never become a real club or location once there's an API behind the button.
 */
export function TestModeNotice() {
  const t = useTranslations("settings.emptyView");

  return (
    <p
      role="status"
      className="inline-flex items-center gap-2 rounded-lg border border-lock/40 bg-lock/10 px-3 py-2 text-[12px] font-medium text-body"
    >
      <Icon name="warning" size="xs" className="shrink-0 text-lock" />
      {t("blocked")}
    </p>
  );
}
