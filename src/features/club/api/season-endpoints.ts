import "server-only";

import { cache } from "react";

import { SESSION_COOKIE } from "@/features/auth/server/session-cookie";
import { segment } from "@/features/club/api/club-endpoints";
import {
  createSeasonRequestSchema,
  seasonResponseSchema,
  seasonsListResponseSchema,
  updateSeasonRequestSchema,
  type CreateSeasonRequest,
  type SeasonResponse,
  type UpdateSeasonRequest,
} from "@/features/club/api/season-wire";
import { api, requestBody } from "@/lib/http/api";

/**
 * The season calls.
 *
 * Listing, reading one, creating and patching - the API's whole seasons
 * surface. It has no delete at all.
 *
 * Like every club call, these need a session - the API answers 401 without -
 * so the token goes along by hand.
 */

const withSession = (sessionToken: string) => ({
  cookie: `${SESSION_COOKIE}=${sessionToken}`,
});

/**
 * Every season the club has, ordered by `seasonStart` and then by id.
 *
 * That order is the API's own promise, which is why nothing sorts these
 * afterwards: a club reads its year forwards, and re-sorting in the browser
 * would only invent a second answer to a question already settled upstream.
 *
 * `cache` dedupes it for one request: the seasons page asks for the club and
 * its seasons at once, and `api` sends every call `no-store`, so without the
 * wrapper one render could ask twice for the same answer.
 *
 * Member or admin - unlike the writes below, reading doesn't need admin rights.
 *
 * @throws {ApiError} 401 without a session, 404 for no such club.
 */
export const listSeasons = cache(async function listSeasons(
  clubId: number,
  sessionToken: string,
): Promise<SeasonResponse[]> {
  const { data } = await api(
    seasonsListResponseSchema,
    `/clubs/${segment(clubId)}/seasons`,
    { headers: withSession(sessionToken) },
  );

  return data.seasons;
});

/**
 * One season on its own.
 *
 * Cached for the same reason as the list. Nothing on the seasons screen calls
 * this yet: the table reads the whole list, and a save re-reads the list
 * rather than each row it touched. It's here for the screens that will want a
 * single season - a season's teams, or its court allocations - so they don't
 * each rebuild the call.
 *
 * @throws {ApiError} 401 without a session, 404 for no such club or season.
 */
export const getSeason = cache(async function getSeason(
  clubId: number,
  seasonId: number,
  sessionToken: string,
): Promise<SeasonResponse> {
  const { data } = await api(
    seasonResponseSchema,
    `/clubs/${segment(clubId)}/seasons/${segment(seasonId)}`,
    { headers: withSession(sessionToken) },
  );

  return data;
});

/**
 * Add a season to a club.
 *
 * Admin only, and not retried on a timeout: a create that got through but
 * answered late would leave the club with the season twice, and there is no
 * delete to undo it with.
 *
 * @throws {ApiError} 400 for a value the API refuses, 403 without admin rights
 *   on the club, 404 for no such club, 409 when the short code is taken.
 */
export async function createSeason(
  clubId: number,
  body: CreateSeasonRequest,
  sessionToken: string,
): Promise<SeasonResponse> {
  const path = `/clubs/${segment(clubId)}/seasons`;

  const { data } = await api(seasonResponseSchema, path, {
    method: "POST",
    body: requestBody(createSeasonRequestSchema, path, body),
    headers: withSession(sessionToken),
  });

  return data;
}

/**
 * Change some of a season's fields; the rest stay as they are.
 *
 * @throws {ApiError} 400 for a value refused, 403 without admin rights, 404
 *   for no such club or season, 409 when the short code is taken.
 */
export async function updateSeason(
  clubId: number,
  seasonId: number,
  body: UpdateSeasonRequest,
  sessionToken: string,
): Promise<SeasonResponse> {
  const path = `/clubs/${segment(clubId)}/seasons/${segment(seasonId)}`;

  const { data } = await api(seasonResponseSchema, path, {
    method: "PATCH",
    body: requestBody(updateSeasonRequestSchema, path, body),
    headers: withSession(sessionToken),
  });

  return data;
}
