import type { LocationRow, LocationSurface } from "@/features/location/types";

/**
 * Every made-up value on the locations overview, in one file.
 *
 * DELETE THIS FILE when the locations endpoint lands - that is the whole
 * cleanup. `services/location-overview.ts` is the only thing that imports it.
 *
 * The hierarchy is the club record's: Hafnia with an indoor and an outdoor
 * zone, Ryparken with its courts hanging straight off the hub. Same halls, same
 * `Bane` numbering, same `HH`/`RP` codes as `features/club/dummy-club.ts`, so
 * the two screens describe one club rather than two. What it adds is the three
 * columns only this screen shows - site number, surface, and group membership.
 */

/** Hubs 0, zones 1, courts 2 - what the first column's guides are drawn from. */
const COURT_DEPTH = 2;

/**
 * The groups a court falls inside, widest range first.
 *
 * Groups are contiguous runs of courts under one parent, and the club books
 * them two ways: non-overlapping threes for a tournament pool, and every
 * adjacent pair for a doubles session. A court belongs to whichever of those
 * cover it, so the codes are derived from its own number rather than listed by
 * hand - the alternative is a table of literals that silently goes wrong the
 * first time somebody adds a court.
 */
function groupsFor(prefix: string, court: number, total: number): string[] {
  const codes: string[] = [];

  /** The pool this court sits in: 1–3, 4–6, 7–9. */
  const poolStart = Math.floor((court - 1) / 3) * 3 + 1;
  const poolEnd = Math.min(poolStart + 2, total);

  if (poolEnd > poolStart) codes.push(`${prefix}.${poolStart}-${poolEnd}`);

  // The pair below, then the pair above - the order the club reads them in,
  // working outwards from the court you are looking at.
  if (court > 1) codes.push(`${prefix}.${court - 1}-${court}`);
  if (court < total) codes.push(`${prefix}.${court}-${court + 1}`);

  return codes;
}

/**
 * Every court books the same way; only its name, its place and its listing differ.
 *
 * Depth 2 whether the court hangs off a zone or straight off a hub, so a court
 * sits on one line of indent throughout - which is how the club reads the
 * hierarchy, courts at the bottom whatever is above them.
 */
function court(
  parentLocation: string,
  prefix: string,
  number: number,
  total: number,
  publicListed: boolean,
): LocationRow {
  return {
    id: `${prefix.toLowerCase().replace(/\./g, "-")}-${number}`,
    name: `Bane ${number}`,
    kind: "court",
    depth: COURT_DEPTH,
    short: String(number),
    show: `${prefix}.${number}`,
    parentAddress: null,
    parentLocation,
    memberBooking: true,
    teamMemberBooking: false,
    memberBookingCount: 4,
    publicListed,
    friends: false,
    active: true,
    directions: null,
    site: null,
    surface: null,
    groups: groupsFor(prefix, number, total),
  };
}

/** A hall's worth of courts, numbered from one. */
function courts(
  parentLocation: string,
  prefix: string,
  total: number,
  publicListed: boolean,
): LocationRow[] {
  return Array.from({ length: total }, (_, index) =>
    court(parentLocation, prefix, index + 1, total, publicListed),
  );
}

function zone(
  id: string,
  name: string,
  short: string,
  show: string,
  parentLocation: string,
  surface: LocationSurface,
): LocationRow {
  return {
    id,
    name,
    kind: "zone",
    depth: 1,
    short,
    show,
    parentAddress: null,
    parentLocation,
    memberBooking: false,
    teamMemberBooking: false,
    memberBookingCount: null,
    publicListed: false,
    friends: false,
    active: true,
    directions: null,
    site: null,
    surface,
    groups: [],
  };
}

function hub(
  id: string,
  name: string,
  short: string,
  site: number,
): LocationRow {
  return {
    id,
    name,
    kind: "hub",
    depth: 0,
    short,
    show: short,
    parentAddress: short,
    parentLocation: null,
    memberBooking: false,
    teamMemberBooking: false,
    memberBookingCount: null,
    publicListed: false,
    friends: false,
    active: true,
    directions: null,
    site,
    surface: null,
    groups: [],
  };
}

/**
 * The hierarchy, parent-first.
 *
 * Every node is immediately followed by what hangs off it - Hafnia, its two
 * zones with their courts under each, then Ryparken with its courts directly
 * beneath. The table draws the guides from this order, so it is the order
 * itself that has to be right; nothing sorts it afterwards.
 *
 * Hafnia's outdoor courts are the one place `Public` differs from its
 * neighbours: the club lists what is under a roof and keeps the sand off the
 * public timetable. It is here so the column has something to say.
 */
export const dummyLocations: LocationRow[] = [
  hub("hh", "Hafnia", "HH", 5),

  zone("hh-i", "HH inde", "i", "HH.i", "HH", "indoor"),
  ...courts("i", "HH.i", 3, true),

  zone("hh-u", "HH ude", "u", "HH.u", "HH", "outdoor"),
  ...courts("u", "HH.u", 3, false),

  hub("rp", "Ryparken", "RP", 4),

  // No zones at Ryparken: its courts hang straight off the hub.
  ...courts("RP", "RP", 9, true),
];
