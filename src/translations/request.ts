import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locale as localeParam } from "next/root-params";

import { messages } from "@/translations";
import { routing } from "@/translations/routing";

/**
 * Per-request config for next-intl. The plugin in `next.config.ts` picks this
 * up by path, which is why nothing imports it.
 *
 * Locale comes from the `[locale]` root param rather than a request header;
 * that's what keeps every page statically renderable.
 */
export default getRequestConfig(async ({ locale }) => {
  // `locale` is only set when a caller names one: `getTranslations({ locale })`.
  const requested = locale ?? (await localeParam());

  const resolved = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return { locale: resolved, messages: messages[resolved] };
});
