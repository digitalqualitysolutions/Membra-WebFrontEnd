"use client"

import * as React from "react"
import { cn } from "cn"
import { Slider as SliderPrimitive } from "radix-ui"

/**
 * A value along a range.
 *
 * Single-thumb only, which is all anything here needs: `value` and `onChange`
 * are plain numbers rather than Radix's arrays, so a caller doesn't have to
 * unwrap a one-element list at every use. Reach for the primitive directly if a
 * two-thumb range ever turns up.
 */
function Slider({
  className,
  value,
  onChange,
  label,
  ...props
}: Omit<
  React.ComponentProps<typeof SliderPrimitive.Root>,
  // `onChange` goes too: the root spreads div props, so leaving it would
  // collide with the DOM handler and widen ours to a change event.
  "value" | "onValueChange" | "defaultValue" | "onChange"
> & {
  value: number
  onChange: (value: number) => void
  /** What the thumb is called, since there's no visible label beside it. */
  label: string
}) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      value={[value]}
      onValueChange={([next]) => onChange(next ?? value)}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-60",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-1 w-full grow overflow-hidden rounded-full bg-track"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full bg-ink"
        />
      </SliderPrimitive.Track>

      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        aria-label={label}
        className="block size-4 shrink-0 rounded-full border border-line-strong bg-surface shadow-btn transition-[color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none"
      />
    </SliderPrimitive.Root>
  )
}

export { Slider }
