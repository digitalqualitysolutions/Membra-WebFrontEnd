import type { SessionUser } from "@/features/auth/api/auth-wire";

/**
 * What to call a member to their face.
 *
 * Nickname first, deliberately: onboarding asks for it as "what your club calls
 * you", so it beats the name on the registration form for a greeting. Falls all
 * the way back to the part of the email in front of the `@`, which is a poor
 * name but better than a blank where a name should be - a member who has only
 * just signed up has filled in nothing else.
 */
export function greetingNameOf(user: SessionUser): string {
  const nickname = user.nickname?.trim();
  if (nickname) return nickname;

  const firstName = user.firstName?.trim();
  if (firstName) return firstName;

  return user.email.split("@")[0];
}
