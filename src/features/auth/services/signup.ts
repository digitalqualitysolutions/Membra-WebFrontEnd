"use server";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { isLocale } from "@/config/locales";
import { signUp } from "@/features/auth/api/auth-endpoints";
import { createSignupSchema } from "@/features/auth/schemas";
import type {
  SignupPayload,
  SignupState,
} from "@/features/auth/services/state";
import { ApiError, NetworkError } from "@/lib/http/api-error";
import { fieldErrorsFrom } from "@/lib/form";
import { setSessionFromUpstream } from "@/features/auth/server/session-cookie";

/**
 * Create the account, take ownership of the session, head to onboarding.
 *
 * The client validated these values already. We validate again: anything
 * reaching a Server Action arrived over the network, so treat it that way.
 */
export async function signUpAction(
  _previous: SignupState,
  payload: SignupPayload,
): Promise<SignupState> {
  const { locale, ...values } = payload;
  if (!isLocale(locale)) return { formError: "Unsupported locale" };

  const tValidation = await getTranslations({ locale, namespace: "validation" });
  const tErrors = await getTranslations({ locale, namespace: "errors" });

  const parsed = createSignupSchema(tValidation).safeParse(values);

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) as SignupState["fieldErrors"] };
  }

  try {
    // Listed out rather than spread. `confirmPassword` is the form's own check
    // and means nothing upstream, so it stops here.
    const { setCookie } = await signUp({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    const stored = await setSessionFromUpstream(setCookie);

    if (!stored) {
      // The account exists but we're holding no session, so sending them on
      // would drop them onto a guarded page as an anonymous visitor.
      console.error("[signup] API issued no membra_session cookie");
      return { formError: tErrors("unexpected") };
    }
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error("[signup] upstream unreachable", error.cause);
      return { formError: tErrors("network") };
    }

    if (ApiError.isApiError(error)) {
      if (error.status === 409) {
        return { fieldErrors: { email: tErrors("emailTaken") } };
      }

      // A 400 here means our schema and the API's disagree. Nothing the user
      // can do about it, but we want to hear about it straight away.
      if (error.status === 400 || error.code === "CONTRACT_MISMATCH") {
        console.error(`[signup] ${error.code}: ${error.message}`, error.details);
      }

      return { formError: tErrors("unexpected") };
    }

    throw error;
  }

  // Outside the try. `redirect` works by throwing, and the catch would eat it.
  redirect(`/${locale}/onboarding/profile`);
}
