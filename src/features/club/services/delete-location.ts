"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isLocale } from "@/config/locales";
import { readSessionToken } from "@/features/auth/server/session-cookie";
import { deleteLocation } from "@/features/club/api/location-endpoints";
import { clubFailure } from "@/features/club/services/club-errors";
import type {
  DeleteLocationPayload,
  DeleteLocationState,
} from "@/features/club/services/location-state";

const idSchema = z.number().int().positive();

/**
 * The ids in the payload. Both end up in the upstream URL, and a Server Action
 * takes whatever the caller sent - the types are gone by the time this runs.
 */
const payloadIdsSchema = z.object({
  clubId: idSchema,
  locationId: idSchema,
});

/**
 * Delete one location, and with it everything underneath.
 *
 * The API hard-deletes the whole branch in a single call and answers with the
 * ids it removed. Those are passed back rather than recomputed: the card draws
 * the rows it was handed, and a descendant it never loaded is gone just the
 * same.
 *
 * Nothing about the confirmation lives here. Whether the admin was warned
 * about children is the card's business; by the time this runs the answer was
 * yes.
 */
export async function deleteLocationAction(
  payload: DeleteLocationPayload,
): Promise<DeleteLocationState> {
  const { locale } = payload;
  if (!isLocale(locale)) return { formError: "Unsupported locale" };

  if (!payloadIdsSchema.safeParse(payload).success) {
    console.error("[delete-location] payload carried an id that isn't one");
    const tErrors = await getTranslations({ locale, namespace: "errors" });

    return { formError: tErrors("unexpected") };
  }

  const token = await readSessionToken();
  if (!token) redirect(`/${locale}/login`);

  let deletedIds: number[];

  try {
    deletedIds = await deleteLocation(payload.clubId, payload.locationId, token);
  } catch (error) {
    return { formError: await clubFailure(error, locale, "delete-location") };
  }

  // Both screens list locations, and the club page also parents new ones.
  revalidatePath(`/${locale}/admin/club`);
  revalidatePath(`/${locale}/admin/location`);

  return { deletedIds: deletedIds.map(String) };
}
