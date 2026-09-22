"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isLocale } from "@/config/locales";
import { readSessionToken } from "@/features/auth/server/session-cookie";
import { getClub } from "@/features/club/api/club-endpoints";
import {
  listLocations,
  updateLocation,
} from "@/features/club/api/location-endpoints";
import {
  toClubLocations,
  updateLocationRequestSchema,
  type UpdateLocationRequest,
} from "@/features/club/api/location-wire";
import { clubFailure } from "@/features/club/services/club-errors";
import type {
  LocationChange,
  SaveLocationsPayload,
  SaveLocationsState,
} from "@/features/club/services/location-state";
import type { ClubLocation } from "@/features/club/types";

const idSchema = z.number().int().positive();

/**
 * The ids in the payload. A Server Action takes whatever the caller sent, and
 * `clubId` and `locationId` both end up in the upstream URL.
 */
const payloadIdsSchema = z.object({
  clubId: idSchema,
  changes: z
    .array(
      z.object({
        locationId: idSchema,
        clubAddressId: idSchema.nullable().optional(),
        parentLocationId: idSchema.nullable().optional(),
      }),
    )
    .min(1),
});

/**
 * Everything one press of the locations card's Save commits.
 *
 * Rows go one at a time and it stops at the first refusal - there's no undo
 * for a stored row, so whatever went through stays through. Either way the
 * answer carries the list as the API now holds it, because changing a parent
 * or a code makes the API recompute the dotted name of every descendant, and
 * the card can't work that out for itself.
 */
export async function saveLocationsAction(
  payload: SaveLocationsPayload,
): Promise<SaveLocationsState> {
  const { locale } = payload;
  if (!isLocale(locale)) return { formError: "Unsupported locale" };

  if (!payloadIdsSchema.safeParse(payload).success) {
    console.error("[save-locations] payload carried an id that isn't one");
    const tErrors = await getTranslations({ locale, namespace: "errors" });

    return { formError: tErrors("unexpected") };
  }

  const token = await readSessionToken();
  if (!token) redirect(`/${locale}/login`);

  let formError: string | undefined;

  for (const change of payload.changes) {
    const patch = toPatch(change);

    // Nothing but the id: the row was marked changed but nothing moved.
    if (Object.keys(patch).length === 0) continue;

    const body = updateLocationRequestSchema.safeParse(patch);

    if (!body.success) {
      console.error(
        `[save-locations] card values did not make a valid request: ${body.error.message}`,
      );
      const tErrors = await getTranslations({ locale, namespace: "errors" });
      formError = tErrors("unexpected");
      break;
    }

    try {
      await updateLocation(payload.clubId, change.locationId, body.data, token);
    } catch (error) {
      formError = await clubFailure(error, locale, "save-locations");
      break;
    }
  }

  revalidatePath(`/${locale}/admin/club`);
  revalidatePath(`/${locale}/admin/location`);

  return { formError, locations: await reread(payload.clubId, token) };
}

/** The change as the API takes it, dropping the id and anything untouched. */
function toPatch(change: LocationChange): UpdateLocationRequest {
  const patch: UpdateLocationRequest = {};

  if (change.name !== undefined) patch.name = change.name;
  if (change.shortName !== undefined) patch.shortName = change.shortName;
  if (change.memberReqToBook !== undefined) {
    patch.memberReqToBook = change.memberReqToBook;
  }
  if (change.directions !== undefined) patch.directions = change.directions;
  if (change.clubAddressId !== undefined) patch.clubAddressId = change.clubAddressId;
  if (change.parentLocationId !== undefined) {
    patch.parentLocationId = change.parentLocationId;
  }
  if (change.canMemberBook !== undefined) patch.canMemberBook = change.canMemberBook;
  if (change.canTeamBook !== undefined) patch.canTeamBook = change.canTeamBook;
  if (change.public !== undefined) patch.public = change.public;
  if (change.canFriendshipClubBook !== undefined) {
    patch.canFriendshipClubBook = change.canFriendshipClubBook;
  }
  if (change.active !== undefined) patch.active = change.active;

  return patch;
}

/**
 * The club's locations as they now stand. Undefined when the re-read itself
 * failed, which leaves the card showing what it has rather than emptying it.
 */
async function reread(
  clubId: number,
  token: string,
): Promise<ClubLocation[] | undefined> {
  try {
    const [club, rows] = await Promise.all([
      getClub(clubId, token),
      listLocations(clubId, token),
    ]);

    const shortById = new Map(
      club.addresses.map((address) => [address.id, address.shortName]),
    );

    return toClubLocations(rows, (addressId) =>
      addressId === null ? null : (shortById.get(addressId) ?? null),
    );
  } catch (error) {
    console.error("[save-locations] could not re-read the locations", error);

    return undefined;
  }
}
