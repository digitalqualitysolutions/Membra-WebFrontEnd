"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Icon } from "@/components/icons";
import { Switch } from "@/components/ui/switch";
import { setEmptyViewMode } from "@/features/testing/services/empty-view-mode";

/**
 * TEMPORARY - see `server/empty-view-mode.ts`. Delete with the rest.
 *
 * Deliberately loud. Someone who finds this by accident should be able to tell
 * at a glance that their data hasn't gone anywhere, which a quiet switch
 * labelled "empty view" would not manage.
 */
export function EmptyViewToggle({ enabled }: { enabled: boolean }) {
  const t = useTranslations("settings.emptyView");
  const router = useRouter();

  const [on, setOn] = useState(enabled);
  const [pending, startTransition] = useTransition();

  function change(next: boolean) {
    // Moved straight away rather than after the round trip: the switch is the
    // one part of this that should never feel like it's thinking about it.
    setOn(next);

    startTransition(async () => {
      await setEmptyViewMode(next);

      // The action revalidates, but this screen was already rendered - without
      // a refresh the toggle would be the only thing that changed.
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-lock/40 bg-lock/10 px-4 py-3.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-lock">
            <Icon name="warning" size="xs" className="shrink-0" />
            {t("label")}
          </p>

          <p className="mt-1 text-[12px] leading-relaxed text-body">
            {t("description")}
          </p>
        </div>

        <Switch
          checked={on}
          disabled={pending}
          onChange={change}
          label={t("label")}
          tone="ink"
        />
      </div>

      {on ? (
        <p className="mt-3 border-t border-lock/30 pt-3 text-[12px] font-medium text-lock">
          {t("active")}
        </p>
      ) : null}
    </div>
  );
}
