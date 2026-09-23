"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isLocale, type Locale } from "@/config/locales";
import { readSessionToken } from "@/features/auth/server/session-cookie";
import {
  addClubAddress,
  getClub,
  makeClubAddressPrimary,
  updateClub,
  updateClubAddress,
  uploadClubAvatar,
} from "@/features/club/api/club-endpoints";
import {
  clubPatchSchema,
  toAddressPatch,
  toClubDetails,
  toLanguageRanks,
  toNewClubAddress,
  type ClubPatch,
} from "@/features/club/api/club-wire";
import { clubFailure } from "@/features/club/services/club-errors";
import type {
  ClubDetailsChange,
  SaveClubPayload,
  SaveClubState,
} from "@/features/club/services/state";
import type { ClubDetails } from "@/features/club/types";
import { createPhotoSchema } from "@/features/onboarding/schemas";
import { dayMonthYearToIso } from "@/lib/date";

/**
 * The ids in the payload, and only those.
 *
 * A whole-payload schema would have to restate `ClubDetailsChange` and every
 * address field, which are already checked further down by `clubPatchSchema`
 * and `toNewClubAddress`. This is the gap those leave: the numbers that become
 * part of a URL rather than part of a body.
 */
const clubIdSchema = z.number().int().positive();

const payloadIdsSchema = z.object({
  clubId: clubIdSchema,
  addresses: z.array(z.object({ addressId: clubIdSchema.nullable() })),
});

/**
 * Everything the club card's Save bar commits, in one go.
 *
 * The card has one Save for the details and the addresses alike, so this
 * does all of it, in an order that can't leave a half-made club behind:
 *
 * 1. the details, and the logo that goes with them;
 * 2. each new or changed address, one at a time;
 * 3. the primary address, if a different one was picked.
 *
 * It stops at the first refusal. Whatever went through before that stays
 * through - there's no undo for a stored address - so the answer always
 * carries the club as the API now holds it, and which address drafts were
 * stored, so the card can drop exactly those and keep the rest for another go.
 *
 * The admin check is the API's; it answers 403 for a club the member doesn't
 * run.
 */
export async function saveClubAction(
  payload: SaveClubPayload,
): Promise<SaveClubState> {
  const { locale } = payload;
  if (!isLocale(locale)) return { formError: "Unsupported locale", saved: {} };

  /*
   * The ids, re-checked.
   *
   * `SaveClubPayload` types them `number`, but a Server Action is a public
   * endpoint: its arguments are whatever the caller sent, and the types are
   * erased by the time this runs. They end up interpolated into the upstream
   * URL, so a string carrying `../` would steer an authenticated call at
   * another endpoint. Everything else in the payload already goes through a
   * schema on its way out; these were the one thing that didn't.
   *
   * Unreachable through the UI, so it's logged rather than explained - nobody
   * sending this is reading the message.
   */
  if (!payloadIdsSchema.safeParse(payload).success) {
    console.error("[save-club] payload carried an id that isn't one");
    const tErrors = await getTranslations({ locale, namespace: "errors" });

    return { formError: tErrors("unexpected"), saved: {} };
  }

  const token = await readSessionToken();
  if (!token) redirect(`/${locale}/login`);

  /** Draft key → the id the API gave the address. */
  const saved: Record<string, string> = {};
  let formError: string | undefined;

  if (payload.details) {
    formError = await saveDetails(payload.clubId, payload.details, locale, token);
  }

  if (!formError) {
    for (const draft of payload.addresses) {
      try {
        const stored =
          draft.addressId === null
            ? await addClubAddress(
                payload.clubId,
                {
                  ...toNewClubAddress(withEveryField(draft.values)),
                  primary: draft.key === payload.primaryKey,
                },
                token,
              )
            : // Only the fields that were changed; the rest stay as stored.
              await updateClubAddress(
                payload.clubId,
                draft.addressId,
                toAddressPatch(draft.values),
                token,
              );

        saved[draft.key] = String(stored.id);
      } catch (error) {
        formError = await clubFailure(error, locale, "save-club-address");
        break;
      }
    }
  }

  if (!formError && payload.primaryKey !== null) {
    // A new address sent with `primary: true` already holds the role.
    const addedAsPrimary = payload.addresses.some(
      (draft) => draft.key === payload.primaryKey && draft.addressId === null,
    );
    const addressId = Number(saved[payload.primaryKey] ?? payload.primaryKey);

    if (!addedAsPrimary && Number.isInteger(addressId)) {
      try {
        await makeClubAddressPrimary(payload.clubId, addressId, token);
      } catch (error) {
        formError = await clubFailure(error, locale, "make-address-primary");
      }
    }
  }

  // Both screens read the club: its record, and its addresses as parent addresses.
  revalidatePath(`/${locale}/admin/club`);
  revalidatePath(`/${locale}/admin/location`);

  // The club as it now stands, whatever happened above - the card shows that,
  // not what it hoped to send.
  let club: ClubDetails | undefined;

  try {
    club = toClubDetails(await getClub(payload.clubId, token));
  } catch (error) {
    const reason = await clubFailure(error, locale, "reload-club");
    formError ??= reason;
  }

  return { club, formError, saved };
}

/**
 * A new address's values with every field present. The card sends them all
 * for a new row; this only makes a missing one an empty string, which the
 * API's schema then refuses with a clear log rather than a crash.
 */
function withEveryField(values: SaveClubPayload["addresses"][number]["values"]) {
  return {
    name: values.name ?? "",
    shortName: values.shortName ?? "",
    streetName: values.streetName ?? "",
    streetNumber: values.streetNumber ?? "",
    zip: values.zip ?? "",
    city: values.city ?? "",
    region: values.region ?? "",
    directions: values.directions ?? "",
  };
}

/**
 * The details half: `PATCH /clubs/{id}` with only the fields given, then the
 * logo if one was picked.
 *
 * A field pencil sends one field, so this sends one field - the rest of the
 * club isn't touched, and can't be overwritten with a stale copy. With only a
 * logo to save there's no PATCH at all.
 *
 * @returns why it didn't go through, or nothing when it did. A logo that fails
 *   after the details saved is reported on its own, so the admin knows the rest
 *   is stored.
 */
async function saveDetails(
  clubId: number,
  details: ClubDetailsChange,
  locale: Locale,
  token: string,
): Promise<string | undefined> {
  const tErrors = await getTranslations({ locale, namespace: "errors" });
  const tValidation = await getTranslations({ locale, namespace: "validation" });

  /** The card only lets Save through when these hold, so a miss is ours. */
  const ours = (reason: string) => {
    console.error(`[save-club] card values did not make a valid request: ${reason}`);
    return tErrors("unexpected");
  };

  const patch: ClubPatch = {};

  if (details.name !== undefined) patch.name = details.name.trim();
  if (details.shortName !== undefined) patch.shortName = details.shortName.trim();
  if (details.active !== undefined) patch.active = details.active;

  if (details.activityIds !== undefined) {
    patch.activityIds = [...new Set(details.activityIds)];
  }

  if (details.establishedDate !== undefined) {
    const iso = dayMonthYearToIso(details.establishedDate);
    if (!iso) return ours("established date");
    patch.establishedDate = iso;
  }

  if (details.languages !== undefined) {
    const { primaryLanguageId, secondaryLanguageId } = details.languages;
    if (primaryLanguageId === null) return ours("primary language");
    patch.languages = toLanguageRanks(primaryLanguageId, secondaryLanguageId);
  }

  const parsed = clubPatchSchema.safeParse(patch);
  if (!parsed.success) return ours(parsed.error.message);

  let avatar: File | null = null;

  if (details.avatar && details.avatar.size > 0) {
    const photo = createPhotoSchema(tValidation).safeParse(details.avatar);

    if (!photo.success) {
      return photo.error.issues[0]?.message ?? tErrors("unexpected");
    }

    avatar = photo.data;
  }

  if (Object.keys(parsed.data).length > 0) {
    try {
      await updateClub(clubId, parsed.data, token);
    } catch (error) {
      return clubFailure(error, locale, "save-club");
    }
  }

  if (!avatar) return undefined;

  try {
    await uploadClubAvatar(clubId, avatar, token);
    return undefined;
  } catch (error) {
    await clubFailure(error, locale, "save-club-avatar");
    return tErrors("logoFailed");
  }
}
