"use server";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { isLocale } from "@/config/locales";
import { readSessionToken } from "@/features/auth/server/session-cookie";
import {
  toCompleteProfileRequest,
  toPreferredLang,
} from "@/features/onboarding/api/profile-wire";
import { completeProfile } from "@/features/onboarding/api/profile-endpoints";
import type {
  ProfilePayload,
  ProfileState,
} from "@/features/onboarding/services/state";
import { createProfileSchema } from "@/features/onboarding/schemas";
import {
  availableGenders,
  genderList,
} from "@/features/onboarding/services/genders";
import { languageList } from "@/features/onboarding/services/languages";
import { ApiError, NetworkError } from "@/lib/http/api-error";
import { fieldErrorsFrom } from "@/lib/form";

/**
 * Save the member's profile, then on to their picture.
 *
 * The client validated these values already. We validate again: anything
 * reaching a Server Action arrived over the network, so treat it that way.
 */
export async function completeProfileAction(
  _previous: ProfileState,
  payload: ProfilePayload,
): Promise<ProfileState> {
  const { locale, ...values } = payload;
  if (!isLocale(locale)) return { formError: "Unsupported locale" };

  const tValidation = await getTranslations({ locale, namespace: "validation" });
  const tErrors = await getTranslations({ locale, namespace: "errors" });

  // Against the same list the form was given, not a copy of it: the page
  // deduped this call, so it's the very same answer.
  const parsed = createProfileSchema(
    tValidation,
    await availableGenders(),
  ).safeParse(values);

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) as ProfileState["fieldErrors"] };
  }

  // Signed-in members only. Without a session there's nothing to hang the
  // profile off.
  const token = await readSessionToken();
  if (!token) redirect(`/${locale}/login`);

  const languages = await languageList();

  if (!toPreferredLang(values.preferredLanguage, languages)) {
    // Not fatal - the locale goes up as-is below - but it's why a save would
    // come back "Invalid preferredLang value", so it gets named here.
    console.error(
      `[complete-profile] no language id for "${values.preferredLanguage}" in [${languages
        .map((row) => row.id)
        .join(", ")}]`,
    );
  }

  const body = toCompleteProfileRequest(values, await genderList(), languages);

  if (typeof body === "string") {
    // The schema already accepted these values, so failing here is ours: a
    // date that won't convert, or a gender with no id because the list
    // couldn't be read.
    console.error(`[complete-profile] could not build request: ${body}`);
    return { formError: tErrors("unexpected") };
  }

  try {
    await completeProfile(body, token);
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error("[complete-profile] upstream unreachable", error.cause);
      return { formError: tErrors("network") };
    }

    if (ApiError.isApiError(error)) {
      // Session disappeared somewhere between the guard above and this call.
      if (error.status === 401) redirect(`/${locale}/login`);

      /*
       * Every refusal gets logged, not just the validation ones. 401 is the
       * only status this step expects, and it returned above; anything still
       * here is unexplained, and leaving a 409 or a 500 silent turns the
       * member's "something went wrong" into our own dead end too.
       */
      console.error(
        `[complete-profile] ${error.status} ${error.code}: ${error.message}`,
        error.details,
      );

      return { formError: tErrors("unexpected") };
    }

    throw error;
  }

  /*
   * On in whichever language they just asked for. The locale lives in the URL,
   * so a member who picked Danish here reads the rest of onboarding in Danish.
   */
  redirect(`/${parsed.data.preferredLanguage}/onboarding/photo`);
}
