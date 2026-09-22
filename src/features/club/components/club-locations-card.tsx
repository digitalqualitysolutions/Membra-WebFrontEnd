"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Icon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CardHeader,
  Chip,
  SaveBar,
  Switch,
  Td,
  Th,
  compactInput,
  compactTrigger,
} from "@/features/club/components/record-parts";
import type {
  ClubAddress,
  ClubLocation,
  LocationToggle,
} from "@/features/club/types";
import { cn } from "@/lib/utils";

/** The on/off columns, in the order the table shows them. */
const toggleColumns = [
  { key: "memberBooking", label: "memberBooking" },
  { key: "teamMemberBooking", label: "teamMemberBooking" },
] as const;

const trailingToggles = [
  { key: "publicListed", label: "public" },
  { key: "friends", label: "friends" },
  { key: "active", label: "active" },
] as const;

/**
 * Indent per level, in pixels, as a style rather than a class.
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
 * The halls, zones and courts the club books.
 *
 * A flat table drawing a tree: rows arrive parent-first, and the guides down
 * the first column are what make the shape readable. Sorting them here would
 * only undo the order the record already has.
 */
export function ClubLocationsCard({
  locations: saved,
  addresses,
}: {
  locations: ClubLocation[];
  /** The club's own addresses, which are what a hub can be parented to. */
  addresses: readonly ClubAddress[];
}) {
  const t = useTranslations("club.locations");
  const tEditing = useTranslations("club.editing");

  // PLACEHOLDER, like the rest of the screen: Save writes back to state here.
  const [locations, setLocations] = useState(saved);
  const [rows, setRows] = useState(saved);
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");

  /** Branches folded away, by the id of the node that heads them. */
  const [folded, setFolded] = useState<readonly string[]>([]);

  const shown = editing ? rows : locations;

  /** Whether anything has actually moved, which changes what the bar says. */
  const dirty = JSON.stringify(rows) !== JSON.stringify(locations);

  /**
   * The last child under each parent, so the guides know which row closes a
   * branch. Cheaper and clearer than looking ahead from inside the render.
   */
  const lastBorn = useMemo(() => {
    const last = new Map<string, string>();

    for (const location of shown) {
      if (location.parentLocation) last.set(location.parentLocation, location.id);
    }

    return last;
  }, [shown]);

  /** `RP (Lyngbyvej 1, …)` - a hub books against one of the club's addresses. */
  const addressOptions = addresses.map((address) => ({
    value: address.short,
    label: `${address.short} (${address.address})`,
  }));

  /**
   * `HH.i (Hafnia inde)` - what a location sits under.
   *
   * Every row is offered, courts included: a court is only a leaf until
   * something is put under it. Keyed by id and labelled by the dotted code,
   * because short codes repeat - `1 (Bane 1)` would read the same for every
   * hall, and picking one would resolve to whichever matched first.
   */
  const locationOptions = shown.map((location) => ({
    value: location.id,
    label: `${location.show} (${location.name})`,
  }));

  /**
   * Every row by id, for walking up a parent chain.
   *
   * By id rather than short code, and with nothing left out: any location can
   * head a branch, and short codes repeat - every hall has a `Bane 1` - so a
   * map keyed by code would answer with whichever one it saw last.
   */
  const byId = useMemo(() => {
    const map = new Map<string, ClubLocation>();

    for (const location of shown) map.set(location.id, location);

    return map;
  }, [shown]);

  const needle = query.trim().toLowerCase();

  /** Walks up the parent chain: folding a hub takes its zones' courts with it. */
  function insideFold(location: ClubLocation) {
    let parent = location.parentLocation;

    while (parent) {
      if (folded.includes(parent)) return true;
      parent = byId.get(parent)?.parentLocation ?? null;
    }

    return false;
  }

  const visible = shown.filter((location) => {
    // A search looks through folds rather than around them - hiding a match
    // because its hall happens to be folded would just look broken.
    if (!needle) return !insideFold(location);

    return [location.name, location.short, location.show].some((field) =>
      field.toLowerCase().includes(needle),
    );
  });

  function begin() {
    setRows(locations);
    setEditing(true);
  }

  /**
   * The pencil closes what it opened.
   *
   * Closing discards, exactly as Cancel does - with a table this long the save
   * bar can be well off screen from the pencil you just pressed, so the pencil
   * has to be a way back as well as a way in.
   */
  function toggleEditing() {
    if (editing) {
      setRows(locations);
      setEditing(false);
      return;
    }

    begin();
  }

  function update(id: string, patch: Partial<ClubLocation>) {
    if (!editing) begin();

    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <CardHeader
        open={open}
        onToggle={() => {
          const closing = open;

          // The same as the cards above: folding the table away ends the edit
          // rather than leaving it running, with its save bar hidden, over
          // rows you can't see.
          if (closing && editing) {
            setRows(locations);
            setEditing(false);
          }

          setOpen(!closing);
        }}
        collapseLabel={t("title")}
        title={t("title")}
        editLabel={t("editAll")}
        onEdit={toggleEditing}
        aside={
          <div className="relative">
            <Icon
              name="find"
              size="xs"
              className="absolute top-1/2 left-3 -translate-y-1/2 text-subtle"
            />
            <Input
              className={cn(compactInput, "w-56 pl-8")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("filter")}
              aria-label={t("filter")}
            />
          </div>
        }
      />

      {open ? (
        <>
          <div className="overflow-x-auto border-t border-line px-5 py-4 sm:px-6">
            <table className="w-full min-w-275 border-collapse text-left">
              <thead>
                <tr className="border-b border-line">
                  <Th className="w-56">{t("columns.name")}</Th>
                  <Th className="w-16">{t("columns.short")}</Th>
                  <Th className="w-20">{t("columns.show")}</Th>
                  <Th className="w-44">{t("columns.parentAddress")}</Th>
                  <Th className="w-44">{t("columns.parentLocation")}</Th>
                  <Th className="w-24">{t("columns.memberBooking")}</Th>
                  <Th className="w-24">{t("columns.teamMemberBooking")}</Th>
                  <Th className="w-20">{t("columns.memberBookingCount")}</Th>
                  <Th className="w-20">{t("columns.public")}</Th>
                  <Th className="w-20">{t("columns.friends")}</Th>
                  <Th className="w-20">{t("columns.active")}</Th>
                  <Th className="w-24">{t("columns.directions")}</Th>
                </tr>
              </thead>

              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-[13px] text-subtle">
                      {t("empty")}
                    </td>
                  </tr>
                ) : null}

                {visible.map((location) => {
                  const heads = shown.some(
                    (row) => row.parentLocation === location.id,
                  );
                  const shut = folded.includes(location.id);

                  return (
                  <tr
                    key={location.id}
                    className={cn(
                      "border-b border-line last:border-0",
                      location.kind !== "hub" && "bg-page/40",
                    )}
                  >
                    <Td>
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: indentFor(location.depth) }}
                      >
                        {/* A node with something under it folds; a court has
                            nothing to fold, so it keeps the guide that says
                            which branch it belongs to. */}
                        {heads ? (
                          <button
                            type="button"
                            aria-expanded={!shut}
                            aria-label={location.name}
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

                        <span className="truncate text-[13px] font-medium text-ink">
                          {location.name}
                        </span>

                        {location.kind === "hub" ? null : (
                          <Chip
                            tone={location.kind === "court" ? "success" : "neutral"}
                          >
                            {t(`kinds.${location.kind}`)}
                          </Chip>
                        )}
                      </div>
                    </Td>

                    <Td>
                      <span className="text-[13px] text-body">{location.short}</span>
                    </Td>

                    <Td>
                      <span className="text-[13px] text-ink-muted">
                        {location.show}
                      </span>
                    </Td>

                    <Td>
                      <RoutingSelect
                        value={location.parentAddress}
                        options={addressOptions}
                        disabled={!editing}
                        label={t("columns.parentAddress")}
                        placeholder={t("none")}
                        onChange={(value) =>
                          update(location.id, { parentAddress: value })
                        }
                      />
                    </Td>

                    <Td>
                      <RoutingSelect
                        value={location.parentLocation}
                        // Not itself. Its descendants are still offered, which
                        // would make a cycle - the card doesn't save locations
                        // yet, and guarding it belongs with the call that does.
                        options={locationOptions.filter(
                          (option) => option.value !== location.id,
                        )}
                        disabled={!editing}
                        label={t("columns.parentLocation")}
                        placeholder={t("none")}
                        onChange={(value) =>
                          update(location.id, { parentLocation: value })
                        }
                      />
                    </Td>

                    {toggleColumns.map(({ key, label }) => (
                      <Td key={key}>
                        <Switch
                          size="sm"
                          tone="success"
                          checked={location[key as LocationToggle]}
                          disabled={!editing}
                          label={t(`columns.${label}`)}
                          onChange={(checked) =>
                            update(location.id, { [key]: checked })
                          }
                        />
                      </Td>
                    ))}

                    <Td>
                      {location.memberBookingCount === null ? (
                        <span className="text-[13px] text-subtle">{t("none")}</span>
                      ) : (
                        <Chip>{location.memberBookingCount}</Chip>
                      )}
                    </Td>

                    {trailingToggles.map(({ key, label }) => (
                      <Td key={key}>
                        <Switch
                          size="sm"
                          tone="success"
                          checked={location[key as LocationToggle]}
                          disabled={!editing}
                          label={t(`columns.${label}`)}
                          onChange={(checked) =>
                            update(location.id, { [key]: checked })
                          }
                        />
                      </Td>
                    ))}

                    <Td>
                      <span className="text-[13px] text-subtle">
                        {location.directions ?? t("none")}
                      </span>
                    </Td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {editing ? (
            <SaveBar
              // What's happened, not just what's possible: once something has
              // actually moved, the bar says so.
              message={dirty ? t("unsaved") : t("editing")}
              cancelLabel={tEditing("cancel")}
              saveLabel={tEditing("save")}
              onCancel={() => {
                setRows(locations);
                setEditing(false);
              }}
              onSave={() => {
                setLocations(rows);
                setEditing(false);
              }}
            />
          ) : null}
        </>
      ) : null}
    </section>
  );
}

/** One of the two routing dropdowns, which read as a dash when unset. */
function RoutingSelect({
  value,
  options,
  disabled,
  label,
  placeholder,
  onChange,
}: {
  value: string | null;
  options: readonly { value: string; label: string }[];
  disabled: boolean;
  label: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value ?? undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className={cn("w-full", compactTrigger)}
        aria-label={label}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
