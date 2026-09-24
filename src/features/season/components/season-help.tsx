"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ReactNode } from "react";

import { CardHeader } from "@/features/club/components/record-parts";

/** The columns the glossary explains, in the order the table shows them. */
const terms = [
  "season",
  "short",
  "start",
  "end",
  "teams",
  "locations",
  "active",
] as const;

/**
 * What a season is, and what each column of the table means.
 *
 * Folded away to begin with, unlike the locations glossary it borrows its shape
 * from: that one only ever appears on an empty screen, where it is the only
 * thing to read. This sits under a table the member came to use, so it waits to
 * be asked for rather than pushing the table down the page.
 */
export function SeasonHelp({
  /**
   * Open from the start, which is what the first-run view wants: there the
   * help is the thing to read, not a footnote under a table.
   */
  defaultOpen = false,
}: {
  defaultOpen?: boolean;
}) {
  const t = useTranslations("season.help");
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <CardHeader
        open={open}
        onToggle={() => setOpen(!open)}
        collapseLabel={t("title")}
        title={t("title")}
        description={t("description")}
      />

      {open ? (
        <div className="border-t border-line px-5 py-5 sm:px-6">
          <ul className="flex list-disc flex-col gap-2 pl-5 text-[13px] text-body">
            <li>{t("intro")}</li>
            <li>{t("pairRule")}</li>

            {terms.map((term) => (
              <li key={term}>
                <Term>{t(`terms.${term}`)}</Term>: {t(`defs.${term}`)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

/** The column a glossary line is about. */
function Term({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-ink">{children}</strong>;
}
