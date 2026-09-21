import "server-only";

import { cache } from "react";

import {
  toSessionUser,
  userResponseSchema,
  type SessionUser,
} from "@/features/auth/api/auth-wire";
import { SESSION_COOKIE } from "@/features/auth/server/session-cookie";
import {
  completeProfileRequestSchema,
  gendersResponseSchema,
  toGenders,
  type CompleteProfileRequest,
  type Gender,
} from "@/features/onboarding/api/profile-wire";
import { api, requestBody } from "@/lib/http/api";

/**
 * The onboarding calls.
 *
 * The endpoint sits under the API's `/auth` prefix, but as far as the app goes
 * this is an onboarding step, so it lives with the feature whose form drives it
 * instead of with sign-in.
 */

/**
 * The genders a member can be registered under.
 *
 * Reference data, and the only call here that needs no session - the list is
 * the same for everyone, signed in or not.
 *
 * `cache` dedupes it for the length of one request. `api` sends every call
 * `no-store`, which is right for anything behind a session and wrong for this:
 * without the wrapper, a page that renders the form and then re-validates the
 * submission in a Server Action would ask twice for an answer that can't have
 * changed in between.
 */
export const listGenders = cache(async function listGenders(): Promise<Gender[]> {
  const { data } = await api(gendersResponseSchema, "/reference/genders");

  return toGenders(data);
});

/**
 * Fill in a member's profile.
 *
 * Needs a session; the API answers 401 without one. Takes the token as an
 * argument rather than reading it, which keeps this a plain function.
 */
export async function completeProfile(
  input: CompleteProfileRequest,
  sessionToken: string,
): Promise<SessionUser> {
  const { data } = await api(userResponseSchema, "/users/complete-profile", {
    method: "POST",
    body: requestBody(completeProfileRequestSchema, "/users/complete-profile", input),
    headers: { cookie: `${SESSION_COOKIE}=${sessionToken}` },
  });

  return toSessionUser(data);
}
