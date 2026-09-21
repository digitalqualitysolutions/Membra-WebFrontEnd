"use client";

import { useTranslations } from "next-intl";

import { Icon } from "@/components/icons";
import { SIDEBAR_ID, useSidebar } from "@/components/layout/sidebar-state";

/**
 * The control that opens and closes the club's navigation.
 *
 * Its own button, not the brand mark. A logo is where you are, and clicking it
 * anywhere else on the web takes you home — so a logo that instead slid a
 * panel out from the side was answering a question nobody asked. The mark
 * sits at the top of the navigation itself, where it names the thing it
 * belongs to.
 *
 * A narrow screen only. Wide enough for a column, the control on the column's
 * own border does this job — it sits on the line between the navigation and
 * the page, which is the thing being moved. A drawer has no such line, so on
 * a phone the summons stays here in the header.
 *
 * Arrows either way, because they name the movement: `»` while the navigation
 * is away, `«` while it's out.
 */
export function SidebarToggle() {
  const t = useTranslations("nav");
  const { open, openMobile, toggle } = useSidebar();

  const expanded = open || openMobile;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-controls={SIDEBAR_ID}
      aria-expanded={expanded}
      aria-label={expanded ? t("closeMenu") : t("openMenu")}
      className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors outline-none hover:bg-badge hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/40 md:hidden"
    >
      <Icon name={expanded ? "collapse" : "expand"} size="lg" />
    </button>
  );
}
