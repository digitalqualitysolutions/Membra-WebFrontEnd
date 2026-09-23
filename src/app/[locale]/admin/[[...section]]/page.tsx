import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AccountUnavailable } from "@/components/layout/account-unavailable";
import { AppShell } from "@/components/layout/app-shell";
import { SectionPlaceholder } from "@/components/layout/section-placeholder";
import { isLocale } from "@/config/locales";
import { navLinkFor } from "@/config/navigation";
import { loadSession } from "@/features/auth/server/session";

/**
 * Every admin screen the sidebar leads to, standing in for all of them at once.
 *
 * One optional catch-all rather than seventeen near-identical files: the list
 * of destinations already lives in `config/navigation.ts`, and a path that
 * isn't on it is a 404 like any other. A real screen taking, say, `/admin/club`
 * simply adds `admin/club/page.tsx` - a concrete segment wins over this one, so
 * they replace it one at a time with nothing to undo here.
 */
type AdminProps = PageProps<"/[locale]/admin/[[...section]]">;

/** The path as `navigation` writes it: `/admin`, or `/admin/<section>`. */
function adminPath(section: string[] | undefined) {
  return section?.length ? `/admin/${section.join("/")}` : "/admin";
}

export async function generateMetadata({
  params,
}: AdminProps): Promise<Metadata> {
  const { locale, section } = await params;

  if (!isLocale(locale)) return {};

  const link = navLinkFor(adminPath(section));

  if (!link) return {};

  const t = await getTranslations({ locale });

  return { title: `${t(`nav.${link.key}`)} · ${t("metadata.siteName")}` };
}

export default async function Admin({ params }: AdminProps) {
  const { locale, section } = await params;

  if (!isLocale(locale)) notFound();

  const link = navLinkFor(adminPath(section));

  if (!link) notFound();

  // Guard on the page, not the layout. Layouts don't re-render between
  // navigations, so a check up there quietly stops running.
  const session = await loadSession(locale);
  if (!session.ok) return <AccountUnavailable locale={locale} />;

  const user = session.data;

  const t = await getTranslations("nav");

  return (
    <AppShell locale={locale} user={user}>
      <SectionPlaceholder icon={link.icon} title={t(link.key)} />
    </AppShell>
  );
}
