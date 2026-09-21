import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A labelled slot in a club form, marked when the club can't do without it.
 *
 * Shared by the setup card and the club card's editors, so a required field
 * looks the same wherever it's asked for.
 */
export function FormField({
  label,
  required = false,
  requiredLabel,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  /** The word read out after a required label: "required". */
  requiredLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <span className="text-[13px] font-medium text-ink">
        {label}
        {required ? (
          <>
            <span aria-hidden className="ml-0.5 text-danger">
              *
            </span>
            {/* The asterisk is a picture of "required"; this is the word. */}
            <span className="sr-only"> ({requiredLabel})</span>
          </>
        ) : null}
      </span>

      <div className="mt-2">{children}</div>
    </div>
  );
}

/**
 * A control with its slot named beside it, in the italic the record uses when
 * it reads a language back: "Danish *Primary*". The tag has a fixed width so
 * both controls in a pair end at the same edge.
 */
export function Tagged({ tag, children }: { tag: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">{children}</div>
      <span className="w-18 shrink-0 text-[12px] text-body italic">{tag}</span>
    </div>
  );
}
