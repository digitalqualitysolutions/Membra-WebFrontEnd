import type { SVGProps } from "react";

/**
 * Membra mark: a group of people behind a calendar, inside a ring.
 *
 * Figures and calendar are drawn in `currentColor`. The gaps between them are
 * knocked out with `--logo-gap`, which every call site has to set to whatever
 * colour the mark sits on (navy tile, light medallion, and so on).
 *
 * Sizing and accessibility belong to the `Icon` wrapper. This file is just the
 * drawing.
 */
export function GroupCalendar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" {...props}>
      <circle
        cx="32"
        cy="32"
        r="29"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
      />

      {/* side figures */}
      <g fill="currentColor">
        <circle cx="18" cy="25" r="5.5" />
        <path d="M8 40a10 10 0 0 1 20 0z" />
        <circle cx="46" cy="25" r="5.5" />
        <path d="M36 40a10 10 0 0 1 20 0z" />
      </g>

      {/* centre figure */}
      <g
        fill="currentColor"
        stroke="var(--logo-gap, var(--color-surface))"
        strokeWidth="2.5"
      >
        <circle cx="32" cy="23" r="7.5" />
        <path d="M19 43a13 13 0 0 1 26 0z" />
      </g>

      {/* calendar */}
      <g stroke="var(--logo-gap, var(--color-surface))" strokeWidth="3">
        <rect x="19" y="37" width="26" height="20" rx="3" fill="currentColor" />
      </g>
      <g fill="var(--logo-gap, var(--color-surface))">
        <rect x="23" y="41.5" width="3" height="3" rx="1" />
        <rect x="30.5" y="41.5" width="3" height="3" rx="1" />
        <rect x="38" y="41.5" width="3" height="3" rx="1" />
        <rect x="23" y="48" width="3" height="3" rx="1" />
        <rect x="30.5" y="48" width="3" height="3" rx="1" />
        <rect x="38" y="48" width="3" height="3" rx="1" />
      </g>
    </svg>
  );
}
