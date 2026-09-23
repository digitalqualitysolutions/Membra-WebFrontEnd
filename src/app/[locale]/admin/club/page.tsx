import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AccountUnavailable } from "@/components/layout/account-unavailable";
import { AppShell } from "@/components/layout/app-shell";
import { isLocale } from "@/config/locales";
import { loadSession } from "@/features/auth/server/session";
import { ClubScreen } from "@/features/club/components/club-screen";
import {
  clubActivities,
  clubContacts,
  clubCountries,
  clubDetails,
  clubLanguages,
  clubLocations,
} from "@/features/club/services/club-details";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/club">): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) return {};

  const t = await getTranslations({ locale });

  return { title: `${t("club.metaTitle")} · ${t("metadata.siteName")}` };
}

/**
 * The club record.
 *
 * A concrete segment, so it wins over `admin/[[...section]]` and quietly
 * replaces that placeholder for this one destination - the sidebar link and the
 * header chip both go on reading `config/navigation.ts` and don't notice.
 *
 * The club and its reference lists are fetched here and handed down, the way
 * the profile page hands the form its genders: the cards are client
 * components and can't ask for them themselves.
 */
export default async function Club({
  params,
}: PageProps<"/[locale]/admin/club">) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  // Guard on the page, not the layout. Layouts don't re-render between
  // navigations, so a check up there quietly stops running.
  const session = await loadSession(locale);
  if (!session.ok) return <AccountUnavailable locale={locale} />;

  const user = session.data;

  const [club, activities, languages, countries, contacts, locations] =
    await Promise.all([
      clubDetails(),
      clubActivities(),
      clubLanguages(),
      clubCountries(),
      clubContacts(),
      clubLocations(),
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
          page's height. With a club, the header and cards just stack. */}
      <div className="flex w-full flex-1 flex-col">
        {/* The heading lives inside the screen, not here: it has to change the
            moment a club is created, and this server render has already
            finished by then. */}
        <ClubScreen
          club={club}
          activities={activities}
          languages={languages}
          countries={countries}
          contacts={contacts}
          locations={locations}
        />
      </div>
    </AppShell>
  );
}
