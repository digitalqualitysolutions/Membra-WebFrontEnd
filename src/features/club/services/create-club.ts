"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isLocale } from "@/config/locales";
import { readSessionToken } from "@/features/auth/server/session-cookie";
import { createClub } from "@/features/club/api/club-endpoints";
import {
  createClubRequestSchema,
  toClubDetails,
  toCreateClubForm,
  toLanguageRanks,
  toNewClubAddress,
  type CreateClubRequest,
} from "@/features/club/api/club-wire";
import { clubFailure } from "@/features/club/services/club-errors";
import type {
  CreateClubPayload,
  CreateClubState,
} from "@/features/club/services/state";
import { createPhotoSchema } from "@/features/onboarding/schemas";
import { dayMonthYearToIso } from "@/lib/date";

/**
 * Create the admin's club.
 *
 * The form checked everything already. It's checked again here, for the same
 * reason every action re-validates: anything reaching a Server Action came over
 * the network, whatever the UI did on the way. A failure at that point is
 * ours, not the admin's - their values already passed the form - so it's
 * logged and shown as a general error.
 */
export async function createClubAction(
  _previous: CreateClubState,
  payload: CreateClubPayload,
): Promise<CreateClubState> {
  const { locale } = payload;
  if (!isLocale(locale)) return { formError: "Unsupported locale" };

  const tValidation = await getTranslations({ locale, namespace: "validation" });
  const tErrors = await getTranslations({ locale, namespace: "errors" });

  const token = await readSessionToken();
  if (!token) redirect(`/${locale}/login`);

  const request = toRequest(payload);
  const parsed = createClubRequestSchema.safeParse(request);

  if (!request || !parsed.success) {
    console.error(
      "[create-club] form values did not make a valid request",
      parsed.error?.message ?? "missing date or primary language",
    );
    return { formError: tErrors("unexpected") };
  }

  let avatar: File | null = null;

  if (payload.avatar && payload.avatar.size > 0) {
    const photo = createPhotoSchema(tValidation).safeParse(payload.avatar);

    // Unlike the rest, this one is the admin's to fix, so say what's wrong.
    if (!photo.success) {
      return { formError: photo.error.issues[0]?.message ?? tErrors("unexpected") };
    }

    avatar = photo.data;
  }

  try {
    const club = await createClub(toCreateClubForm(parsed.data, avatar), token);

    // Both screens read the club: its record here, its addresses for the
    // locations form's "parent address".
    revalidatePath(`/${locale}/admin/club`);
    revalidatePath(`/${locale}/admin/location`);

    return { club: toClubDetails(club) };
  } catch (error) {
    // The same ladder every club call answers a failure with; a 400 here names
    // the fields the API refused rather than just "Validation failed".
    return {
      formError: await clubFailure(error, locale, "create-club", "clubRejected"),
    };
  }
}

/**
 * The form's values as the API's request, or `null` if a value the form was
 * meant to guarantee is missing.
 */
function toRequest(payload: CreateClubPayload): CreateClubRequest | null {
  const establishedDate = dayMonthYearToIso(payload.establishedDate);
  if (!establishedDate) return null;

  return {
    name: payload.name.trim(),
    shortName: payload.shortName.trim(),
    establishedDate,
    // De-duplicated: the picker can't produce a repeat, but the network can.
    activityIds: [...new Set(payload.activityIds)],
    languages: toLanguageRanks(payload.languageIds),
    // In the order the admin entered them: the API makes the first primary.
    addresses: payload.addresses.map(toNewClubAddress),
  };
}
