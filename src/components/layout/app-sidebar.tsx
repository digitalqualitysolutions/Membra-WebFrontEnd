"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Fragment, useState } from "react";
import type { ReactNode } from "react";

import { Icon, type IconName } from "@/components/icons";
import { Logo, LogoTile } from "@/components/layout/logo";
import { SIDEBAR_ID, useSidebar } from "@/components/layout/sidebar-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Locale } from "@/config/locales";
import { isNavActive, navigation, sectionPath } from "@/config/navigation";
import { cn } from "@/lib/utils";

const row =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

/**
 * The navy edge down the left of the row you're on.
 *
 * An inset shadow rather than a border, because a border is 2px of layout:
 * every active row would sit two pixels right of every other one, or need its
 * padding shaved to compensate — and then shaved back again in the rail, where
 * the row has no padding at all. A shadow is drawn inside the box it's given.
 */
const activeEdge = "shadow-[inset_2px_0_0_var(--color-sidebar-primary)]";

/**
 * The club's navigation.
 *
 * Two shapes from one element: a column in the flow once there's room for one,
 * and a drawer over the page when there isn't. The same toggle drives both -
 * see `sidebar-state.tsx` for why they're separate pieces of state.
 */
export function AppSidebar({ locale }: { locale: Locale }) {
  const t = useTranslations("nav");
  const tHeader = useTranslations("header");
  const { open, openMobile, close, toggle } = useSidebar();

  const path = sectionPath(usePathname());

  /**
   * Narrowed to icons: the column closed on a screen wide enough to have one.
   *
   * Applied through `md:` classes rather than by rendering something else,
   * because a narrow screen has no rail — there the sidebar is a drawer, and a
   * drawer is full width with its labels whatever this says.
   */
  const rail = !open;

  /*
   * A section is open when you're inside it. That's the whole default, so what
   * there is to remember isn't which sections are open - it's which ones you've
   * overruled by hand, and only until you go somewhere else, where the page you
   * asked for gets to decide again. Keeping the path alongside is what expires
   * them: the first paint is already right, and navigating settles it in the
   * same render rather than in an effect after one.
   */
  const [overruled, setOverruled] = useState<{
    at: string;
    keys: readonly string[];
  }>({ at: path, keys: [] });

  const overruledHere = overruled.at === path ? overruled.keys : [];

  const toggleSection = (key: string) =>
    setOverruled({
      at: path,
      keys: overruledHere.includes(key)
        ? overruledHere.filter((open) => open !== key)
        : [...overruledHere, key],
    });

  return (
    // One provider for the whole column: the rows share its timing, so
    // running down the rail doesn't wait out the delay at every icon.
    <TooltipProvider>
      {/*
       * The drawer's backdrop, and nothing on a wide screen: there the sidebar
       * is a column and the page beside it stays usable.
       */}
      <div
        aria-hidden
        onClick={close}
        className={cn(
          "fixed inset-0 z-30 bg-ink/40 transition-opacity duration-200 md:hidden",
          openMobile ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        id={SIDEBAR_ID}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[transform,visibility,width] duration-200 ease-out",
          openMobile ? "translate-x-0 shadow-card" : "-translate-x-full",
          /*
           * Shut, the drawer is off to the left and not to be tabbed into.
           * `invisible` is what takes it out of the tab order, and it's in the
           * transition so the panel finishes sliding before it goes.
           */
          !openMobile && "invisible md:visible",
          /*
           * Wide enough for a column: back in the flow beside the page, where
           * closing it narrows it to a rail of icons rather than taking it
           * away. A destination you can still see and click is worth more than
           * the 200px the labels were using.
           */
          // The toggle hangs off the right border, so the column is what it
          // is positioned against.
          "md:static md:relative md:translate-x-0 md:shadow-none",
          !open && "md:w-16",
        )}
      >
        {/*
         * The club's mark, at the head of its own navigation.
         *
         * This is where a brand belongs in an application: naming the column
         * of destinations under it, and linking home the way a logo does
         * everywhere else on the web. The same height as the header beside
         * it, so the two line up across the top of the app.
         */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-6",
            rail && "md:justify-center md:px-0",
          )}
        >
          <Link
            href={`/${locale}`}
            aria-label={tHeader("home")}
            className="inline-flex rounded-xl outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {/* Both are rendered and one is hidden by width, because the rail
                is a media query away rather than a different render: a narrow
                screen's drawer is full width and keeps the wordmark. */}
            <Logo className={cn(rail && "md:hidden")} />
            <LogoTile className={cn("hidden", rail && "md:inline-flex")} />
          </Link>

          {/* The drawer's own dismissal, on a narrow screen. */}
          <button
            type="button"
            onClick={close}
            aria-label={t("closeMenu")}
            className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors outline-none hover:bg-badge hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/40 md:hidden"
          >
            <Icon name="close" size="lg" />
          </button>
        </div>

        {/*
         * The control that opens and closes the column, sitting on the line
         * between it and the page.
         *
         * Pinned to the corner where the three lines meet: the brand's rule,
         * the header's rule across the page, and the border down the side.
         * That point is the only one on the seam that isn't inside anything —
         * not the brand's row, not the navigation, not the page — and it's at
         * the same place whether the column is 256px or 64px, so the control
         * never moves and never crowds the mark beside it.
         *
         * `top-16` is where those rules sit and `-right-3.5` is half its
         * width; the two shifts by half its own size centre it on the meeting
         * point rather than hanging it off either line.
         *
         * Bordered, so it reads as a control rather than a glyph that happens
         * to be sitting on the seam - hanging half over the page, an unbounded
         * pair of chevrons looks like part of the rule it's crossing. The fill
         * is what that border needs to work: without it the seam would run
         * straight through the gap between the two chevrons and out the other
         * side. The z-index is for the half that overhangs the page.
         */}
        <button
          type="button"
          onClick={toggle}
          aria-controls={SIDEBAR_ID}
          aria-expanded={open}
          aria-label={open ? t("closeMenu") : t("openMenu")}
          className="absolute top-16 -right-3.5 z-20 hidden size-7 -translate-y-1/2 items-center justify-center rounded-[50%] border border-line-strong bg-surface text-ink-muted transition-colors outline-none hover:border-separator hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/40 md:inline-flex"
        >
          <Icon name={open ? "collapse" : "expand"} size="lg" />
        </button>

        {/*
         * Admin unfolded is longer than most screens are tall, so this scrolls.
         * A thin track instead of the platform's full-width one, which is wide
         * enough here to crowd the labels it sits beside; `overscroll-contain`
         * stops the page behind it scrolling on once the list bottoms out, and
         * the deep bottom padding keeps the last item off the floor.
         */}
        <nav
          aria-label={t("label")}
          className="scrollbar-slim flex-1 overflow-y-auto overscroll-contain px-3 pt-5 pb-8"
        >
          <ul className="flex flex-col gap-1">
            {navigation.map((item) => {
              const active = isNavActive(path, item);

              if (!("groups" in item)) {
                return (
                  <li key={item.key}>
                    <NavRow
                      href={`/${locale}${item.path}`}
                      icon={item.icon}
                      label={t(item.key)}
                      active={active}
                      rail={rail}
                    />
                  </li>
                );
              }

              // Open inside the section, shut outside it, and the other way
              // round for a section you've overruled.
              const expanded = overruledHere.includes(item.key) !== active;

              const sectionButton = (
                <button
                  type="button"
                  // In the rail the fold has nowhere to open, so the flyout
                  // below takes the click instead and this is only ever the
                  // drawer's own toggle.
                  onClick={() => toggleSection(item.key)}
                  aria-expanded={expanded}
                  className={cn(
                    row,
                    "font-medium",
                    rail && "md:justify-center md:px-0",
                    active
                      ? "text-ink"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-ink",
                    // In the rail this icon stands for everything under it, so
                    // it carries the mark of the page you're on — which is
                    // otherwise hidden along with the children.
                    rail &&
                      active &&
                      "md:bg-sidebar-primary md:text-sidebar-primary-foreground",
                  )}
                >
                  <Icon
                    name={item.icon}
                    size="sm"
                    className={cn(
                      active ? "text-ink" : "text-ink-muted",
                      rail && "md:size-5",
                      rail && active && "md:text-sidebar-primary-foreground",
                    )}
                  />

                  <span className={cn("flex-1 text-left", rail && "md:hidden")}>
                    {t(item.key)}
                  </span>

                  <Icon
                    name="navExpand"
                    size="sm"
                    className={cn(
                      "text-subtle transition-transform duration-200",
                      expanded && "rotate-90",
                      rail && "md:hidden",
                    )}
                  />
                </button>
              );

              return (
                <li key={item.key}>
                  {rail ? (
                    /*
                     * Railed, the section's children have nowhere to unfold
                     * into, so they come out sideways instead: the same
                     * groups and links, in a panel beside the icon that owns
                     * them. A menu rather than a hover panel — it's portalled
                     * clear of the column's own scrolling, and arrow keys,
                     * Escape and focus return come with it, which a hover
                     * panel would have to be taught and a touch screen could
                     * never reach at all.
                     */
                    <DropdownMenu>
                      {/*
                       * Both on the one button: the tooltip names it on the
                       * way past, the menu opens it on a click. They can't
                       * collide — a tooltip closes on the pointer going down,
                       * which is the same gesture that opens the menu.
                       */}
                      <Railed label={t(item.key)} rail={rail}>
                        <DropdownMenuTrigger asChild>
                          {sectionButton}
                        </DropdownMenuTrigger>
                      </Railed>

                      <DropdownMenuContent
                        side="right"
                        align="start"
                        className="scrollbar-slim hidden max-h-[70vh] w-60 overflow-y-auto md:block"
                      >
                        {item.groups.map((group, index) => (
                          <Fragment key={group.key}>
                            {index > 0 ? <DropdownMenuSeparator /> : null}

                            <DropdownMenuLabel className="text-[11px] font-semibold tracking-wide text-subtle uppercase">
                              {t(group.key)}
                            </DropdownMenuLabel>

                            {group.items.map((link) => (
                              <DropdownMenuItem key={link.key} asChild>
                                <Link
                                  href={`/${locale}${link.path}`}
                                  aria-current={
                                    isNavActive(path, link) ? "page" : undefined
                                  }
                                  className={cn(
                                    "flex items-center gap-3",
                                    isNavActive(path, link) &&
                                      cn("font-semibold text-ink", activeEdge),
                                  )}
                                >
                                  <Icon
                                    name={link.icon}
                                    size="sm"
                                    className="text-ink-muted"
                                  />
                                  {t(link.key)}
                                </Link>
                              </DropdownMenuItem>
                            ))}
                          </Fragment>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    sectionButton
                  )}

                  {expanded ? (
                    /*
                     * Indented under the section. Without it the children
                     * start on the same edge as Event and Chat and read as
                     * more top-level items, not as Admin's own. `pl-7` puts
                     * the children's icons under Admin's label.
                     */
                    <div
                      className={cn(
                        "mt-1 mb-2 flex flex-col gap-4 pl-7",
                        // A rail is one icon wide: an indented tree of
                        // children has nowhere to go in it, and the top-level
                        // icons are what a rail is for.
                        rail && "md:hidden",
                      )}
                    >
                      {item.groups.map((group) => (
                        <div key={group.key}>
                          <p className="px-3 pb-1 text-[11px] font-semibold tracking-wide text-subtle uppercase">
                            {t(group.key)}
                          </p>

                          <ul className="flex flex-col gap-0.5">
                            {group.items.map((link) => (
                              <li key={link.key}>
                                <NavRow
                                  href={`/${locale}${link.path}`}
                                  icon={link.icon}
                                  label={t(link.key)}
                                  active={isNavActive(path, link)}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </TooltipProvider>
  );
}

function NavRow({
  href,
  icon,
  label,
  active,
  rail = false,
}: {
  href: string;
  icon: IconName;
  label: string;
  active: boolean;
  /** Icon only, centred, with the label in a tooltip beside it. */
  rail?: boolean;
}) {
  return (
    <Railed label={label} rail={rail}>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          row,
          rail && "md:justify-center md:px-0",
          active
            ? cn(
                "bg-sidebar-accent font-semibold text-sidebar-accent-foreground",
                // The mark is navy in both states; how much of it there is
                // depends on how much work it has to do. Here the label has
                // already said where you are, so an edge is enough.
                activeEdge,
              )
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-ink",
          // Filled rather than edged once it's a picture on its own: a bar at
          // the far left of a 64px strip reads as detached from the centred
          // icon it's marking, and where you are is the one thing a rail
          // still has to say.
          rail &&
            active &&
            "md:bg-sidebar-primary md:text-sidebar-primary-foreground md:shadow-none",
        )}
      >
        <Icon
          name={icon}
          size="sm"
          className={cn(
            active ? "text-ink" : "text-ink-muted",
            // Bigger where it stands alone: in the rail the glyph is the
            // label, the target and the whole message, and 16px in a 64px
            // column is under-scaled for all three. A class rather than the
            // size step, so it can be a width away rather than a render away.
            rail && "md:size-5",
            rail && active && "md:text-sidebar-primary-foreground",
          )}
        />

        {/* Hidden by width, not removed: the drawer on a narrow screen is the
            same markup and keeps its labels, and a screen reader reads this
            rather than the tooltip either way. */}
        <span className={cn(rail && "md:hidden")}>{label}</span>
      </Link>
    </Railed>
  );
}

/**
 * The label a row loses when the column narrows, given back on hover.
 *
 * Only in the rail, and only on a pointer screen: a drawer shows its labels
 * outright, and a tooltip nobody can hover is a tooltip nobody reads. Wrapping
 * rather than branching keeps one row in the markup — the tooltip is a
 * trigger around it, not a second copy of it.
 */
function Railed({
  label,
  rail,
  children,
}: {
  label: string;
  rail: boolean;
  children: ReactNode;
}) {
  if (!rail) return children;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>

      {/* `hidden md:block`: below `md` the column is a drawer with its labels
          already showing, and this would be saying it twice. */}
      <TooltipContent side="right" className="hidden md:block">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
