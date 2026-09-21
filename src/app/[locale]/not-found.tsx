import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { locale as localeParam } from "next/root-params";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { defaultLocale, isLocale } from "@/config/locales";

/**
 * Renders for `notFound()`, and for unmatched URLs under a locale.
 *
 * Not-found boundaries aren't handed `params`, hence the root param. And the
 * path may not carry a real locale at all (`/xx/nowhere` gets here too), so
 * fall back instead of trusting it.
 */
export default async function LocaleNotFound() {
  const requested = (await localeParam()) ?? "";
  const locale = isLocale(requested) ? requested : defaultLocale;

  const t = await getTranslations({ locale, namespace: "notFound" });

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-page px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-ink text-on-ink">
        <Icon name="brand" className="size-6" />
      </span>

      <h1 className="mt-6 text-xl font-semibold tracking-tight text-ink">
        {t("title")}
      </h1>

      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-subtle sm:text-sm">
        {t("description")}
      </p>

      <Button asChild size="form" className="mt-7 w-full max-w-xs">
        <Link href={`/${locale}/login`}>{t("backToLogin")}</Link>
      </Button>
    </div>
  );
}
