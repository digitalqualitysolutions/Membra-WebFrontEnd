"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/** The fields the glossary explains, in the order the form shows them. */
const terms = [
  "parentSite",
  "parentLocation",
  "memberBookable",
  "toBook",
  "public",
  "active",
  "groups",
] as const;

/**
 * What a location is, and what each column of the form means.
 *
 * Shown only while the club has no locations at all. It is written for someone
 * about to create their first one - which hierarchy to build, which addresses
 * to add first - and once there are rows on the screen that advice is behind
 * you, so it stops taking up the space the table wants.
 */
export function LocationHelp() {
  const t = useTranslations("location.help");

  return (
    <section className="rounded-2xl border border-line bg-surface px-5 py-5 shadow-card sm:px-6">
      <h2 className="text-[15px] font-semibold tracking-tight text-ink">
        {t("title")}
      </h2>

      <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-[13px] text-body">
        <li>{t("intro")}</li>

        <li>
          {t("naming")}
          {/* The two tips hang off the naming bullet rather than standing as
              bullets of their own: they are the order you do that paragraph
              in, not two more things to know. */}
          <span className="mt-1 block text-subtle">{t("tip1")}</span>
        </li>

        <li>{t("tip2")}</li>

        {terms.map((term) => (
          <li key={term}>
            <Term>{t(`terms.${term}`)}</Term>: {t(`defs.${term}`)}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The field a glossary line is about. */
function Term({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-ink">{children}</strong>;
}
