/**
 * Every locale the portal speaks, English first.
 *
 * The order matters. It's what the language switcher and the preferred-language
 * field render in, and English is the default.
 */
export const locales = ["en", "da"] as const;

export type Locale = (typeof locales)[number];

/** What an unprefixed path resolves to. Never guessed from the browser. */
export const defaultLocale: Locale = "en";

/**
 * Each language named in its own tongue, so the switcher reads the same however
 * the locale is set. That's why these aren't in the dictionaries.
 */
export const localeNames: Record<Locale, string> = {
  en: "EN",
  da: "DA",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
