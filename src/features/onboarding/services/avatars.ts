import "server-only";

import type { MemberAvatars } from "@/features/onboarding/api/avatar-wire";
import { getSession } from "@/features/auth/server/session";

/**
 * The signed-in member's picture, for whatever wants to show it.
 *
 * The read half of the photo step, sitting beside the write in
 * `upload-photo.ts`. No `"use server"`: pages call this while rendering, so it
 * wants `server-only` - a fence against reaching the browser - rather than a
 * directive that publishes it as an endpoint the browser may call.
 *
 * Read off the session rather than fetched. `GET /users/me` returns the signed
 * URLs alongside the member, and every page that shows a picture has already
 * asked for the session to guard itself - `getSession` is cached for the
 * request, so this costs nothing. It used to be a second round trip to
 * `GET /users/avatars` on every signed-in page.
 *
 * Never throws, and that's the whole job. An avatar is decoration on every
 * screen it appears on; a member with no picture, an expired session or an
 * API having a bad afternoon all arrive here the same way and leave with
 * nothing to show. `MemberAvatar` then falls back to initials.
 */
export async function memberAvatars(): Promise<MemberAvatars> {
  const none: MemberAvatars = { large: null, medium: null, small: null };

  try {
    const session = await getSession();

    return session?.avatars ?? none;
  } catch (error) {
    /*
     * Logged as a warning, not an error. Nothing is broken for the member and
     * nothing downstream changes its behaviour - but a session read that
     * failed looks exactly like a member with no picture, and that's worth
     * being able to tell apart.
     */
    console.warn("[avatars] could not be read, falling back to initials", error);

    return none;
  }
}
