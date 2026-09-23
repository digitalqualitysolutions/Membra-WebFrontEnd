import type { ClubActivity } from "@/features/club/api/club-wire";

/**
 * Lower-case, accents dropped, so "hand" finds "Håndbold" and "padel" finds
 * "Padel".
 */
function fold(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase();
}

/**
 * The activities a search matches, by name.
 *
 * With nothing typed it's every activity, the chosen ones first, so what an
 * admin already picked is on screen without paging through the catalogue.
 * Kept apart from the picker so the matching can be tested without a browser.
 */
export function matchActivities(
  activities: readonly ClubActivity[],
  chosen: ReadonlySet<number>,
  query: string,
): ClubActivity[] {
  const needle = fold(query.trim());

  if (!needle) {
    return [
      ...activities.filter((activity) => chosen.has(activity.id)),
      ...activities.filter((activity) => !chosen.has(activity.id)),
    ];
  }

  return activities.filter((activity) => fold(activity.name).includes(needle));
}
