/**
 * Programmatic access to the brand palette declared in `src/styles/palette.css`.
 *
 * These are CSS variable references, not hex literals, so the stylesheet stays
 * the source of truth and anything painted through them follows the active
 * theme. Use them when a colour has to be picked in TypeScript: inline `style`,
 * an SVG `fill`, a chart series. If a class can express it, use a semantic
 * utility instead (`bg-surface`, `text-muted`).
 */
export const brandColors = {
  blue1: "var(--color-brand-blue-1)",
  blue2: "var(--color-brand-blue-2)",
  blue101: "var(--color-brand-blue-101)",
  brown1: "var(--color-brand-brown-1)",
  brown2: "var(--color-brand-brown-2)",
  green1: "var(--color-brand-green-1)",
  green2: "var(--color-brand-green-2)",
  green101: "var(--color-brand-green-101)",
  grey1: "var(--color-brand-grey-1)",
  grey2: "var(--color-brand-grey-2)",
  grey102: "var(--color-brand-grey-102)",
  magenta1: "var(--color-brand-magenta-1)",
  magenta2: "var(--color-brand-magenta-2)",
  orange: "var(--color-brand-orange)",
  pink1: "var(--color-brand-pink-1)",
  pink2: "var(--color-brand-pink-2)",
  purple1: "var(--color-brand-purple-1)",
  purple2: "var(--color-brand-purple-2)",
  purple3: "var(--color-brand-purple-3)",
  purple4: "var(--color-brand-purple-4)",
  red: "var(--color-brand-red)",
  turquoise: "var(--color-brand-turquoise)",
  yellow1: "var(--color-brand-yellow-1)",
  yellow2: "var(--color-brand-yellow-2)",
  black: "var(--color-brand-black)",
  white: "var(--color-brand-white)",
} as const;

export type BrandColor = keyof typeof brandColors;

/**
 * Rotation for colours assigned to arbitrary data: member avatars, category
 * tags, chart series. Ordered so neighbours stay distinguishable, and limited
 * to hues that carry text at the sizes we render at.
 */
export const accentSequence = [
  "blue2",
  "green2",
  "purple3",
  "orange",
  "turquoise",
  "pink2",
  "brown2",
  "magenta2",
  "yellow2",
  "red",
] as const satisfies readonly BrandColor[];
