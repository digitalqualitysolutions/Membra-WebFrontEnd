import { z } from "zod";

import { parseDayMonthYear, toIsoDate } from "@/lib/date";
import type { ProfileFormValues } from "@/features/onboarding/types";

/**
 * Wire format for completing a member's profile, plus the mapping from what the
 * form holds to what the API expects.
 */

/**
 * One row of `app.genders`, from `GET /reference/genders`.
 *
 * Both halves matter now: the word is what the form shows and translates, the
 * id is what `complete-profile` takes and `/users/me` reports.
 */
const genderSchema = z.object({
  id: z.number().int(),
  gender: z.string().min(1),
});

export const gendersResponseSchema = z.object({
  genders: z.array(genderSchema),
});

/** A gender the API offers, in the names the rest of the app uses. */
export type Gender = {
  /** What the API sends and expects: `genderId`. */
  id: number;
  /** What the form works in: `male`, `female`, `others`. */
  value: string;
};

export function toGenders(
  response: z.infer<typeof gendersResponseSchema>,
): Gender[] {
  return response.genders.map((row) => ({ id: row.id, value: row.gender }));
}

/**
 * What `POST /users/complete-profile` accepts.
 *
 * `genderId` is any positive integer rather than a known set, deliberately.
 * The ids come from `GET /reference/genders` at runtime, so listing them here
 * would refuse a gender the API added tomorrow - by us, as a
 * CONTRACT_MISMATCH, before the API ever gets a say.
 */
export const completeProfileRequestSchema = z.object({
  firstname: z.string().min(1).max(200),
  surname: z.string().min(1).max(200),
  nickname: z.string().min(1).max(200),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  genderId: z.number().int().positive(),
  preferredLang: z.string().min(2).max(15),
});

export type CompleteProfileRequest = z.infer<typeof completeProfileRequestSchema>;

/** Why a validated form still couldn't be turned into a request. */
export type CompleteProfileProblem = "date" | "gender";

/**
 * Turn validated form values into the API's shape.
 *
 * The form holds a gender word; the API wants that word's id, looked up in the
 * list the API gave. Both failures below are ours, not the member's - the
 * schema already accepted these values - so the caller logs them and shows a
 * general error:
 *
 * - `date`: the date wouldn't parse, which the schema should have caught.
 * - `gender`: the word has no id, which means the gender list couldn't be
 *   read and the form fell back to its built-in words. Refusing is the point:
 *   guessing an id would save the member under a gender they didn't pick.
 */
export function toCompleteProfileRequest(
  values: ProfileFormValues,
  genders: readonly Gender[],
): CompleteProfileRequest | CompleteProfileProblem {
  const dob = parseDayMonthYear(values.dateOfBirth);
  if (!dob) return "date";

  const gender = genders.find((row) => row.value === values.genderCategory);
  if (!gender) return "gender";

  return {
    firstname: values.firstName,
    surname: values.lastName,
    nickname: values.nickname,
    dob: toIsoDate(dob),
    genderId: gender.id,
    preferredLang: values.preferredLanguage,
  };
}
