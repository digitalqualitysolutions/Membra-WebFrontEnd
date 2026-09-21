import type { SVGProps } from "react";

/**
 * A pair of members with a camera, for the member-picture card.
 *
 * Custom for the same reason as the brand mark: lucide has people or a camera,
 * never both in one glyph, and the medallion needs both to read as "a picture
 * of a member".
 *
 * Drawn in `currentColor` following lucide's stroke conventions so it doesn't
 * look heavier or lighter than the lucide icons next to it. Size and stroke
 * width still come from the `Icon` wrapper.
 */
export function MemberPhoto(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Front member */}
      <circle cx="8.5" cy="7.5" r="3.5" />
      <path d="M2 20a6.5 6.5 0 0 1 13 0" />

      {/* Member behind, cropped by the camera */}
      <path d="M15 4.6a3.5 3.5 0 0 1 0 6.8" />

      {/* Camera */}
      <path d="M15.5 14h1l1-1.5h2.5l1 1.5h1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z" />
      <circle cx="19" cy="17" r="1.75" />
    </svg>
  );
}
