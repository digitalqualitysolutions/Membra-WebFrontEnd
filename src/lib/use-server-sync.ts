"use client";

import { useState } from "react";

/**
 * Take server data again whenever the server sends a new copy.
 *
 * A card seeds its state from a prop, so a re-render after `router.refresh()`
 * arrives with fresh data the state never reads. This spots the new prop and
 * hands it over, during render rather than in an effect so nothing paints
 * stale first.
 *
 * `hold` is the card's own "someone is part-way through typing" flag. While
 * it's true the fresh copy waits, and is taken on the first render after the
 * edit closes - a draft is never overwritten by a background refresh.
 */
export function useServerSync<T>(
  saved: T,
  hold: boolean,
  take: (fresh: T) => void,
) {
  const [seen, setSeen] = useState(saved);

  if (saved !== seen && !hold) {
    setSeen(saved);
    take(saved);
  }
}
