import { z } from "zod";

import {
  avatarsResponseSchema,
  toMemberAvatars,
} from "@/features/onboarding/api/avatar-wire";
import type { ClubAddress, ClubDetails } from "@/features/club/types";

/**
 * The wire format for the club calls: the API's shapes and how they map onto
 * ours. Parsed rather than trusted, so a rename upstream fails here instead of
 * surfacing as `undefined` inside a card.
 *
 * The contract is `GET /api/openapi.json` on the API - check it there before
 * changing a shape here. It moves: `short_name` became `shortName` without
 * notice, and that alone emptied the activity dropdown.
 */

/* ------------------------------------------------------------------------ */
/* Reference data                                                            */
/* ------------------------------------------------------------------------ */

/** One row of `GET /reference/activities`. The name is `activity`, not `name`. */
const activitySchema = z.object({
  id: z.number().int(),
  activity: z.string().min(1),
});

export const activitiesResponseSchema = z.object({
  activities: z.array(activitySchema),
});

/** An activity a club can be registered for, in the names the app uses. */
export type ClubActivity = {
  id: number;
  name: string;
};

/**
 * The activities worth offering.
 *
 * Unfiltered: the row carries no `active` flag any more, so the endpoint's
 * promise to send only live ones is the only guarantee there is.
 */
export function toClubActivities(
  response: z.infer<typeof activitiesResponseSchema>,
): ClubActivity[] {
  return response.activities.map((row) => ({ id: row.id, name: row.activity }));
}

/** One row of `GET /clubs/languages`. The id is a code - `da`, `en-US`. */
const languageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  active: z.boolean(),
});

export const languagesResponseSchema = z.object({
  languages: z.array(languageSchema),
});

/** A language a club can list, in the names the app uses. */
export type ClubLanguageOption = {
  id: string;
  name: string;
};

/** Active ones only: offering a retired language would be refused on save. */
export function toClubLanguages(
  response: z.infer<typeof languagesResponseSchema>,
): ClubLanguageOption[] {
  return response.languages
    .filter((row) => row.active)
    .map((row) => ({ id: row.id, name: row.name }));
}

/* ------------------------------------------------------------------------ */
/* The club                                                                  */
/* ------------------------------------------------------------------------ */

/** One address, as every club and address endpoint returns it. */
export const clubAddressSchema = z.object({
  id: z.number().int(),
  streetName: z.string(),
  streetNumber: z.string(),
  zip: z.string(),
  city: z.string(),
  region: z.string().nullable(),
  name: z.string(),
  shortName: z.string(),
  directions: z.string().nullable(),
  primary: z.boolean(),
});

/**
 * What `POST /clubs` and `GET /clubs/{id}` answer with.
 *
 * Strict, unlike the extras on the member's own record. A club that won't
 * parse must not read as "no club" - the screen would offer to create one, and
 * the admin would end up with two. Failing loudly is the safe way to be wrong
 * here. Only the avatars degrade quietly; they're a picture.
 */
export const clubResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  shortName: z.string(),
  establishedDate: z.string().nullable(),
  active: z.boolean(),
  countryCode: z.string(),
  activities: z.array(
    z.object({ id: z.number().int(), activity: z.string() }),
  ),
  languages: z.array(
    z.object({
      /** A code, not a number: `da`, `en-US`. */
      languageId: z.string(),
      name: z.string(),
      rank: z.number().int(),
    }),
  ),
  addresses: z.array(clubAddressSchema),
  /** How many admins the club has. Was a list of their ids until 2026-09-17. */
  adminCount: z.number().int(),
  /**
   * The club's logo, and the one place this record disagrees with its own spec.
   *
   * `GET /clubs/{id}` sends `avatar`: a single signed URL, already the 96px
   * variant - which is exactly the one the UI wants. The OpenAPI document
   * declares `avatars`, an `{avatar1, avatar2, avatar3}` object, the way the
   * member record and `GET /clubs/{id}/avatars` both really do answer.
   *
   * Both are accepted, because either could be the one that changes: reading
   * only `avatar` would lose the logo again the day the API is corrected to
   * match its spec, and reading only `avatars` is what was losing it until
   * now. Whichever arrives, the picture shows.
   *
   * Still `.catch(null)` on each, so a shape nobody predicted costs a
   * thumbnail rather than the whole club record.
   */
  avatar: z.string().nullish().catch(null),
  avatars: avatarsResponseSchema.nullish().catch(null),
});

/**
 * `GET /clubs`: the clubs the signed-in member runs, as summary cards.
 *
 * Only the id is needed - the full record comes from `GET /clubs/{id}` - so
 * that's all that's required here. The rest of each card is left unparsed,
 * so a change to a field this screen doesn't read can't take it down.
 */
export const myClubsResponseSchema = z.object({
  clubs: z.array(z.object({ id: z.number().int() })),
});

export type ClubResponse = z.infer<typeof clubResponseSchema>;
export type ClubAddressResponse = z.infer<typeof clubAddressSchema>;

/** One API address as a row of the club's addresses table. */
export function toClubAddress(address: ClubAddressResponse): ClubAddress {
  return {
    id: String(address.id),
    name: address.name,
    streetName: address.streetName,
    streetNumber: address.streetNumber,
    zip: address.zip,
    city: address.city,
    region: address.region,
    // Read the way it's typed: street, then city and postcode, then region.
    address: [
      `${address.streetName} ${address.streetNumber}`,
      `${address.zip} ${address.city}`,
      address.region,
    ]
      .filter(Boolean)
      .join(", "),
    short: address.shortName,
    directions: address.directions,
    prime: address.primary ? "primary" : "secondary",
  };
}

/**
 * How many admins a club should have before the safeguard stops warning.
 * Ours, not the API's: it's advice about lockout, not a rule anything enforces.
 */
const RECOMMENDED_ADMINS = 3;

/**
 * The API's club, in the shape the club screen reads.
 *
 * @param countryName how a country code reads to this member - the API only
 *   sends the code, and the name depends on the page's language.
 */
export function toClubDetails(
  club: ClubResponse,
  countryName: (code: string) => string,
): ClubDetails {
  // Rank 1 is the primary language; everything after it is secondary. Sorted
  // first, because nothing promises the API lists them in rank order.
  const languages = [...club.languages].sort((a, b) => a.rank - b.rank);
  const avatars = toMemberAvatars(club.avatars ?? {});

  return {
    id: club.id,
    name: club.name,
    short: club.shortName,
    established: club.establishedDate ?? "",
    admins: club.adminCount,
    recommendedAdmins: RECOMMENDED_ADMINS,
    active: club.active,
    activity: club.activities.map((entry) => entry.activity).join(", "),
    activityIds: club.activities.map((activity) => activity.id),
    languages: languages.map((language, index) => ({
      id: language.languageId,
      name: language.name,
      rank: index === 0 ? "primary" : "secondary",
    })),
    country: { code: club.countryCode, name: countryName(club.countryCode) },
    addresses: club.addresses.map(toClubAddress),
    /*
     * Whichever of the two the API sent - see the note on the schema. The
     * single `avatar` is already the 96px one; out of the trio that's the
     * variant to take, since the logo draws at 40px and 96 stays sharp on a
     * high-density screen where the 32px one wouldn't.
     */
    avatar: club.avatar ?? avatars.medium ?? avatars.large,
  };
}

/* ------------------------------------------------------------------------ */
/* Creating one                                                              */
/* ------------------------------------------------------------------------ */

/**
 * One address as the API takes it - in `POST /clubs`, and on its own through
 * the address endpoints. The limits are the API's, from its spec, so an
 * over-long value is refused here with a clear log rather than as a 400.
 */
export const newAddressSchema = z.object({
  name: z.string().min(1).max(60),
  shortName: z.string().min(1).max(20),
  streetName: z.string().min(1).max(60),
  streetNumber: z.string().min(1).max(20),
  zip: z.string().min(1).max(14),
  city: z.string().min(1).max(100),
  region: z.string().max(100).nullable(),
  directions: z.string().max(255).nullable(),
  active: z.boolean(),
});

/**
 * What `POST /clubs` accepts, before it's flattened into multipart.
 *
 * The API also takes these as strings - that's a detail of the transport, not
 * of the club, so they're typed properly here and serialised in
 * `toCreateClubForm`.
 */
export const createClubRequestSchema = z.object({
  name: z.string().min(1).max(255),
  shortName: z.string().min(1).max(10),
  establishedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  activityIds: z.array(z.number().int().positive()),
  /** Rank 1 is primary. Ranks must be unique per club. */
  languages: z
    .array(
      z.object({
        languageId: z.string().min(1).max(15),
        rank: z.number().int().positive(),
      }),
    )
    .min(1),
  /** The first is the primary one - the API ignores any `primary` flag. */
  addresses: z.array(newAddressSchema).min(1),
});

export type CreateClubRequest = z.infer<typeof createClubRequestSchema>;
export type NewClubAddress = z.infer<typeof newAddressSchema>;

/**
 * The request as the multipart body `POST /clubs` wants.
 *
 * Arrays go up as JSON text, unquoted, the way the spec asks. A club is always
 * created active: there's nothing to switch off before it exists.
 */
export function toCreateClubForm(
  request: CreateClubRequest,
  avatar: File | null,
): FormData {
  const form = new FormData();

  form.set("name", request.name);
  form.set("shortName", request.shortName);
  form.set("establishedDate", request.establishedDate);
  form.set("countryCode", request.countryCode);
  form.set("active", "true");
  form.set("activityIds", JSON.stringify(request.activityIds));
  form.set("languages", JSON.stringify(request.languages));
  form.set("addresses", JSON.stringify(request.addresses));

  // Left out entirely when there's no picture - an empty `avatar` part is
  // a file with no bytes, not an absent one.
  if (avatar) form.set("avatar", avatar);

  return form;
}

/* ------------------------------------------------------------------------ */
/* Changing one                                                              */
/* ------------------------------------------------------------------------ */

/**
 * What `PATCH /clubs/{id}` accepts. Every field is optional upstream; the card
 * always sends the whole record, which is simpler to reason about than a diff
 * and costs nothing.
 */
export const updateClubRequestSchema = z.object({
  name: z.string().min(1).max(255),
  shortName: z.string().min(1).max(10),
  establishedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  active: z.boolean(),
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  activityIds: z.array(z.number().int().positive()),
  languages: createClubRequestSchema.shape.languages,
});

export type UpdateClubRequest = z.infer<typeof updateClubRequestSchema>;

/**
 * What `POST /clubs/{id}/addresses` accepts. Unlike creating a club, adding
 * one address has to say whether it's the primary one.
 */
export const addAddressRequestSchema = newAddressSchema.extend({
  primary: z.boolean(),
});

export type AddAddressRequest = z.infer<typeof addAddressRequestSchema>;

/* ------------------------------------------------------------------------ */
/* From form values                                                          */
/* ------------------------------------------------------------------------ */

/**
 * A club's two language slots as the API's ranked list.
 *
 * Rank 1 is primary. The secondary is left out when empty or when it repeats
 * the primary - the API wants ranks unique, and the same language twice would
 * say nothing new.
 */
export function toLanguageRanks(
  primaryId: string,
  secondaryId: string | null,
): CreateClubRequest["languages"] {
  return [
    { languageId: primaryId, rank: 1 },
    ...(secondaryId !== null && secondaryId !== primaryId
      ? [{ languageId: secondaryId, rank: 2 }]
      : []),
  ];
}

/** An address as the form holds it, trimmed into what the API takes. */
export function toNewClubAddress(values: {
  name: string;
  shortName: string;
  streetName: string;
  streetNumber: string;
  zip: string;
  city: string;
  region: string;
  directions: string;
}): NewClubAddress {
  return {
    name: values.name.trim(),
    shortName: values.shortName.trim(),
    streetName: values.streetName.trim(),
    streetNumber: values.streetNumber.trim(),
    zip: values.zip.trim(),
    city: values.city.trim(),
    // Empty optional fields go up as null, not as "".
    region: values.region.trim() || null,
    directions: values.directions.trim() || null,
    active: true,
  };
}

/**
 * What `PATCH /clubs/{id}` accepts when only some fields are sent. Every field
 * is optional upstream; the card sends one field from a field pencil and all
 * of them from "edit all".
 */
export const clubPatchSchema = updateClubRequestSchema.partial();

export type ClubPatch = z.infer<typeof clubPatchSchema>;

/**
 * What `PATCH /clubs/{id}/addresses/{addressId}` accepts: any of the address
 * fields, on their own. `active` isn't offered - the card doesn't change it.
 */
export const addressPatchSchema = newAddressSchema
  .omit({ active: true })
  .partial();

export type AddressPatch = z.infer<typeof addressPatchSchema>;

/** Only the address fields that were typed into, trimmed for the API. */
export function toAddressPatch(values: {
  name?: string;
  shortName?: string;
  streetName?: string;
  streetNumber?: string;
  zip?: string;
  city?: string;
  region?: string;
  directions?: string;
}): AddressPatch {
  const patch: AddressPatch = {};

  if (values.name !== undefined) patch.name = values.name.trim();
  if (values.shortName !== undefined) patch.shortName = values.shortName.trim();
  if (values.streetName !== undefined) patch.streetName = values.streetName.trim();
  if (values.streetNumber !== undefined) {
    patch.streetNumber = values.streetNumber.trim();
  }
  if (values.zip !== undefined) patch.zip = values.zip.trim();
  if (values.city !== undefined) patch.city = values.city.trim();
  if (values.region !== undefined) patch.region = values.region.trim() || null;
  // Emptied directions are cleared, not sent as an empty string.
  if (values.directions !== undefined) {
    patch.directions = values.directions.trim() || null;
  }

  return patch;
}
