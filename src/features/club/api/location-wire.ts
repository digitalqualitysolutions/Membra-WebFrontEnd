import { z } from "zod";

import type { ClubLocation } from "@/features/club/types";

/**
 * The wire format for the club's locations: halls, zones and courts.
 *
 * Kept apart from `club-wire.ts` because a location is its own resource with
 * its own tree - it just happens to hang off `/clubs/{clubId}`, the way the
 * addresses do. The contract is `GET /api/openapi.json` on the API; check it
 * there before changing a shape here, because it moves without notice.
 *
 * Listing and creating are wired. `GET /{locationId}` and `PATCH` exist
 * upstream and aren't called yet - nothing edits one row on its own.
 */

/* ------------------------------------------------------------------------ */
/* Creating one                                                              */
/* ------------------------------------------------------------------------ */

/**
 * What `POST /clubs/{clubId}/locations` accepts.
 *
 * The limits are the API's own, from its spec, so an over-long value is
 * refused here with a clear log rather than coming back as a 400. Note
 * `shortName` caps at 8, not the 20 an address gets - they look like the same
 * field and aren't.
 *
 * The API marks six of these optional, but every one is sent anyway: a
 * location's booking rules read as a set, and "left out" and "off" are easy to
 * confuse at a glance. `null` is a real value here rather than an absence -
 * `canMemberBook` genuinely has three states, and `memberReqToBook` is null
 * whenever member booking is off.
 */
export const createLocationRequestSchema = z.object({
  name: z.string().min(1).max(60),
  shortName: z.string().min(1).max(8),
  /** A location in the same club; `null` for one that sits at the top. */
  parentLocationId: z.number().int().positive().nullable(),
  directions: z.string().max(255).nullable(),
  /** Which of the club's addresses it's booked against. */
  clubAddressId: z.number().int().positive().nullable(),
  canMemberBook: z.boolean().nullable(),
  canTeamBook: z.boolean(),
  /** How many members must be on a booking. 1-30, or null where that's moot. */
  memberReqToBook: z.number().int().min(1).max(30).nullable(),
  public: z.boolean(),
  canFriendshipClubBook: z.boolean(),
  active: z.boolean(),
});

export type CreateLocationRequest = z.infer<typeof createLocationRequestSchema>;

/**
 * What `PATCH /clubs/{clubId}/locations/{locationId}` accepts: any of the
 * create fields on their own, the rest left as they are.
 *
 * Changing `shortName` or `parentLocationId` makes the API recompute
 * `shownName` for the location and everything under it, so a caller has to
 * re-read the list rather than patch its own copy.
 */
export const updateLocationRequestSchema =
  createLocationRequestSchema.partial();

export type UpdateLocationRequest = z.infer<typeof updateLocationRequestSchema>;

/* ------------------------------------------------------------------------ */
/* What comes back                                                           */
/* ------------------------------------------------------------------------ */

/**
 * One location, as `POST` answers with and the read endpoints return.
 *
 * Strict: every field is required upstream, and a location that won't parse
 * means the two repos have drifted. `shownName` is the API's own doing - it
 * builds it from the parent's `shownName` and this one's `shortName`, so it
 * can't be predicted here and is read rather than computed.
 */
export const locationResponseSchema = z.object({
  id: z.number().int(),
  clubId: z.number().int(),
  name: z.string(),
  shortName: z.string(),
  /** The dotted code the club reads it by: `HH.i.1`. The API composes it. */
  shownName: z.string(),
  parentLocationId: z.number().int().nullable(),
  directions: z.string().nullable(),
  clubAddressId: z.number().int().nullable(),
  canMemberBook: z.boolean().nullable(),
  canTeamBook: z.boolean(),
  memberReqToBook: z.number().int().nullable(),
  public: z.boolean(),
  canFriendshipClubBook: z.boolean(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type LocationResponse = z.infer<typeof locationResponseSchema>;

/** What `GET /clubs/{clubId}/locations` answers with. */
export const locationsListResponseSchema = z.object({
  locations: z.array(locationResponseSchema),
});

/* ------------------------------------------------------------------------ */
/* Into the rows the tables draw                                             */
/* ------------------------------------------------------------------------ */

/**
 * The API's flat list, as the tree both locations tables render. Walks
 * depth-first from the roots, since nothing promises parent-first order and
 * the guides are drawn by reading straight down the rows.
 *
 * @param addressShort the club's short code for a `clubAddressId` - passed in
 *   because the addresses come from the club record, not from here.
 */
export function toClubLocations(
  rows: readonly LocationResponse[],
  addressShort: (clubAddressId: number | null) => string | null,
): ClubLocation[] {
  /** Children by the id of what they hang off; `null` holds the roots. */
  const children = new Map<number | null, LocationResponse[]>();

  for (const row of rows) {
    const siblings = children.get(row.parentLocationId);

    if (siblings) siblings.push(row);
    else children.set(row.parentLocationId, [row]);
  }

  const ordered: ClubLocation[] = [];
  const seen = new Set<number>();

  function one(row: LocationResponse, depth: number): ClubLocation {
    return {
      id: String(row.id),
      name: row.name,
      depth,
      short: row.shortName,
      // The API composes this from the parent chain, so it's read, not built.
      show: row.shownName,
      parentAddress: addressShort(row.clubAddressId),
      // By id, not short code: codes repeat across halls, and any location can
      // be a parent, so a code can name two candidates at once.
      parentLocation:
        row.parentLocationId === null ? null : String(row.parentLocationId),
      // `null` means the API has no answer yet, which reads as "off" in a
      // column that can only draw a switch one way or the other.
      memberBooking: row.canMemberBook ?? false,
      teamMemberBooking: row.canTeamBook,
      memberBookingCount: row.memberReqToBook,
      publicListed: row.public,
      friends: row.canFriendshipClubBook,
      active: row.active,
      directions: row.directions,
    };
  }

  function walk(parentId: number | null, depth: number) {
    for (const row of children.get(parentId) ?? []) {
      // Guards a cycle upstream. Without it a parent pointing back into its
      // own branch would recurse until the stack gave out.
      if (seen.has(row.id)) continue;

      seen.add(row.id);
      ordered.push(one(row, depth));
      walk(row.id, depth + 1);
    }
  }

  walk(null, 0);

  /*
   * Anything the walk never reached: a row whose parent isn't in the list,
   * which the API shouldn't send and a cycle could also leave behind. Shown at
   * the top rather than dropped - a location the club can't see is worse than
   * one drawn in the wrong place, and its `shownName` still says where it
   * belongs.
   */
  for (const row of rows) {
    if (!seen.has(row.id)) ordered.push(one(row, 0));
  }

  return ordered;
}

/* ------------------------------------------------------------------------ */
/* From form values                                                          */
/* ------------------------------------------------------------------------ */

/**
 * A location as a form holds it, trimmed into what the API takes.
 *
 * Text comes in as typed and leaves trimmed; an emptied optional field goes up
 * as `null` rather than `""`, which is what the API reads as "none".
 *
 * `memberReqToBook` is dropped when member booking is off: a count of how many
 * members must be on a booking says nothing about a location members can't
 * book, and sending one would store a number that no screen could explain.
 */
export function toCreateLocationRequest(values: {
  name: string;
  shortName: string;
  parentLocationId: number | null;
  clubAddressId: number | null;
  directions: string;
  canMemberBook: boolean;
  canTeamBook: boolean;
  memberReqToBook: number | null;
  public: boolean;
  canFriendshipClubBook: boolean;
  active: boolean;
}): CreateLocationRequest {
  return {
    name: values.name.trim(),
    shortName: values.shortName.trim(),
    parentLocationId: values.parentLocationId,
    clubAddressId: values.clubAddressId,
    directions: values.directions.trim() || null,
    canMemberBook: values.canMemberBook,
    canTeamBook: values.canTeamBook,
    memberReqToBook: values.canMemberBook ? values.memberReqToBook : null,
    public: values.public,
    canFriendshipClubBook: values.canFriendshipClubBook,
    active: values.active,
  };
}
