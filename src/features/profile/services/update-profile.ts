"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isLocale } from "@/config/locales";
import { readSessionToken } from "@/features/auth/server/session-cookie";
import { completeProfile } from "@/features/onboarding/api/profile-endpoints";
import {
  toAppLocale,
  toCompleteProfileRequest,
} from "@/features/onboarding/api/profile-wire";
import { createProfileSchema } from "@/features/onboarding/schemas";
import {
  availableGenders,
  genderList,
} from "@/features/onboarding/services/genders";
import { languageList } from "@/features/onboarding/services/languages";
import type {
  ProfilePayload,
  ProfileState,
} from "@/features/onboarding/services/state";
import { ApiError, NetworkError } from "@/lib/http/api-error";
import { fieldErrorsFrom } from "@/lib/form";

/**
 * Save an edit to a profile that already exists.
 *
 * Same fields and the same endpoint as onboarding's first step: the API has one
 * profile write, and it takes the whole profile rather than a patch. What
 * differs is the ending - onboarding moves on to the photo step, an edit stays
 * where it is and says it saved.
 *
 * The client validated these values already. We validate again: anything
 * reaching a Server Action arrived over the network, so treat it that way.
 */
export async function updateProfileAction(
  _previous: ProfileState,
  payload: ProfilePayload,
): Promise<ProfileState> {
  const { locale, ...values } = payload;
  if (!isLocale(locale)) return { formError: "Unsupported locale" };

  const tValidation = await getTranslations({ locale, namespace: "validation" });
  const tErrors = await getTranslations({ locale, namespace: "errors" });

  // Against the same list the form was given, not a copy of it: the page
  // deduped this call, so it's the very same answer.
  const languages = await languageList();

  const parsed = createProfileSchema(
    tValidation,
    await availableGenders(),
    languages.map((row) => row.id),
  ).safeParse(values);

  if (!parsed.success) {
    return {
      fieldErrors: fieldErrorsFrom(parsed.error) as ProfileState["fieldErrors"],
    };
  }

  const token = await readSessionToken();
  if (!token) redirect(`/${locale}/login`);

  // The schema already checked it against this list, so it's a row id by now.
  const body = toCompleteProfileRequest(
    parsed.data,
    await genderList(),
    languages,
  );

  if (typeof body === "string") {
    // The schema already accepted these values, so failing here is ours: a
    // date that won't convert, or a gender with no id because the list
    // couldn't be read.
    console.error(`[update-profile] could not build request: ${body}`);
    return { formError: tErrors("unexpected") };
  }

  try {
    await completeProfile(body, token);
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error("[update-profile] upstream unreachable", error.cause);
      return { formError: tErrors("network") };
    }

    if (ApiError.isApiError(error)) {
      // Session went away between the check above and this call.
      if (error.status === 401) redirect(`/${locale}/login`);

      if (error.status === 400 || error.code === "CONTRACT_MISMATCH") {
        console.error(`[update-profile] ${error.code}: ${error.message}`, error.details);
      }

      return { formError: tErrors("unexpected") };
    }

    throw error;
  }

  // The prefix the chosen language reads in - `en-US` and `en-GB` both `en`.
  const chosen = toAppLocale(parsed.data.preferredLanguage);

  /*
   * The header greets the member by name and the home page repeats it, both
   * from `/me`. Drop the cached render so the new name is what they see when
   * they navigate away, instead of the one they just replaced. Both locales,
   * since the next thing this member reads may well be the other one.
   */
  for (const affected of new Set([locale, chosen])) {
    revalidatePath(`/${affected}`, "layout");
  }

  /*
   * A language is the one profile field that changes the app rather than just
   * describing the member, and the locale lives in the URL - nothing reads the
   * saved preference to decide what to render. So switching languages means
   * going to the same page under the other prefix, and every link built from
   * the locale param follows from there.
   *
   * `?saved=1` carries the confirmation across the navigation. Returning it
   * wouldn't survive: this is a different page in a different language, with a
   * form whose action state starts empty.
   */
  if (chosen !== locale) redirect(`/${chosen}/profile?saved=1`);

  return { saved: true };
}
