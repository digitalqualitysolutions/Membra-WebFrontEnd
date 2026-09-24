"use client";

import { useTranslations } from "next-intl";

import { Icon } from "@/components/icons";
import type { SeasonRow } from "@/features/season/types";

/**
 * Which season the club is actually in, and what moving its dates would cost.
 *
 * Not dismissible, unlike the club screen's safeguard banner: that one warns
 * about something you can go and fix, and this one states the state the rest of
 * the page is edited against. Reading it is the point, so it stays.
 */
export function ActiveSeasonNote({ current }: { current: SeasonRow | null }) {
  const t = useTranslations("season.note");

  return (
    <section className="rounded-2xl border border-lock/30 bg-lock/8 px-5 py-4 sm:px-6">
      <div className="flex gap-4">
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-lock/15 text-lock">
          <Icon name="warning" size="lg" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 className="text-[13px] font-semibold tracking-wide text-ink uppercase">
              {t("title")}
            </h2>

            <span className="inline-flex items-center gap-2 rounded-full border border-lock/40 bg-surface px-2.5 py-0.5 text-[12px] font-medium text-lock">
              <span aria-hidden className="size-1.5 rounded-full bg-lock" />

              {current ? t("current", { name: current.name }) : t("none")}
            </span>
          </div>

          <p className="mt-1.5 text-[13px] leading-relaxed text-body">
            {t("body")}
          </p>
        </div>
      </div>
    </section>
  );
}
