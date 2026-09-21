/**
 * The countries a club can be registered in.
 *
 * Ours to keep, for now: the API takes a two-letter `countryCode` but has no
 * list to offer, so the codes live here. Only the codes, though - the names
 * come from the runtime in the page's own language, so "Denmark" reads
 * "Danmark" on the Danish site with nothing to translate by hand.
 *
 * When the API grows a countries endpoint, this becomes a call like the
 * activities and languages.
 */
export const clubCountryCodes = ["DK", "SE", "NO", "FI"] as const;

/** A code as this member reads it, or the code itself if it has no name. */
export function countryName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Every offered country, named in `locale`. */
export function countryOptions(
  locale: string,
): { code: string; name: string }[] {
  return clubCountryCodes.map((code) => ({
    code,
    name: countryName(code, locale),
  }));
}
