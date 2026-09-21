/**
 * Throwaway-mailbox domains we turn away at signup.
 *
 * A mirror, not the boundary. Anything can post straight to the API, so the
 * authoritative list belongs upstream; this copy exists so someone pasting a
 * ten-minute address finds out under the field instead of after the round trip.
 * That also means it can stay small and hand-kept: the well-known services,
 * not an exhaustive index that would go stale in the repo.
 */
const disposableEmailDomains: ReadonlySet<string> = new Set([
  "10minutemail.com",
  "20minutemail.com",
  "33mail.com",
  "burnermail.io",
  "dispostable.com",
  "discard.email",
  "e4ward.com",
  "emailondeck.com",
  "fakeinbox.com",
  "getairmail.com",
  "getnada.com",
  "grr.la",
  "guerrillamail.biz",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.net",
  "guerrillamail.org",
  "harakirimail.com",
  "inboxkitten.com",
  "incognitomail.com",
  "jetable.org",
  "linshiyouxiang.net",
  "luxusmail.org",
  "mail.tm",
  "mail7.io",
  "mailcatch.com",
  "maildrop.cc",
  "mailexpire.com",
  "mailinator.com",
  "mailnesia.com",
  "mailsac.com",
  "mailslurp.com",
  "minuteinbox.com",
  "moakt.com",
  "mohmal.com",
  "mytemp.email",
  "mytrashmail.com",
  "nada.email",
  "sharklasers.com",
  "spam4.me",
  "spambog.com",
  "spamgourmet.com",
  "temp-mail.io",
  "temp-mail.org",
  "tempinbox.com",
  "tempmail.com",
  "tempmail.plus",
  "tempmailo.com",
  "tempr.email",
  "throwawaymail.com",
  "tmail.ws",
  "trashmail.com",
  "trashmail.de",
  "wegwerfmail.de",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
]);

/**
 * Is this address handed out by a throwaway-mailbox service?
 *
 * Takes anything a text input can hold, so it can run on a value the format
 * check has already rejected without throwing. No `@`, no verdict.
 *
 * Parent domains count. These services hand out subdomains freely, and
 * `pick@inbox.yopmail.com` is the same mailbox as `pick@yopmail.com`.
 */
export function isDisposableEmailAddress(email: string): boolean {
  const domain = email.slice(email.lastIndexOf("@") + 1).trim().toLowerCase();

  if (!email.includes("@") || domain.length === 0) return false;

  // Walk up from the full host: `inbox.yopmail.com`, then `yopmail.com`, then
  // `com`. Stops one label short of a bare TLD, which is never on the list and
  // would sweep up every address under it if it were.
  const labels = domain.split(".");

  for (let index = 0; index <= labels.length - 2; index += 1) {
    if (disposableEmailDomains.has(labels.slice(index).join("."))) return true;
  }

  return false;
}
