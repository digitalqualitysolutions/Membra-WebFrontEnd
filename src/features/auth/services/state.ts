import type { LoginFormValues, SignupFormValues } from "@/features/auth/types";

/**
 * Shapes passed between the auth forms and their Server Actions.
 *
 * Here rather than next to each action because a `"use server"` module can only
 * export async functions. Anything else, a plain initial value included, gets
 * refused at build time.
 */

/** What a form renders after a submit attempt. */
type FormState<Values> = {
  /** Keyed by field, so a server complaint lands where the user can fix it. */
  fieldErrors?: Partial<Record<keyof Values, string>>;
  /** A failure that doesn't belong to any one field. */
  formError?: string;
};

/** The client knows the locale; a Server Action has no path to infer it from. */
type WithLocale<Values> = Values & { locale: string };

export type SignupState = FormState<SignupFormValues>;
export type SignupPayload = WithLocale<SignupFormValues>;
export const initialSignupState: SignupState = {};

export type LoginState = FormState<LoginFormValues>;
export type LoginPayload = WithLocale<LoginFormValues>;
export const initialLoginState: LoginState = {};

/**
 * What the revoke button gets back. Silent on success: the list just loses a
 * row, which says it worked better than a message would.
 */
export type RevokeSessionState = { error?: string };
export const initialRevokeSessionState: RevokeSessionState = {};
