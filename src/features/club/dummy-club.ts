import type { ClubLocation } from "@/features/club/types";

/**
 * The one made-up thing left on the club screen: its locations list.
 *
 * The club itself, its activities and languages are real now. Locations have
 * no endpoint yet, so the club card's table reads these. DELETE THIS FILE when
 * a locations endpoint lands - `services/club-details.ts` is its only importer.
 */

/**
 * Every court books the same way; only its name and its place differ.
 *
 * Depth 2 whether the court hangs off a zone or straight off a hub, so a court
 * sits on one line of indent throughout - which is how the club reads the
 * hierarchy, courts at the bottom whatever is above them.
 */
function court(
  id: string,
  name: string,
  short: string,
  show: string,
  parentLocation: string,
): ClubLocation {
  return {
    id,
    name,
    kind: "court",
    depth: 2,
    short,
    show,
    parentAddress: null,
    parentLocation,
    memberBooking: true,
    teamMemberBooking: false,
    memberBookingCount: 4,
    publicListed: false,
    friends: false,
    active: true,
    directions: null,
  };
}

function zone(
  id: string,
  name: string,
  short: string,
  show: string,
  parentLocation: string,
): ClubLocation {
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
  };
}

/**
 * The hierarchy, parent-first.
 *
 * Every node is immediately followed by what hangs off it - Hafnia, its two
 * zones with their courts under each, then Ryparken with its courts directly
 * beneath. The table draws the guides from this order, so it is the order
 * itself that has to be right; nothing sorts it afterwards.
 */
export const dummyLocations: ClubLocation[] = [
  {
    id: "hh",
    name: "Hafnia",
    kind: "hub",
    depth: 0,
    short: "HH",
    show: "HH",
    parentAddress: "HH",
    parentLocation: null,
    memberBooking: false,
    teamMemberBooking: false,
    memberBookingCount: null,
    publicListed: false,
    friends: false,
    active: true,
    directions: null,
  },

  zone("hh-i", "HH inde", "i", "HH.i", "HH"),
  court("hh-i-1", "Bane 1", "1", "HH.i.1", "i"),
  court("hh-i-2", "Bane 2", "2", "HH.i.2", "i"),
  court("hh-i-3", "Bane 3", "3", "HH.i.3", "i"),

  zone("hh-u", "HH ude", "u", "HH.u", "HH"),
  court("hh-u-1", "Bane 1", "1", "HH.u.1", "u"),
  court("hh-u-2", "Bane 2", "2", "HH.u.2", "u"),
  court("hh-u-3", "Bane 3", "3", "HH.u.3", "u"),

  {
    id: "rp",
    name: "Ryparken",
    kind: "hub",
    depth: 0,
    short: "RP",
    show: "RP",
    parentAddress: "RP",
    parentLocation: null,
    memberBooking: false,
    teamMemberBooking: false,
    memberBookingCount: null,
    publicListed: true,
    friends: false,
    active: true,
    directions: null,
  },

  // No zones at Ryparken: its courts hang straight off the hub.
  ...Array.from({ length: 7 }, (_, index) =>
    court(
      `rp-${index + 1}`,
      `Bane ${index + 1}`,
      String(index + 1),
      `RP.${index + 1}`,
      "RP",
    ),
  ),
];
