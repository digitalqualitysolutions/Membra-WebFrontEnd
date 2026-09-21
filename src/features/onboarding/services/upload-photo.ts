"use server";

import { getTranslations } from "next-intl/server";
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
 * Send the member's picture up, then on to the portal.
 *
 * Last step of onboarding, so success leaves this flow entirely rather than
 * advancing within it.
 *
 * The picker checked the file already. We check it again, for the same reason
 * the profile action re-validates: anything arriving at a Server Action came
 * over the network, whatever the UI did on the way.
 */
export async function uploadPhotoAction(
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
      console.error("[upload-photo] upstream unreachable", error.cause);
      return { error: tErrors("network") };
    }

    if (ApiError.isApiError(error)) {
      // Session went away between the guard above and this call.
      if (error.status === 401) redirect(`/${locale}/login`);

      // The member's own doing, and worth saying so: waiting fixes it.
      if (error.status === 429) return { error: tErrors("rateLimited") };

      /*
       * 400 means the API turned the file down after our schema passed it -
       * a format it can't decode, say. Not a sentence about our rules, since
       * the file met those; a "try another picture" instead.
       */
      if (error.status === 400) {
        console.warn(`[upload-photo] ${error.code}: ${error.message}`, error.details);
        return { error: tErrors("photoRejected") };
      }

      console.error(`[upload-photo] ${error.code}: ${error.message}`, error.details);
      return { error: tErrors("unexpected") };
    }

    throw error;
  }

  // Onboarding is done. Same destination as skipping, which is the point: the
  // picture was the last thing left to ask for.
  redirect(`/${locale}`);
}
