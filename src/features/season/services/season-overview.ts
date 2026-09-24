import "server-only";

import { readSessionToken } from "@/features/auth/server/session-cookie";
import { listMyClubIds } from "@/features/club/api/club-endpoints";
import { listSeasons } from "@/features/club/api/season-endpoints";
import { toSeasons } from "@/features/club/api/season-wire";
import type { SeasonRow } from "@/features/season/types";
import { ApiError } from "@/lib/http/api-error";
import { loaded, LOAD_FAILED, type Loaded } from "@/lib/loaded";

/**
 * What the seasons screen reads.
 *
 * The same shape `clubLocations` has, and for the same reasons: the club the
 * seasons hang off comes from `GET /clubs`, and both calls are deduped per
 * request so asking here costs nothing the page didn't already pay.
 *
 * Never throws. A failure costs this screen its table rather than the whole
 * page, and it says so rather than reading as "no seasons yet" - an empty
 * table over a dead API invites someone to re-create seasons that exist.
 */
export async function seasonOverview(): Promise<Loaded<SeasonRow[]>> {
  const token = await readSessionToken();
  if (!token) return loaded([]);

  let clubId: number | undefined;

  try {
    [clubId] = await listMyClubIds(token);
  } catch (error) {
    // Same reading as `clubDetails`: no documented 404 on `GET /clubs`, so a
    // failure here is a failure, not a club without seasons.
    console.error("[seasons] could not list the member's clubs", error);

    return LOAD_FAILED;
  }

  // No club, so no seasons - and nothing failed.
  if (clubId === undefined) return loaded([]);

  try {
    // Handed on in the order the API gave them - by `seasonStart`, then id -
    // which is the order a club reads its year in. Nothing re-sorts them.
    return loaded(toSeasons(await listSeasons(clubId, token)));
  } catch (error) {
    // A club that's gone has no seasons, the same reading `clubLocations`
    // gives a 404 from its own endpoint.
    if (ApiError.isApiError(error) && error.status === 404) return loaded([]);

    console.error("[seasons] could not be loaded", error);

    return LOAD_FAILED;
  }
}
