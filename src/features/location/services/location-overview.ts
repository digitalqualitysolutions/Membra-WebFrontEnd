import { clubLocations } from "@/features/club/services/club-details";
import type { LocationRow } from "@/features/location/types";
import { loaded, LOAD_FAILED, type Loaded } from "@/lib/loaded";

/**
 * What the locations overview reads.
 *
 * The same rows the club card shows, widened by the three columns only this
 * screen has. Read through `clubLocations` rather than calling the endpoint
 * again: one screen's locations and the other's are the same locations, and
 * two readers with their own idea of how to build the tree is how the two
 * tables would start disagreeing about which court sits under which hall.
 *
 * Site, surface and group membership have nowhere to come from yet - the API's
 * location carries none of them. They're left empty rather than invented, so
 * the columns read as "not set" instead of as something the club never said.
 * `dummy-location.ts` still holds worked examples of all three for whenever
 * those land.
 */
export async function locationOverview(): Promise<Loaded<LocationRow[]>> {
  const locations = await clubLocations();

  if (!locations.ok) return LOAD_FAILED;

  return loaded(
    locations.data.map((location) => ({
      ...location,
      surface: null,
      groups: [],
    })),
  );
}
