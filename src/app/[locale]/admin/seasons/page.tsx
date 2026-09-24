import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AccountUnavailable } from "@/components/layout/account-unavailable";
import { AppShell } from "@/components/layout/app-shell";
import { isLocale } from "@/config/locales";
import { loadSession } from "@/features/auth/server/session";
import { SeasonsScreen } from "@/features/season/components/seasons-screen";
import { dummySeasons } from "@/features/season/dummy-seasons";
import { toIsoDate } from "@/lib/date";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/seasons">): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale });

  return { title: `${t("season.metaTitle")} · ${t("metadata.siteName")}` };
}

/**
 * The club's operational year, as a list of dated runs.
 *
 * A concrete segment, so it wins over `admin/[[...section]]` and quietly
 * replaces that placeholder for this one destination - the sidebar link and the
 * header chip both go on reading `config/navigation.ts` and don't notice.
 *
 * The rows are made up for now: seasons have no endpoint yet, so there is
 * nothing to fetch and nothing that can fail to load. When one lands this grows
 * the same `Loaded`/`LoadFailed` pair the locations page has.
 */
export default async function Seasons({
  params,
}: PageProps<"/[locale]/admin/seasons">) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  // Guard on the page, not the layout. Layouts don't re-render between
  // navigations, so a check up there quietly stops running.
  const session = await loadSession(locale);
  if (!session.ok) return <AccountUnavailable locale={locale} />;

  const user = session.data;

  return (
    <AppShell
      locale={locale}
      user={user}
      // The shell centres a card by default, which is what the auth screens
      // want. This is a full page, so it starts at the top and fills the width.
      className="items-stretch justify-start px-4 py-6 sm:px-6 lg:px-8"
    >
      {/* A growing flex column, so an empty screen can centre its card in the
          page's height. The heading lives inside the screen component: it only
          belongs once there are seasons, and on an empty club there are none. */}
      <div className="flex w-full flex-1 flex-col">
        {/* Today is settled here rather than in the browser, so the note above
            the table renders the same on both sides of hydration. */}
        <SeasonsScreen seasons={dummySeasons} today={toIsoDate(new Date())} />
      </div>
    </AppShell>
  );
}
