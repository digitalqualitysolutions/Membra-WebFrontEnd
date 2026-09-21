import { Inter } from "next/font/google";

/**
 * The portal's typeface, and the only place it's chosen.
 *
 * Sits beside `locales.ts` and `colors.ts` for the same reason they do: it's a
 * decision about what the app *is*, not about any one route. It used to live in
 * `[locale]/layout.tsx`, which meant the font was declared inside a file about
 * routing and metadata, and anything rendering outside that layout had to
 * invent its own stack - which is exactly what happened.
 *
 * Two exports, because there are two kinds of consumer:
 *
 * - `inter` is the loader. The locale layout puts its `--font-inter` variable
 *   on `<html>`, and `--font-sans` in `globals.css` reads it. Everything drawn
 *   inside the app gets there through the `font-sans` utility, so no component
 *   ever names a typeface.
 *
 * - `fontStacks` is for the two screens that can't use any of that. `not-found`
 *   and `global-error` render with their own `<html>` and inline styles,
 *   deliberately: a stylesheet that never loaded is one of the ways a visitor
 *   ends up on them, so they can't read a CSS custom property. They can import
 *   a string, though - it's JavaScript, and it ships with the component.
 */

/**
 * What renders before (or instead of) the webfont.
 *
 * Kept in step by hand with `--font-sans` and `--font-mono` in `globals.css`.
 * The duplication is real and unavoidable - CSS can't import a TypeScript
 * constant - so it's spelled once on each side of that boundary and nowhere
 * else. Change one, change the other.
 */
export const fontStacks = {
  sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

/**
 * Latin only, which is all `en` and `da` need. Adding a locale that doesn't
 * fit in it means adding its subset here rather than loading a second family.
 */
export const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
