import type { Locale } from "@/config/locales";
import { da } from "@/translations/da";
import { en, type Dictionary } from "@/translations/en";

export type { Dictionary };

/**
 * Copy for every locale. Small enough to ship together, so no request has to
 * go and fetch a dictionary of its own.
 */
export const messages: Record<Locale, Dictionary> = { da, en };

/**
 * Tells next-intl about this app, so `t("…")` keys get checked against `en.ts`
 * and `useLocale()` returns the locale union instead of a bare string.
 */
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Dictionary;
  }
}
