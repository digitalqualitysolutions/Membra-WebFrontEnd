import "server-only";

import { cache } from "react";

import { SESSION_COOKIE } from "@/features/auth/server/session-cookie";
import {
  activitiesResponseSchema,
  addAddressRequestSchema,
  clubAddressSchema,
  addressPatchSchema,
  clubPatchSchema,
  clubResponseSchema,
  languagesResponseSchema,
  myClubsResponseSchema,
  toClubActivities,
  toClubLanguages,
  type AddAddressRequest,
  type AddressPatch,
  type ClubActivity,
  type ClubAddressResponse,
  type ClubLanguageOption,
  type ClubPatch,
  type ClubResponse,
} from "@/features/club/api/club-wire";
import {
  avatarsResponseSchema,
  toMemberAvatars,
  type MemberAvatars,
} from "@/features/onboarding/api/avatar-wire";
import { api, requestBody } from "@/lib/http/api";

/**
 * The club calls.
 *
 * Every one of them needs a session - the API answers 401 without - so the
 * token goes along by hand, the way every server-side call here sends it.
 */

const withSession = (sessionToken: string) => ({
  cookie: `${SESSION_COOKIE}=${sessionToken}`,
});

/**
 * An id as a path segment.
 *
 * Every id below arrives typed `number`, but the ones that come from a Server
 * Action were deserialised from a request the caller controls, and TypeScript
 * is gone by the time this runs. A string like `1/../../users/me` would reach
 * these templates intact and `fetch` would normalise the traversal away,
 * steering an authenticated call - session cookie attached - at whatever
 * endpoint the caller named. The actions check their ids before calling; this
 * is the second lock, next to the door it actually protects.
 *
 * Exported so `location-endpoints.ts` builds its paths the same way. One copy
 * on purpose: a security check that exists twice is one that can be fixed in
 * one place and stay broken in the other.
 */
export const segment = (id: number) => encodeURIComponent(String(id));

/**
 * How a `/reference` list is read: kept for an hour under one tag.
 *
 * These are the API's own tables - languages, activities, genders - not a
 * club's data. They change when someone edits the database, so an hour stale
 * costs nothing, and `revalidateTag("reference")` drops them on demand.
 */
export const catalogue = { revalidate: 3600, tags: ["reference"] } as const;

/**
 * The activities a club can be registered for.
 *
 * `cache` dedupes it for one request: the card and the setup form both want
 * the list, and `api` sends every call `no-store`, so without the wrapper a
 * single render could ask twice for an answer that can't have changed.
 */
export const listActivities = cache(async function listActivities(
  sessionToken: string,
): Promise<ClubActivity[]> {
  // Under `/reference`, not `/clubs`: it's a catalogue, not a club's own data.
  const { data } = await api(activitiesResponseSchema, "/reference/activities", {
    headers: withSession(sessionToken),
    ...catalogue,
  });

  return toClubActivities(data);
});

/** The languages a club can list. Deduped per request, like the activities. */
export const listLanguages = cache(async function listLanguages(
  sessionToken: string,
): Promise<ClubLanguageOption[]> {
  const { data } = await api(languagesResponseSchema, "/reference/languages", {
    headers: withSession(sessionToken),
    ...catalogue,
  });

  return toClubLanguages(data);
});

/**
 * The ids of the clubs the signed-in member runs, in the API's order (by
 * name). Empty for a member who hasn't created or been given one.
 */
export const listMyClubIds = cache(async function listMyClubIds(
  sessionToken: string,
): Promise<number[]> {
  const { data } = await api(myClubsResponseSchema, "/clubs", {
    headers: withSession(sessionToken),
  });

  return data.clubs.map((club) => club.id);
});

/**
 * One club, with its addresses, activities, languages, admin count and signed
 * avatar URLs.
 *
 * @throws {ApiError} 404 when there's no such club.
 */
export const getClub = cache(async function getClub(
  clubId: number,
  sessionToken: string,
): Promise<ClubResponse> {
  const { data } = await api(clubResponseSchema, `/clubs/${segment(clubId)}`, {
    headers: withSession(sessionToken),
  });

  return data;
});

/**
 * Create a club. The member who sends it becomes its first admin.
 *
 * Multipart, because the logo rides along as a file. Not retried on a
 * timeout: a create that got through but answered late would make a second
 * club.
 *
 * @throws {ApiError} 400 for a value the API refuses (an unknown activity or
 *   language id, say), 409 for a clash with an existing club.
 */
export async function createClub(
  form: FormData,
  sessionToken: string,
): Promise<ClubResponse> {
  const { data } = await api(clubResponseSchema, "/clubs", {
    method: "POST",
    body: form,
    headers: withSession(sessionToken),
  });

  return data;
}

/**
 * Change some or all of a club's details: name, code, date, status, country,
 * activities and languages. Only the fields sent are changed. Needs the member
 * to be one of its admins - the API answers 403 otherwise.
 *
 * @throws {ApiError} 400 for a value refused, 403 without admin rights, 409
 *   for a clash with another club.
 */
export async function updateClub(
  clubId: number,
  body: ClubPatch,
  sessionToken: string,
): Promise<ClubResponse> {
  const path = `/clubs/${segment(clubId)}`;
  const { data } = await api(clubResponseSchema, path, {
    method: "PATCH",
    body: requestBody(clubPatchSchema, path, body),
    headers: withSession(sessionToken),
  });

  return data;
}

/** Add an address to a club. */
export async function addClubAddress(
  clubId: number,
  body: AddAddressRequest,
  sessionToken: string,
): Promise<ClubAddressResponse> {
  const path = `/clubs/${segment(clubId)}/addresses`;
  const { data } = await api(clubAddressSchema, path, {
    method: "POST",
    body: requestBody(addAddressRequestSchema, path, body),
    headers: withSession(sessionToken),
  });

  return data;
}

/** Change some fields of one of a club's addresses; the rest stay. */
export async function updateClubAddress(
  clubId: number,
  addressId: number,
  body: AddressPatch,
  sessionToken: string,
): Promise<ClubAddressResponse> {
  const path = `/clubs/${segment(clubId)}/addresses/${segment(addressId)}`;
  const { data } = await api(clubAddressSchema, path, {
    method: "PATCH",
    body: requestBody(addressPatchSchema, path, body),
    headers: withSession(sessionToken),
  });

  return data;
}

/**
 * Make an address the club's primary one. The API takes the role from
 * whichever address held it, so there's only ever one.
 */
export async function makeClubAddressPrimary(
  clubId: number,
  addressId: number,
  sessionToken: string,
): Promise<ClubAddressResponse> {
  const { data } = await api(
    clubAddressSchema,
    `/clubs/${segment(clubId)}/addresses/${segment(addressId)}/primary`,
    { method: "POST", headers: withSession(sessionToken) },
  );

  return data;
}

/**
 * Replace the club's logo. The API renders its own three sizes from the one
 * file and answers with their signed URLs.
 */
export async function uploadClubAvatar(
  clubId: number,
  avatar: File,
  sessionToken: string,
): Promise<MemberAvatars> {
  const form = new FormData();
  form.set("avatar", avatar);

  const { data } = await api(avatarsResponseSchema, `/clubs/${segment(clubId)}/avatars`, {
    method: "PUT",
    body: form,
    headers: withSession(sessionToken),
  });

  return toMemberAvatars(data);
}
