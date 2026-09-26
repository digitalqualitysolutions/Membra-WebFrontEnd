import type { useTranslations } from "next-intl";
import { z } from "zod";

import { parseDayMonthYear } from "@/lib/date";

/**
 * What a club gets told about a member, and what a member can leave out. Built
 * like the auth schemas: the rule and the sentence a user reads when they break
 * it sit on the same line, in their own language.
 */

/** The `validation` translator, from `useTranslations` or `getTranslations`. */
type Translate = ReturnType<typeof useTranslations<"validation">>;

/**
 * Gender a member is registered under for team training, in the API's own
 * words - `GET /auth/genders` returns these, `complete-profile` takes them
 * and `/me` gives them back. One vocabulary end to end, so nothing in between
 * has to translate.
 *
 * This copy is the fallback, not the source of truth. The real list is fetched;
 * see `features/onboarding/services/genders`. It's here so a form still renders
 * when that call fails, and it's what makes an offline dev build work.
 */
export const genderCategories = ["male", "female", "others"] as const;

export type GenderCategory = (typeof genderCategories)[number];

/** Long enough for a real name, short enough that a roster row still reads. */
const maxNameLength = 60;

function nameField(t: Translate, requiredMessage: string) {
  return z
    .string()
    .trim()
    .min(1, requiredMessage)
    .max(maxNameLength, t("nameTooLong"));
}

/**
 * A masked `DD / MM / YYYY` value.
 *
 * Stays text instead of becoming a `Date`, because the field has to hold a
 * half-typed date without treating that as an error. Only submit does.
 */
function dateOfBirthField(t: Translate) {
  return z
    .string()
    .trim()
    .min(1, t("dateOfBirthRequired"))
    .refine((value) => parseDayMonthYear(value) !== null, t("dateOfBirthInvalid"))
    .refine((value) => {
      const date = parseDayMonthYear(value);
      // Unparseable dates are the refinement above's to report, not ours.
      return date === null || date.getTime() <= Date.now();
    }, t("dateOfBirthFuture"));
}

/**
 * A gender out of the list the member was actually offered.
 *
 * Not `choiceField`, because that needs its values at the time the module is
 * written and these arrive over the network. A value outside the list means a
 * tampered request or a page left open while the list changed underneath it;
 * either way the answer is the same as an empty one - pick again.
 */
function genderField(t: Translate, genders: readonly string[]) {
  const offered = new Set(genders);

  return z
    .string()
    .min(1, t("genderRequired"))
    .refine((value) => offered.has(value), t("genderRequired"));
}

/** A language out of the catalogue the member was actually offered. */
function languageField(t: Translate, languages: readonly string[]) {
  const offered = new Set(languages);

  return z
    .string()
    .min(1, t("languageRequired"))
    .refine((value) => offered.has(value), t("languageRequired"));
}

/**
 * @param genders what the gender field will accept, from `availableGenders()`.
 *   Defaults to the built-in list so a caller with nothing fetched still gets a
 *   working schema rather than one that rejects every gender.
 * @param languages the catalogue ids the language field will accept. No
 *   built-in fallback: there is no honest guess at another table's row ids.
 */
export function createProfileSchema(
  t: Translate,
  genders: readonly string[] = genderCategories,
  languages: readonly string[] = [],
) {
  return z.object({
    firstName: nameField(t, t("firstNameRequired")),
    lastName: nameField(t, t("lastNameRequired")),
    // Required because the API requires it. Leave it optional here and an empty
    // nickname comes back as a 400 the member can't do anything about.
    nickname: nameField(t, t("nicknameRequired")),
    dateOfBirth: dateOfBirthField(t),
    genderCategory: genderField(t, genders),
    // Language the club writes to this member in, from `GET /reference/languages`.
    preferredLanguage: languageField(t, languages),
    // Consent is the lawful basis for storing any of the above, which makes it
    // the one box that has to be ticked rather than just offered.
    consentStorage: z.boolean().refine(Boolean, t("consentStorageRequired")),
  });
}

/**
 * 8 MB, and the number is the API's rather than ours.
 *
 * `PUT /auth/avatars` refuses anything larger, so a laxer rule in the browser
 * would only turn a sentence the member can act on into a 400 they can't.
 */
export const maxPhotoBytes = 8 * 1024 * 1024;

/** What the API takes in. It renders its own AVIF variants from any of them. */
const acceptedPhotoTypes = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
  "image/avif",
];

/** What the file dialog offers. Extensions are in there for HEIC, see below. */
export const photoAccept = [
  ...acceptedPhotoTypes,
  ".jpg",
  ".jpeg",
  ".png",
  ".heic",
  ".heif",
  ".webp",
  ".avif",
].join(",");

/**
 * Some browsers report an empty `type` for HEIC because they can't decode it
 * themselves, so the extension check is a fallback, not a shortcut.
 */
export function isAcceptedPhoto(file: File) {
  return file.type
    ? acceptedPhotoTypes.includes(file.type)
    : /\.(jpe?g|png|hei[cf]|webp|avif)$/i.test(file.name);
}

export function createPhotoSchema(t: Translate) {
  return z
    .instanceof(File)
    .refine((file) => file.size <= maxPhotoBytes, t("photoTooLarge"))
    .refine(isAcceptedPhoto, t("photoUnsupportedType"));
}
