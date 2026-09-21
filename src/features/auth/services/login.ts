"use server";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { isLocale } from "@/config/locales";
import type {
  LoginPayload,
  LoginState,
} from "@/features/auth/services/state";
import { logIn } from "@/features/auth/api/auth-endpoints";
import { createLoginSchema } from "@/features/auth/schemas";
import { setSessionFromUpstream } from "@/features/auth/server/session-cookie";
import { ApiError, NetworkError } from "@/lib/http/api-error";
import { fieldErrorsFrom } from "@/lib/form";

/**
 * Sign in, take ownership of the session, move on.
 *
 * The client validated these values already. We validate again: anything
 * reaching a Server Action arrived over the network, so treat it that way.
 */
export async function logInAction(
  _previous: LoginState,
  payload: LoginPayload,
): Promise<LoginState> {
  const { locale, ...values } = payload;
  if (!isLocale(locale)) return { formError: "Unsupported locale" };

  const tValidation = await getTranslations({ locale, namespace: "validation" });
  const tErrors = await getTranslations({ locale, namespace: "errors" });

  const parsed = createLoginSchema(tValidation).safeParse(values);

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) as LoginState["fieldErrors"] };
  }

  try {
    const { setCookie } = await logIn(parsed.data);
    const stored = await setSessionFromUpstream(setCookie);

    if (!stored) {
      // Credentials checked out but we're holding no session, so sending them
      // on would drop them onto a guarded page as an anonymous visitor.
      console.error("[login] API issued no membra_session cookie");
      return { formError: tErrors("unexpected") };
    }
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error("[login] upstream unreachable", error.cause);
      return { formError: tErrors("network") };
    }

    if (ApiError.isApiError(error)) {
      // Not attached to the email field, on purpose. The API says "invalid
      // email or password" without saying which one, and keeping that same
      // ambiguity is what stops the form confirming which addresses exist.
      if (error.status === 401) {
        return { formError: tErrors("invalidCredentials") };
      }

      if (error.status === 400 || error.code === "CONTRACT_MISMATCH") {
        console.error(`[login] ${error.code}: ${error.message}`, error.details);
      }

      // The API validates the shape of a credential before the credential
      // itself, so a password under the minimum comes back 400, not 401. To a
      // member both mean the same thing: this won't get you in. Answering the
      // same way also avoids revealing which of the two fields was wrong.
      if (error.status === 400) {
        return { formError: tErrors("invalidCredentials") };
      }

      return { formError: tErrors("unexpected") };
    }

    throw error;
  }

  // Home. Signing in is for members who already have an account, so they go
  // where a member goes; filling in a profile is signup's business, and anyone
  // who skipped it can pick it up from the account menu.
  redirect(`/${locale}`);
}
