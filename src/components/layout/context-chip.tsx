"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import { navTrailFor, sectionPath } from "@/config/navigation";

/**
 * Where you are, in the header.
 *
 * Only ever shows one level down. A section on its own is already the title of
 * the page you're looking at, so the chip would be repeating the heading and
 * the lit-up sidebar row back at you; inside a section it's the one place that
 * says which of seventeen you picked. Admin is the only section with children
 * today, which is why today that's the only place it appears - it follows the
 * nav rather than knowing anything about admin.
 *
 * Labels come from the same keys the sidebar renders, so the chip can't end up
 * calling a destination something the link to it doesn't.
 */
export function ContextChip() {
  const t = useTranslations("nav");

  const trail = navTrailFor(sectionPath(usePathname()));

  if (!trail) return null;

  return (
    // Hidden on a narrow screen: the header is down to the mark, the language
    // switcher and a picture there, and this is the piece the sidebar's own
    // highlight already tells you.
    <p className="hidden items-center gap-1.5 rounded-lg border border-line bg-page px-3 py-1.5 text-[12px] md:inline-flex">
      <span className="font-semibold text-ink">{t(trail.section.key)}</span>

      <span aria-hidden className="text-separator">
        /
      </span>

      <span className="font-semibold text-ink">{t(trail.link.key)}</span>
    </p>
  );
}
