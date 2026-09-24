"use client";

import { da, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { useState, type ChangeEvent } from "react";
import { getDefaultClassNames } from "react-day-picker";

import { Icon } from "@/components/icons";
import { Calendar } from "@/components/ui/calendar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate, formatDayMonthYear, parseDayMonthYear } from "@/lib/date";

/** Month and weekday names for the calendar, in the page's locale. */
const calendarLocales = { da, en: enUS };

/** Nobody on the register was born before this. */
const earliestYear = 1900;

/** Where the calendar opens while the field is still empty. */
const typicalMemberAge = 25;

/**
 * How far a forward-looking field reaches either side of today.
 *
 * A season is planned a year or two out and kept for a few years after, so a
 * decade each way covers it without turning the year dropdown into a list of
 * everything since 1900.
 */
const yearsEitherSide = 10;

export type DateInputProps = Omit<
  React.ComponentProps<typeof InputGroupInput>,
  "type" | "value" | "onChange"
> & {
  value: string;
  /** Gets the re-masked value, not the raw keystroke. */
  onValueChange: (value: string) => void;
  /** Names the calendar button for assistive tech. */
  pickerLabel: string;
  /**
   * Classes for the field's outer box, which is what sets its height.
   *
   * `className` lands on the text input inside, so it can't resize the field:
   * a record card passes `h-9` here to line up with the compact inputs beside
   * it, where the default is sized for a sign-in form.
   */
  groupClassName?: string;
  /**
   * How far the calendar reaches.
   *
   * `past` is the default, and what a date of birth or a club's founding date
   * wants: back to 1900, opening on a plausible birth year, with tomorrow
   * onwards closed off. `either` is for a date that is meant to be in the
   * future - a season's start and end - and opens on today with nothing barred.
   */
  span?: "past" | "either";
};

/**
 * Day-first date field. Type `DD / MM / YYYY`, or pick it off a calendar.
 *
 * Typing is the main path (for a date of birth it beats paging a calendar back
 * thirty years), so the text input holds the value and the calendar just writes
 * into it. The value stays a masked string rather than a `Date` because it has
 * to survive being half-finished; the schema decides when that's an error.
 */
export function DateInput({
  value,
  onValueChange,
  pickerLabel,
  groupClassName,
  // A default rather than a fixed value: this field was written for a date of
  // birth, but a club's founding date would otherwise be offered the admin's
  // own birthday by the browser.
  autoComplete = "bday",
  span = "past",
  "aria-invalid": ariaInvalid,
  ...props
}: DateInputProps) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const selected = parseDayMonthYear(value) ?? undefined;
  const today = new Date();

  /** A forward-looking field: the calendar runs either side of today. */
  const ahead = span === "either";

  const startMonth = ahead
    ? new Date(today.getFullYear() - yearsEitherSide, 0)
    : new Date(earliestYear, 0);

  const endMonth = ahead
    ? new Date(today.getFullYear() + yearsEitherSide, 11)
    : today;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onValueChange(formatDayMonthYear(event.target.value, value));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/*
        Anchored on the whole field rather than the icon button, so the calendar
        drops from the field's edge and `--radix-popover-trigger-width` measures
        the field. On the button alone it came out half the input's width.
      */}
      <PopoverAnchor asChild>
        <InputGroup className={groupClassName}>
          <InputGroupInput
            {...props}
            type="text"
            // Give phones a digit keypad; the mask adds the separators.
            inputMode="numeric"
            autoComplete={autoComplete}
            maxLength={"DD / MM / YYYY".length}
            value={value}
            onChange={handleChange}
            aria-invalid={ariaInvalid}
          />

          <InputGroupAddon align="inline-end">
            <PopoverTrigger asChild>
              <InputGroupButton
                variant="ghost"
                size="icon-sm"
                aria-label={pickerLabel}
              >
                <Icon name="calendar" />
              </InputGroupButton>
            </PopoverTrigger>
          </InputGroupAddon>
        </InputGroup>
      </PopoverAnchor>

      {/* `min-w-fit` so a field narrower than the calendar can't crush it. */}
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-fit p-0"
      >
        <Calendar
          mode="single"
          selected={selected}
          /*
           * Fixed-height rows. The calendar stretches to the field's width
           * (below), and its day cells are square by default, so a wide field
           * turned every row ~67px tall and the calendar ran off the page.
           * Width still follows the field; only the height is pinned.
           *
           * Aimed at `rdp-day`, which the cell and its button both carry,
           * through `className` because that one is merged - overriding the
           * `day` key in `classNames` would replace the calendar's own styles
           * for it outright. The descendant selector also outranks the
           * `aspect-square` it's undoing.
           */
          className="[--cell-size:--spacing(8)] [&_.rdp-day]:aspect-auto [&_.rdp-day]:h-(--cell-size) [&_.rdp-week]:mt-1"
          // Swaps the calendar's `w-fit` for full width, so the day grid
          // stretches to the field instead of sitting at its natural size.
          classNames={{ root: `w-full ${getDefaultClassNames().root}` }}
          // Open near a plausible birth year. Starting at today leaves the
          // user thirty years of paging - unless the field looks forward, and
          // then today is exactly where it should start.
          defaultMonth={
            selected ??
            (ahead
              ? today
              : new Date(
                  today.getFullYear() - typicalMemberAge,
                  today.getMonth(),
                ))
          }
          onSelect={(date) => {
            if (!date) return;

            onValueChange(formatDate(date));
            setOpen(false);
          }}
          // Dropdowns, since you can't page your way to a birth year.
          captionLayout="dropdown"
          startMonth={startMonth}
          endMonth={endMonth}
          // A birth date can't be in the future; a season's very much can.
          disabled={ahead ? undefined : { after: today }}
          autoFocus
          locale={
            calendarLocales[locale as keyof typeof calendarLocales] ?? enUS
          }
        />
      </PopoverContent>
    </Popover>
  );
}
