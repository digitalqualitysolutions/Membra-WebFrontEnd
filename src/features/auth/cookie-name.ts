/**
 * The name the API expects back on `Cookie`, so it's what we store it under.
 *
 * Kept out of `server/session-cookie.ts` because the proxy needs it too, and
 * that module is `server-only`: it goes through `next/headers`, which has no
 * business running in a proxy. The name is shared; reading and writing the
 * cookie isn't.
 */
export const SESSION_COOKIE = "membra_session";
