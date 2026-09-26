"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Icon } from "@/components/icons";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import { deleteLocationAction } from "@/features/club/services/delete-location";
import type { LocationChange } from "@/features/club/services/location-state";
import { saveLocationsAction } from "@/features/club/services/update-location";
import type {
  ClubAddress,
  ClubLocation,
  LocationToggle,
} from "@/features/club/types";
import { useServerSync } from "@/lib/use-server-sync";
import { cn } from "@/lib/utils";

/**
 * Everything hanging under `id`, nearest first.
 *
 * Only what the table was handed - the API deletes the real branch and says
 * what it took, so this is for the warning, not for the work.
 */
function descendantsOf(
  rows: readonly ClubLocation[],
  id: string,
): ClubLocation[] {
  const found: ClubLocation[] = [];
  const queue: string[] = [id];

  for (let at = 0; at < queue.length; at += 1) {
    const parent = queue[at];

    for (const row of rows) {
      if (row.parentLocation !== parent) continue;

      found.push(row);
      queue.push(row.id);
    }
  }

  return found;
}


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

/** The API's caps on a location's short code, booking count and directions. */
const SHORT_MAX = 8;
const COUNT_MAX = 30;
const DIRECTIONS_MAX = 255;

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
  clubId,
  addresses,
}: {
  locations: ClubLocation[];
  /** The club these belong to, which every save is made against. */
  clubId: number;
  /** The club's own addresses, which are what a hub can be parented to. */
  addresses: readonly ClubAddress[];
}) {
  const t = useTranslations("club.locations");
  const tEditing = useTranslations("club.editing");
  const locale = useLocale();
  const router = useRouter();

  const [locations, setLocations] = useState(saved);
  const [rows, setRows] = useState(saved);
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");

  /** Why the last save didn't go through, already in the member's language. */
  const [failure, setFailure] = useState<string | undefined>(undefined);

  /** The row whose name and code are open for typing, from its pencil. */
  const [renaming, setRenaming] = useState<string | null>(null);

  const [saving, startSaving] = useTransition();

  /** The row whose delete was pressed, held until the question is answered. */
  const [deleteTarget, setDeleteTarget] = useState<ClubLocation | null>(null);
  const [deleting, startDeleting] = useTransition();

  /** What goes with it, for the warning. Read from what's saved, not the edit. */
  const deleteChildren = deleteTarget
    ? descendantsOf(locations, deleteTarget.id)
    : [];

  /** Branches folded away, by the id of the node that heads them. */
  const [folded, setFolded] = useState<readonly string[]>([]);

  // Fresh rows after a save or delete re-reads the page. Held back while the
  // table is open for editing, so a refresh can't take a draft away.
  useServerSync(saved, editing, (fresh) => {
    setLocations(fresh);
    setRows(fresh);
  });

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
      setRenaming(null);
      setEditing(false);
      return;
    }

    begin();
  }

  /**
   * What's wrong with a name or code that was typed in, if anything.
   *
   * Only rows whose name or code actually changed are checked. The record
   * already holds duplicates from before there was a rule, and blocking an
   * unrelated switch because of one of those would strand the whole card.
   */
  function firstProblem() {
    const before = new Map(locations.map((row) => [row.id, row]));

    for (const row of rows) {
      const was = before.get(row.id);
      if (!was) continue;

      const count = row.memberBookingCount;

      if (
        count !== was.memberBookingCount &&
        count !== null &&
        (!Number.isInteger(count) || count < 1 || count > COUNT_MAX)
      ) {
        return t("countInvalid");
      }

      if (was.short === row.short && was.name === row.name) continue;

      if (row.name.trim().length === 0) return t("nameRequired");

      const code = row.short.trim();

      if (code.length === 0) return t("shortRequired");
      if (code.length > SHORT_MAX) return t("shortInvalid");
      // A dot separates the steps of the shown name, so it can't sit in one.
      if (/[.\s]/.test(code)) return t("shortInvalid");

      const clash = rows.some(
        (other) =>
          other.id !== row.id &&
          (other.parentLocation ?? "") === (row.parentLocation ?? "") &&
          other.short.trim().toLowerCase() === code.toLowerCase(),
      );

      if (clash) return t("shortTaken", { short: code });
    }

    return undefined;
  }

  const problem = firstProblem();

  /** The club's id for an address, which the table holds by short code. */
  function addressIdFor(short: string | null) {
    if (short === null) return null;

    const address = addresses.find((row) => row.short === short);

    return address ? Number(address.id) : null;
  }

  /** Only the rows that moved, and on each only the fields that did. */
  function pendingChanges(): LocationChange[] {
    const before = new Map(locations.map((row) => [row.id, row]));
    const changes: LocationChange[] = [];

    for (const row of rows) {
      const was = before.get(row.id);
      if (!was) continue;

      const change: LocationChange = { locationId: Number(row.id) };
      let moved = false;

      if (row.name.trim() !== was.name) {
        change.name = row.name.trim();
        moved = true;
      }

      if (row.short.trim() !== was.short) {
        change.shortName = row.short.trim();
        moved = true;
      }

      if (row.memberBookingCount !== was.memberBookingCount) {
        change.memberReqToBook = row.memberBookingCount;
        moved = true;
      }

      if (row.directions !== was.directions) {
        change.directions = row.directions?.trim() || null;
        moved = true;
      }

      if (row.parentAddress !== was.parentAddress) {
        change.clubAddressId = addressIdFor(row.parentAddress);
        moved = true;
      }

      if (row.parentLocation !== was.parentLocation) {
        change.parentLocationId =
          row.parentLocation === null ? null : Number(row.parentLocation);
        moved = true;
      }

      if (row.memberBooking !== was.memberBooking) {
        change.canMemberBook = row.memberBooking;
        moved = true;
      }

      if (row.teamMemberBooking !== was.teamMemberBooking) {
        change.canTeamBook = row.teamMemberBooking;
        moved = true;
      }

      if (row.publicListed !== was.publicListed) {
        change.public = row.publicListed;
        moved = true;
      }

      if (row.friends !== was.friends) {
        change.canFriendshipClubBook = row.friends;
        moved = true;
      }

      if (row.active !== was.active) {
        change.active = row.active;
        moved = true;
      }

      if (moved) changes.push(change);
    }

    return changes;
  }

  function save() {
    const changes = pendingChanges();

    if (changes.length === 0) {
      setRenaming(null);
      setEditing(false);
      return;
    }

    setFailure(undefined);

    startSaving(async () => {
      const result = await saveLocationsAction({ locale, clubId, changes });

      // What the API now holds, whatever happened: a changed parent or code
      // recomputes the dotted name of everything below it, so the card can't
      // work out the new list for itself.
      if (result.locations) {
        setLocations(result.locations);
        setRows(result.locations);
      }

      if (result.formError !== undefined) {
        setFailure(result.formError);
        return;
      }

      setRenaming(null);
      setEditing(false);

      // Re-fetch the data so the table shows what the API now holds.
      router.refresh();
    });
  }

  /**
   * Delete the row the dialog is asking about, and everything the API takes
   * with it.
   *
   * The ids come back from the API rather than being worked out here: a
   * descendant this table never loaded is gone just the same, and dropping
   * only what we knew about would leave a row pointing at a parent that no
   * longer exists.
   */
  function confirmDelete() {
    const target = deleteTarget;
    if (!target) return;

    setFailure(undefined);

    startDeleting(async () => {
      const result = await deleteLocationAction({
        locale,
        clubId,
        locationId: Number(target.id),
      });

      if (result.formError !== undefined) {
        setFailure(result.formError);
        setDeleteTarget(null);
        return;
      }

      const gone = new Set(result.deletedIds ?? []);
      const without = (list: ClubLocation[]) =>
        list.filter((row) => !gone.has(row.id));

      setLocations(without);
      setRows(without);

      // A row open for typing, or folded, may have just been deleted.
      setRenaming((open) => (open !== null && gone.has(open) ? null : open));
      setFolded((shut) => shut.filter((id) => !gone.has(id)));

      setDeleteTarget(null);

      // Re-fetch the data so the table shows what the API now holds.
      router.refresh();
    });
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
            setRenaming(null);
            setEditing(false);
          }

          setOpen(!closing);
        }}
        collapseLabel={t("title")}
        title={t("title")}
        editLabel={t("editAll")}
        // No pencil over an empty table: it only renames and re-parents rows
        // that exist, and locations are added on the locations page. Gated on
        // what's saved, not on what the filter leaves - a search that matches
        // nothing still has rows worth editing behind it.
        onEdit={locations.length > 0 ? toggleEditing : undefined}
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
                  {/* Only while editing - there's nothing to act on in a
                      read-only table. */}
                  {editing ? (
                    <Th className="w-24">{t("columns.actions")}</Th>
                  ) : null}
                </tr>
              </thead>

              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td
                      colSpan={editing ? 13 : 12}
                      className="py-8 text-center text-[13px] text-subtle"
                    >
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
                      location.depth > 0 && "bg-page/40",
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

                        {renaming === location.id ? (
                          <Input
                            className={cn(compactInput, "min-w-0 flex-1")}
                            value={location.name}
                            maxLength={60}
                            aria-label={t("columns.name")}
                            onChange={(event) =>
                              update(location.id, { name: event.target.value })
                            }
                          />
                        ) : (
                          <span className="truncate text-[13px] font-medium text-ink">
                            {location.name}
                          </span>
                        )}
                      </div>
                    </Td>

                    <Td>
                      {renaming === location.id ? (
                        <Input
                          className={cn(compactInput, "w-16")}
                          value={location.short}
                          maxLength={SHORT_MAX}
                          aria-label={t("columns.short")}
                          onChange={(event) =>
                            update(location.id, { short: event.target.value })
                          }
                        />
                      ) : (
                        <span className="text-[13px] text-body">
                          {location.short}
                        </span>
                      )}
                    </Td>

                    <Td>
                      <span className="text-[13px] text-ink-muted">
                        {location.show}
                      </span>
                    </Td>

                    {/* An address makes it a root; a parent location makes it a
                        child that inherits one. Either one rules out the other,
                        so setting one clears it. */}
                    <Td>
                      <RoutingSelect
                        value={location.parentAddress}
                        options={addressOptions}
                        disabled={!editing || location.parentLocation !== null}
                        label={t("columns.parentAddress")}
                        placeholder={t("none")}
                        onChange={(value) =>
                          update(location.id, {
                            parentAddress: value,
                            parentLocation: null,
                          })
                        }
                      />
                    </Td>

                    <Td>
                      <RoutingSelect
                        value={location.parentLocation}
                        // Not itself. Its descendants are still offered, which
                        // would make a cycle - the API is what refuses that.
                        options={locationOptions.filter(
                          (option) => option.value !== location.id,
                        )}
                        disabled={!editing || location.parentAddress !== null}
                        label={t("columns.parentLocation")}
                        placeholder={t("none")}
                        onChange={(value) =>
                          update(location.id, {
                            parentLocation: value,
                            parentAddress: null,
                          })
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
                            update(
                              location.id,
                              // Turning member booking off takes the count with
                              // it: a quota on a location members can't book
                              // is a number nothing can explain.
                              key === "memberBooking" && !checked
                                ? { memberBooking: false, memberBookingCount: null }
                                : { [key]: checked },
                            )
                          }
                        />
                      </Td>
                    ))}

                    <Td>
                      {renaming === location.id ? (
                        <Input
                          className={cn(compactInput, "w-16")}
                          type="number"
                          min={1}
                          max={COUNT_MAX}
                          // A count only means something where members can
                          // book at all, so it follows that switch.
                          disabled={!location.memberBooking}
                          value={location.memberBookingCount ?? ""}
                          aria-label={t("columns.memberBookingCount")}
                          onChange={(event) =>
                            update(location.id, {
                              memberBookingCount:
                                event.target.value === ""
                                  ? null
                                  : Number(event.target.value),
                            })
                          }
                        />
                      ) : location.memberBookingCount === null ? (
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
                      {renaming === location.id ? (
                        <Input
                          className={cn(compactInput, "w-40")}
                          value={location.directions ?? ""}
                          maxLength={DIRECTIONS_MAX}
                          aria-label={t("columns.directions")}
                          onChange={(event) =>
                            update(location.id, {
                              directions: event.target.value || null,
                            })
                          }
                        />
                      ) : (
                        <span className="text-[13px] text-subtle">
                          {location.directions ?? t("none")}
                        </span>
                      )}
                    </Td>

                    {editing ? (
                      <Td>
                        <div className="flex items-center gap-1">
                          {/* Opens this row's name and code for typing. */}
                          <button
                            type="button"
                            aria-label={t("editRow", { name: location.name })}
                            aria-pressed={renaming === location.id}
                            onClick={() =>
                              setRenaming(
                                renaming === location.id ? null : location.id,
                              )
                            }
                            className={cn(
                              "inline-flex size-7 items-center justify-center rounded-md transition-colors outline-none hover:bg-badge hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/40",
                              renaming === location.id
                                ? "bg-badge text-ink"
                                : "text-ink-muted",
                            )}
                          >
                            <Icon name="edit" size="xs" />
                          </button>

                          {/* Asks first, always - the API hard-deletes the
                              whole branch and there is no undo. */}
                          <button
                            type="button"
                            aria-label={t("delete.action", {
                              name: location.name,
                            })}
                            onClick={() => setDeleteTarget(location)}
                            className="inline-flex size-7 items-center justify-center rounded-md text-ink-muted transition-colors outline-none hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring/40"
                          >
                            <Icon name="delete" size="xs" />
                          </button>
                        </div>
                      </Td>
                    ) : null}
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
              // A name or code that was just typed and can't be sent is worth
              // saying before the API does.
              error={problem ?? failure}
              pending={saving}
              dirty={dirty}
              saveDisabled={problem !== undefined}
              cancelLabel={tEditing("cancel")}
              saveLabel={tEditing("save")}
              onCancel={() => {
                setRows(locations);
                setFailure(undefined);
                setRenaming(null);
                setEditing(false);
              }}
              onSave={save}
            />
          ) : null}
        </>
      ) : null}

      {/*
        Two questions, one dialog. A court with nothing under it is a single
        row, and asking plainly is enough; a hall is itself and everything
        inside it, and "delete Hafnia" reads like one row right up until
        eleven disappear - so that version counts them and names them.

        The names come from the rows this table holds, which is why the copy
        says "and everything under it" rather than promising the count is the
        whole story: a branch added in another tab is deleted too.
      */}
      {deleteTarget ? (
        <ConfirmDialog
          title={
            deleteChildren.length > 0
              ? t("delete.branchTitle", { name: deleteTarget.name })
              : t("delete.leafTitle", { name: deleteTarget.name })
          }
          description={
            deleteChildren.length > 0
              ? t("delete.branchBody", { count: deleteChildren.length })
              : t("delete.leafBody")
          }
          confirmLabel={t("delete.confirm")}
          cancelLabel={tEditing("cancel")}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        >
          {deleteChildren.length > 0 ? (
            // The names themselves, so it can be recognised rather than
            // trusted. Capped and scrollable: a hall can hold dozens.
            <ul className="max-h-40 overflow-y-auto rounded-lg border border-line bg-page px-3 py-2 text-[13px] text-body">
              {deleteChildren.map((child) => (
                <li key={child.id} className="truncate py-0.5">
                  {child.show} · {child.name}
                </li>
              ))}
            </ul>
          ) : null}
        </ConfirmDialog>
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
