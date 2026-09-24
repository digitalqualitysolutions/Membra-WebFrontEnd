import { z } from "zod";

import type { SeasonRow } from "@/features/season/types";

/**
 * The wire format for a club's seasons.
 *
 * Beside the locations wire and apart from `club-wire.ts` for the same reason:
 * a season is its own resource that happens to hang off `/clubs/{clubId}`. The
 * contract is `GET /api/openapi.json` on the API; check it there before
 * changing a shape here, because it moves without notice.
 *
 * Listing, reading one, creating and patching are all wired. There is **no
 * delete**: the API offers none, so a stored season can be switched inactive
 * but never removed, and the table must not offer to.
 */

/** The API's own caps, so an over-long value is refused here, not as a 400. */
export const SEASON_NAME_MAX = 30;
export const SEASON_SHORT_MAX = 8;

/** `2026-05-01`. A calendar day, which is what a season is bounded by. */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a YYYY-MM-DD date");

/**
 * What `POST /clubs/{clubId}/seasons` accepts.
 *
 * `active` is optional upstream and defaults to true. It's sent anyway: the
 * row has a switch for it, and "left out" and "off" are easy to confuse at a
 * glance.
 */
export const createSeasonRequestSchema = z.object({
  name: z.string().min(1).max(SEASON_NAME_MAX),
  shortName: z.string().min(1).max(SEASON_SHORT_MAX),
  seasonStart: isoDate,
  seasonEnd: isoDate,
  /** Teams register against it. */
  forTeams: z.boolean(),
  /** Courts are allocated for it. */
  forLocations: z.boolean(),
  active: z.boolean(),
});

export type CreateSeasonRequest = z.infer<typeof createSeasonRequestSchema>;

/**
 * What `PATCH /clubs/{clubId}/seasons/{seasonId}` accepts: any of the create
 * fields on their own, the rest left as they are.
 */
export const updateSeasonRequestSchema = createSeasonRequestSchema.partial();

export type UpdateSeasonRequest = z.infer<typeof updateSeasonRequestSchema>;

/**
 * One season as the API holds it.
 *
 * `createdAt` and `updatedAt` are parsed but never read: they arrive on every
 * response and leaving them out of the schema would only mean not noticing if
 * they changed shape.
 */
export const seasonResponseSchema = z.object({
  id: z.number().int(),
  clubId: z.number().int(),
  name: z.string(),
  shortName: z.string(),
  seasonStart: z.string(),
  seasonEnd: z.string(),
  forTeams: z.boolean(),
  forLocations: z.boolean(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SeasonResponse = z.infer<typeof seasonResponseSchema>;

export const seasonsListResponseSchema = z.object({
  seasons: z.array(seasonResponseSchema),
});

/**
 * The API's season in the names the rest of the app uses.
 *
 * Renames on the way in, the way every wire file here does: the API says
 * `shortName`, `seasonStart`, `forTeams`; the table says `short`, `start`,
 * `teams`. The id becomes a string because that is what keys a row.
 *
 * The dates are sliced rather than parsed. The API types them as a plain
 * string, so a full timestamp is allowed; taking the first ten characters
 * keeps the calendar day the club meant without letting a timezone move it,
 * which is exactly what `new Date()` here would do for half of Europe.
 */
export function toSeason(season: SeasonResponse): SeasonRow {
  return {
    id: String(season.id),
    name: season.name,
    short: season.shortName,
    start: season.seasonStart.slice(0, 10),
    end: season.seasonEnd.slice(0, 10),
    teams: season.forTeams,
    locations: season.forLocations,
    active: season.active,
  };
}

export const toSeasons = (rows: readonly SeasonResponse[]): SeasonRow[] =>
  rows.map(toSeason);
