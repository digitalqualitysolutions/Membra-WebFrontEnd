import type { SeasonRow } from "@/features/season/types";

/**
 * The seasons screen's rows, invented.
 *
 * Seasons have no endpoint yet, so the page reads these straight off the module
 * and every edit lives and dies in the browser. DELETE THIS FILE when a seasons
 * endpoint lands - `app/[locale]/admin/seasons/page.tsx` is its only importer.
 *
 * Two summers, two winters and a summer-of-next-year, because that is what makes
 * the screen worth looking at: overlapping runs, one club-wide and one scoped to
 * a single venue, and a winter that crosses the new year.
 */
export const dummySeasons: SeasonRow[] = [
  {
    id: "s26",
    name: "Summer 26",
    short: "s26",
    start: "2026-05-01",
    end: "2026-08-31",
    teams: true,
    locations: false,
    active: true,
  },
  {
    id: "s26rp",
    name: "Summer 26 RP",
    short: "s26rp",
    start: "2026-04-20",
    end: "2026-09-21",
    teams: false,
    locations: true,
    active: true,
  },
  {
    id: "w26",
    name: "Winter 26/27",
    short: "w26",
    start: "2026-09-01",
    end: "2027-04-30",
    teams: true,
    locations: false,
    active: true,
  },
  {
    id: "w26hhi",
    name: "Winter 26/27 HH.i",
    short: "w26HH.i",
    start: "2026-10-01",
    end: "2027-04-15",
    teams: false,
    locations: true,
    active: true,
  },
  {
    id: "s27",
    name: "Summer 27",
    short: "s27",
    start: "2027-05-01",
    end: "2027-08-31",
    teams: true,
    locations: false,
    active: true,
  },
];
