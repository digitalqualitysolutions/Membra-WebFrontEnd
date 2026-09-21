"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addressValuesOf,
  blankAddressValues,
  cleanAddressValue,
  isAddressComplete,
} from "@/features/club/components/address-fields";
import {
  CardHeader,
  PencilButton,
  SaveBar,
  Switch,
  Td,
  Th,
  compactInput,
} from "@/features/club/components/record-parts";
import type {
  AddressChange,
  NewAddressValues,
} from "@/features/club/services/state";
import { saveClubAction } from "@/features/club/services/update-club";
import type { ClubAddress, ClubDetails } from "@/features/club/types";
import { cn } from "@/lib/utils";

/** An address added in this edit, not stored yet. */
type NewAddressRow = { key: string; values: NewAddressValues };

/** One row of the addresses table as it's drawn: stored, new, open or not. */
type AddressRow = {
  key: string;
  /** The stored address, or `null` for one added in this edit. */
  saved: ClubAddress | null;
  /** What's being typed, when the row is open. */
  values: NewAddressValues | null;
};

/** The id of an address row's first input, so it can be focused by hand. */
const nameInputId = (key: string) => `club-address-${key}-name`;

const primaryIdOf = (club: ClubDetails) =>
  club.addresses.find((address) => address.prime === "primary")?.id ?? null;

/** The fields of an address that differ from what's stored - and only those. */
function changedAddressFields(
  typed: NewAddressValues,
  stored: NewAddressValues,
): Partial<NewAddressValues> {
  return Object.fromEntries(
    (Object.keys(typed) as (keyof NewAddressValues)[])
      .filter((field) => typed[field].trim() !== stored[field].trim())
      .map((field) => [field, typed[field]]),
  );
}

/**
 * Where the club is, and which of its addresses it answers on.
 *
 * Its own card rather than a band under the details: it's a table that grows,
 * with its own add-a-row, its own pencil and its own save, and none of that is
 * a club parameter you type into a field. The locations card below reads these
 * as the sites a hub books against, so it sits between the two.
 *
 * One pencil, on the card - a row's own pencil opens that row for typing, but
 * only once the card is open, so there's one way in and one save bar out.
 */
export function ClubAddressesCard({
  club,
  onSaved,
}: {
  club: ClubDetails;
  /** The club as the API now holds it, for the cards that share the record. */
  onSaved: (club: ClubDetails) => void;
}) {
  const t = useTranslations("club");
  const locale = useLocale();

  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(true);
  const [saveError, setSaveError] = useState<string>();
  const [saving, startSave] = useTransition();

  // The addresses being edited: stored rows opened by their pencil, rows
  // added in this edit, and which one is meant to lead.
  const [openIds, setOpenIds] = useState<readonly string[]>([]);
  const [edits, setEdits] = useState<Record<string, NewAddressValues>>({});
  const [newRows, setNewRows] = useState<NewAddressRow[]>([]);
  const [primary, setPrimary] = useState(() => primaryIdOf(club));
  /** The row that should take the cursor - the one just added. */
  const [focusKey, setFocusKey] = useState<string | null>(null);
  /**
   * Set when someone switches the primary address off, which does nothing.
   *
   * A club has exactly one primary address, and the way to move it is to
   * switch another one on. A switch that springs back with no word said reads
   * as broken, so the save bar says why until a primary is actually picked.
   */
  const [primaryRefused, setPrimaryRefused] = useState(false);
  /** Keys for added rows. A counter, since reading a clock mid-render is impure. */
  const nextRow = useRef(1);

  /** Everything back to what's saved, so a cancelled edit leaves no trace. */
  function reset(from: ClubDetails) {
    setSaveError(undefined);
    setOpenIds([]);
    setEdits({});
    setNewRows([]);
    setPrimary(primaryIdOf(from));
    setFocusKey(null);
    setPrimaryRefused(false);
  }

  function cancel() {
    reset(club);
    setEditing(false);
  }

  /**
   * The pencil closes what it opened.
   *
   * Closing discards, exactly as Cancel does - the two ways out of an edit
   * shouldn't disagree.
   */
  function toggleEditing() {
    if (saving) return;

    if (editing) {
      cancel();
      return;
    }

    reset(club);
    setEditing(true);
    // A folded card unfolds to be edited. The pencil opening an edit nobody
    // can see is the card refusing to do the thing it was just asked for.
    setOpen(true);
  }

  /**
   * Close whatever address row is open, throwing its typing away.
   *
   * One row at a time: editing an address and adding one are never open
   * together, so opening either closes the other. A primary that pointed at a
   * new row being thrown away goes back to the stored one - a choice made on
   * a stored row is kept, since it isn't an edit of the row being closed.
   */
  function closeOpenRow() {
    setOpenIds([]);
    setEdits({});
    setNewRows([]);
    setFocusKey(null);
    setPrimary((current) =>
      current !== null && current.startsWith("new-")
        ? (primaryIdOf(club) ?? club.addresses[0]?.id ?? null)
        : current,
    );
  }

  /**
   * A stored row's pencil opens it for typing - closing any other open row,
   * the new one included - and closes it again, discarding.
   */
  function toggleRow(id: string) {
    const saved = club.addresses.find((row) => row.id === id);
    if (!saved) return;

    const wasOpen = openIds.includes(id);

    closeOpenRow();

    if (!wasOpen) {
      setOpenIds([id]);
      setEdits({ [id]: addressValuesOf(saved) });
      // The row's inputs appear fresh, so the cursor can land in them.
      setFocusKey(id);
    }
  }

  /**
   * Add a row - closing a stored row that was open. Pressed while a new row is
   * already there, it just puts the cursor back in it rather than stacking a
   * second empty one.
   */
  function addRow() {
    const existing = newRows[0];

    if (existing) {
      // Already on screen, so `autoFocus` won't fire again; focus it directly.
      document.getElementById(nameInputId(existing.key))?.focus();
      return;
    }

    const key = `new-${(nextRow.current += 1)}`;

    closeOpenRow();
    setNewRows([{ key, values: blankAddressValues }]);
    setFocusKey(key);

    // A club with no address yet has nothing else to lead.
    if (club.addresses.length === 0) setPrimary(key);
  }

  function removeNewRow(key: string) {
    setNewRows((rows) => rows.filter((row) => row.key !== key));

    // The row that led is gone: the first stored address takes it back.
    if (primary === key)
      setPrimary(primaryIdOf(club) ?? club.addresses[0]?.id ?? null);
  }

  function updateRow(key: string, patch: Partial<NewAddressValues>) {
    if (newRows.some((row) => row.key === key)) {
      setNewRows((rows) =>
        rows.map((row) =>
          row.key === key
            ? { ...row, values: { ...row.values, ...patch } }
            : row,
        ),
      );
    } else {
      setEdits((current) => ({
        ...current,
        [key]: { ...(current[key] ?? blankAddressValues), ...patch },
      }));
    }
  }

  const rows: AddressRow[] = editing
    ? [
        ...club.addresses.map((saved) => ({
          key: saved.id,
          saved,
          values: openIds.includes(saved.id) ? (edits[saved.id] ?? null) : null,
        })),
        ...newRows.map((row) => ({
          key: row.key,
          saved: null,
          values: row.values,
        })),
      ]
    : club.addresses.map((saved) => ({ key: saved.id, saved, values: null }));

  /** The stored addresses that were actually changed, and every new one. */
  const addressChanges: AddressChange[] = [
    ...openIds.flatMap((id) => {
      const saved = club.addresses.find((row) => row.id === id);
      const typed = edits[id];
      if (!saved || !typed) return [];

      const changed = changedAddressFields(typed, addressValuesOf(saved));

      return Object.keys(changed).length > 0
        ? [{ key: id, addressId: Number(id), values: changed }]
        : [];
    }),
    ...newRows.map((row) => ({
      key: row.key,
      addressId: null,
      values: row.values,
    })),
  ];

  const primaryChanged = editing && primary !== primaryIdOf(club);

  const ready =
    Object.values(edits).every(isAddressComplete) &&
    newRows.every((row) => isAddressComplete(row.values));

  function save() {
    if (!ready || saving) return;

    // Nothing to send - a row's pencil opened and closed, say.
    if (addressChanges.length === 0 && !primaryChanged) {
      cancel();
      return;
    }

    setSaveError(undefined);

    startSave(async () => {
      const result = await saveClubAction({
        locale,
        clubId: club.id,
        // The details card sends its own; this one only ever sends addresses.
        details: null,
        addresses: addressChanges,
        primaryKey: primaryChanged ? primary : null,
      });

      const fresh = result.club ?? club;
      if (result.club) onSaved(result.club);

      if (!result.formError) {
        reset(fresh);
        setEditing(false);
        return;
      }

      /*
       * Stopped partway. What went through is in `fresh` now, so those drafts
       * go; what didn't stays open for another try. A primary picked on a row
       * that was just stored follows it to its new id.
       */
      const stored = result.saved;

      setNewRows((current) => current.filter((row) => !(row.key in stored)));
      setOpenIds((current) => current.filter((id) => !(id in stored)));
      setEdits((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([id]) => !(id in stored)),
        ),
      );
      setPrimary((current) =>
        current !== null && current in stored ? stored[current] : current,
      );
      setSaveError(result.formError);
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <CardHeader
        open={open}
        onToggle={() => {
          const closing = open;

          // Folding the table away shouldn't leave its edit running - and its
          // save bar sitting there - against rows you can't see.
          if (closing && editing) cancel();

          setOpen(!closing);
        }}
        collapseLabel={open ? t("addresses.collapse") : t("addresses.expand")}
        title={t("addresses.title")}
        description={t("addresses.description")}
        editLabel={t("addresses.editAll")}
        onEdit={toggleEditing}
        aside={
          editing ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={addRow}
            >
              <Icon name="add" size="xs" />
              {t("addresses.add")}
            </Button>
          ) : null
        }
      />

      {open ? (
        <div className="border-t border-line px-5 py-4 sm:px-6">
          <AddressTable
            rows={rows}
            editable={editing}
            primary={primary}
            focusKey={focusKey}
            onToggleRow={toggleRow}
            onRemoveRow={removeNewRow}
            onChange={updateRow}
            onMakePrimary={(key) => {
              setPrimary(key);
              setPrimaryRefused(false);
            }}
            onRefusePrimary={() => setPrimaryRefused(true)}
          />
        </div>
      ) : null}

      {editing ? (
        <SaveBar
          message={
            /*
             * Whatever is stopping the save comes first.
             *
             * The note about the primary address is a remark - nothing is
             * wrong, the switch simply doesn't go that way. Said ahead of a
             * field that's still empty, it left the bar explaining something
             * harmless while Save sat greyed out for a reason it never
             * mentioned. A disabled button has to say what would undo it; the
             * remark can wait its turn.
             */
            !ready
              ? t("editing.incomplete")
              : primaryRefused
                ? rows.length > 1
                  ? t("addresses.primaryFixed")
                  : t("addresses.primaryOnly")
                : t("editing.section")
          }
          cancelLabel={t("editing.cancel")}
          saveLabel={t("editing.save")}
          onCancel={cancel}
          onSave={save}
          pending={saving}
          error={saveError}
          saveDisabled={!ready}
        />
      ) : null}
    </section>
  );
}

/**
 * The club's addresses, edited where they're read.
 *
 * An open row turns its own cells into inputs, so each value is typed in the
 * column it's shown in: the address parts under "Address", the code under
 * "Short", the directions under "Directions". The address takes three short
 * lines - name; street and number; postcode and city - rather than one long
 * one the API would have to be told how to split.
 */
function AddressTable({
  rows,
  editable,
  primary,
  focusKey,
  onToggleRow,
  onRemoveRow,
  onChange,
  onMakePrimary,
  onRefusePrimary,
}: {
  rows: readonly AddressRow[];
  editable: boolean;
  /** The row meant to lead, while editing. */
  primary: string | null;
  focusKey: string | null;
  onToggleRow: (id: string) => void;
  onRemoveRow: (key: string) => void;
  onChange: (key: string, patch: Partial<NewAddressValues>) => void;
  onMakePrimary: (key: string) => void;
  /** Someone switched the primary off; the save bar says why. */
  onRefusePrimary: () => void;
}) {
  const t = useTranslations("club");

  /** Which row leads: the one picked in this edit, or the stored one. */
  const leads = (row: AddressRow) =>
    editable ? row.key === primary : row.saved?.prime === "primary";

  /*
   * The primary address at the top, read or edited.
   *
   * It's the address the club answers on, and every other row is read against
   * it, so a list that leads with a secondary makes you hunt for the one that
   * matters.
   *
   * Ordered by the *stored* primary, not the one being picked: a switch
   * pressed here would otherwise pull its own row across the table, out from
   * under the pointer, carrying whatever is half typed in it. So the order
   * holds still for as long as the edit lasts, and the move happens once, on
   * the save that makes the new primary the stored one.
   *
   * `sort` is stable, so everything under the primary keeps the club's own
   * order, and rows added in this edit stay at the bottom where they appeared.
   */
  const ordered = [...rows].sort(
    (a, b) =>
      Number(b.saved?.prime === "primary") -
      Number(a.saved?.prime === "primary"),
  );

  return (
    <div className="overflow-x-auto">
      {/* Wide enough that an open row's three inputs a line stay readable;
          narrower than this the table scrolls rather than squeezing them. */}
      <table className="w-full min-w-250 border-collapse text-left">
        <thead>
          <tr className="border-b border-line">
            {/* Widths rather than auto-sizing: left to itself the table hands
                almost everything to the two long text columns and leaves the
                short code crowded against the directions beside it. The
                address gets the most, since an open row puts six inputs in
                it, but not so much that the directions beside it are a slot. */}
            <Th className="w-[38%]">{t("addresses.address")}</Th>
            <Th className="w-28">{t("addresses.short")}</Th>
            <Th className="w-[32%]">{t("addresses.directions")}</Th>
            <Th className="w-36">{t("addresses.prime")}</Th>
            {editable ? (
              <Th className="w-20 text-right">{t("addresses.actions")}</Th>
            ) : null}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={editable ? 5 : 4}
                className="py-6 text-center text-[13px] text-body"
              >
                {t("addresses.none")}
              </td>
            </tr>
          ) : null}

          {ordered.map((row, index) => {
            const typed = row.values;
            const rank = leads(row) ? "primary" : "secondary";

            /*
             * No red borders on empty fields. Half of a new address is always
             * empty while it's being typed, and marking it made every field
             * look wrong at once. The save bar says what's missing, and Save
             * stays off until it's filled in.
             */
            const input = (
              field: keyof NewAddressValues,
              label: string,
              maxLength: number,
              className?: string,
              /**
               * What the field says when it's empty, where the label is too
               * long for it. "Street no." in a field that narrow is cut to
               * "Street", which is the field beside it — a placeholder that
               * names the wrong thing is worse than a short one. The label
               * itself is unchanged: it's what's read out.
               */
              placeholder = label,
            ) =>
              typed ? (
                <Input
                  className={cn(compactInput, className)}
                  value={typed[field]}
                  maxLength={maxLength}
                  placeholder={placeholder}
                  aria-label={label}
                  aria-required={
                    (field !== "directions" && field !== "region") || undefined
                  }
                  id={field === "name" ? nameInputId(row.key) : undefined}
                  autoFocus={field === "name" && row.key === focusKey}
                  onChange={(event) =>
                    onChange(row.key, {
                      // The same rules the setup card's fields hold to: an
                      // address is typed in two places and is the same thing
                      // in both.
                      [field]: cleanAddressValue(field, event.target.value),
                    })
                  }
                />
              ) : null;

            return (
              <tr
                key={row.key}
                className={cn(
                  "border-b border-line last:border-0",
                  typed && "bg-page/60 align-top",
                )}
              >
                <Td>
                  {typed ? (
                    // Two lines, in the order an address is read:
                    //   Name · Street · Street no.
                    //   City · Zip code · Region (optional)
                    // Twenty-four columns rather than twelve: a house number
                    // is a couple of characters against a street that's a
                    // sentence, and at twelve the narrowest a number could
                    // get was a quarter of the line. The row under it splits
                    // in even thirds, so the city isn't the one field that
                    // runs on.
                    <div className="grid grid-cols-24 gap-2">
                      {input(
                        "name",
                        t("setup.address.name"),
                        60,
                        "col-span-10",
                      )}
                      {input(
                        "streetName",
                        t("setup.address.streetName"),
                        60,
                        "col-span-11",
                      )}
                      {input(
                        "streetNumber",
                        t("setup.address.streetNumber"),
                        20,
                        "col-span-3",
                        t("setup.address.streetNumberShort"),
                      )}
                      {input(
                        "city",
                        t("setup.address.city"),
                        100,
                        "col-span-8",
                      )}
                      {input("zip", t("setup.address.zip"), 14, "col-span-8")}
                      {input(
                        "region",
                        t("setup.address.region"),
                        100,
                        "col-span-8",
                      )}
                    </div>
                  ) : (
                    <span className="text-[13px] text-body">
                      {row.saved?.address}
                    </span>
                  )}
                </Td>

                <Td>
                  {typed ? (
                    input("shortName", t("addresses.short"), 20)
                  ) : (
                    <span className="text-[13px] text-body">
                      {row.saved?.short}
                    </span>
                  )}
                </Td>

                <Td>
                  {typed ? (
                    input("directions", t("addresses.directions"), 255)
                  ) : (
                    <span className="text-[13px] text-body">
                      {row.saved?.directions ?? t("addresses.none")}
                    </span>
                  )}
                </Td>

                <Td>
                  {/* Held to an input's height, so on an open row the toggle
                      sits level with the first line of inputs. */}
                  <div className="flex h-9 items-center">
                    {editable ? (
                      <div className="flex items-center gap-2">
                        {/*
                         * Switching one on makes it the primary address and
                         * switches the rest off. Switching the primary off
                         * does nothing: a club always has exactly one, and
                         * the way to move it is to switch another one on —
                         * which the note under the table then says.
                         */}
                        <Switch
                          size="sm"
                          tone="success"
                          checked={rank === "primary"}
                          onChange={(on) =>
                            on ? onMakePrimary(row.key) : onRefusePrimary()
                          }
                          label={t("addresses.makePrimary", {
                            address:
                              row.saved?.short ||
                              typed?.shortName ||
                              String(index + 1),
                          })}
                        />
                        <span className="text-[13px] text-body italic">
                          {t(`fields.${rank}`)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[13px] text-body italic">
                        {t(`fields.${rank}`)}
                      </span>
                    )}
                  </div>
                </Td>

                {editable ? (
                  <Td className="text-right">
                    <div className="flex h-9 items-center justify-end">
                      {row.saved ? (
                        <PencilButton
                          label={t("addresses.edit")}
                          onClick={() => onToggleRow(row.key)}
                        />
                      ) : (
                        // Not stored yet, so taking it back is just dropping
                        // the row - there's nothing to delete upstream.
                        <button
                          type="button"
                          onClick={() => onRemoveRow(row.key)}
                          aria-label={t("addresses.removeNew")}
                          className="inline-flex size-6 items-center justify-center rounded-md text-ink-muted transition-colors outline-none hover:bg-badge hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/40"
                        >
                          <Icon name="close" size="xs" />
                        </button>
                      )}
                    </div>
                  </Td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
