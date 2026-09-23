import "server-only";

import { getLocale } from "next-intl/server";

import { readSessionToken } from "@/features/auth/server/session-cookie";
import {
  getClub,
  listActivities,
  listLanguages,
  listMyClubIds,
} from "@/features/club/api/club-endpoints";
import {
  toClubDetails,
  type ClubActivity,
  type ClubLanguageOption,
} from "@/features/club/api/club-wire";
import { listLocations } from "@/features/club/api/location-endpoints";
import { toClubLocations } from "@/features/club/api/location-wire";
import { countryName, countryOptions } from "@/features/club/countries";
import type {
  ClubContact,
  ClubDetails,
  ClubLocation,
} from "@/features/club/types";
import { ApiError } from "@/lib/http/api-error";
import { loaded, LOAD_FAILED, type Loaded } from "@/lib/loaded";

/**
 * What the club screen reads.
 *
 * The club, its activities and its languages come from the API. Two things
 * don't yet, and say so below: contact details (the API has no field for
 * them) and the locations list (no endpoint).
 */

/**
 * The admin's club, `null` when they don't run one, or a failure.
 *
 * Asked of the API: `GET /clubs` lists the clubs the member admins, and the
 * first one is the club this screen shows. The screen manages one club; a
 * member who runs several sees the first by name until it offers a choice.
 *
 * An empty list, or a club that's gone (404), really is "no club", and the
 * setup screen is the right answer. Anything else reads as a failure rather
 * than as an absence - answering `null` there would offer to create a club the
 * admin already has. Nothing throws: a failure costs this screen its cards,
 * not the whole page.
 */
export async function clubDetails(): Promise<Loaded<ClubDetails | null>> {
  const token = await readSessionToken();
  if (!token) return loaded(null);

  try {
    const [clubId] = await listMyClubIds(token);
    if (clubId === undefined) return loaded(null);

    const [club, locale] = await Promise.all([
      getClub(clubId, token),
      getLocale(),
    ]);

    return loaded(toClubDetails(club, (code) => countryName(code, locale)));
  } catch (error) {
    if (ApiError.isApiError(error) && error.status === 404) return loaded(null);

    console.error("[club] could not be loaded", error);

    return LOAD_FAILED;
  }
}

/**
 * How to reach the club.
 *
 * None on purpose. The API's club has no phone, email, website or contact
 * person yet, and showing invented ones next to a real club would be worse
 * than showing none. The card offers to add the first.
 */
export async function clubContacts(): Promise<ClubContact[]> {
  return [];
}

/**
 * The club's halls, zones and courts, as a tree the tables can draw.
 *
 * Asked of `GET /clubs/{clubId}/locations`, against the same club the screen
 * is showing. The club record comes along because the API names a location's
 * site by id and the table shows the club's own short code for it; both calls
 * are deduped per request, so asking here costs nothing the page didn't
 * already pay.
 *
 * Never throws. This is one card on a page full of them, and a locations call
 * that fails must cost the admin that card rather than the whole club screen.
 * A failure says so rather than reading as "no locations yet": an empty table
 * over a dead API invites someone to re-create rows that already exist.
 */
export async function clubLocations(): Promise<Loaded<ClubLocation[]>> {
  const token = await readSessionToken();
  if (!token) return loaded([]);

  try {
    const [clubId] = await listMyClubIds(token);
    if (clubId === undefined) return loaded([]);

    const [club, rows] = await Promise.all([
      getClub(clubId, token),
      listLocations(clubId, token),
    ]);

    const shortById = new Map(
      club.addresses.map((address) => [address.id, address.shortName]),
    );

    return loaded(
      toClubLocations(rows, (addressId) =>
        addressId === null ? null : (shortById.get(addressId) ?? null),
      ),
    );
  } catch (error) {
    // A club that isn't there has no locations - the same reading `clubDetails`
    // gives a 404, and the two have to agree. Answering "couldn't be loaded"
    // here told an admin with no club yet that the API was broken.
    if (ApiError.isApiError(error) && error.status === 404) return loaded([]);

    console.error("[locations] could not be loaded", error);

    return LOAD_FAILED;
  }
}

/**
 * The activities the club's activity field offers.
 *
 * Never throws. This is reference data for one dropdown, and the club page
 * loads it alongside everything else - a failing lookup must cost the admin
 * that dropdown, not the whole screen. An empty list makes the field say it
 * couldn't load rather than inventing options: made-up activities would be
 * refused by the API anyway.
 */
export async function clubActivities(): Promise<readonly ClubActivity[]> {
  const token = await readSessionToken();
  if (!token) return [];

  try {
    return await listActivities(token);
  } catch (error) {
    console.error("[activities] could not be loaded", error);

    return [];
  }
}

/** The languages a club can list. Never throws, for the same reasons. */
export async function clubLanguages(): Promise<readonly ClubLanguageOption[]> {
  const token = await readSessionToken();
  if (!token) return [];

  try {
    return await listLanguages(token);
  } catch (error) {
    console.error("[languages] could not be loaded", error);

    return [];
  }
}

/** The countries a club can be registered in, named in the page's language. */
export async function clubCountries(): Promise<
  readonly { code: string; name: string }[]
> {
  return countryOptions(await getLocale());
}
