"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClubAddress } from "@/features/club/types";
import { AddLocationPanel } from "@/features/location/components/add-location-panel";
import { LocationHelp } from "@/features/location/components/location-help";
import type { LocationRow } from "@/features/location/types";
import { cn } from "@/lib/utils";

/**
 * Indent per level, in pixels, applied as a style rather than a class.
 *
 * Nesting is unbounded - any location can be given children - so there's no
 * fixed list of classes to pick from, and Tailwind can't see a class it would
 * have to run the code to find out. Capped so a deep branch still leaves the
 * name column readable.
 */
const INDENT_STEP = 16;
const INDENT_MAX = 96;

const indentFor = (depth: number) =>
  Math.min(depth * INDENT_STEP, INDENT_MAX);

/**
 * A just-created location, put where it belongs rather than at the end.
 *
 * The table draws its tree by reading straight down the rows, so a child
 * appended to the bottom of the list renders as a stray indented line under
 * some unrelated hall until the next full load. This walks past everything
 * already under the parent and slots the new row in after its last sibling.
 *
 * The parent is re-read at the same time: a court that has just been given a
 * child isn't a court any more, which is the rule the server applies when the
 * page next loads and the one the screen should agree with now.
 */
function withCreated(
  rows: readonly LocationRow[],
  created: LocationRow,
): LocationRow[] {
  const parentAt = rows.findIndex((row) => row.id === created.parentLocation);

  // A new hub, or a parent that somehow isn't on screen: the end is right.
  if (created.parentLocation === null || parentAt === -1) {
    return [...rows, created];
  }

  const parent = rows[parentAt];
  if (!parent) return [...rows, created];

  let at = parentAt + 1;

  while (at < rows.length && (rows[at]?.depth ?? 0) > parent.depth) at += 1;

  const next = [...rows];
  next.splice(at, 0, created);

  return next;
}

/** How many group codes a row shows before the rest collapse into a count. */
const GROUPS_SHOWN = 3;

/**
 * The club's courts and facilities as one matrix.
 *
 * A flat table drawing a tree: rows arrive parent-first and the guides down the
 * first column are what make the shape readable, so nothing is sorted here -
 * re-ordering the rows would undo the hierarchy the record already carries.
 *
 * Read-only on purpose. The club screen's locations card is where a row is
 * edited, one field at a time against a save bar; this screen answers the other
 * question - what does the whole estate look like at once - and a page that
 * both surveys and edits does neither well.
 */
export function LocationsOverviewTable({
  locations: saved,
  clubId,
  addresses,
}: {
  locations: readonly LocationRow[];
  /** The club a new location is created under. `null` when the member runs none. */
  clubId: number | null;
  /** The club's own addresses, which are what a new hub is parented to. */
  addresses: readonly ClubAddress[];
}) {
  const t = useTranslations("location");

  // PLACEHOLDER, like the rest of the app: a created location lands in state
  // here so the table can show it, and goes no further.
  const [locations, setLocations] = useState(saved);
  const [adding, setAdding] = useState(false);

  /** The two letters every on/off column reads as, resolved once for all of them. */
  const yes = t("yes");
  const no = t("no");

  const [query, setQuery] = useState("");

  /** Branches folded away, by the id of the node that heads them. */
  const [folded, setFolded] = useState<readonly string[]>([]);

  /**
   * Every row by id, for walking up a parent chain.
   *
   * By id rather than short code, and with nothing left out: any location can
   * head a branch, and short codes repeat - every hall has a `Bane 1` - so a
   * map keyed by code would answer with whichever one it saw last.
   */
  const byId = useMemo(() => {
    const map = new Map<string, LocationRow>();

    for (const location of locations) map.set(location.id, location);

    return map;
  }, [locations]);

  /**
   * The last child under each parent, so the guides know which row closes a
   * branch. Cheaper and clearer than looking ahead from inside the render.
   */
  const lastBorn = useMemo(() => {
    const last = new Map<string, string>();

    for (const location of locations) {
      if (location.parentLocation) last.set(location.parentLocation, location.id);
    }

    return last;
  }, [locations]);

  /** What the summary pill counts. The whole estate, not the filtered view. */
  const active = locations.filter((location) => location.active);
  const bookable = locations.filter((location) => location.memberBooking);
  const allActive = active.length === locations.length;

  const needle = query.trim().toLowerCase();

  /** Walks up the parent chain: folding a hub takes its zones' courts with it. */
  function insideFold(location: LocationRow) {
    let parent = location.parentLocation;

    while (parent) {
      if (folded.includes(parent)) return true;
      parent = byId.get(parent)?.parentLocation ?? null;
    }

    return false;
  }

  const visible = locations.filter((location) => {
    // A search looks through folds rather than around them - hiding a match
    // because its hall happens to be folded would just look broken.
    if (!needle) return !insideFold(location);

    return [location.name, location.short, location.show, ...location.groups].some(
      (field) => field.toLowerCase().includes(needle),
    );
  });

  /** Every node that heads a branch, which is what "expand all" has to clear. */
  const foldable = locations
    .filter((location) =>
      locations.some((row) => row.parentLocation === location.id),
    )
    .map((location) => location.id);

  const allOpen = folded.length === 0;

  /*
   * A club with no locations gets none of the table's furniture.
   *
   * A filter, a count of zero hubs, "Collapse all" and an empty grid are all
   * tools for looking through rows, and there are no rows - so the first view
   * is one button. The form and the help arrive together once it's pressed:
   * the help is written for someone creating their first location, which is
   * exactly who is looking at that form. Counted off the whole record, not the
   * filtered view, since a filter matching nothing is still a club with rows.
   */
  if (locations.length === 0) {
    // No page heading either, the same as the club's first view: it heads a
    // list, and there isn't one yet.
    if (!adding) {
      return (
        <EmptyState
          icon="location"
          title={t("emptyState.title")}
          body={t("emptyState.body")}
          action={
            <Button type="button" size="lg" onClick={() => setAdding(true)}>
              <Icon name="add" size="xs" />
              {t("emptyState.add")}
            </Button>
          }
        />
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <AddLocationPanel
          clubId={clubId}
          addresses={addresses}
          locations={locations}
          onCreate={(location) =>
            setLocations((current) => withCreated(current, location))
          }
          onClose={() => setAdding(false)}
        />

        <LocationHelp />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="mb-2 border-b border-line pb-5">
        <h1 className="text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">
          {t("title")}
        </h1>

        {/* `text-body`, matching the club screen: a sentence to read, not a
            placeholder, and `text-subtle` falls short of 4.5:1 on white. */}
        <p className="mt-1.5 text-[13px] text-body sm:text-sm">
          {t("description")}
        </p>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-card sm:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Icon
              name="find"
              size="xs"
              className="absolute top-1/2 left-3 -translate-y-1/2 text-subtle"
            />

            <Input
              className="h-9 w-64 pl-8 text-[13px]"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("filter")}
              aria-label={t("filter")}
            />
          </div>

          {/* What the table adds up to, so the count doesn't have to be read
              off the rows. Green only while everything is active. */}
          <p
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium",
              allActive
                ? "border-success/30 bg-success/10 text-success"
                : "border-lock/40 bg-lock/10 text-lock",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "size-2 rounded-full",
                allActive ? "bg-success" : "bg-lock",
              )}
            />

            {allActive
              ? t("summaryAll", {
                  total: locations.length,
                  bookable: bookable.length,
                })
              : t("summarySome", {
                  active: active.length,
                  total: locations.length,
                  bookable: bookable.length,
                })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFolded(allOpen ? foldable : [])}
          >
            {/* Points the way the row chevrons do at the same state: down
                while the tree is open, turned while it's folded away. */}
            <Icon
              name="selectArrow"
              size="xs"
              className={cn("transition-transform", !allOpen && "-rotate-90")}
            />
            {allOpen ? t("collapseAll") : t("expandAll")}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={adding}
            onClick={() => setAdding((value) => !value)}
          >
            <Icon name="add" size="xs" />
            {t("add")}
          </Button>
        </div>
      </section>

      {/* Directly under the button that opens it, so the form arrives where
          you just clicked rather than above the toolbar you were reading. */}
      {adding ? (
        <AddLocationPanel
          clubId={clubId}
          addresses={addresses}
          locations={locations}
          onCreate={(location) =>
            setLocations((current) => withCreated(current, location))
          }
          onClose={() => setAdding(false)}
        />
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-250 border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-page/60">
                <Th className="w-72 pl-5 sm:pl-6">{t("columns.name")}</Th>
                <Th className="w-20">{t("columns.short")}</Th>
                <Th className="w-24">{t("columns.show")}</Th>
                <Th className="w-20">{t("columns.memberBooking")}</Th>
                <Th className="w-16">{t("columns.memberBookingCount")}</Th>
                <Th className="w-20">{t("columns.public")}</Th>
                <Th className="w-16">{t("columns.site")}</Th>
                <Th className="w-72">{t("columns.groups")}</Th>
                <Th className="w-20 pr-5 text-right sm:pr-6">
                  {t("columns.active")}
                </Th>
              </tr>
            </thead>

            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-10 text-center text-[13px] text-subtle"
                  >
                    {t("empty")}
                  </td>
                </tr>
              ) : null}

              {visible.map((location) => {
                const heads = locations.some(
                  (row) => row.parentLocation === location.id,
                );
                const shut = folded.includes(location.id);

                return (
                  <tr
                    key={location.id}
                    className="border-b border-line transition-colors last:border-0 hover:bg-page/60"
                  >
                    <Td className="pl-5 sm:pl-6">
                      {/* The indent stays on its own element rather than on the
                          cell: the cell carries the card's left gutter, and a
                          `pl-8` merged onto that would replace the gutter
                          instead of adding to it. */}
                      <div
                        className="flex min-w-0 items-center gap-2"
                        style={{ paddingLeft: indentFor(location.depth) }}
                      >
                        {/* A node with something under it folds; a court has
                            nothing to fold, so it keeps the guide that says
                            which branch it belongs to. */}
                        {heads ? (
                          <button
                            type="button"
                            aria-expanded={!shut}
                            aria-label={
                              shut
                                ? t("unfold", { name: location.name })
                                : t("fold", { name: location.name })
                            }
                            onClick={() =>
                              setFolded((current) =>
                                current.includes(location.id)
                                  ? current.filter((id) => id !== location.id)
                                  : [...current, location.id],
                              )
                            }
                            className="inline-flex size-4 shrink-0 items-center justify-center rounded text-ink-muted transition-colors outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/40"
                          >
                            <Icon
                              name="selectArrow"
                              size="xs"
                              className={cn(
                                "transition-transform",
                                shut && "-rotate-90",
                              )}
                            />
                          </button>
                        ) : (
                          <span
                            aria-hidden
                            className="w-4 shrink-0 text-center text-[12px] text-subtle"
                          >
                            {lastBorn.get(location.parentLocation ?? "") ===
                            location.id
                              ? "└"
                              : "├"}
                          </span>
                        )}

                        <span
                          className={cn(
                            "truncate text-[13px] text-ink",
                            location.depth === 0
                              ? "font-semibold"
                              : "font-medium",
                          )}
                        >
                          {location.name}
                        </span>

                        {location.surface ? (
                          <Tag uppercase>{t(`surfaces.${location.surface}`)}</Tag>
                        ) : null}
                      </div>
                    </Td>

                    <Td>
                      <span
                        className={cn(
                          "font-mono text-[12px] text-body",
                          location.depth === 0 && "font-semibold text-ink",
                        )}
                      >
                        {location.short}
                      </span>
                    </Td>

                    <Td>
                      {/* The dotted code the club actually calls a court by, and
                          the one thing on the row worth picking out of it. */}
                      <span className="font-mono text-[12px] text-success">
                        {location.show}
                      </span>
                    </Td>

                    <Td>
                      <Flag
                        on={location.memberBooking}
                        label={location.memberBooking ? yes : no}
                      />
                    </Td>

                    <Td>
                      {location.memberBookingCount === null ? (
                        <Dash label={t("none")} />
                      ) : (
                        <span className="text-[13px] text-body">
                          {location.memberBookingCount}
                        </span>
                      )}
                    </Td>

                    <Td>
                      <Flag
                        on={location.publicListed}
                        label={location.publicListed ? yes : no}
                      />
                    </Td>

                    <Td>
                      {location.site === null ? (
                        <Dash label={t("none")} />
                      ) : (
                        <span className="text-[13px] font-medium text-ink">
                          {location.site}
                        </span>
                      )}
                    </Td>

                    <Td>
                      {location.groups.length === 0 ? (
                        <Dash label={t("none")} />
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {location.groups.slice(0, GROUPS_SHOWN).map((group) => (
                            <span
                              key={group}
                              className="rounded-md border border-line-strong bg-track px-1.5 py-0.5 font-mono text-[11px] text-ink-muted"
                            >
                              {group}
                            </span>
                          ))}

                          {/* A court in more groups than the row has room for
                              still says so, rather than quietly showing three. */}
                          {location.groups.length > GROUPS_SHOWN ? (
                            <span className="text-[11px] text-subtle">
                              {t("moreGroups", {
                                count: location.groups.length - GROUPS_SHOWN,
                              })}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </Td>

                    <Td className="justify-end pr-5 sm:pr-6">
                      <Flag on={location.active} label={location.active ? yes : no} />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/** The kind or surface beside a name: "Hub", "Court", "INDOOR". */
function Tag({
  children,
  uppercase,
}: {
  children: ReactNode;
  uppercase?: boolean;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-md border border-line-strong bg-track px-1.5 py-0.5 text-[10px] font-medium text-ink-muted",
        uppercase && "tracking-wide uppercase",
      )}
    >
      {children}
    </span>
  );
}

/**
 * One on/off cell, as the single letter the club reads down the column.
 *
 * A switch would say the value is yours to change, and on this screen it isn't
 * - so the column states the answer and the club screen keeps the controls.
 */
function Flag({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
        on ? "bg-success/10 text-success" : "bg-track text-ink-muted",
      )}
    >
      {label}
    </span>
  );
}

/** Stands in for a column that doesn't apply to this row, not one left blank. */
function Dash({ label }: { label: string }) {
  return <span className="text-[13px] text-subtle">{label}</span>;
}

function Th({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "py-3 pr-4 text-[11px] font-semibold tracking-wide text-ink-muted uppercase",
        className,
      )}
    >
      {children}
    </th>
  );
}

/**
 * One cell, whose content is a row rather than a line of text.
 *
 * The wrapper isn't decoration. A cell holding a bare `<span>` puts it on the
 * cell's own baseline strut - 16px, inherited, whatever the span's size - so
 * an 11px flag or a 12px code lands two or three pixels below a cell whose
 * content is already a flex row, like the name or the group badges. Every cell
 * being block-level means there's no strut anywhere and `align-middle` centres
 * all nine the same way.
 */
function Td({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className="py-2.5 align-middle">
      <div className={cn("flex min-h-6 min-w-0 items-center pr-4", className)}>
        {children}
      </div>
    </td>
  );
}
