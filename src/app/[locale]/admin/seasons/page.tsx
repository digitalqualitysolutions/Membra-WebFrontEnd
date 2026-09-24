import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AccountUnavailable } from "@/components/layout/account-unavailable";
import { AppShell } from "@/components/layout/app-shell";
import { LoadFailed } from "@/components/ui/load-failed";
import { isLocale } from "@/config/locales";
import { loadSession } from "@/features/auth/server/session";
import { clubDetails } from "@/features/club/services/club-details";
import { SeasonsScreen } from "@/features/season/components/seasons-screen";
import { seasonOverview } from "@/features/season/services/season-overview";

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
 * The rows are fetched here and handed down, the way the locations page hands
 * its table the estate: the screen is a client component, because the filter,
 * the edit and the draft are all state, and it can't ask for them itself.
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
  const t = await getTranslations({ locale });

  // The club comes along for its id: a season is created under one, and
  // without it the screen has nothing to save against.
  const [seasons, club] = await Promise.all([seasonOverview(), clubDetails()]);

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
          belongs once there are seasons, and on a new club there are none. */}
      <div className="flex w-full flex-1 flex-col">
        {seasons.ok ? (
          <SeasonsScreen
            seasons={seasons.data}
            // Which club a season is created under. No club record means there
            // is nothing to create one in, and the screen disables Save.
            clubId={club.ok ? (club.data?.id ?? null) : null}
          />
        ) : (
          // The shell, header and navigation all rendered; only the table is
          // missing, and its own Try again reloads just this page.
          <LoadFailed title={t("errorPage.partSeasons")} />
        )}
      </div>
    </AppShell>
  );
}
