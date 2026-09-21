/**
 * Read a `Set-Cookie` header far enough to re-issue the cookie ourselves.
 *
 * The frontend owns its session cookie: it takes the opaque value the API
 * minted and picks the flags itself. Hence only name, value and expiry get read
 * here. Every other attribute is ours to set, and `Domain` gets dropped on
 * purpose: a `Domain` naming a host the browser isn't talking to makes it throw
 * the cookie away without a word, which looks exactly like a successful signup
 * followed by an anonymous session.
 *
 * No Next imports, so it can be tested as a plain function.
 */

export type ParsedCookie = {
  name: string;
  value: string;
  /** Absolute expiry from `Expires` or `Max-Age`, if the API gave one. */
  expires?: Date;
};

/**
 * @param header a single `Set-Cookie` header value
 * @param now injected so a relative `Max-Age` is testable
 */
export function parseSetCookie(
  header: string,
  now: Date = new Date(),
): ParsedCookie | null {
  const [pair, ...attributes] = header.split(";");
  if (!pair) return null;

  const separator = pair.indexOf("=");
  if (separator < 1) return null;

  const name = pair.slice(0, separator).trim();
  const value = pair.slice(separator + 1).trim();
  if (!name) return null;

  let expires: Date | undefined;

  for (const attribute of attributes) {
    const at = attribute.indexOf("=");
    if (at < 0) continue;

    const key = attribute.slice(0, at).trim().toLowerCase();
    const raw = attribute.slice(at + 1).trim();

    // Per the RFC, `Max-Age` beats `Expires` when both are present.
    if (key === "max-age") {
      const seconds = Number(raw);
      if (Number.isFinite(seconds)) return { name, value, expires: new Date(now.getTime() + seconds * 1000) };
    }

    if (key === "expires") {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) expires = parsed;
    }
  }

  return expires ? { name, value, expires } : { name, value };
}
