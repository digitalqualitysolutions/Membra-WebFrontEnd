import type { ClubLocation } from "@/features/club/types";

/**
 * Shapes passed between the locations card and its Server Action.
 *
 * Kept out of the action because a `"use server"` module can only export async
 * functions; a plain initial value gets refused at build time - the same
 * reason `state.ts` exists next to the club actions.
 */

/**
 * One location as a form holds it.
 *
 * Ids rather than short codes for the two parents: the table reads locations
 * by their short code, but the API joins them by id, and the form picked its
 * option from a list that already carries both. `null` in either means "at the
 * top" and "not booked against an address".
 *
 * `directions` is a plain string rather than `string | null` because that's
 * what an input holds; it becomes `null` on the way out when it's empty.
 */
export type NewLocationValues = {
  name: string;
  shortName: string;
  parentLocationId: number | null;
  clubAddressId: number | null;
  directions: string;
  canMemberBook: boolean;
  canTeamBook: boolean;
  /** How many members a booking needs. Ignored while `canMemberBook` is off. */
  memberReqToBook: number | null;
  public: boolean;
  canFriendshipClubBook: boolean;
  active: boolean;
};

/** Everything creating one location sends. */
export type CreateLocationPayload = {
  locale: string;
  clubId: number;
  values: NewLocationValues;
};

/**
 * The location as the API stored it.
 *
 * Not a `ClubLocation`: that row carries `depth` and `kind`, which are
 * properties of where a location sits among all the others rather than of the
 * location itself, so neither can be read off a single created record. This is
 * what one create genuinely knows.
 */
export type CreatedLocation = {
  id: number;
  name: string;
  /** Its own short code, as typed. */
  short: string;
  /** The dotted code the API composed for it: `HH.i.1`. */
  show: string;
};

/**
 * One row's changes, as the locations card holds them.
 *
 * Only what that card can edit. Left out means "leave as it is", so a row
 * where one switch moved sends one field.
 */
export type LocationChange = {
  locationId: number;
  name?: string;
  shortName?: string;
  /** 1-30, or null where member booking is off. */
  memberReqToBook?: number | null;
  directions?: string | null;
  clubAddressId?: number | null;
  parentLocationId?: number | null;
  canMemberBook?: boolean;
  canTeamBook?: boolean;
  public?: boolean;
  canFriendshipClubBook?: boolean;
  active?: boolean;
};

export type SaveLocationsPayload = {
  locale: string;
  clubId: number;
  changes: LocationChange[];
};

export type SaveLocationsState = {
  /** Why the save stopped, if it did. */
  formError?: string;
  /**
   * The club's locations as the API now holds them - after a failure as much
   * as a success. Re-read rather than patched locally: changing a parent makes
   * the API recompute the dotted name of everything below it.
   */
  locations?: ClubLocation[];
};

export type CreateLocationState = {
  /** Why the location wasn't created, ready to show. */
  formError?: string;
  /** The location as the API stored it, once it has been. */
  location?: CreatedLocation;
};

export const initialCreateLocationState: CreateLocationState = {};

/** Which location to delete. Its descendants go with it; the API decides which. */
export type DeleteLocationPayload = {
  locale: string;
  clubId: number;
  locationId: number;
};

export type DeleteLocationState = {
  /** Why it wasn't deleted, ready to show. */
  formError?: string;
  /**
   * Every id the API removed, the target included - as strings, which is how
   * the table keys its rows. Absent when nothing was deleted.
   *
   * Taken from the answer rather than worked out here: the card only knows the
   * rows it was handed, and a branch it hasn't loaded still gets deleted.
   */
  deletedIds?: string[];
};
