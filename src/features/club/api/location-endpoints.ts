import "server-only";

import { cache } from "react";

import { SESSION_COOKIE } from "@/features/auth/server/session-cookie";
import { segment } from "@/features/club/api/club-endpoints";
import {
  createLocationRequestSchema,
  deleteLocationResponseSchema,
  locationResponseSchema,
  locationsListResponseSchema,
  updateLocationRequestSchema,
  type CreateLocationRequest,
  type LocationResponse,
  type UpdateLocationRequest,
} from "@/features/club/api/location-wire";
import { api, requestBody } from "@/lib/http/api";

/**
 * The location calls.
 *
 * Listing and creating. `GET /{locationId}` and `PATCH /{locationId}` exist
 * upstream and aren't wired - nothing reads or edits a single row on its own.
 *
 * Like every club call, these need a session - the API answers 401 without -
 * so the token goes along by hand.
 */

const withSession = (sessionToken: string) => ({
  cookie: `${SESSION_COOKIE}=${sessionToken}`,
});

/**
 * Every location the club has, flat and in no promised order.
 *
 * `cache` dedupes it for one request: the location page asks for the club and
 * its locations at once, and `api` sends every call `no-store`, so without the
 * wrapper one render could ask twice for the same answer.
 *
 * @throws {ApiError} 403 without admin rights on the club, 404 for no such club.
 */
export const listLocations = cache(async function listLocations(
  clubId: number,
  sessionToken: string,
): Promise<LocationResponse[]> {
  const { data } = await api(
    locationsListResponseSchema,
    `/clubs/${segment(clubId)}/locations`,
    { headers: withSession(sessionToken) },
  );

  return data.locations;
});

/**
 * Add a location to a club: a hall, a zone inside one, or a court.
 *
 * The API composes `shownName` itself, from the parent's `shownName` and this
 * one's `shortName` (or the short name alone at the top of the tree), so the
 * answer is worth reading rather than assuming - it's the only place the
 * dotted code comes from.
 *
 * Admin only, and not retried on a timeout: a create that got through but
 * answered late would leave the club with the location twice.
 *
 * @throws {ApiError} 400 for a value the API refuses - an unknown
 *   `parentLocationId` or `clubAddressId`, or a short name already taken under
 *   the same parent - 403 without admin rights on the club, 404 for no such
 *   club.
 */
export async function createLocation(
  clubId: number,
  body: CreateLocationRequest,
  sessionToken: string,
): Promise<LocationResponse> {
  const path = `/clubs/${segment(clubId)}/locations`;

  const { data } = await api(locationResponseSchema, path, {
    method: "POST",
    body: requestBody(createLocationRequestSchema, path, body),
    headers: withSession(sessionToken),
  });

  return data;
}

/**
 * Change some of a location's fields; the rest stay as they are.
 *
 * A new `shortName` or `parentLocationId` makes the API recompute `shownName`
 * here and on every descendant, so the caller re-reads the list afterwards.
 *
 * @throws {ApiError} 400 for a value refused, 403 without admin rights, 404
 *   for no such club or location.
 */
export async function updateLocation(
  clubId: number,
  locationId: number,
  body: UpdateLocationRequest,
  sessionToken: string,
): Promise<LocationResponse> {
  const path = `/clubs/${segment(clubId)}/locations/${segment(locationId)}`;

  const { data } = await api(locationResponseSchema, path, {
    method: "PATCH",
    body: requestBody(updateLocationRequestSchema, path, body),
    headers: withSession(sessionToken),
  });

  return data;
}

/**
 * Delete a location and everything under it, for good.
 *
 * A hard delete upstream, not a flag: the API takes the location and every
 * descendant in one call, and there is nothing to undo afterwards. The ids it
 * answers with are the whole set it removed, target included - which is why
 * the caller reads them instead of working out the branch itself.
 *
 * Admin only.
 *
 * @throws {ApiError} 403 without admin rights on the club, 404 for no such
 *   club or location.
 */
export async function deleteLocation(
  clubId: number,
  locationId: number,
  sessionToken: string,
): Promise<number[]> {
  const { data } = await api(
    deleteLocationResponseSchema,
    `/clubs/${segment(clubId)}/locations/${segment(locationId)}`,
    { method: "DELETE", headers: withSession(sessionToken) },
  );

  return data.deletedIds;
}
