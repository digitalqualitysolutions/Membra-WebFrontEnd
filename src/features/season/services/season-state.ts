import type { SeasonRow } from "@/features/season/types";

/**
 * Shapes passed between the seasons screen and its Server Action.
 *
 * Kept out of the action because a `"use server"` module can only export async
 * functions; a plain type or initial value gets refused at build time - the
 * same reason `location-state.ts` exists next to the location actions.
 */

/**
 * A season the screen is about to create.
 *
 * In the API's vocabulary rather than the table's, because it goes straight
 * out as a request body. Dates are the stored `YYYY-MM-DD`; the screen has
 * already turned what was typed into one, and a half-typed date never gets
 * this far.
 */
export type NewSeason = {
  name: string;
  shortName: string;
  seasonStart: string;
  seasonEnd: string;
  forTeams: boolean;
  forLocations: boolean;
  active: boolean;
};

/**
 * One stored season's changes.
 *
 * Left out means "leave as it is", so a row where one switch moved sends one
 * field.
 */
export type SeasonChange = {
  seasonId: number;
  name?: string;
  shortName?: string;
  seasonStart?: string;
  seasonEnd?: string;
  forTeams?: boolean;
  forLocations?: boolean;
  active?: boolean;
};

/**
 * Everything one press of Save commits: the rows added in this edit and the
 * stored rows that moved.
 */
export type SaveSeasonsPayload = {
  locale: string;
  clubId: number;
  created: NewSeason[];
  changes: SeasonChange[];
};

export type SaveSeasonsState = {
  /** Why the save stopped, if it did. */
  formError?: string;
  /**
   * The club's seasons as the API now holds them - after a failure as much as
   * a success, since a create may have gone through before a later one was
   * refused. Re-read rather than patched locally: the API assigns the id, and
   * a created row has none until it answers.
   */
  seasons?: SeasonRow[];
};
