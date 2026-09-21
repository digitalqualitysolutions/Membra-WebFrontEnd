"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isLocale } from "@/config/locales";
import { readSessionToken } from "@/features/auth/server/session-cookie";
import { uploadAvatar } from "@/features/onboarding/api/avatar-endpoints";
import { createPhotoSchema } from "@/features/onboarding/schemas";
import type {
  PhotoPayload,
  PhotoState,
} from "@/features/onboarding/services/state";
import { ApiError, NetworkError } from "@/lib/http/api-error";

/**
 * Replace the picture on a profile that already has one.
 *
 * Same file, same rules and the same endpoint as onboarding's photo step - the
 * API has one avatar write and it overwrites. What differs is the ending:
 * onboarding was on its way to the portal and leaves, an edit stays on the page
 * and says it saved. That's the same split as `update-profile` beside it.
 *
 * The picker checked the file already. We check it again, because anything
 * arriving at a Server Action came over the network whatever the UI did on the
 * way.
 */
export async function updateAvatarAction(
  _previous: PhotoState,
  payload: PhotoPayload,
): Promise<PhotoState> {
  const { photo, locale } = payload;
  if (!isLocale(locale)) return { error: "Unsupported locale" };

  const tValidation = await getTranslations({ locale, namespace: "validation" });
  const tErrors = await getTranslations({ locale, namespace: "errors" });

  const parsed = createPhotoSchema(tValidation).safeParse(photo);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("unexpected") };
  }

  // A picture belongs to a member. Without a session there's nobody to hang it
  // on, and the API would answer 401 anyway.
  const token = await readSessionToken();
  if (!token) redirect(`/${locale}/login`);

  try {
    await uploadAvatar(parsed.data, token);
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error("[update-avatar] upstream unreachable", error.cause);
      return { error: tErrors("network") };
    }

    if (ApiError.isApiError(error)) {
      // Session went away between the guard above and this call.
      if (error.status === 401) redirect(`/${locale}/login`);

      // The member's own doing, and worth saying so: waiting fixes it.
      if (error.status === 429) return { error: tErrors("rateLimited") };

      /*
       * 400 means the API turned the file down after our schema passed it - a
       * format it can't decode, say. Not a sentence about our rules, since the
       * file met those; a "try another picture" instead.
       */
      if (error.status === 400) {
        console.warn(`[update-avatar] ${error.code}: ${error.message}`, error.details);
        return { error: tErrors("photoRejected") };
      }

      console.error(`[update-avatar] ${error.code}: ${error.message}`, error.details);
      return { error: tErrors("unexpected") };
    }

    throw error;
  }

  /*
   * The badge in the header comes from this same endpoint, and so does the
   * picture on the home page. Drop the cached render of the whole frame, not
   * just this route, so the new picture is what they see when they navigate
   * away instead of the one they just replaced.
   *
   * Only this locale: unlike a language change, a picture doesn't send the
   * member to the other prefix, and the signed URLs expire within the hour
   * anyway.
   */
  revalidatePath(`/${locale}`, "layout");

  return { saved: true };
}
