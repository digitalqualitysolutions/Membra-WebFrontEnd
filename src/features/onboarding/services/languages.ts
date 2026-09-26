import "server-only";

import { listLanguages } from "@/features/club/api/club-endpoints";
import type { ClubLanguageOption } from "@/features/club/api/club-wire";
import { readSessionToken } from "@/features/auth/server/session-cookie";

/**
 * The API's language table, which is what `preferredLang` is a row of.
 *
 * Read from the club feature because that's where the endpoint lives -
 * `GET /reference/languages` serves a club's languages and a member's
 * preferred one alike. A profile has nothing to do with clubs; the shared
 * table is the API's arrangement, not ours.
 *
 * Never throws, and deduped per request by the endpoint underneath. An empty
 * list means the locale goes up unmapped - see `toCompleteProfileRequest`.
 */
export async function languageList(): Promise<readonly ClubLanguageOption[]> {
  const token = await readSessionToken();
  if (!token) return [];

  try {
    return await listLanguages(token);
  } catch (error) {
    console.error("[languages] could not be loaded", error);

    return [];
  }
}
