"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { ReactNode } from "react";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ClubAddress } from "@/features/club/types";
import type { LocationRow } from "@/features/location/types";
import { TestModeNotice } from "@/features/testing/components/test-mode-notice";
import { cn } from "@/lib/utils";

/**
 * What a `Select` uses for "nothing chosen".
 *
 * Radix refuses an empty string as an item value - it reserves it for clearing
 * the control - so the empty case needs a token of its own, converted back to
 * `null` on the way out.
 */
const NONE = "none";

/** Matches the compact sizing the record cards type into. */
const compact = "h-9 px-3 text-[13px]";
const compactTrigger = "h-9 px-3 text-[13px] data-[size=default]:h-9";

/**
 * The row a new hub, zone or court is created from.
 *
 * One line, scrolling sideways the way the table below it does, rather than a
 * grid of stacked fields: it is the same nine columns the table shows, so
 * reading down from a heading to the value you are about to type is the point.
 *
 * Every value here is what a location gets when nothing has been chosen to
 * copy: bookable by members, not listed publicly, active. Those three describe
 * the ordinary case - a court the club has just built and wants its own members
 * booking, before deciding whether the public timetable should carry it.
 *
 * PLACEHOLDER, like the rest of the screen: `onCreate` hands the row upwards
 * and the table shows it. Nothing is posted anywhere yet.
 */
export function AddLocationPanel({
  addresses,
  locations,
  onCreate,
  onClose,
  testMode = false,
}: {
  /** The club's own addresses, which are what a hub is parented to. */
  addresses: readonly ClubAddress[];
  /** Everything already in the table, which is what a child is parented to. */
  locations: readonly LocationRow[];
  onCreate: (location: LocationRow) => void;
  onClose: () => void;
  /** TEMPORARY: empty view testing mode is on, so Save keeps nothing. */
  testMode?: boolean;
}) {
  const t = useTranslations("location.form");

  /** Set when Save was pressed in testing mode and refused. */
  const [blocked, setBlocked] = useState(false);

  const [name, setName] = useState("");
  const [short, setShort] = useState("");
  const [site, setSite] = useState(NONE);
  const [parent, setParent] = useState(NONE);
  const [bookable, setBookable] = useState(true);
  const [quota, setQuota] = useState("");
  const [listed, setListed] = useState(false);
  const [active, setActive] = useState(true);

  /**
   * Ids for rows that only exist on screen.
   *
   * A counter rather than a clock: `Date.now()` read from a component body is
   * impure, and two locations added inside the same millisecond would collide
   * on a key anyway. Nothing outside this session ever sees these.
   */
  const created = useRef(0);

  /**
   * What a child can hang off: hubs and zones, never a court.
   *
   * Court codes repeat - every hall has a Bane 1 - so offering them would let
   * you point at a parent the table can't tell apart from three others.
   */
  const parents = locations.filter((location) => location.kind !== "court");

  /** The two things that can't be defaulted or derived. */
  const ready = name.trim().length > 0 && short.trim().length > 0;

  function save() {
    // TEMPORARY testing switch - see `features/testing`. The row stays open
    // and filled in, so the screen can go on being tested; nothing leaves it.
    if (testMode) {
      setBlocked(true);
      return;
    }

    const above = parents.find((location) => location.short === parent);

    // No parent means this is a hub. Below one, a location that members book
    // is a court and a location they don't is a zone that only groups things -
    // which is the distinction the two already in the table are drawn on.
    const kind = !above ? "hub" : bookable ? "court" : "zone";

    onCreate({
      id: `new-${(created.current += 1)}`,
      name: name.trim(),
      kind,
      depth: kind === "hub" ? 0 : kind === "zone" ? 1 : 2,
      short: short.trim(),
      show: above ? `${above.show}.${short.trim()}` : short.trim(),
      parentAddress: site === NONE ? null : site,
      parentLocation: above?.short ?? null,
      memberBooking: bookable,
      teamMemberBooking: false,
      memberBookingCount: bookable && quota ? Number(quota) : null,
      publicListed: listed,
      friends: false,
      active,
      directions: null,
      site: null,
      surface: null,
      // Groups are owned by their own screen; a new location joins none.
      groups: [],
    });

    onClose();
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <header className="flex items-center justify-between gap-4 px-5 py-3 sm:px-6">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">
          {t("title")}
        </h2>

        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors outline-none hover:bg-badge hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Icon name="close" size="xs" />
        </button>
      </header>

      <div className="overflow-x-auto border-t border-line px-5 py-4 sm:px-6">
        {/* `w-max` rather than a guessed min-width: the row is exactly as wide
            as the fields need and scrolls from there, so no column has to be
            squeezed to make an invented total fit. */}
        <div className="flex w-max items-end gap-4">
          <Field label={t("name")} className="w-56">
            <Input
              className={compact}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("namePlaceholder")}
              aria-label={t("name")}
            />
          </Field>

          <Field label={t("short")} className="w-24">
            <Input
              className={compact}
              value={short}
              onChange={(event) => setShort(event.target.value)}
              placeholder={t("shortPlaceholder")}
              aria-label={t("short")}
            />
          </Field>

          <Field label={t("parentSite")} className="w-64">
            <Choice
              value={site}
              onChange={setSite}
              label={t("parentSite")}
              none={t("none")}
              options={addresses.map((address) => ({
                value: address.short,
                label: `${address.short} (${address.address})`,
              }))}
            />
          </Field>

          <Field label={t("parentLocation")} className="w-48">
            <Choice
              value={parent}
              onChange={setParent}
              label={t("parentLocation")}
              none={t("none")}
              options={parents.map((location) => ({
                value: location.short,
                label: `${location.short} (${location.name})`,
              }))}
            />
          </Field>

          <Field label={t("memberBookable")} className="w-28">
            <Control>
              <Switch
                checked={bookable}
                onChange={setBookable}
                label={t("memberBookable")}
                tone="success"
              />
            </Control>
          </Field>

          <Field label={t("toBook")} className="w-24">
            {/* A quota only means something where members can book at all, so
                it follows the switch beside it rather than sitting there
                contradicting it. */}
            <Input
              className={compact}
              type="number"
              min={1}
              value={quota}
              disabled={!bookable}
              onChange={(event) => setQuota(event.target.value)}
              placeholder={t("none")}
              aria-label={t("toBook")}
            />
          </Field>

          <Field label={t("public")} className="w-20">
            <Control>
              <Switch
                checked={listed}
                onChange={setListed}
                label={t("public")}
                tone="success"
              />
            </Control>
          </Field>

          <Field label={t("active")} className="w-20">
            <Control>
              <Switch
                checked={active}
                onChange={setActive}
                label={t("active")}
                tone="success"
              />
            </Control>
          </Field>

          <Field label={t("inGroups")} className="w-36">
            {/* Read-only: groups are built on their own screen, out of
                locations that already exist, so there is nothing to join yet. */}
            <Control>
              <span className="text-[13px] text-subtle">{t("none")}</span>
            </Control>
          </Field>

          <Control>
            <Button type="button" disabled={!ready} onClick={save}>
              <Icon name="save" size="xs" />
              {t("save")}
            </Button>
          </Control>
        </div>
      </div>

      {blocked ? (
        <div className="border-t border-line px-5 py-3 sm:px-6">
          <TestModeNotice />
        </div>
      ) : null}
    </section>
  );
}

/** A labelled slot in the row, its heading sitting over the control. */
function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-w-0 shrink-0", className)}>
      <span className="block truncate text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
        {label}
      </span>

      <div className="mt-2">{children}</div>
    </div>
  );
}

/**
 * Holds a control that isn't an input to the input's own height.
 *
 * A switch is 24px and a button 32px against the field's 36px, so without this
 * the row's baseline moves every time the kind of control changes.
 */
function Control({ children }: { children: ReactNode }) {
  return <div className="flex h-9 shrink-0 items-center">{children}</div>;
}

/** A dropdown that reads as a dash until something is picked. */
function Choice({
  value,
  options,
  label,
  none,
  onChange,
}: {
  value: string;
  options: readonly { value: string; label: string }[];
  label: string;
  none: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("w-full", compactTrigger)} aria-label={label}>
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value={NONE}>{none}</SelectItem>

        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
