"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
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
import { createLocationAction } from "@/features/club/services/create-location";
import type { ClubAddress } from "@/features/club/types";
import type { LocationRow } from "@/features/location/types";
import { cn } from "@/lib/utils";

/**
 * What a `Select` uses for "nothing chosen".
 *
 * Radix refuses an empty string as an item value - it reserves it for clearing
 * the control - so the empty case needs a token of its own, converted back to
 * `null` on the way out.
 */
const NONE = "none";

/** The API's cap on a location's short code. */
const SHORT_MAX = 8;

/** Matches the compact sizing the record cards type into. */
const compact = "h-9 px-3 text-[13px]";
const compactTrigger = "h-9 px-3 text-[13px] data-[size=default]:h-9";

/**
 * A row's id as the API knows it, or `null` for one that only exists on screen.
 *
 * Every row comes from the API now, so in practice this always answers. It
 * stays because a parent travels to the API as an id: if a row ever arrives
 * without a real one, refusing to offer it as a parent is the safe way to be
 * wrong - sending a made-up id would be refused, and quietly sending `null`
 * instead would create a hub where a court was meant.
 */
function apiId(id: string): number | null {
  return /^\d+$/.test(id) ? Number(id) : null;
}

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
 * Save posts to `POST /clubs/{clubId}/locations` and hands the stored row
 * upwards, so the table shows what the API kept rather than what was typed -
 * `show` in particular is the API's to compose, not ours to predict.
 */
export function AddLocationPanel({
  clubId,
  addresses,
  locations,
  onCreate,
  onClose,
}: {
  /** The club being added to. `null` when the member runs none, which
      disables Save: there is nothing to create a location under. */
  clubId: number | null;
  /** The club's own addresses, which are what a hub is parented to. */
  addresses: readonly ClubAddress[];
  /** Everything already in the table, which is what a child is parented to. */
  locations: readonly LocationRow[];
  onCreate: (location: LocationRow) => void;
  onClose: () => void;
}) {
  const t = useTranslations("location.form");
  const locale = useLocale();

  /** Why the API turned the location down, already in the member's language. */
  const [failure, setFailure] = useState<string | null>(null);

  const [saving, startSaving] = useTransition();

  const [name, setName] = useState("");
  const [short, setShort] = useState("");
  const [site, setSite] = useState(NONE);
  const [parent, setParent] = useState(NONE);
  const [bookable, setBookable] = useState(true);
  const [quota, setQuota] = useState("");
  const [listed, setListed] = useState(false);
  const [active, setActive] = useState(true);

  /**
   * What a child can hang off: any location at all, at any depth.
   *
   * Courts included - a court is only a leaf until something is put under it,
   * and a club that splits `Bane 1` into halves needs exactly that. It stops
   * reading as a court and starts reading as a zone once it has children.
   *
   * Offering them is only safe because the options below are keyed by id.
   * Court codes repeat - every hall has a `Bane 1` - so a list keyed by short
   * code would resolve the wrong one without saying so.
   *
   * Rows the API doesn't know about are left out: a parent is sent as its id,
   * so one without a real id can't be named as a parent at all.
   */
  const parents = locations.filter((location) => apiId(location.id) !== null);

  // The two are exclusive, so setting one clears the other.
  function pickSite(value: string) {
    setSite(value);
    if (value !== NONE) setParent(NONE);
  }

  function pickParent(value: string) {
    setParent(value);
    if (value !== NONE) setSite(NONE);
  }

  /**
   * Short codes already taken where this one would sit.
   *
   * Siblings only. `HH.i.1` and `RP.1` are both fine - it's two `1`s under the
   * same parent that would collide, since the API builds the dotted name from
   * the parent chain plus this code.
   */
  const takenHere = new Set(
    locations
      .filter((location) => (location.parentLocation ?? NONE) === parent)
      .map((location) => location.short.trim().toLowerCase()),
  );

  const duplicate =
    short.trim().length > 0 && takenHere.has(short.trim().toLowerCase());

  /**
   * A dot would break the dotted name it goes into - `HH.i` as a code makes
   * `HH.i.HH.i`, with no way to tell where one step ends. Spaces go too, since
   * the code is read as one token.
   */
  const malformed = /[.\s]/.test(short.trim());

  /** The two things that can't be defaulted or derived, and a club to put them in. */
  const ready =
    clubId !== null &&
    name.trim().length > 0 &&
    short.trim().length > 0 &&
    !duplicate &&
    !malformed;

  function save() {
    if (clubId === null) return;

    const above = parents.find((location) => location.id === parent);
    const chosenSite = addresses.find((address) => address.short === site);

    setFailure(null);

    startSaving(async () => {
      const result = await createLocationAction({
        locale,
        clubId,
        values: {
          name,
          shortName: short,
          parentLocationId: above ? apiId(above.id) : null,
          // The club's addresses come from the API, so this id is already real.
          clubAddressId: chosenSite ? Number(chosenSite.id) : null,
          directions: "",
          canMemberBook: bookable,
          // Neither has a control in this row yet, and the table shows both as
          // off for a location nobody has opened up. Sent rather than left out
          // so what is stored matches what the row said.
          canTeamBook: false,
          memberReqToBook: bookable && quota ? Number(quota) : null,
          public: listed,
          canFriendshipClubBook: false,
          active,
        },
      });

      if (result.formError !== undefined) {
        setFailure(result.formError);
        return;
      }

      // Nothing stored and nothing refused can't happen, but the type allows
      // it; leaving the row open is the harmless way to be wrong.
      const stored = result.location;
      if (!stored) return;

      onCreate({
        // The API's own id and dotted code - `shownName` is composed upstream.
        id: String(stored.id),
        name: stored.name,
        // One below whatever it was put under, however deep that already was.
        depth: above ? above.depth + 1 : 0,
        short: stored.short,
        show: stored.show,
        parentAddress: site === NONE ? null : site,
        parentLocation: above?.id ?? null,
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
    });
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
              className={cn(compact, (duplicate || malformed) && "border-danger")}
              value={short}
              // The API's own cap, so 9 characters is stopped here rather than
              // coming back as a flat "something went wrong".
              maxLength={SHORT_MAX}
              onChange={(event) => setShort(event.target.value)}
              placeholder={t("shortPlaceholder")}
              aria-label={t("short")}
              aria-invalid={duplicate || malformed}
            />
          </Field>

          {/* A site makes it a root node; a parent location makes it a child
              that inherits one. Picking either rules the other out. */}
          <Field label={t("parentSite")} className="w-64">
            <Choice
              value={site}
              onChange={pickSite}
              disabled={parent !== NONE}
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
              onChange={pickParent}
              disabled={site !== NONE}
              label={t("parentLocation")}
              none={t("none")}
              // `HH.i.1 (Bane 1)` - the dotted code says which hall's Bane 1
              // this is, where the short code alone reads the same for all.
              options={parents.map((location) => ({
                value: location.id,
                label: `${location.show} (${location.name})`,
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
              // The API's own range. Without the cap, a 40 here comes back as
              // a flat "something went wrong" from the schema rather than as
              // the number being out of range.
              min={1}
              max={30}
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
            <Button type="button" disabled={!ready || saving} onClick={save}>
              <Icon name="save" size="xs" />
              {t("save")}
            </Button>
          </Control>
        </div>
      </div>

      {duplicate || malformed ? (
        <div className="border-t border-line px-5 py-3 sm:px-6">
          <p role="alert" className="text-[13px] text-danger">
            {malformed
              ? t("shortInvalid")
              : t("shortTaken", { short: short.trim() })}
          </p>
        </div>
      ) : null}

      {/* The row stays open and filled in behind this: whatever the API
          refused, retyping the other eight fields isn't the way to fix it. */}
      {failure ? (
        <div className="border-t border-line px-5 py-3 sm:px-6">
          <p role="alert" className="text-[13px] text-danger">
            {failure}
          </p>
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
  disabled = false,
  onChange,
}: {
  value: string;
  options: readonly { value: string; label: string }[];
  label: string;
  none: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
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
