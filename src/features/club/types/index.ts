/** Which of a club's two language slots a language sits in. */
export type LanguageRank = "primary" | "secondary";

/** One of the club's physical addresses, as the table lists them. */
export type ClubAddress = {
  /** The API's id, as a string for React keys and form names. */
  id: string;
  /** What the club calls the place: "Main hall". */
  name: string;
  streetName: string;
  streetNumber: string;
  zip: string;
  city: string;
  /** Optional - the API accepts none. */
  region: string | null;
  /** One line for the table, built from the parts: "Lyngbyvej 1, 2100 Copenhagen". */
  address: string;
  /** The two- or three-letter code the club calls the place by. */
  short: string;
  /** Free text, and often not filled in - the table shows a dash for those. */
  directions: string | null;
  prime: LanguageRank;
};

export type ClubLanguage = {
  /** The id from `GET /clubs/languages`. */
  id: number;
  name: string;
  rank: LanguageRank;
};

export type ClubDetails = {
  /** The API's id for the club, which every later call is made against. */
  id: number;
  name: string;
  short: string;
  /** `YYYY-MM-DD`, the form the API stores dates in. Formatted where it's shown. */
  established: string;
  /** How many admins the club has right now. */
  admins: number;
  /** How many it wants before the safeguard stops warning about lockout. */
  recommendedAdmins: number;
  active: boolean;
  /** The club's activities by name, comma-separated, for reading. */
  activity: string;
  /** The same activities by id, for picking. */
  activityIds: number[];
  languages: ClubLanguage[];
  country: { code: string; name: string };
  addresses: ClubAddress[];
  /**
   * The club's logo as an image URL, or `null` for none - the club's mark
   * stands in. A signed URL from the API; a local `data:` preview while an
   * edit on the card is open.
   */
  avatar: string | null;
};

/** Everything the section's edit mode can change, flattened for the form. */
export type ClubFormValues = {
  name: string;
  short: string;
  /**
   * Day-first `DD / MM / YYYY`, as the field edits it - not the stored ISO
   * form, which can't represent a date that's only half typed.
   */
  established: string;
  /** Ids from `GET /clubs/activities` - a club can have several. */
  activityIds: number[];
  /** Ids from `GET /clubs/languages`. The primary one is required. */
  primaryLanguageId: number | null;
  secondaryLanguageId: number | null;
  country: string;
  active: boolean;
  avatar: string | null;
};

/** How to reach the club. One card, four fields, all free text. */
export type ClubContact = {
  phone: string;
  email: string;
  website: string;
  contactPerson: string;
};

export type ClubContactField = keyof ClubContact;

/** Where a location sits in the hierarchy: a hub, a zone in it, or a court. */
export type LocationKind = "hub" | "zone" | "court";

/**
 * One row of the locations table.
 *
 * Flat, with `depth` rather than nested children: the table renders one row per
 * location and draws the tree with guides down the first column, so a nested
 * shape would only have to be flattened again to render it.
 */
export type ClubLocation = {
  id: string;
  name: string;
  kind: LocationKind;
  /** Hubs 0, zones 1, courts 2. What the guides are drawn from. */
  depth: number;
  short: string;
  /** The dotted code the club reads it by: `HH.i.1`. */
  show: string;
  /** The address it books against, by the address's own short code. */
  parentAddress: string | null;
  /** The location above it, by that location's short code. */
  parentLocation: string | null;
  memberBooking: boolean;
  teamMemberBooking: boolean;
  /** How many members may hold it at once. Null where booking is off. */
  memberBookingCount: number | null;
  publicListed: boolean;
  friends: boolean;
  active: boolean;
  directions: string | null;
};

/** The columns of the locations table that are a plain on/off. */
export type LocationToggle =
  "memberBooking" | "teamMemberBooking" | "publicListed" | "friends" | "active";

/**
 * The typed-in fields of the details card, each of which carries its own
 * pencil and all of which close on that card's one save bar.
 */
export type ClubField = keyof Omit<ClubFormValues, "active">;
