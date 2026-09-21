"use client";

import { useTranslations } from "next-intl";
import { Fragment, useState } from "react";
import type { ReactNode } from "react";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CardHeader,
  PencilButton,
  SaveBar,
  Td,
  Th,
  compactInput,
} from "@/features/club/components/record-parts";
import type { ClubContact, ClubContactField } from "@/features/club/types";

/** Column order, and the only place it's decided. */
const fields: readonly ClubContactField[] = [
  "phone",
  "email",
  "website",
  "contactPerson",
];

/** The field's name in the record, against its name in the copy. */
const labelKeys = {
  phone: "phone",
  email: "email",
  website: "website",
  contactPerson: "person",
} as const;

/** And against the example shown in the empty field. */
const placeholderKeys = {
  phone: "phonePlaceholder",
  email: "emailPlaceholder",
  website: "websitePlaceholder",
  contactPerson: "personPlaceholder",
} as const;

/** How wide each column sits, so the table doesn't hand it all to the email. */
const widths = {
  phone: "w-[20%]",
  email: "w-[28%]",
  website: "w-[24%]",
  contactPerson: "w-[28%]",
} as const;

const blank: ClubContact = {
  phone: "",
  email: "",
  website: "",
  contactPerson: "",
};

/**
 * A phone number as it's typed: digits, and the punctuation a written number
 * uses to group them.
 *
 * Filtered on the way in rather than complained about afterwards - there's no
 * word anyone could put in this field that we'd want, so the field simply
 * doesn't take one. Spaces, brackets and dashes stay, because a number is read
 * in groups, and a country code keeps its `+`, but only at the front where it
 * means something.
 */
function asPhone(value: string) {
  const kept = value.replace(/[^\d\s+()-]/g, "");
  const country = kept.startsWith("+") ? "+" : "";

  return country + kept.replaceAll("+", "");
}

/** How many digits are actually in there, whatever they're grouped with. */
const digitsIn = (value: string) => value.replace(/\D/g, "").length;

/**
 * The shortest a real number can be.
 *
 * Eight digits is a Danish number, but a club can be reached abroad and short
 * internal lines exist, so this only catches what's plainly a slip - three
 * digits typed and then a tab away.
 */
const minimumDigits = 6;

const phoneIsUsable = (contact: ClubContact) =>
  contact.phone.trim().length === 0 || digitsIn(contact.phone) >= minimumDigits;

/**
 * An address with a name, an `@`, and a domain that has a dot in it.
 *
 * Deliberately not the full grammar of an address: the only honest test is
 * sending mail to it, and a stricter pattern than this mostly succeeds at
 * rejecting addresses that turn out to be real. This catches the slip -
 * a missing `@`, a trailing comma, a domain that stops at "gmail".
 */
const emailPattern = /^[^\s@,]+@[^\s@,]+\.[^\s@,]{2,}$/;

const emailIsUsable = (contact: ClubContact) =>
  contact.email.trim().length === 0 || emailPattern.test(contact.email.trim());

const hasSomething = (contact: ClubContact) =>
  fields.some((field) => contact[field].trim().length > 0);

const trimmed = (contact: ClubContact): ClubContact => ({
  phone: contact.phone.trim(),
  email: contact.email.trim(),
  website: contact.website.trim(),
  contactPerson: contact.contactPerson.trim(),
});

/**
 * How to reach the club.
 *
 * Two pencils, the way the addresses table has them: the card's own turns the
 * actions on and leaves every contact as text, and a row's own turns that row
 * into fields. So the card is read without a column of pencils down the side
 * of it, and changing one contact never opens the rest.
 *
 * A club has more than one way in - the office and the bookings desk, the hall
 * and the chairman - so the card holds a run of contacts, each the same four
 * fields. Adding one and changing one stay apart: the pencil opens what's
 * saved, and Add leaves it alone and puts an empty set of fields below it,
 * where the contact being added is the only thing being typed.
 */
export function ClubContactCard({
  contacts: saved,
}: {
  contacts: ClubContact[];
}) {
  const t = useTranslations("club.contact");
  const tEditing = useTranslations("club.editing");

  // PLACEHOLDER, like the rest of the screen: no club endpoint, so Save writes
  // back to state here and the change is gone on reload.
  const [contacts, setContacts] = useState(saved);
  /**
   * The stored contacts a row's pencil has opened, by their place in the list.
   *
   * A row at a time, the way an address row opens: the rest stay as text
   * while one of them is being typed into.
   */
  const [edits, setEdits] = useState<Record<number, ClubContact>>({});
  /** The contacts being added, below the stored ones. */
  const [adding, setAdding] = useState<ClubContact[]>([]);
  const [open, setOpen] = useState(true);
  /**
   * Whether the card is open for changes.
   *
   * Its own state rather than "is some row open": the card's pencil turns the
   * actions on without opening anything, so there has to be something for it
   * to turn on.
   */
  const [editing, setEditing] = useState(false);

  /**
   * Whether the club has told us anything at all.
   *
   * Four dashes in a row say nothing a sentence couldn't say better, and a
   * pencil beside them is an edit for a record that doesn't exist yet. So an
   * empty card asks to be filled in instead, and becomes the read-and-edit
   * card the others are once it holds something.
   */
  const filled = contacts.length > 0;

  /** The typing thrown away, the rows closed back to what's stored. */
  function reset() {
    setEdits({});
    setAdding([]);
  }

  /** Out of edit mode altogether, discarding whatever was being typed. */
  function cancel() {
    reset();
    setEditing(false);
  }

  /**
   * The card's own pencil: it turns the actions on, and off again.
   *
   * It doesn't open the contacts themselves - that's what each row's pencil
   * is for, and it's only there once this has been pressed. Closing discards,
   * exactly as Cancel does, so the two ways out of an edit agree.
   */
  function toggleEditing() {
    if (editing) {
      cancel();
      return;
    }

    setEditing(true);
    // A folded card unfolds to be edited, the way it does to be added to.
    // The pencil opening an edit nobody can see is the card refusing to do
    // the thing it was just asked for.
    setOpen(true);
  }

  /** One stored row, opened or closed again by its own pencil. */
  function toggleRow(index: number) {
    setEdits((current) => {
      if (index in current) {
        const rest = { ...current };
        delete rest[index];
        return rest;
      }

      return { ...current, [index]: contacts[index]! };
    });
  }

  /** An empty set of fields under everything already on the card. */
  function addContact() {
    setAdding((current) => [...current, blank]);
    // Reached from the empty card as well as from the header, and there it's
    // the way in: a card with nothing saved has no pencil to press first.
    setEditing(true);
    setOpen(true);
  }

  /** What a field keeps of what was typed into it. */
  const clean = (field: ClubContactField, value: string) =>
    field === "phone" ? asPhone(value) : value;

  const patchSaved = (index: number, field: ClubContactField, value: string) =>
    setEdits((current) =>
      index in current
        ? {
            ...current,
            [index]: { ...current[index]!, [field]: clean(field, value) },
          }
        : current,
    );

  const patchAdded = (index: number, field: ClubContactField, value: string) =>
    setAdding((current) =>
      current.map((contact, at) =>
        at === index ? { ...contact, [field]: clean(field, value) } : contact,
      ),
    );

  function save() {
    // What was typed into an open row, and what was already there for the
    // rest. A stored contact emptied out is a contact deleted, and a set of
    // fields nobody typed into was never a contact at all.
    setContacts(
      [...contacts.map((row, index) => edits[index] ?? row), ...adding]
        .map(trimmed)
        .filter(hasSomething),
    );
    cancel();
  }

  /*
   * A second set of fields only once the one before it holds something.
   * Offering an empty set under an empty set leaves two of them, and nobody
   * can tell which was meant - the same reason setup waits before offering a
   * second address. The button stays where it is and stops working rather
   * than coming and going, which would move the header under the pointer.
   */
  const canAdd =
    adding.length === 0 || hasSomething(adding[adding.length - 1]!);

  /**
   * What's wrong with what's being typed, if anything.
   *
   * Checked at the save rather than under each field: a number and an address
   * are both half written for as long as it takes to write them, and marking
   * one wrong on the way there is the field arguing with someone who is doing
   * nothing wrong. Both are optional, so only what's been filled in is held to
   * a shape.
   */
  const typing = [...Object.values(edits), ...adding];
  const problem = !typing.every(phoneIsUsable)
    ? t("phoneInvalid")
    : !typing.every(emailIsUsable)
      ? t("emailInvalid")
      : undefined;

  /**
   * One contact as a row of the table: four cells, read or typed.
   *
   * The columns are named once at the top, the way the addresses are, rather
   * than over every contact - a club with four contacts would otherwise read
   * "Phone number" four times down the card.
   */
  const row = (
    contact: ClubContact,
    onChange: ((field: ClubContactField, value: string) => void) | null,
    action: ReactNode,
  ) => (
    <tr className="border-b border-line last:border-0">
      {fields.map((field) => {
        const label = t(labelKeys[field]);

        return (
          <Td key={field}>
            {onChange ? (
              <Input
                className={compactInput}
                value={contact[field]}
                onChange={(event) => onChange(field, event.target.value)}
                placeholder={t(placeholderKeys[field])}
                aria-label={label}
                // The right keyboard on a phone: a number pad for the number,
                // an `@` within reach for the address. Hints to the device,
                // not rules - what's allowed is settled above and at the save.
                {...(field === "phone"
                  ? { type: "tel", inputMode: "tel" as const }
                  : field === "email"
                    ? { type: "email", inputMode: "email" as const }
                    : {})}
              />
            ) : (
              // A contact can still be missing one of the four, and a blank
              // there reads as "not set".
              <span className="text-[13px] text-body">
                {contact[field] || t("none")}
              </span>
            )}
          </Td>
        );
      })}

      {/* The actions arrive with the edit, the way the addresses table's do.
          A card being read has nothing to act on, and a pencil on every row
          beside the one in the header is the same way in offered twice. */}
      {editing ? (
        <Td className="text-right">
          {/* Holds the row's height whether the button is a pencil or a cross,
              so an open row and a closed one line up. */}
          <div className="flex h-9 items-center justify-end">{action}</div>
        </Td>
      ) : null}
    </tr>
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <CardHeader
        open={open}
        onToggle={() => {
          const closing = open;

          // Folding the card away shouldn't leave its edit running - and its
          // Add button sitting in the header - over rows you can't see. The
          // save bar goes with them, so an edit left open behind a closed card
          // is one nothing can finish or call off.
          if (closing && editing) cancel();

          setOpen(!closing);
        }}
        collapseLabel={t("title")}
        title={t("title")}
        editLabel={t("editAll")}
        // The pencil closes what it opened. Either way it reloads from what's
        // saved, so opening starts clean and closing discards, the way Cancel
        // does - the two ways out of an edit shouldn't disagree.
        //
        // No pencil until something is saved: it's for coming back to a
        // record that exists, and an empty card has the button in the middle
        // of it as the way in instead.
        onEdit={filled ? toggleEditing : undefined}
        aside={
          <div className="flex items-center gap-3">
            {/* The club's address, up where you can read it without opening
                the card - it's the one field anyone comes here to copy. */}
            {contacts[0]?.email ? (
              <span className="truncate text-[13px] text-subtle">
                {contacts[0].email}
              </span>
            ) : null}

            {/*
             * Only while an edit is open, the way "Add address" is on the
             * card above: adding a contact is part of changing the record,
             * and a card being read has nothing for it to add to. The pencil
             * is the way in; this is what's there once you're in.
             *
             * An empty card is the exception that needs no exception — it has
             * no pencil, and offers the same thing in the middle of itself.
             */}
            {editing ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canAdd}
                onClick={addContact}
              >
                <Icon name="add" size="xs" />
                {t("add")}
              </Button>
            ) : null}
          </div>
        }
      />

      {open ? (
        <>
          {!filled && adding.length === 0 ? (
            <div className="flex flex-col items-center gap-3 border-t border-line px-5 py-10 text-center sm:px-6">
              <div className="max-w-md">
                <p className="text-[14px] font-medium text-ink">{t("empty")}</p>
                <p className="mt-1 text-[13px] text-subtle">{t("emptyBody")}</p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addContact}
              >
                <Icon name="add" size="xs" />
                {t("add")}
              </Button>
            </div>
          ) : null}

          {filled || adding.length > 0 ? (
            <div className="overflow-x-auto border-t border-line px-5 py-2 sm:px-6">
              {/* Wide enough that an open row's four inputs stay readable;
                  narrower than this the table scrolls rather than squeezing
                  them. */}
              <table className="w-full min-w-200 border-collapse text-left">
                <thead>
                  <tr className="border-b border-line">
                    {fields.map((field) => (
                      <Th key={field} className={widths[field]}>
                        {t(labelKeys[field])}
                      </Th>
                    ))}

                    {editing ? (
                      <Th className="w-20 text-right">{t("actions")}</Th>
                    ) : null}
                  </tr>
                </thead>

                <tbody>
                  {/* What's stored, as text or as its pencil's inputs. */}
                  {contacts.map((contact, index) => (
                    // Keyed by position: a contact has no id of its own, and
                    // what's typed into one isn't unique while it's typed.
                    <Fragment key={`saved-${index}`}>
                      {row(
                        edits[index] ?? contact,
                        index in edits
                          ? (field, value) => patchSaved(index, field, value)
                          : null,
                        <PencilButton
                          label={t("edit", { number: index + 1 })}
                          onClick={() => toggleRow(index)}
                        />,
                      )}
                    </Fragment>
                  ))}

                  {/* And under it, the contact being added. */}
                  {adding.map((contact, index) => (
                    <Fragment key={`adding-${index}`}>
                      {row(
                        contact,
                        (field, value) => patchAdded(index, field, value),
                        // Not stored yet, so taking it back is just dropping
                        // the row - there's nothing to delete upstream.
                        <button
                          type="button"
                          onClick={() =>
                            setAdding((current) =>
                              current.filter((_, at) => at !== index),
                            )
                          }
                          aria-label={t("remove", {
                            number: contacts.length + index + 1,
                          })}
                          className="inline-flex size-6 items-center justify-center rounded-md text-ink-muted transition-colors outline-none hover:bg-badge hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/40"
                        >
                          <Icon name="close" size="xs" />
                        </button>,
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {editing ? (
            <SaveBar
              message={t("editing")}
              error={problem}
              saveDisabled={problem !== undefined}
              cancelLabel={tEditing("cancel")}
              saveLabel={tEditing("save")}
              onCancel={cancel}
              onSave={save}
            />
          ) : null}
        </>
      ) : null}
    </section>
  );
}
