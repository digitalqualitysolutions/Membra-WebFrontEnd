import type { ClubDetails } from "@/features/club/types";

/**
 * Shapes passed between the club setup form and its Server Action.
 *
 * Kept out of the action because a `"use server"` module can only export async
 * functions; a plain initial value gets refused at build time.
 */

/** One address as the setup form holds it. */
export type NewAddressValues = {
  name: string;
  shortName: string;
  streetName: string;
  streetNumber: string;
  zip: string;
  city: string;
  /** Optional; empty means none. */
  region: string;
  directions: string;
};

/**
 * Everything the setup form sends.
 *
 * Ids rather than names for the activities and languages: the form picked them
 * from the API's own lists, so there's nothing to look up on the way out.
 * The logo is the `File` itself - React sends Server Action arguments as
 * multipart when one is in there.
 */
export type CreateClubPayload = {
  locale: string;
  name: string;
  shortName: string;
  countryCode: string;
  /** Day-first `DD / MM / YYYY`, as the field holds it. */
  establishedDate: string;
  activityIds: number[];
  /** Language codes - `da`, `en-US` - not numbers. */
  primaryLanguageId: string | null;
  secondaryLanguageId: string | null;
  addresses: NewAddressValues[];
  avatar: File | null;
};

export type CreateClubState = {
  /** Why the club wasn't created, ready to show. */
  formError?: string;
  /** The club as the API stored it, once it has been. */
  club?: ClubDetails;
};

export const initialCreateClubState: CreateClubState = {};

/**
 * The club details the card's Save bar sends.
 *
 * Only the fields being saved are present. A field pencil sends the one field
 * it opened; "edit all" sends every one. Left out means "leave as it is".
 */
export type ClubDetailsChange = {
  name?: string;
  shortName?: string;
  countryCode?: string;
  /** Day-first `DD / MM / YYYY`, as the field holds it. */
  establishedDate?: string;
  active?: boolean;
  activityIds?: number[];
  /** Both slots together: the API takes the club's languages as one list. */
  languages?: {
    primaryLanguageId: string | null;
    secondaryLanguageId: string | null;
  };
  /** A new logo, or `null` to leave the current one alone. */
  avatar: File | null;
};

/**
 * One address to store.
 *
 * A new one (`addressId: null`) carries every field. A stored one carries only
 * the fields that were changed - the rest are left as they are.
 */
export type AddressChange = {
  /** The card's own key for the row, so the answer can say which were stored. */
  key: string;
  addressId: number | null;
  values: Partial<NewAddressValues>;
};

/** Everything one press of the club card's Save commits. */
export type SaveClubPayload = {
  locale: string;
  clubId: number;
  /** `null` when only the addresses were being edited. */
  details: ClubDetailsChange | null;
  addresses: AddressChange[];
  /** The row now meant to be primary, when that changed. */
  primaryKey: string | null;
};

export type SaveClubState = {
  /** Why the save stopped, if it did. */
  formError?: string;
  /** The club as the API now holds it - after a failure as much as a success. */
  club?: ClubDetails;
  /** Row key → the id the API gave each address that was stored. */
  saved: Record<string, string>;
};
