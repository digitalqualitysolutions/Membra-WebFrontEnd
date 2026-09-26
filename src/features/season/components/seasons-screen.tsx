"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";

import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  CardHeader,
  Chip,
  SaveBar,
  compactInput,
} from "@/features/club/components/record-parts";
import {
  SEASON_NAME_MAX,
  SEASON_SHORT_MAX,
} from "@/features/club/api/season-wire";
import { AddSeasonPanel } from "@/features/season/components/add-season-panel";
import { SeasonHelp } from "@/features/season/components/season-help";
import { saveSeasonsAction } from "@/features/season/services/save-seasons";
import type {
  NewSeason,
  SeasonChange,
} from "@/features/season/services/season-state";
import type { SeasonRow, SeasonToggle } from "@/features/season/types";
import { dayMonthYearToIso, fromIsoDate } from "@/lib/date";
import { useServerSync } from "@/lib/use-server-sync";
import { cn } from "@/lib/utils";

/** The on/off columns, in the order the table shows them. */
const toggleColumns = [
  { key: "teams", label: "teams" },
  { key: "locations", label: "locations" },
  { key: "active", label: "active" },
] as const;

/** The API's own caps, so an over-long value can't be typed in the first place. */
const NAME_MAX = SEASON_NAME_MAX;
const SHORT_MAX = SEASON_SHORT_MAX;

/** Lets Add put the cursor back in a row that's already on screen. */
const nameInputId = (id: string) => `season-name-${id}`;

/**
 * A season while it's being typed into.
 *
 * Dates are the masked `DD / MM / YYYY` here rather than the stored ISO, because
 * a date halfway through being typed isn't a date yet - `03 / 1` has to survive
 * the next keystroke, and there's no ISO form of it to hold it in.
 */
type SeasonDraft = Omit<SeasonRow, "start" | "end"> & {
  start: string;
  end: string;
  /**
   * Added during this edit and never saved.
   *
   * Such a row has no read state to fall back to - collapsing it would leave a
   * line reading "New season" and three dashes - so it stays open for typing
   * and goes without the pencil that would close it.
   */
  added: boolean;
};

const toDraft = (season: SeasonRow): SeasonDraft => ({
  ...season,
  start: fromIsoDate(season.start),
  end: fromIsoDate(season.end),
  added: false,
});

/**
 * Only ever called once a draft has passed `firstProblem`, so the dates parse.
 *
 * Field by field rather than by spread: `added` is the draft's own bookkeeping
 * and has no business being saved onto the season.
 */
const fromDraft = (draft: SeasonDraft): SeasonRow => ({
  id: draft.id,
  name: draft.name.trim(),
  short: draft.short.trim(),
  start: dayMonthYearToIso(draft.start) ?? "",
  end: dayMonthYearToIso(draft.end) ?? "",
  teams: draft.teams,
  locations: draft.locations,
  active: draft.active,
});

/**
 * What flipping one of a row's switches actually changes.
 *
 * Teams and locations are what a season attaches to, and it has to attach to
 * something: both on is fine, both off is a season that registers nobody and
 * allocates nothing. So switching one off turns the other on rather than
 * refusing the click - the member said which one they wanted off, and there is
 * only one way left to honour it. Turning one *on* never disturbs the other.
 *
 * `active` is a different question - whether the season runs at all - so it
 * passes straight through.
 */
function toggle(key: SeasonToggle, checked: boolean): Partial<SeasonDraft> {
  if (checked || key === "active") return { [key]: checked };

  return key === "teams"
    ? { teams: false, locations: true }
    : { locations: false, teams: true };
}

/**
 * Whether a row holds everything a season needs.
 *
 * What Add reads to decide the table is ready for another one. Deliberately
 * the shape of a season rather than every rule `firstProblem` applies - a code
 * that clashes with another row's is a problem to fix, not a reason to refuse
 * to start the next row.
 */
function isComplete(row: SeasonDraft) {
  const start = dayMonthYearToIso(row.start);
  const end = dayMonthYearToIso(row.end);

  return (
    row.name.trim().length > 0 &&
    row.short.trim().length > 0 &&
    start !== null &&
    end !== null &&
    end >= start
  );
}

/**
 * The club's operational year.
 *
 * Holds the list in state rather than reading the prop directly, so the note
 * above the table and the table itself can't disagree about which season is
 * running - switching one off has to move both - and so a save can put the
 * API's answer straight back on screen without waiting for a round trip.
 */
export function SeasonsScreen({
  seasons: saved,
  clubId,
}: {
  seasons: SeasonRow[];
  /** The club these belong to. `null` when the member runs none, which
      leaves the screen read-only: there is nothing to create a season under. */
  clubId: number | null;
}) {
  const t = useTranslations("season");
  const locale = useLocale();
  const router = useRouter();

  const [seasons, setSeasons] = useState(saved);
  const [rows, setRows] = useState(() => saved.map(toDraft));

  /** Whether the first-run panel is open, before there is a table to add to. */
  const [adding, setAdding] = useState(false);

  /** Keys for added rows. A counter, since reading a clock mid-render is impure. */
  const nextRow = useRef(1);

  /** Why the last save didn't go through, already in the member's language. */
  const [failure, setFailure] = useState<string | undefined>(undefined);
  const [saving, startSaving] = useTransition();

  /** The club's seasons as the API now holds them, after a create or a save. */
  function commit(next: SeasonRow[]) {
    setSeasons(next);
    setRows(next.map(toDraft));
  }

  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");

  /** The row whose text fields are open for typing, from its pencil. */
  const [typing, setTyping] = useState<string | null>(null);

  // Fresh rows once a save re-reads the page. Held back while the table is
  // open, so a refresh can't take a half-typed season away.
  useServerSync(saved, editing || adding, commit);

  /**
   * `01 May 2026` - short, unambiguous, and in the page's own language.
   *
   * Read back in UTC, which is how it was written. A stored date is a calendar
   * day, not an instant, so letting the reader's timezone at it would only give
   * the far side of the world an off-by-one - and a different first render on
   * the server than in the browser.
   */
  const dates = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
    [locale],
  );

  const showDate = (iso: string) =>
    iso ? dates.format(new Date(`${iso}T00:00:00Z`)) : "–";

  const shown = editing ? rows : seasons.map(toDraft);

  /** What's saved, in the shape the draft holds it, for comparing against. */
  const savedDraft = JSON.stringify(seasons.map(toDraft));

  /** Whether anything has actually moved, which changes what the save bar says. */
  const dirty = JSON.stringify(rows) !== savedDraft;

  const needle = query.trim().toLowerCase();

  const visible = shown.filter((season) =>
    needle
      ? [season.name, season.short].some((field) =>
          field.toLowerCase().includes(needle),
        )
      : true,
  );

  /** What a row with no name yet is called, in a label or a warning. */
  const nameOf = (season: SeasonDraft) => season.name.trim() || t("row.newName");

  function begin() {
    setRows(seasons.map(toDraft));
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
    if (editing) return cancel();

    begin();
  }

  function cancel() {
    setRows(seasons.map(toDraft));
    setFailure(undefined);
    setTyping(null);
    setEditing(false);
  }

  /** Every field that calls this is already behind the header pencil. */
  function change(id: string, patch: Partial<SeasonDraft>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  /** What's wrong with the draft, if anything. First problem only. */
  function firstProblem() {
    for (const row of rows) {
      if (row.name.trim().length === 0) return t("invalid.nameRequired");

      const code = row.short.trim();

      if (code.length === 0) return t("invalid.shortRequired");

      const clash = rows.some(
        (other) =>
          other.id !== row.id &&
          other.short.trim().toLowerCase() === code.toLowerCase(),
      );

      if (clash) return t("invalid.shortTaken", { short: code });

      const start = dayMonthYearToIso(row.start);
      if (!start) return t("invalid.startInvalid", { name: nameOf(row) });

      const end = dayMonthYearToIso(row.end);
      if (!end) return t("invalid.endInvalid", { name: nameOf(row) });

      // A run of days that ends before it starts books nothing at all.
      if (end < start) return t("invalid.endBeforeStart", { name: nameOf(row) });
    }

    return undefined;
  }

  const problem = firstProblem();

  /**
   * Everything this edit changed, in one call.
   *
   * Rows added here are created; stored rows send only the fields that moved.
   * Whatever comes back is what the API holds, which is the only place a
   * created row's id exists - so the answer replaces the list rather than
   * being merged into it.
   */
  function save() {
    if (problem || clubId === null) return;

    const before = new Map(seasons.map((season) => [season.id, season]));
    const created: NewSeason[] = [];
    const changes: SeasonChange[] = [];

    for (const row of rows) {
      const now = fromDraft(row);

      if (row.added) {
        created.push({
          name: now.name,
          shortName: now.short,
          seasonStart: now.start,
          seasonEnd: now.end,
          forTeams: now.teams,
          forLocations: now.locations,
          active: now.active,
        });

        continue;
      }

      const was = before.get(row.id);
      if (!was) continue;

      const change: SeasonChange = { seasonId: Number(row.id) };
      let moved = false;

      if (now.name !== was.name) {
        change.name = now.name;
        moved = true;
      }

      if (now.short !== was.short) {
        change.shortName = now.short;
        moved = true;
      }

      if (now.start !== was.start) {
        change.seasonStart = now.start;
        moved = true;
      }

      if (now.end !== was.end) {
        change.seasonEnd = now.end;
        moved = true;
      }

      if (now.teams !== was.teams) {
        change.forTeams = now.teams;
        moved = true;
      }

      if (now.locations !== was.locations) {
        change.forLocations = now.locations;
        moved = true;
      }

      if (now.active !== was.active) {
        change.active = now.active;
        moved = true;
      }

      if (moved) changes.push(change);
    }

    if (created.length === 0 && changes.length === 0) {
      setTyping(null);
      setEditing(false);
      return;
    }

    setFailure(undefined);

    startSaving(async () => {
      const result = await saveSeasonsAction({
        locale,
        clubId,
        created,
        changes,
      });

      // What the API now holds, whatever happened: a create may have landed
      // before a later one was refused, and there is no delete to undo it.
      if (result.seasons) commit(result.seasons);

      if (result.formError !== undefined) {
        setFailure(result.formError);
        return;
      }

      setTyping(null);
      setEditing(false);

      // Re-fetch the data so the table shows what the API now holds.
      router.refresh();
    });
  }

  /** A blank season at the foot of the table, open for typing. */
  function appendRow() {
    setRows((current) => [
      ...current,
      {
        id: `new-${(nextRow.current += 1)}`,
        name: "",
        short: "",
        start: "",
        end: "",
        // Teams on, because a season has to attach to something and both off
        // is the one combination the switches won't let you reach anyway.
        teams: true,
        locations: false,
        active: true,
        // Stays open for typing on its own - a blank row is nothing but fields
        // to fill in, so there is no closed state to put it in.
        added: true,
      },
    ]);
  }

  /**
   * Add a season, one at a time.
   *
   * Pressed while a new row is still unfinished, it puts the cursor back in
   * that row rather than stacking a second empty one under it - a column of
   * identical blank rows is easy to create by accident and says nothing about
   * which one to fill in first. Finish the row and the button adds the next.
   *
   * The same way the addresses card behaves, for the same reason.
   */
  function add() {
    // Nothing has been added yet in an edit that hasn't started.
    if (!editing) {
      begin();
      appendRow();
      return;
    }

    const unfinished = rows.find((row) => row.added && !isComplete(row));

    if (unfinished) {
      // Already on screen, so `autoFocus` won't fire again; focus it directly.
      document.getElementById(nameInputId(unfinished.id))?.focus();
      return;
    }

    appendRow();
  }

  /**
   * Only reachable from the actions column, which only exists while editing.
   *
   * Taking back the row that started the edit ends the edit: if the table now
   * matches what's saved there is nothing left to commit, and leaving the save
   * bar and the actions column up over an unchanged table only asks the member
   * to dismiss something they already dismissed. An edit with other changes
   * still in it carries on - those aren't the cross's to throw away.
   */
  function remove(id: string) {
    const next = rows.filter((row) => row.id !== id);

    setRows(next);
    setTyping((row) => (row === id ? null : row));

    if (JSON.stringify(next) === savedDraft) setEditing(false);
  }

  /*
   * A club with no seasons gets none of the page's furniture.
   *
   * No heading and no table: a heading heads a list, and there isn't one yet.
   * The first view is one button, the same as the locations screen's.
   */
  if (seasons.length === 0) {
    if (!adding) {
      return (
        <EmptyState
          icon="seasons"
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

    /*
     * The form and the help arrive together, the way the locations screen's
     * do: the help is written for someone setting up their first season, which
     * is exactly who is looking at that form - so it opens rather than waiting
     * to be asked for.
     */
    return (
      <div className="flex flex-col gap-4">
        <AddSeasonPanel
          seasons={seasons}
          clubId={clubId}
          onCreated={commit}
          onClose={() => setAdding(false)}
        />

        <SeasonHelp defaultOpen />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="mb-2 border-b border-line pb-5">
        <h1 className="text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">
          {t("title")}
        </h1>

        {/* `text-body`, matching the club and locations screens: a sentence to
            read, and `text-subtle` falls short of 4.5:1 on white. */}
        <p className="mt-1.5 text-[13px] text-body sm:text-sm">
          {t("description")}
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        {/* No fold chevron: the table is the whole point of the page, and
            there is nothing underneath it to reach by folding it away. */}
        <CardHeader
          title={t("card.title")}
          editLabel={t("card.editAll")}
          // No pencil over an empty table - there are no rows to edit, and the
          // Add season button beside it is the only thing that helps.
          onEdit={seasons.length > 0 ? toggleEditing : undefined}
          badge={<Chip>{t("card.count", { count: seasons.length })}</Chip>}
          aside={
            <div className="flex flex-wrap items-center gap-3">
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
                  placeholder={t("card.filter")}
                  aria-label={t("card.filter")}
                />
              </div>

              <Button type="button" variant="outline" size="sm" onClick={add}>
                <Icon name="add" size="xs" />
                {t("card.add")}
              </Button>
            </div>
          }
        />

        <div className="overflow-x-auto border-t border-line">
              <table className="w-full min-w-225 border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-page/60">
                    <Th className="w-56 pl-5 sm:pl-6">{t("columns.season")}</Th>
                    <Th className="w-28">{t("columns.short")}</Th>
                    <Th className="w-44">{t("columns.start")}</Th>
                    <Th className="w-44">{t("columns.end")}</Th>
                    <Th className="w-20">{t("columns.teams")}</Th>
                    <Th className="w-24">{t("columns.locations")}</Th>
                    <Th className="w-20">{t("columns.active")}</Th>
                    {/* Arrives with the header pencil, along with the buttons
                        it heads. */}
                    {editing ? (
                      <Th className="w-24 pr-5 sm:pr-6">
                        {t("columns.actions")}
                      </Th>
                    ) : null}
                  </tr>
                </thead>

                <tbody>
                  {visible.length === 0 ? (
                    <tr>
                      <td
                        colSpan={editing ? 8 : 7}
                        className="py-10 text-center text-[13px] text-subtle"
                      >
                        {t("card.empty")}
                      </td>
                    </tr>
                  ) : null}

                  {visible.map((season) => {
                    // A just-added row is always open: it has nothing to show
                    // in a closed state.
                    const typed = typing === season.id || season.added;

                    return (
                      <tr
                        key={season.id}
                        className="border-b border-line transition-colors last:border-0 hover:bg-page/60"
                      >
                        <Td className="pl-5 sm:pl-6">
                          {typed ? (
                            <Input
                              id={nameInputId(season.id)}
                              className={cn(compactInput, "min-w-0 flex-1")}
                              value={season.name}
                              maxLength={NAME_MAX}
                              placeholder={t("row.namePlaceholder")}
                              aria-label={t("columns.season")}
                              onChange={(event) =>
                                change(season.id, { name: event.target.value })
                              }
                            />
                          ) : (
                            <span className="truncate text-[13px] font-semibold text-ink">
                              {nameOf(season)}
                            </span>
                          )}
                        </Td>

                        <Td>
                          {typed ? (
                            <Input
                              className={cn(compactInput, "w-24")}
                              value={season.short}
                              maxLength={SHORT_MAX}
                              placeholder={t("row.shortPlaceholder")}
                              aria-label={t("columns.short")}
                              onChange={(event) =>
                                change(season.id, { short: event.target.value })
                              }
                            />
                          ) : (
                            <span className="font-mono text-[12px] text-body">
                              {season.short}
                            </span>
                          )}
                        </Td>

                        {(["start", "end"] as const).map((edge) => (
                          <Td key={edge}>
                            {typed ? (
                              // `either`: a season is planned ahead, so the
                              // calendar has to offer dates a birth date can't.
                              <DateInput
                                span="either"
                                groupClassName="h-9 w-40"
                                className="px-3 text-[13px]"
                                value={season[edge]}
                                onValueChange={(next) =>
                                  change(season.id, { [edge]: next })
                                }
                                placeholder={t("row.datePlaceholder")}
                                pickerLabel={t("row.datePicker")}
                                aria-label={t(`columns.${edge}`)}
                                autoComplete="off"
                              />
                            ) : (
                              <span className="text-[13px] text-body">
                                {showDate(dayMonthYearToIso(season[edge]) ?? "")}
                              </span>
                            )}
                          </Td>
                        ))}

                        {toggleColumns.map(({ key, label }) => (
                          <Td key={key}>
                            <Switch
                              size="sm"
                              tone="success"
                              checked={season[key as SeasonToggle]}
                              // Read-only until the header pencil, like the
                              // actions column and the text fields.
                              disabled={!editing}
                              label={t(`columns.${label}`)}
                              onChange={(checked) =>
                                change(season.id, toggle(key, checked))
                              }
                            />
                          </Td>
                        ))}

                        {/* Only while editing - there's nothing to act on in a
                            read-only table. */}
                        {editing ? (
                          <Td className="pr-5 sm:pr-6">
                            <div className="flex items-center gap-1">
                              {/* Opens this row's name, code and dates for
                                  typing. A row that was added in this edit is
                                  already open and has no saved state to close
                                  back to, so it goes without one. */}
                              {season.added ? (
                                // Holds the pencil's place, so delete stays in
                                // the same column down every row.
                                <span aria-hidden className="size-7" />
                              ) : (
                                <button
                                  type="button"
                                  aria-label={t("row.edit", {
                                    name: nameOf(season),
                                  })}
                                  aria-pressed={typed}
                                  onClick={() =>
                                    setTyping(typed ? null : season.id)
                                  }
                                  className={cn(
                                    "inline-flex size-7 items-center justify-center rounded-md transition-colors outline-none hover:bg-badge hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/40",
                                    typed
                                      ? "bg-badge text-ink"
                                      : "text-ink-muted",
                                  )}
                                >
                                  <Icon name="edit" size="xs" />
                                </button>
                              )}

                              {/*
                                Only a row added in this edit can go, and it
                                goes with the cross the address and contact
                                cards use: nothing upstream has been created
                                yet, so this is taking it back rather than
                                deleting it.

                                A stored season has no delete at all - the API
                                offers none - so there is no button to offer
                                one with. Switching it inactive is how a club
                                retires a season.
                              */}
                              {season.added ? (
                                <button
                                  type="button"
                                  aria-label={t("row.removeNew")}
                                  onClick={() => remove(season.id)}
                                  className="inline-flex size-7 items-center justify-center rounded-md text-ink-muted transition-colors outline-none hover:bg-badge hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/40"
                                >
                                  <Icon name="close" size="xs" />
                                </button>
                              ) : null}
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
            message={dirty ? t("card.unsaved") : t("card.editing")}
            // A value that can't be sent is worth saying before the API does;
            // once it has spoken, what it said wins.
            error={problem ?? failure}
            dirty={dirty}
            pending={saving}
            saveDisabled={problem !== undefined || clubId === null}
            cancelLabel={t("card.cancel")}
            saveLabel={t("card.save")}
            onCancel={cancel}
            onSave={save}
          />
        ) : null}
      </section>

      <SeasonHelp />
    </div>
  );
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
 * cell's own baseline strut - 16px, inherited, whatever the span's size - so a
 * 12px code lands two or three pixels below a cell whose content is already a
 * flex row, like the switches or the actions. Every cell being block-level means
 * there's no strut anywhere and `align-middle` centres all eight the same way.
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
      <div className={cn("flex min-h-8 min-w-0 items-center pr-4", className)}>
        {children}
      </div>
    </td>
  );
}
