import { z } from "zod";

/**
 * Wire format for the member's picture.
 *
 * An upload answers with signed URLs for the three square AVIF variants the
 * server renders from it, cover-cropped: 384, 96 and 32 pixels. The API names
 * them `avatar1`, `avatar2`, `avatar3`; nothing past this file should have to
 * remember which number is which size. Club logos use the same three.
 *
 * The URLs are opaque - use them as given, never build or take one apart.
 */

/**
 * Deliberately lenient.
 *
 * By the time this parses, the picture is already stored - the upload
 * succeeded. Failing the whole action because one URL came back null, or
 * because the API grew a fourth variant, would show the member an error for
 * work that went through. A missing URL is a gap in what we can display, not a
 * failed upload.
 */
export const avatarsResponseSchema = z.object({
  avatar1: z.string().nullish(),
  avatar2: z.string().nullish(),
  avatar3: z.string().nullish(),
});

/**
 * The three variants, named by size.
 *
 * Pick by the size the picture is *drawn* at, doubled for high-density
 * screens: a 36px badge wants `medium`, a 72px profile picture wants `large`.
 */
export type MemberAvatars = {
  /** 384 × 384: profile pictures and anywhere the picture is the subject. */
  large: string | null;
  /** 96 × 96: header badges, club logos, anything up to about 48px. */
  medium: string | null;
  /** 32 × 32: tiny marks only - too soft for a badge on a sharp screen. */
  small: string | null;
};

export function toMemberAvatars(
  response: z.infer<typeof avatarsResponseSchema>,
): MemberAvatars {
  return {
    large: response.avatar1 ?? null,
    medium: response.avatar2 ?? null,
    small: response.avatar3 ?? null,
  };
}
