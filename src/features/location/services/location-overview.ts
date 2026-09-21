import { dummyLocations } from "@/features/location/dummy-location";
import type { LocationRow } from "@/features/location/types";
import { isEmptyViewMode } from "@/features/testing/server/empty-view-mode";

/**
 * What the locations overview reads.
 *
 * The values are still made up, but they don't live here: they're all in
 * `dummy-location.ts`, so switching this screen onto the real API is deleting
 * one file and replacing the return below with an `api(...)` call plus a
 * `location-wire.ts`. The page awaits this function already and won't notice.
 *
 * Async for the same reason - the shape of the read is the part worth being
 * honest about now, even while the answer is a constant.
 */
export async function locationOverview(): Promise<LocationRow[]> {
  // TEMPORARY testing switch - see `features/testing`. Delete with it.
  if (await isEmptyViewMode()) return [];

  return dummyLocations;
}
