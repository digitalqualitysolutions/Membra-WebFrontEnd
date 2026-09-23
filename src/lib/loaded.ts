/**
 * What a screen got when it asked for something the API owns.
 *
 * Three answers, not two: the thing, nothing, or a failure to read it. A screen
 * that can't tell "there isn't one" from "we couldn't load it" has to guess,
 * and both guesses are wrong in their own way - the club page reading a failed
 * call as "no club" offers to create a second one, and a locations table
 * reading it as "none yet" quietly hides that the API is down.
 *
 * `{ ok: true, data: null }` is a real, empty answer. `{ ok: false }` is the
 * failure, and carries nothing: whatever went wrong belongs in the server log,
 * not in the browser.
 */
export type Loaded<T> = { ok: true; data: T } | { ok: false };

/** A real answer, empty or not. */
export function loaded<T>(data: T): Loaded<T> {
  return { ok: true, data };
}

/** Couldn't be read. Assignable to `Loaded<T>` whatever `T` is. */
export const LOAD_FAILED = { ok: false } as const;
