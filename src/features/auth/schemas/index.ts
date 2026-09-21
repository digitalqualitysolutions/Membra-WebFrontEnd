import type { useTranslations } from "next-intl";
import { z } from "zod";

import { isDisposableEmailAddress } from "@/features/auth/schemas/disposable-email-domains";

/**
 * One source of truth for what a valid credential looks like. Each schema takes
 * the active locale's translator, which keeps a rule and its wording in the same
 * place and gets the user an error in their own language.
 */

/** The `validation` translator, from `useTranslations` or `getTranslations`. */
type Translate = ReturnType<typeof useTranslations<"validation">>;

function emailField(t: Translate) {
  return z
    .string()
    .trim()
    .min(1, t("emailRequired"))
    // Longest address SMTP carries, and what the API caps at. Checked here so
    // an over-long address shows under the field instead of coming back as a
    // rejected request.
    .max(254, t("emailTooLong"))
    .pipe(z.email(t("emailInvalid")));
}

/**
 * Signup's email: the same address rules, plus a throwaway-mailbox check.
 *
 * Only signup. Login authenticates whoever already has an account, and turning
 * a sign-in away over its domain would strand anyone who registered before a
 * service landed on the list, with an error they can do nothing about.
 */
function signupEmailField(t: Translate) {
  return emailField(t).refine((email) => !isDisposableEmailAddress(email), {
    error: t("emailDisposable"),
  });
}

export function createLoginSchema(t: Translate) {
  return z.object({
    email: emailField(t),
    // Presence only. Strength rules belong to the signup form.
    password: z.string().min(1, t("passwordRequired")),
    /** Opting into a longer session. Always answered, never invalid. */
    rememberMe: z.boolean(),
  });
}

export function createSignupSchema(t: Translate) {
  return z
    .object({
      email: signupEmailField(t),
      password: z
        .string()
        // Same bounds the API enforces: at least 8, no more than 128.
        .min(8, t("passwordTooShort"))
        .max(128, t("passwordTooLong"))
        .regex(/[a-z]/, t("passwordNeedsLowercase"))
        .regex(/[A-Z]/, t("passwordNeedsUppercase"))
        .regex(/[0-9]/, t("passwordNeedsNumber")),
      confirmPassword: z.string().min(1, t("confirmRequired")),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ["confirmPassword"],
      error: t("passwordsDoNotMatch"),
    });
}
