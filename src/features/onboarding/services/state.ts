import type { ProfileFormValues } from "@/features/onboarding/types";

/**
 * Shape passed between the profile form and its Server Action.
 *
 * Kept out of the action because a `"use server"` module can only export async
 * functions; a plain initial value gets refused at build time.
 */
export type ProfileState = {
  /** Keyed by field, so a server complaint lands where the user can fix it. */
  fieldErrors?: Partial<Record<keyof ProfileFormValues, string>>;
  /** A failure that doesn't belong to any one field. */
  formError?: string;
  /**
   * Set once a change has been saved. Only the profile page's action reports
   * it: onboarding navigates away on success, so the only states its form ever
   * renders are failures.
   */
  saved?: boolean;
};

export const initialProfileState: ProfileState = {};

/** The client knows the locale; a Server Action has no path to infer it from. */
export type ProfilePayload = ProfileFormValues & { locale: string };

/**
 * Shape passed between the photo picker and its Server Action.
 *
 * One message, not a map of fields: the step has a single input, so there's
 * nowhere else for a complaint to land.
 */
export type PhotoState = {
  /** Why the upload didn't happen, ready to show. Absent while it's fine. */
  error?: string;
  /**
   * Set once a picture has been stored. Only the profile page's action reports
   * it: onboarding leaves for the portal on success, so the only states its
   * picker ever renders are failures.
   */
  saved?: boolean;
};

export const initialPhotoState: PhotoState = {};

/**
 * The picked file, plus the locale the client is on.
 *
 * A `File` survives the trip: React sends Server Action arguments as multipart
 * when one is in there, so the picker hands over the file itself rather than
 * reading it into memory first.
 */
export type PhotoPayload = { photo: File; locale: string };
