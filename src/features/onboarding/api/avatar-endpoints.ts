import "server-only";

import {
  avatarsResponseSchema,
  toMemberAvatars,
  type MemberAvatars,
} from "@/features/onboarding/api/avatar-wire";
import { SESSION_COOKIE } from "@/features/auth/server/session-cookie";
import { api } from "@/lib/http/api";

/**
 * The member picture calls.
 *
 * Under the API's `/auth` prefix like the profile ones, and here for the same
 * reason: the only screen that sends a picture today is an onboarding step.
 */

/*
 * No read here. `GET /users/me` returns the signed picture URLs with the
 * member, so the session already has them - see `services/avatars.ts`. A
 * separate `GET /users/avatars` would be a second round trip for the same
 * answer on every signed-in page.
 */

/**
 * Replace the member's picture.
 *
 * A `PUT`, not a `POST`: the member has one picture and this is it. Sending a
 * second one overwrites the first, so a retry after a timeout is safe.
 *
 * No `requestBody` check on the way out - the body is a file, and its rules
 * (size, type) are the form schema's, already applied before we get here.
 *
 * @throws {ApiError} 400 when the API rejects the file, 401 without a session,
 *   429 when the member has tried too often.
 */
export async function uploadAvatar(
  file: File,
  sessionToken: string,
): Promise<MemberAvatars> {
  const body = new FormData();

  // The field name is the API's; the filename rides along so it can tell a
  // `.heic` from a `.png` when the browser reports no type for either.
  body.append("avatar", file, file.name);

  const { data } = await api(avatarsResponseSchema, "/users/avatars", {
    method: "PUT",
    body,
    headers: { cookie: `${SESSION_COOKIE}=${sessionToken}` },
  });

  return toMemberAvatars(data);
}
