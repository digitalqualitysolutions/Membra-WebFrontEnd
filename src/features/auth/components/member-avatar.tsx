"use client";

import { useCallback, useState } from "react";

import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/features/auth/api/auth-wire";

/**
 * The member, as a round badge.
 *
 * Three layers, not three branches. The initials (or the placeholder) are
 * always rendered, and the picture sits on top of them - so the circle is never
 * empty while a photo is on its way, and a photo that never arrives leaves what
 * was already underneath it rather than a gap that fills in late.
 * `photoUrl` is a prop rather than something read here - `GET /auth/avatars`
 * needs the session cookie, which never leaves the server, so a page fetches it
 * through `memberAvatars()` and passes the URL down.
 *
 * A client component for one reason: a signed URL can be handed over and still
 * fail to load. They expire after an hour, and the object behind one can go
 * missing. That's only knowable in the browser, so the fallback to initials has
 * to happen there too.
 */
export function MemberAvatar({
  user,
  photoUrl = null,
  className,
}: {
  user: Pick<SessionUser, "firstName" | "lastName" | "nickname" | "email">;
  photoUrl?: string | null;
  className?: string;
}) {
  const initials = initialsOf(user);

  /*
   * The URL that failed, rather than a boolean. A new picture is a new URL, so
   * this clears itself: no effect to reset the flag, and no window where a
   * fresh upload is hidden because the one before it was broken.
   */
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);

  const showPhoto = photoUrl !== null && photoUrl !== brokenUrl;

  /*
   * `onError` alone isn't enough, and this is the case it misses.
   *
   * The server renders this `img` into the HTML, so the browser starts loading
   * it straight away - usually finishing, or failing, before React has hydrated
   * the page. React doesn't replay events from before hydration, so a failure
   * in that window never reaches `onError` and the broken glyph just sits
   * there. By the time a ref callback runs, an image that finished loading
   * reports `complete`, and one that failed reports zero width with it.
   *
   * Keyed on `photoUrl` so a new picture gets its own check rather than
   * inheriting the last one's verdict.
   */
  const checkAlreadyFailed = useCallback(
    (node: HTMLImageElement | null) => {
      if (node?.complete && node.naturalWidth === 0) setBrokenUrl(photoUrl);
    },
    [photoUrl],
  );

  return (
    <span
      // Decorative. Whatever opens this avatar carries the accessible name, and
      // a member's own initials read as noise to a screen reader.
      aria-hidden
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-badge text-[12px] font-semibold tracking-wide text-ink select-none",
        className
      )}
    >
      {/* The floor. Whatever happens above it, the circle reads as this member. */}
      {initials || <Icon name="account" size="sm" className="text-ink-muted" />}

      {showPhoto ? (
        /*
         * Plain `img`: the host is the API's to choose, and `next/image` wants
         * it declared in `next.config` before it will load one. Nothing to
         * optimise anyway - these arrive as AVIF, already cut to size.
         *
         * Absolute, so it covers the initials rather than replacing them. An
         * image that hasn't loaded paints nothing, which is what lets the
         * letters show through until the picture is actually there.
         */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={checkAlreadyFailed}
          src={photoUrl}
          alt=""
          onError={() => setBrokenUrl(photoUrl)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
    </span>
  )
}

/**
 * One or two letters from whatever the member has actually filled in.
 *
 * Empty when there's nothing but an email address: an initial taken from an
 * address is as often the mail provider's as the member's, and a wrong letter
 * looks more broken than no letter.
 */
function initialsOf(
  user: Pick<SessionUser, "firstName" | "lastName" | "nickname">,
): string {
  const first = user.firstName?.trim();
  const last = user.lastName?.trim();

  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();

  const single = first ?? last ?? user.nickname?.trim();

  return single ? single.slice(0, 2).toUpperCase() : "";
}
