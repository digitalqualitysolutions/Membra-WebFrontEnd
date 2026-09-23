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
}: PageProps<"/[locale]/chat">): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale });

  return { title: `${t("nav.chat")} · ${t("metadata.siteName")}` };
}

/** Club conversations. A placeholder until the real screen lands here. */
export default async function Chat({ params }: PageProps<"/[locale]/chat">) {
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
      <SectionPlaceholder icon="chat" title={t("chat")} />
    </AppShell>
  );
}
