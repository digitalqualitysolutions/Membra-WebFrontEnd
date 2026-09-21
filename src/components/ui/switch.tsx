"use client"

import { cn } from "cn"

/**
 * An on/off control.
 *
 * Hand-rolled rather than wrapped around Radix: it carries no open state, no
 * portal and no focus management, so the primitive would only add a dependency
 * to own a `<button role="switch">`.
 *
 * `success` is the green a table of many rows uses, where a column of them
 * reads as data; `ink` is the navy one a single setting takes, where it reads
 * as a switch you are about to throw.
 */
function Switch({
  checked,
  disabled = false,
  onChange,
  label,
  tone = "ink",
  size = "md",
}: {
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
  label: string
  tone?: "ink" | "success"
  size?: "sm" | "md"
}) {
  const small = size === "sm"

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        small ? "h-5 w-9" : "h-6 w-11",
        checked ? (tone === "success" ? "bg-success" : "bg-ink") : "bg-track",
        disabled ? "opacity-70" : "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "rounded-full bg-surface shadow-btn transition-transform",
          small ? "size-4" : "size-5",
          checked && (small ? "translate-x-4" : "translate-x-5"),
        )}
      />
    </button>
  )
}

export { Switch }
