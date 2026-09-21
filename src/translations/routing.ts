import { defineRouting } from "next-intl/routing";

import { defaultLocale, locales } from "@/config/locales";

/**
 * How locales show up in the URL. Every path carries one, and we don't consult
 * `accept-language` or a cookie: an unprefixed path lands on the default
 * locale, same as the hand-rolled proxy did.
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localeDetection: false,
  localeCookie: false,
});
