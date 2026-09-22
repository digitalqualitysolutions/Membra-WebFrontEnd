"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isLocale } from "@/config/locales";
import { readSessionToken } from "@/features/auth/server/session-cookie";
import { createLocation } from "@/features/club/api/location-endpoints";
import {
  createLocationRequestSchema,
  toCreateLocationRequest,
  type LocationResponse,
} from "@/features/club/api/location-wire";
import { clubFailure } from "@/features/club/services/club-errors";
import type {
  CreateLocationPayload,
  CreateLocationState,
} from "@/features/club/services/location-state";

/**
 * The ids in the payload, and only those.
 *
 * `CreateLocationPayload` types them `number`, but a Server Action is a public
 * endpoint: its arguments are whatever the caller sent, and the types are gone
 * by the time this runs. `clubId` is interpolated into the upstream URL, so a
 * string carrying `../` would steer an authenticated call - session cookie
 * attached - at another endpoint. The other two end up in the body, where the
 * API would refuse them anyway, but they're checked here so a bad one reads as
 * our bug in a log rather than as a 400 the admin can't act on.
 *
 * Everything else in the payload goes through `createLocationRequestSchema` on
 * its way out; these are what that leaves.
 */
const locationIdSchema = z.number().int().positive();

const payloadIdsSchema = z.object({
  clubId: locationIdSchema,
  values: z.object({
    parentLocationId: locationIdSchema.nullable(),
    clubAddressId: locationIdSchema.nullable(),
  }),
});

/**
 * Add one location to the club.
 *
 * A hall sits at the top (`parentLocationId: null`); a zone or a court names
 * the location above it. The API composes the dotted `shownName` from that
 * chain, so the answer carries the code rather than the caller predicting it.
 *
 * The admin check is the API's: it answers 403 for a club the member doesn't
 * run. Nothing is retried - a create that got through but answered late would
 * make the location twice.
 */
export async function createLocationAction(
  payload: CreateLocationPayload,
): Promise<CreateLocationState> {
  const { locale } = payload;
  if (!isLocale(locale)) return { formError: "Unsupported locale" };

  /* Unreachable through the UI, so it's logged rather than explained - nobody
     sending this is reading the message. */
  if (!payloadIdsSchema.safeParse(payload).success) {
    console.error("[create-location] payload carried an id that isn't one");
    const tErrors = await getTranslations({ locale, namespace: "errors" });

    return { formError: tErrors("unexpected") };
  }

  const token = await readSessionToken();
  if (!token) redirect(`/${locale}/login`);

  const request = createLocationRequestSchema.safeParse(
    toCreateLocationRequest(payload.values),
  );

  /* The card only lets Save through when these hold, so a miss is ours: the
     form's schema and the API's have drifted, and that's not the admin's to
     fix or understand. */
  if (!request.success) {
    console.error(
      `[create-location] card values did not make a valid request: ${request.error.message}`,
    );
    const tErrors = await getTranslations({ locale, namespace: "errors" });

    return { formError: tErrors("unexpected") };
  }

  let stored: LocationResponse;

  try {
    stored = await createLocation(payload.clubId, request.data, token);
  } catch (error) {
    return { formError: await clubFailure(error, locale, "create-location") };
  }

  // Both screens list locations: the club card's table, and the location page.
  revalidatePath(`/${locale}/admin/club`);
  revalidatePath(`/${locale}/admin/location`);

  return {
    location: {
      id: stored.id,
      name: stored.name,
      short: stored.shortName,
      show: stored.shownName,
    },
  };
}
