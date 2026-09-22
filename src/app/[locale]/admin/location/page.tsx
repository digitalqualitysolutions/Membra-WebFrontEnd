import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { isLocale } from "@/config/locales";
import { requireSession } from "@/features/auth/server/session";
import { clubDetails } from "@/features/club/services/club-details";
import { LocationsOverviewTable } from "@/features/location/components/locations-overview-table";
import { locationOverview } from "@/features/location/services/location-overview";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/location">): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale });

  return { title: `${t("location.metaTitle")} · ${t("metadata.siteName")}` };
}

/**
 * The whole estate on one screen.
 *
 * A concrete segment, so it wins over `admin/[[...section]]` and quietly
 * replaces that placeholder for this one destination - the sidebar link and the
 * header chip both go on reading `config/navigation.ts` and don't notice.
 *
 * The rows are fetched here and handed down, the way the club page hands its
 * cards their lists: the table is a client component, because the filter and
 * the folds are state, and it can't ask for them itself.
 */
export default async function Location({
  params,
}: PageProps<"/[locale]/admin/location">) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  // Guard on the page, not the layout. Layouts don't re-render between
  // navigations, so a check up there quietly stops running.
  const user = await requireSession(locale);

  // The club's own addresses go along: a hub is parented to one of them, so
  // the "parent site" dropdown offers what the club record already has.
  const [locations, club] = await Promise.all([
    locationOverview(),
    clubDetails(),
  ]);

  return (
    <AppShell
      locale={locale}
      user={user}
      // The shell centres a card by default, which is what the auth screens
      // want. This is a full page, so it starts at the top and fills the width.
      className="items-stretch justify-start px-4 py-6 sm:px-6 lg:px-8"
    >
      {/* Fills the column rather than capping and centring: a capped page
          leaves gutters the footer below it doesn't have, and the two stop
          sharing a left edge. */}
      {/* A growing flex column, so an empty screen can centre its card in the
          page's height. The heading lives inside the table component: it only
          belongs once there are locations, and the first one is created in
          the browser, after this render has finished. */}
      <div className="flex w-full flex-1 flex-col">
        <LocationsOverviewTable
          locations={locations}
          // Which club a new location is created under. No club record means
          // there is nothing to create one in, and the panel disables Save.
          clubId={club?.id ?? null}
          // No club record yet means no addresses to parent a hub to, and
          // the dropdown simply offers nothing rather than breaking.
          addresses={club?.addresses ?? []}
        />
      </div>
    </AppShell>
  );
}
