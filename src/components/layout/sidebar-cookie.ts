/**
 * Remembers whether the sidebar column is open.
 *
 * Read on the server so the first paint already has it right, written in the
 * browser when the toggle flips - which is why the name lives on its own here
 * rather than inside either of them.
 */
export const SIDEBAR_COOKIE = "membra_sidebar";

/** A year. This is a preference, not a session. */
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
