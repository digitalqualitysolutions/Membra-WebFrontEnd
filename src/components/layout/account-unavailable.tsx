import { getTranslations } from "next-intl/server";

import { LoadFailed } from "@/components/ui/load-failed";
import type { Locale } from "@/config/locales";

/**
 * A guarded page whose member couldn't be read.
 *
 * Without the shell, deliberately: the header greets the member by name and
 * draws their picture, and there's no member to draw. What's left is the one
 * thing worth offering - say what happened, and try again.
 *
 * This is what a guarded page renders instead of throwing, so an API that
 * didn't answer costs a screen rather than the whole app.
 */
export async function AccountUnavailable({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale });

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-page px-4 py-6 sm:px-6">
      <LoadFailed title={t("errorPage.partAccount")} />
    </main>
  );
}
