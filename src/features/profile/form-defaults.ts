import type { Locale } from "@/config/locales";
import { isLocale } from "@/config/locales";
import type { SessionUser } from "@/features/auth/api/auth-wire";
import type { Gender } from "@/features/onboarding/api/profile-wire";
import { genderCategories } from "@/features/onboarding/schemas";
import type { ProfileFormValues } from "@/features/onboarding/types";

/**
 * The member's saved profile, in the shape the form holds it.
 *
 * Every field falls back to empty rather than throwing. A profile can be half
 * filled in (onboarding is skippable) and the API's labels are its own to
 * change, so anything that doesn't map cleanly comes back as an untouched field
 * the member can just fill in.
 */
export function profileFormDefaults(
  user: SessionUser,
  locale: Locale,
  /** The words the select offers, from `availableGenders()`. */
  genders: readonly string[] = genderCategories,
  /** Every gender with its id, from `genderList()`, to read `genderId` by. */
  genderRows: readonly Gender[] = [],
): ProfileFormValues {
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    nickname: user.nickname ?? "",
    dateOfBirth: toMaskedDate(user.dateOfBirth),
    genderCategory: toGenderCategory(user.genderId, genders, genderRows),
    // Their saved choice, or the language they're reading this in.
    preferredLanguage: isLocale(user.preferredLanguage ?? "")
      ? (user.preferredLanguage as Locale)
      : locale,
    // Already given, or the profile wouldn't have been stored in the first
    // place. Shown ticked so unticking it stays a deliberate act.
    consentStorage: true,
  };
}

/** `YYYY-MM-DD` (or a full timestamp) as the masked `DD / MM / YYYY` field. */
function toMaskedDate(value: string | null): string {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "";

  const [, year, month, day] = match;

  return `${day} / ${month} / ${year}`;
}

/**
 * The gender `/users/me` reports, as a value the select can actually show.
 *
 * `/users/me` sends an id; the select works in words. The id is looked up in
 * the API's own list, then the word checked against what the select offers -
 * so a gender retired upstream can't leave the field holding a value its own
 * select doesn't list.
 *
 * Anything that doesn't resolve - no id, an unknown one, or a list that
 * couldn't be read - gives up quietly and leaves the member to pick.
 */
function toGenderCategory(
  reported: number | null,
  genders: readonly string[],
  rows: readonly Gender[],
): string {
  if (reported === null) return "";

  const word = rows.find((row) => row.id === reported)?.value;

  return word && genders.includes(word) ? word : "";
}
