import "server-only";

import type { z } from "zod";

import {
  activeSessionsResponseSchema,
  loginRequestSchema,
  logoutRequestSchema,
  logoutResponseSchema,
  signupRequestSchema,
  toSessionUser,
  userResponseSchema,
  type ActiveSession,
  type LoginRequest,
  type SessionUser,
  type SignupRequest,
} from "@/features/auth/api/auth-wire";
import { SESSION_COOKIE } from "@/features/auth/server/session-cookie";
import { api, requestBody } from "@/lib/http/api";

/**
 * Every call we make to the API's auth endpoints.
 *
 * One file per resource, not per endpoint, so `logOut` and the password-reset
 * calls land here too. All plain async functions with no React in them, which
 * means a Server Action, a Server Component or a test can call them directly.
 *
 * Server-side only. The session cookie is what authenticates a member and it
 * never gets handled in the browser.
 */

/** A member plus the session the API issued for them. */
export type AuthResult = {
  user: SessionUser;
  /** Raw `Set-Cookie` headers for `setSessionFromUpstream` to store. */
  setCookie: string[];
};

/** Signup and login only differ in path and body, so they share this. */
async function postForSession<T>(
  path: string,
  schema: z.ZodType<T>,
  input: unknown,
): Promise<AuthResult> {
  const { data, setCookie } = await api(userResponseSchema, path, {
    method: "POST",
    body: requestBody(schema, path, input),
  });

  return { user: toSessionUser(data), setCookie };
}

/**
 * Create an account.
 *
 * A 409 means the email is already registered. Signup has to give that away or
 * the form is unusable.
 */
export async function signUp(input: SignupRequest): Promise<AuthResult> {
  return postForSession("/auth/signup", signupRequestSchema, input);
}

/**
 * Sign in an existing member.
 *
 * A 401 means the credentials didn't match. The API answers "Invalid email or
 * password" without saying which, and the UI keeps that ambiguity; naming the
 * wrong field would tell an attacker which addresses have accounts.
 */
export async function logIn(input: LoginRequest): Promise<AuthResult> {
  return postForSession("/auth/login", loginRequestSchema, input);
}

/**
 * Every session this member currently has, one per device they signed in on.
 *
 * The one matching the cookie we sent is flagged `isCurrent`, which is the only
 * way to learn our own session's id - nothing else hands it out, and `logOut`
 * needs it.
 *
 * Throws `ApiError` with status 401 when the session is missing or expired.
 */
export async function listActiveSessions(
  sessionToken: string,
): Promise<ActiveSession[]> {
  const { data } = await api(activeSessionsResponseSchema, "/auth/active-sessions", {
    headers: { cookie: `${SESSION_COOKIE}=${sessionToken}` },
  });

  return data.sessions;
}

/**
 * Revoke one of the member's sessions, killing it upstream.
 *
 * @param sessionId which session to end - from `listActiveSessions`. A 404
 *   means it's already gone, which for signing out is the outcome we wanted.
 * @param sessionToken authenticates the request. Revoking a session other than
 *   this one leaves the caller signed in, by the API's design.
 *
 * The API clears its own cookie when the revoked session is the current one,
 * but that `Set-Cookie` dies with this server-side fetch. Ours is still ours to
 * delete; `logOutAction` does it.
 */
export async function logOut(
  sessionId: string,
  sessionToken: string,
): Promise<void> {
  await api(logoutResponseSchema, "/auth/logout", {
    method: "POST",
    body: requestBody(logoutRequestSchema, "/auth/logout", { sessionId }),
    headers: { cookie: `${SESSION_COOKIE}=${sessionToken}` },
  });
}

/**
 * The member a session belongs to.
 *
 * Takes the token as an argument instead of reading it, which keeps this a
 * plain function of its inputs and leaves request context to the caller.
 *
 * Throws `ApiError` with status 401 when the session is missing, expired or
 * revoked. Whether that means "log in" or "not signed in" is up to the caller.
 */
export async function getMe(sessionToken: string): Promise<SessionUser> {
  const { data } = await api(userResponseSchema, "/users/me", {
    // A server-side fetch has no cookie jar, so send the session by hand.
    headers: { cookie: `${SESSION_COOKIE}=${sessionToken}` },
  });

  return toSessionUser(data);
}
