import { z } from "zod";

import {
  avatarsResponseSchema,
  toMemberAvatars,
  type MemberAvatars,
} from "@/features/onboarding/api/avatar-wire";

/**
 * The wire format: the API's shapes and how they map onto ours.
 *
 * Called `wire` and not `schemas` because `features/auth/schemas` already means
 * something else around here, namely the rules a form is validated against.
 * These are the shapes the network speaks.
 *
 * Two jobs. It parses responses instead of trusting them, so a rename upstream
 * blows up here rather than showing up as `undefined` inside some component a
 * week later. And it renames on the way in (the API says `firstname`,
 * `surname`, `uuid`; we say `firstName`, `lastName`, `id`), which keeps backend
 * vocabulary from leaking past this file.
 */

/** What `POST /auth/signup` accepts. No `rememberMe`, no confirmation field. */
export const signupRequestSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(128),
});

export type SignupRequest = z.infer<typeof signupRequestSchema>;

/**
 * What `POST /auth/login` accepts. Unlike signup it does take `rememberMe`.
 *
 * `password` only asks for something, not for eight characters, even though the
 * API insists on eight. Login doesn't police password rules; it forwards what
 * was typed and lets the API decide, so a short password comes back as a failed
 * login instead of a hint about the policy. Requiring eight here would reject
 * the value on the way out, which is a crash rather than an answer.
 */
export const loginRequestSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1),
  rememberMe: z.boolean(),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

/**
 * One live session, from `GET /auth/active-sessions`.
 *
 * The timestamps come back as `2026-09-10 16:13:56.46768+05:30` - a space
 * where ISO wants a `T` - so they're parsed as plain strings. Checking a
 * format nothing reads would only invent a way for logout to fail.
 */
const activeSessionSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string(),
  expiresAt: z.string(),
  /** True for the session behind the cookie we sent. */
  isCurrent: z.boolean(),
});

export const activeSessionsResponseSchema = z.object({
  sessions: z.array(activeSessionSchema),
});

export type ActiveSession = z.infer<typeof activeSessionSchema>;

/**
 * What `POST /auth/logout` accepts.
 *
 * A session id rather than "mine": the same call revokes any session the member
 * owns, which is what a "signed in on these devices" screen would need. Whoever
 * calls it has to say which, even when the answer is the current one.
 */
export const logoutRequestSchema = z.object({ sessionId: z.string().min(1) });

export type LogoutRequest = z.infer<typeof logoutRequestSchema>;

/** Logout answers with a confirmation sentence. Parsed, never shown. */
export const logoutResponseSchema = z.object({ message: z.string() });

/**
 * A profile field the session can live without.
 *
 * Only `uuid` and `email` are who the member is; everything else describes
 * them. A renamed profile field used to fail the whole parse, and every
 * signed-in page guards on this parse - so when `gender` became `genderId`,
 * every page broke at once. Now a field that's missing or the wrong type reads
 * as "not filled in", and a warning names it: the member stays signed in and
 * the rename still gets noticed.
 *
 * `nullable`, not `nullish`: every endpoint sends these keys, so a missing one
 * is a rename worth hearing about, not an ordinary absence.
 */
function profileField<Schema extends z.ZodType>(schema: Schema, name: string) {
  return schema.nullable().catch((context) => {
    console.warn(`[users] ignoring malformed user.${name}`, context.error.issues);

    return null;
  });
}

/**
 * A part of the response only some endpoints send.
 *
 * `nullish`, because signup and login don't carry these - only `/users/me`
 * does - and a malformed one is logged and dropped for the same reason as
 * above: it's decoration, and decoration mustn't sign anyone out.
 */
function extra<Schema extends z.ZodType>(schema: Schema, name: string) {
  return schema.nullish().catch((context) => {
    console.warn(`[users] ignoring malformed "${name}"`, context.error.issues);

    return null;
  });
}

/**
 * The API's user projection. Profile fields stay null until onboarding runs.
 *
 * Only `uuid` and `email` are strict - see `profileField` for why.
 */
const safeUserSchema = z.object({
  uuid: z.string(),
  email: z.string(),
  firstname: profileField(z.string(), "firstname"),
  surname: profileField(z.string(), "surname"),
  nickname: profileField(z.string(), "nickname"),
  dob: profileField(z.string(), "dob"),
  /** A row id from `GET /reference/genders`, not the word the form shows. */
  genderId: profileField(z.number().int(), "genderId"),
  preferredLang: profileField(z.string(), "preferredLang"),
  /**
   * The API's own verdict: name, date of birth, gender and preferred language
   * all set. Anything that needs the answer should take it from here rather
   * than re-deriving it and drifting from the server's rule.
   */
  profileComplete: profileField(z.boolean(), "profileComplete"),
});

/**
 * A phone number as the API holds it: the calling code apart from the rest.
 * Either half can be null, so a number is only a number once it has digits.
 */
const phoneSchema = z.object({
  countryCode: z.number().int().nullable(),
  phoneNumber: z.string().nullable(),
});

/**
 * The envelope signup, login, complete-profile and /me all answer with.
 *
 * Only `user` is guaranteed, and only `user` is strict. `/users/me` also
 * carries the member's signed avatar URLs and primary contact details; the
 * others may not, and a missing or malformed extra reads as "nothing to show".
 */
export const userResponseSchema = z.object({
  user: safeUserSchema,
  avatars: extra(avatarsResponseSchema, "avatars"),
  primaryEmail: extra(z.string(), "primaryEmail"),
  primaryPhone: extra(phoneSchema, "primaryPhone"),
});

/** A member's phone number. `countryCode` is the calling code: 45, not "+45". */
export type MemberPhone = {
  countryCode: number | null;
  phoneNumber: string;
};

/** The user, in the names the rest of the app uses. */
export type SessionUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  dateOfBirth: string | null;
  /**
   * The API's id for the member's gender. Turned into the word the form shows
   * with the genders list - see `features/onboarding/services/genders.ts`.
   */
  genderId: number | null;
  preferredLanguage: string | null;
  /** `null` when the endpoint didn't say, rather than a guess. */
  profileComplete: boolean | null;
  /**
   * Signed picture URLs, good for an hour. Arrives with the session, so the
   * header badge costs no second request.
   */
  avatars: MemberAvatars;
  primaryEmail: string | null;
  primaryPhone: MemberPhone | null;
};

export function toSessionUser(
  response: z.infer<typeof userResponseSchema>,
): SessionUser {
  const { user } = response;

  return {
    id: user.uuid,
    email: user.email,
    firstName: user.firstname,
    lastName: user.surname,
    nickname: user.nickname,
    dateOfBirth: user.dob,
    genderId: user.genderId,
    preferredLanguage: user.preferredLang,
    profileComplete: user.profileComplete ?? null,
    // The lenient avatar parse maps an absent block to three nulls, the same
    // answer a member without a picture gets.
    avatars: toMemberAvatars(response.avatars ?? {}),
    primaryEmail: response.primaryEmail ?? null,
    // No digits, no number - even if a calling code came back on its own.
    primaryPhone: response.primaryPhone?.phoneNumber
      ? {
          countryCode: response.primaryPhone.countryCode,
          phoneNumber: response.primaryPhone.phoneNumber,
        }
      : null,
  };
}
