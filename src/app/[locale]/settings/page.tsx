import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { isLocale } from "@/config/locales";
import { ActiveSessions } from "@/features/auth/components/active-sessions";
import { AuthCard } from "@/features/auth/components/auth-card";
import { requireSession } from "@/features/auth/server/session";
import { EmptyViewToggle } from "@/features/testing/components/empty-view-toggle";
import {
  emptyViewModeAvailable,
  isEmptyViewMode,
} from "@/features/testing/server/empty-view-mode";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings">): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale });

  return { title: `${t("settings.metaTitle")} · ${t("metadata.siteName")}` };
}

/**
 * Account settings. Just sessions for now, which is the one thing here that a
 * member might need in a hurry.
 */
export default async function Settings({
  params,
}: PageProps<"/[locale]/settings">) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  // Guard on the page, not the layout. Layouts don't re-render between
  // navigations, so a check up there quietly stops running.
  const user = await requireSession(locale);

  const t = await getTranslations("settings");

  return (
    <AppShell locale={locale} user={user} className="py-[clamp(1rem,4vh,4rem)]">
      <AuthCard
        title={t("title")}
        description={t("description")}
        icon="settings"
        medallion="ring"
      >
        <section>
          <h2 className="text-[13px] font-semibold tracking-wide text-ink uppercase">
            {t("sessions.title")}
          </h2>
          <p className="mt-1 mb-4 text-[12px] leading-relaxed text-subtle sm:text-[13px]">
            {t("sessions.description")}
          </p>

          <ActiveSessions locale={locale} />
        </section>

        {/* TEMPORARY - a testing switch, not a product feature. Remove this
            section along with `features/testing` once the empty states have
            been signed off. Off the developer's machine it isn't here at all,
            and the action behind it refuses for the same reason. */}
        {emptyViewModeAvailable ? (
          <section className="mt-8 border-t border-line pt-6">
            <h2 className="text-[13px] font-semibold tracking-wide text-ink uppercase">
              {t("emptyView.title")}
            </h2>
            <p className="mt-1 mb-4 text-[12px] leading-relaxed text-subtle sm:text-[13px]">
              {t("emptyView.intro")}
            </p>

            <EmptyViewToggle enabled={await isEmptyViewMode()} />
          </section>
        ) : null}
      </AuthCard>
    </AppShell>
  );
}
