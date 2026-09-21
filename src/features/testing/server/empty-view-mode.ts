import "server-only";

import { cookies } from "next/headers";

/**
 * TEMPORARY - a testing switch, not a product feature.
 *
 * DELETE THIS FOLDER when the empty states have been signed off. Search for
 * `features/testing` to find every use: the location services that answer with
 * made-up records, the settings toggle, the location page (which passes
 * `testMode` down so saving is refused), and the form that shows
 * `TestModeNotice`. Each is marked TEMPORARY where it happens.
 *
 * It no longer touches the club. The club is real now, read from and created
 * through the API - emptying it here would only offer to create a duplicate.
 *
 * It lives in a cookie rather than React state because the screens it changes
 * are server-rendered - the club record and the locations list are fetched on
 * the server, so a browser-side flag could never reach them.
 */
export const EMPTY_VIEW_COOKIE = "membra_empty_view";

/**
 * Whether the switch exists at all. Never in production.
 *
 * Checked at every entry point rather than at one - the read below, the action
 * that writes the cookie, and the settings toggle that renders it. A Server
 * Action is reachable by anyone who finds its id in a static chunk, so "the UI
 * doesn't render it" is not a guard, and this one revalidates the whole tree.
 */
export const emptyViewModeAvailable = process.env.NODE_ENV !== "production";

/**
 * Whether every list and record should answer as if it were empty.
 *
 * Read from the services, so a screen doesn't need to know the mode exists -
 * it just gets nothing back and renders whatever it shows for nothing.
 */
export async function isEmptyViewMode(): Promise<boolean> {
  // A cookie left over from a dev session, or set by hand, does nothing here.
  if (!emptyViewModeAvailable) return false;

  const store = await cookies();

  return store.get(EMPTY_VIEW_COOKIE)?.value === "on";
}
