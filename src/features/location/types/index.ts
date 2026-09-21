import type { ClubLocation } from "@/features/club/types";

/** Which side of a zone's wall its courts are on. Zones only; null elsewhere. */
export type LocationSurface = "indoor" | "outdoor";

/**
 * One row of the locations overview.
 *
 * The club record's own location, plus the three things only this screen shows.
 * Extending rather than restating it keeps one vocabulary for a court across
 * both screens - the overview is a wider view of the same rows, not a second
 * kind of location, and a field added to `ClubLocation` arrives here already.
 */
export type LocationRow = ClubLocation & {
  /** The site number the hub is registered under. Null below a hub. */
  site: number | null;
  /** Indoor or outdoor, on zones. Null on hubs and courts. */
  surface: LocationSurface | null;
  /** Codes of the groups this court falls inside, widest range first. */
  groups: readonly string[];
};
