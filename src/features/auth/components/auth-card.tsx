import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * How the icon above the title is mounted.
 *
 * `plain` is the brand mark on its own, the way login and signup show it. The
 * other two put a frame around a regular UI icon, which it needs to read as the
 * card's subject instead of a stray glyph.
 */
type Medallion = "plain" | "badge" | "ring";

const medallions: Record<Medallion, string> = {
  plain: "[--logo-gap:var(--color-badge)]",
  badge: "rounded-2xl bg-badge [--logo-gap:var(--color-badge)]",
  ring: "rounded-full border border-line bg-surface [--logo-gap:var(--color-surface)]",
};

type AuthCardProps = {
  title: string;
  /** One-line tagline under the title. */
  subtitle?: string;
  /** A fuller paragraph, for cards whose title needs explaining. */
  description?: string;
  icon?: IconName;
  medallion?: Medallion;
  /**
   * Takes the icon's place at the top of the card, for a card whose subject is
   * a thing rather than a symbol - the profile's picture of the member, say.
   * `icon` and `medallion` are ignored when this is given.
   */
  media?: ReactNode;
  children: ReactNode;
};

export function AuthCard({
  title,
  subtitle,
  description,
  icon = "brand",
  medallion = "plain",
  media,
  children,
}: AuthCardProps) {
  // A framed icon needs breathing room, so the frame grows and the glyph doesn't.
  const framed = medallion !== "plain";

  return (
    <section className="w-full max-w-[574px] rounded-2xl border border-line bg-surface px-6 py-[clamp(0.75rem,2.5vh,2.5rem)] shadow-card sm:px-10">
      <header className="flex flex-col items-center text-center">
        {media ?? (
          <span
            className={cn(
              "inline-flex items-center justify-center text-ink",
              framed
                ? "size-[clamp(2.75rem,7vh,4rem)]"
                : "size-[clamp(2.25rem,5vh,2.75rem)] rounded-full",
              medallions[medallion],
            )}
          >
            <Icon
              name={icon}
              className={
                framed
                  ? "size-[clamp(1.375rem,3.25vh,1.75rem)]"
                  : "size-[clamp(2rem,4.5vh,2.5rem)]"
              }
            />
          </span>
        )}

        <h1 className="mt-[clamp(0.5rem,1.5vh,1.25rem)] text-[19px] leading-tight font-semibold tracking-tight text-ink sm:text-[clamp(1.25rem,3.2vh,1.6875rem)]">
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-1.5 text-[12px] text-subtle sm:text-[13px]">{subtitle}</p>
        ) : null}

        {description ? (
          <p className="mt-[clamp(0.375rem,1.25vh,0.875rem)] max-w-[42ch] text-[13px] leading-relaxed text-ink-muted sm:text-[15px]">
            {description}
          </p>
        ) : null}
      </header>

      <div className="mt-[clamp(0.5rem,2vh,2.25rem)]">{children}</div>
    </section>
  );
}
