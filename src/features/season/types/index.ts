/** One operational season, as the screen holds it. */
export type SeasonRow = {
  id: string;
  name: string;
  /** The code the club writes on a schedule: `s26`, `w26HH.i`. */
  short: string;
  /**
   * Stored `YYYY-MM-DD`, the form the API keeps dates in.
   *
   * Not a `Date`: a season is a run of days, and pulling it through a timezone
   * on the way to the screen is what turns 01-05 into 30-04 for half of Europe.
   */
  start: string;
  end: string;
  /** Teams register for this season. */
  teams: boolean;
  /** Courts are allocated against it. */
  locations: boolean;
  active: boolean;
};

/** The columns on a season that are a switch rather than a value. */
export type SeasonToggle = "teams" | "locations" | "active";
