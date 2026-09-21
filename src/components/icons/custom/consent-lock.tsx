import type { SVGProps } from "react";

/**
 * Closed padlock with a knocked-out keyhole, for the consent badge.
 *
 * Custom rather than lucide's single-stroke `Lock`, because the solid body with
 * a punched keyhole is the brand's shape and lucide has no two-tone version.
 *
 * The body follows `currentColor`, so pick the colour with a text utility at
 * the call site. The keyhole is knocked out with `--lock-gap`, defaulting to
 * the card surface; override it if the badge sits on some other fill.
 */
export function ConsentLock(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        fill="currentColor"
        d="M6.5 10.5h11c.83 0 1.5.67 1.5 1.5v6.5c0 .83-.67 1.5-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5V12c0-.83.67-1.5 1.5-1.5Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        d="M8.25 10.5V8a3.75 3.75 0 0 1 7.5 0v2.5"
      />
      <circle
        cx="12"
        cy="15.2"
        r="1.35"
        fill="var(--lock-gap, var(--color-surface))"
      />
    </svg>
  );
}
