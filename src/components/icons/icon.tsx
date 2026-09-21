import type { SVGProps } from "react";

import { icons, type IconName } from "@/components/icons/registry";
import { cn } from "@/lib/utils";

/**
 * The size scale. Call sites pick a step rather than a raw pixel value, which
 * is how icons stay consistent with each other.
 *
 * If a size needs to flex with the viewport, pass a `size-*` class instead. CSS
 * beats the width/height attributes, and the step still gives the intrinsic
 * size before styles land.
 */
export const iconSizes = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 26,
} as const;

export type IconSize = keyof typeof iconSizes;

export type IconProps = Omit<SVGProps<SVGSVGElement>, "width" | "height"> & {
  name: IconName;
  size?: IconSize;
  /**
   * Accessible name. Leave it off for decorative icons; those get hidden from
   * assistive tech, which is what you want when nearby text or an `aria-label`
   * on the parent control already says it.
   */
  label?: string;
};

/**
 * Renders a registered icon. Size, stroke weight and accessibility get decided
 * here once so no call site has to repeat them.
 */
export function Icon({
  name,
  size = "md",
  label,
  className,
  ...props
}: IconProps) {
  const Glyph = icons[name]; // Pick the icon based on the name from registry
  const px = iconSizes[size];

  return (
    <Glyph
      width={px}
      height={px}
      strokeWidth={1.6}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}
