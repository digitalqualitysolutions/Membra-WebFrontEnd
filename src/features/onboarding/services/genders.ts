import "server-only";

import { listGenders } from "@/features/onboarding/api/profile-endpoints";
import type { Gender } from "@/features/onboarding/api/profile-wire";
import { genderCategories } from "@/features/onboarding/schemas";

/**
 * The genders the profile form offers, and how they're known to the API.
 *
 * A read, sitting beside the writes. `services/` is the one place a feature's
 * work gets done, whichever direction the data is going - one flow to remember
 * rather than a rule about which folder a function belongs in.
 *
 * No `"use server"` at the top, and that part is deliberate. The directive
 * turns every export in a module into an endpoint the browser can call, which
 * is right for a form submission and wrong for a lookup a page makes while
 * rendering. `server-only` gives the half that's actually wanted: this can't
 * end up in a client bundle, and it isn't published as an action either.
 *
 * The form works in words - `male`, `female`, `others` - because its labels
 * are translated by word. The API speaks ids, both ways: `/users/me` reports a
 * `genderId` and `complete-profile` wants one. The list below is the only
 * thing that pairs the two, so everything that crosses that line reads it.
 *
 * Never throws. The call underneath is deduped per request, so a page and the
 * Server Action that re-validates its submission share one answer.
 */

/**
 * Every gender the API offers, id and word together. Empty if the list
 * couldn't be read.
 *
 * No built-in fallback here, unlike the words below. The ids are the API's own
 * row ids; copying them into the app would be a guess that goes stale the day
 * the table is reseeded, and a wrong id is worse than none - it saves the
 * member under a gender they didn't pick.
 */
export async function genderList(): Promise<readonly Gender[]> {
  try {
    return await listGenders();
  } catch (error) {
    console.error("[genders] could not be loaded", error);

    return [];
  }
}

/**
 * The words the form offers, and validates against.
 *
 * Falls back to the built-in words when the list is empty or unreachable: a
 * member should still be able to see and fill in the form. Saving needs the
 * ids, so a save made while the list is down is refused with an error rather
 * than stored wrong - see `toCompleteProfileRequest`.
 */
export async function availableGenders(): Promise<readonly string[]> {
  const genders = await genderList();

  // An empty list would leave the member a select they can't satisfy, which
  // is worse than an out-of-date one.
  return genders.length > 0
    ? genders.map((gender) => gender.value)
    : genderCategories;
}
