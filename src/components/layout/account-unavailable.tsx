import { getTranslations } from "next-intl/server";

import { AppShell } from "@/components/layout/app-shell";
import { LoadFailed } from "@/components/ui/load-failed";
import type { Locale } from "@/config/locales";

/**
 * A guarded page whose member couldn't be read.
 *
 * Inside the shell, not instead of it. Whoever renders this is signed in - the
 * session cookie is right there - so the navigation belongs on screen and
 * every link in it still works. One call didn't answer; that costs the page
 * its contents and the header its avatar, and nothing else. A card on a blank
 * ground would take the whole app away over the same call.
 *
 * `signedIn` without a `user` is what says so: draw a member's frame, leave
 * out the name and picture we haven't got.
 */
export async function AccountUnavailable({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale });

  return (
    <AppShell locale={locale} signedIn>
      <LoadFailed title={t("errorPage.partAccount")} />
    </AppShell>
  );
}
