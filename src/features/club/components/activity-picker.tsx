"use client";

import { useTranslations } from "next-intl";
import { useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { Icon } from "@/components/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { matchActivities } from "@/features/club/activity-search";
import type { ClubActivity } from "@/features/club/api/club-wire";
import { cn } from "@/lib/utils";

/**
 * How many matches the list draws at once.
 *
 * The catalogue can run to a thousand activities. Drawing all of them makes
 * the menu slow to open and useless to scroll, and nobody reads past the first
 * screenful anyway - they type. Past this many, the list says so and asks for
 * a few more letters.
 */
const SHOWN_LIMIT = 100;

/** How many names the closed field spells out before it counts the rest. */
const NAMED_IN_FIELD = 2;

/**
 * The club's activities, picked from the API's list - as many as apply.
 *
 * A search box inside the menu, because the list is long: it filters on name
 * and short code as you type. The menu has a fixed height and scrolls. With
 * nothing typed, the ones already chosen come first, so an admin can see what
 * they picked without paging through the catalogue to find it.
 *
 * A combobox, not a menu of checkboxes: focus stays in the search box, the
 * arrow keys move a highlight through the options, and Enter ticks or unticks
 * the highlighted one. That's the pattern screen readers expect for a
 * filterable list, and it keeps typing and choosing in one place.
 */
export function ActivityPicker({
  value,
  onChange,
  activities,
  label,
  unavailableLabel,
}: {
  /** The chosen activities' ids. */
  value: readonly number[];
  onChange: (value: number[]) => void;
  activities: readonly ClubActivity[];
  label: string;
  unavailableLabel: string;
}) {
  const t = useTranslations("club.activityPicker");

  const listId = useId();
  const optionId = (id: number) => `${listId}-${id}`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const list = useRef<HTMLUListElement>(null);
  const search = useRef<HTMLInputElement>(null);

  const unavailable = activities.length === 0;
  const chosen = useMemo(() => new Set(value), [value]);

  const matches = useMemo(
    () => matchActivities(activities, chosen, query),
    [activities, chosen, query],
  );

  const shown = matches.slice(0, SHOWN_LIMIT);

  /** The chosen activities in the catalogue's own order, for the field. */
  const chosenNames = activities
    .filter((activity) => chosen.has(activity.id))
    .map((activity) => activity.name);

  function toggle(id: number) {
    onChange(
      chosen.has(id)
        ? value.filter((existing) => existing !== id)
        : [...value, id],
    );
  }

  /** Move the highlight, and keep it in view in the scrolling list. */
  function highlight(index: number) {
    const next = Math.max(0, Math.min(index, shown.length - 1));
    setActive(next);

    const option = shown[next];
    if (!option) return;

    list.current
      ?.querySelector(`[id="${optionId(option.id)}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        highlight(active + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        highlight(active - 1);
        break;
      case "Home":
        event.preventDefault();
        highlight(0);
        break;
      case "End":
        event.preventDefault();
        highlight(shown.length - 1);
        break;
      case "Enter": {
        // Never submits the form around it: Enter here means "tick this".
        event.preventDefault();
        const option = shown[active];
        if (option) toggle(option.id);
        break;
      }
    }
  }

  /** "Beach volleyball, Padel +3", or the placeholder while nothing is chosen. */
  const summary =
    chosenNames.length === 0
      ? null
      : chosenNames.length <= NAMED_IN_FIELD
        ? chosenNames.join(", ")
        : `${chosenNames.slice(0, NAMED_IN_FIELD).join(", ")} ${t("more", {
            count: chosenNames.length - NAMED_IN_FIELD,
          })}`;

  const activeOption = shown[active];

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Every opening starts fresh: an old search hiding half the list
        // would look like the activities had gone.
        if (next) {
          setQuery("");
          setActive(0);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={unavailable}
          aria-label={label}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex h-9 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-muted px-3 text-left text-[13px] transition-colors outline-none focus-visible:border-ring focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
        >
          <span className={cn("truncate", !summary && "text-subtle")}>
            {unavailable ? unavailableLabel : (summary ?? t("placeholder"))}
          </span>

          <Icon name="selectArrow" size="sm" className="shrink-0 text-ink-muted" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        // As wide as the field, but never so narrow the names wrap into mush.
        className="w-(--radix-popover-trigger-width) min-w-64 gap-0 p-0"
        // The search box takes focus, not the first thing Radix finds. Once,
        // on opening - so a click on "Clear" isn't pulled straight back.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          search.current?.focus({ preventScroll: true });
        }}
      >
        <div className="relative border-b border-line p-2">
          <Icon
            name="find"
            size="xs"
            className="absolute top-1/2 left-4.5 -translate-y-1/2 text-subtle"
          />

          <input
            ref={search}
            type="text"
            role="combobox"
            aria-label={t("search")}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeOption ? optionId(activeOption.id) : undefined
            }
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
              list.current?.scrollTo({ top: 0 });
            }}
            onKeyDown={onKeyDown}
            placeholder={t("search")}
            className="h-8 w-full rounded-md border border-field-line bg-field pr-2 pl-7 text-[13px] text-ink outline-none placeholder:text-subtle focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/15"
          />
        </div>

        {/* A fixed height that scrolls, whatever the catalogue's length. */}
        <ul
          ref={list}
          id={listId}
          role="listbox"
          aria-multiselectable
          aria-label={label}
          className="max-h-60 overflow-y-auto p-1"
        >
          {shown.length === 0 ? (
            <li className="px-2 py-6 text-center text-[13px] text-body">
              {t("noMatch", { query: query.trim() })}
            </li>
          ) : null}

          {shown.map((activity, index) => {
            const selected = chosen.has(activity.id);

            return (
              <li
                key={activity.id}
                id={optionId(activity.id)}
                role="option"
                aria-selected={selected}
                // Pointer down, not click: a click would blur the search box
                // first and the list would lose its keyboard highlight.
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => toggle(activity.id)}
                onPointerMove={() => setActive(index)}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-ink",
                  index === active && "bg-badge",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "inline-flex size-4 shrink-0 items-center justify-center rounded border",
                    selected
                      ? "border-ink bg-ink text-on-ink"
                      : "border-line-strong bg-surface",
                  )}
                >
                  {selected ? <Icon name="checked" size="xs" /> : null}
                </span>

                <span className="min-w-0 flex-1 truncate">{activity.name}</span>

                {activity.short ? (
                  <span className="shrink-0 text-[11px] text-body">
                    {activity.short}
                  </span>
                ) : null}
              </li>
            );
          })}

          {matches.length > shown.length ? (
            <li className="px-2 py-2 text-center text-[12px] text-body">
              {t("truncated", { shown: shown.length, total: matches.length })}
            </li>
          ) : null}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2">
          <span role="status" className="text-[12px] text-body">
            {t("selected", { count: value.length })}
          </span>

          {value.length > 0 ? (
            <button
              type="button"
              onClick={() => onChange([])}
              className="rounded-md px-2 py-1 text-[12px] font-medium text-ink transition-colors outline-none hover:bg-badge focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {t("clear")}
            </button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
