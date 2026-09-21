import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { isLocale } from "@/config/locales";

/**
 * The signed-out screens: login, signup and the onboarding steps that follow.
 *
 * No account menu here, even though onboarding runs with a session. The header
 * lives in this layout, and a layout doesn't re-render between navigations, so
 * anything it showed about the member would go stale. Signed-in pages render
 * `AppShell` themselves and pass the session in.
 */
export default async function AuthLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  return <AppShell locale={locale}>{children}</AppShell>;
}
