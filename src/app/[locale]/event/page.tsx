import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AccountUnavailable } from "@/components/layout/account-unavailable";
import { AppShell } from "@/components/layout/app-shell";
import { SectionPlaceholder } from "@/components/layout/section-placeholder";
import { isLocale } from "@/config/locales";
import { loadSession } from "@/features/auth/server/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/event">): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale });

  return { title: `${t("nav.event")} · ${t("metadata.siteName")}` };
}

/** The club's events. A placeholder until the real screen lands here. */
export default async function Event({ params }: PageProps<"/[locale]/event">) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  // Guard on the page, not the layout. Layouts don't re-render between
  // navigations, so a check up there quietly stops running.
  const session = await loadSession(locale);
  if (!session.ok) return <AccountUnavailable locale={locale} />;

  const user = session.data;

  const t = await getTranslations("nav");

  return (
    <AppShell locale={locale} user={user}>
      <SectionPlaceholder icon="events" title={t("event")} />
    </AppShell>
  );
}
