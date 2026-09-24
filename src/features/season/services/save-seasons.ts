"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isLocale } from "@/config/locales";
import { readSessionToken } from "@/features/auth/server/session-cookie";
import {
  createSeason,
  listSeasons,
  updateSeason,
} from "@/features/club/api/season-endpoints";
import {
  createSeasonRequestSchema,
  toSeasons,
  updateSeasonRequestSchema,
  type UpdateSeasonRequest,
} from "@/features/club/api/season-wire";
import { clubFailure } from "@/features/club/services/club-errors";
import type {
  SaveSeasonsPayload,
  SaveSeasonsState,
  SeasonChange,
} from "@/features/season/services/season-state";
import type { SeasonRow } from "@/features/season/types";

const idSchema = z.number().int().positive();

/**
 * The ids in the payload. A Server Action takes whatever the caller sent, and
 * both of these end up in the upstream URL.
 */
const payloadIdsSchema = z.object({
  clubId: idSchema,
  changes: z.array(z.object({ seasonId: idSchema })),
});

/**
 * Everything one press of the seasons card's Save commits.
 *
 * Creates first, then patches, one at a time, stopping at the first refusal.
 * The API has no delete, so whatever went through stays through - which is
 * exactly why the answer carries the list as the API now holds it rather than
 * leaving the screen to guess. A created season has no id until the API says
 * so, and only a re-read knows it.
 */
export async function saveSeasonsAction(
  payload: SaveSeasonsPayload,
): Promise<SaveSeasonsState> {
  const { locale } = payload;
  if (!isLocale(locale)) return { formError: "Unsupported locale" };

  if (!payloadIdsSchema.safeParse(payload).success) {
    console.error("[save-seasons] payload carried an id that isn't one");
    const tErrors = await getTranslations({ locale, namespace: "errors" });

    return { formError: tErrors("unexpected") };
  }

  const token = await readSessionToken();
  if (!token) redirect(`/${locale}/login`);

  let formError: string | undefined;

  for (const season of payload.created) {
    const body = createSeasonRequestSchema.safeParse(season);

    if (!body.success) {
      console.error(
        `[save-seasons] a new row did not make a valid request: ${body.error.message}`,
      );
      const tErrors = await getTranslations({ locale, namespace: "errors" });
      formError = tErrors("unexpected");
      break;
    }

    try {
      await createSeason(payload.clubId, body.data, token);
    } catch (error) {
      formError = await clubFailure(error, locale, "save-seasons");
      break;
    }
  }

  // Only if every create landed: a refusal part-way through is worth showing
  // before more calls go out on top of it.
  if (formError === undefined) {
    for (const change of payload.changes) {
      const patch = toPatch(change);

      // Nothing but the id: the row was marked changed but nothing moved.
      if (Object.keys(patch).length === 0) continue;

      const body = updateSeasonRequestSchema.safeParse(patch);

      if (!body.success) {
        console.error(
          `[save-seasons] card values did not make a valid request: ${body.error.message}`,
        );
        const tErrors = await getTranslations({ locale, namespace: "errors" });
        formError = tErrors("unexpected");
        break;
      }

      try {
        await updateSeason(payload.clubId, change.seasonId, body.data, token);
      } catch (error) {
        formError = await clubFailure(error, locale, "save-seasons");
        break;
      }
    }
  }

  revalidatePath(`/${locale}/admin/seasons`);

  return { formError, seasons: await reread(payload.clubId, token) };
}

/** The change as the API takes it, dropping the id and anything untouched. */
function toPatch(change: SeasonChange): UpdateSeasonRequest {
  const patch: UpdateSeasonRequest = {};

  if (change.name !== undefined) patch.name = change.name;
  if (change.shortName !== undefined) patch.shortName = change.shortName;
  if (change.seasonStart !== undefined) patch.seasonStart = change.seasonStart;
  if (change.seasonEnd !== undefined) patch.seasonEnd = change.seasonEnd;
  if (change.forTeams !== undefined) patch.forTeams = change.forTeams;
  if (change.forLocations !== undefined) {
    patch.forLocations = change.forLocations;
  }
  if (change.active !== undefined) patch.active = change.active;

  return patch;
}

/**
 * The club's seasons as they now stand. Undefined when the re-read itself
 * failed, which leaves the screen showing what it has rather than emptying it.
 */
async function reread(
  clubId: number,
  token: string,
): Promise<SeasonRow[] | undefined> {
  try {
    return toSeasons(await listSeasons(clubId, token));
  } catch (error) {
    console.error("[save-seasons] could not re-read the seasons", error);

    return undefined;
  }
}
