"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { ReactNode } from "react";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { SeasonRow } from "@/features/season/types";
import { dayMonthYearToIso } from "@/lib/date";
import { cn } from "@/lib/utils";

const NAME_MAX = 60;
const SHORT_MAX = 12;

/** Matches the compact sizing the record cards type into. */
const compact = "h-9 px-3 text-[13px]";

/**
 * The row a season is created from.
 *
 * One line, scrolling sideways the way the table below it does, rather than a
 * grid of stacked fields: it is the same columns the table shows, so reading
 * down from a heading to the value you are about to type is the point.
 *
 * Shown only while the club has no seasons at all - it is the way in before
 * there is a table to add a row to. Once there are seasons the table adds them
 * inline instead, where the new row can be read against the ones around it.
 */
export function AddSeasonPanel({
  seasons,
  onCreate,
  onClose,
}: {
  /** Everything already stored, which is what a short code can't clash with. */
  seasons: readonly SeasonRow[];
  onCreate: (season: SeasonRow) => void;
  onClose: () => void;
}) {
  const t = useTranslations("season");

  const [name, setName] = useState("");
  const [short, setShort] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  // A season has to attach to something, and teams is the ordinary case.
  const [teams, setTeams] = useState(true);
  const [locations, setLocations] = useState(false);
  const [active, setActive] = useState(true);

  /** A key for the created row. A counter, since reading a clock is impure. */
  const nextId = useRef(1);

  /*
   * Both on is fine; both off is a season that registers nobody and allocates
   * nothing. Switching one off turns the other on, the same rule the table's
   * switches follow.
   */
  function pickTeams(checked: boolean) {
    setTeams(checked);
    if (!checked) setLocations(true);
  }

  function pickLocations(checked: boolean) {
    setLocations(checked);
    if (!checked) setTeams(true);
  }

  const code = short.trim();

  const duplicate =
    code.length > 0 &&
    seasons.some((season) => season.short.toLowerCase() === code.toLowerCase());

  const startIso = dayMonthYearToIso(start);
  const endIso = dayMonthYearToIso(end);

  /** A run of days that ends before it starts books nothing at all. */
  const backwards = startIso !== null && endIso !== null && endIso < startIso;

  const ready =
    name.trim().length > 0 &&
    code.length > 0 &&
    !duplicate &&
    startIso !== null &&
    endIso !== null &&
    !backwards;

  function save() {
    if (!ready) return;

    onCreate({
      id: `new-${(nextId.current += 1)}`,
      name: name.trim(),
      short: code,
      start: startIso,
      end: endIso,
      teams,
      locations,
      active,
    });

    onClose();
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <header className="flex items-center justify-between gap-4 px-5 py-3 sm:px-6">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">
          {t("form.title")}
        </h2>

        <button
          type="button"
          onClick={onClose}
          aria-label={t("form.close")}
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
          <Field label={t("columns.season")} className="w-56">
            <Input
              className={compact}
              value={name}
              maxLength={NAME_MAX}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("row.namePlaceholder")}
              aria-label={t("columns.season")}
              autoFocus
            />
          </Field>

          <Field label={t("columns.short")} className="w-28">
            <Input
              className={cn(compact, duplicate && "border-danger")}
              value={short}
              maxLength={SHORT_MAX}
              onChange={(event) => setShort(event.target.value)}
              placeholder={t("row.shortPlaceholder")}
              aria-label={t("columns.short")}
              aria-invalid={duplicate}
            />
          </Field>

          {/* `either`: a season is planned ahead, so the calendar has to offer
              dates a birth date can't. */}
          <Field label={t("columns.start")} className="w-40">
            <DateInput
              span="either"
              groupClassName="h-9"
              className="px-3 text-[13px]"
              value={start}
              onValueChange={setStart}
              placeholder={t("row.datePlaceholder")}
              pickerLabel={t("row.datePicker")}
              aria-label={t("columns.start")}
              autoComplete="off"
            />
          </Field>

          <Field label={t("columns.end")} className="w-40">
            <DateInput
              span="either"
              groupClassName="h-9"
              className="px-3 text-[13px]"
              value={end}
              onValueChange={setEnd}
              placeholder={t("row.datePlaceholder")}
              pickerLabel={t("row.datePicker")}
              aria-label={t("columns.end")}
              autoComplete="off"
              aria-invalid={backwards}
            />
          </Field>

          <Field label={t("columns.teams")} className="w-20">
            <Control>
              <Switch
                checked={teams}
                onChange={pickTeams}
                label={t("columns.teams")}
                tone="success"
              />
            </Control>
          </Field>

          <Field label={t("columns.locations")} className="w-24">
            <Control>
              <Switch
                checked={locations}
                onChange={pickLocations}
                label={t("columns.locations")}
                tone="success"
              />
            </Control>
          </Field>

          <Field label={t("columns.active")} className="w-20">
            <Control>
              <Switch
                checked={active}
                onChange={setActive}
                label={t("columns.active")}
                tone="success"
              />
            </Control>
          </Field>

          <Control>
            <Button type="button" disabled={!ready} onClick={save}>
              <Icon name="save" size="xs" />
              {t("form.save")}
            </Button>
          </Control>
        </div>
      </div>

      {duplicate || backwards ? (
        <div className="border-t border-line px-5 py-3 sm:px-6">
          <p role="alert" className="text-[13px] text-danger">
            {duplicate
              ? t("invalid.shortTaken", { short: code })
              : t("invalid.endBeforeStart", {
                  name: name.trim() || t("row.newName"),
                })}
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
