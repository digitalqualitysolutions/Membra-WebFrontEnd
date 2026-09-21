"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";

/**
 * The warning about running the club on too few administrators.
 *
 * Dismissible twice over, which is the point of it: the × is "not now" and the
 * link underneath is "not for a month". Neither outlives the page yet - where
 * that preference belongs is a question for whoever owns the club record, and
 * guessing at a cookie here would be inventing an answer.
 */
export function AdminSafeguardBanner({
  admins,
  recommended,
}: {
  admins: number;
  recommended: number;
}) {
  const t = useTranslations("club.safeguard");
  const [dismissed, setDismissed] = useState(false);

  // Nothing to warn about once the club has enough of them.
  if (dismissed || admins >= recommended) return null;

  return (
    <section className="relative rounded-2xl border border-lock/30 bg-lock/8 px-5 py-4 sm:px-6">
      <div className="flex gap-4">
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-lock/15 text-lock">
          <Icon name="warning" size="lg" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pr-8">
            <h2 className="text-[15px] font-semibold text-ink">{t("title")}</h2>

            <span className="rounded-full border border-lock/40 bg-surface px-2.5 py-0.5 text-[12px] font-medium text-lock">
              {t("count", { count: admins })}
            </span>
          </div>

          <p className="mt-1.5 text-[13px] leading-relaxed text-body">
            {t("body", { recommended })}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-lock/40 bg-lock/10 text-[12px] font-semibold text-ink hover:bg-lock/15"
            >
              <Icon name="add" size="xs" />
              {t("invite", { recommended })}
            </Button>

            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-[13px] font-medium text-ink underline underline-offset-4 transition-colors outline-none hover:text-ink-soft focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {t("snooze")}
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t("dismiss")}
        className="absolute top-4 right-4 inline-flex size-7 items-center justify-center rounded-lg text-lock transition-colors outline-none hover:bg-lock/15 focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <Icon name="close" size="sm" />
      </button>
    </section>
  );
}
