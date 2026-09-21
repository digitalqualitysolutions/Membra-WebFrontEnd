/**
 * Day-first dates, the way people type them.
 *
 * Both locales we ship write dates day-first, so the field is masked to
 * `DD / MM / YYYY` instead of using `<input type="date">`. That control renders
 * the browser's own format and placeholder, and we can't line either of them up
 * with the rest of the form.
 */

const digitsOf = (value: string) => value.replace(/\D/g, "");

/** Day, month, year: 2, 2 and 4 digits, eight altogether. */
const segmentLengths = [2, 2, 4] as const;

/**
 * Re-mask a field's raw value after an edit.
 *
 * `previous` is what the field held before the keystroke, which is how we tell
 * a backspace over a separator from one over a digit. The separator is ours,
 * not the user's, so deleting it has to take the digit in front of it too;
 * otherwise the mask puts it straight back and the key looks dead.
 */
export function formatDayMonthYear(raw: string, previous = ""): string {
  let digits = digitsOf(raw);

  const deleting = raw.length < previous.length;
  if (deleting && digits.length === digitsOf(previous).length) {
    digits = digits.slice(0, -1);
  }

  const segments: string[] = [];
  let offset = 0;

  for (const length of segmentLengths) {
    const segment = digits.slice(offset, offset + length);
    if (!segment) break;

    segments.push(segment);
    offset += length;
  }

  return segments.join(" / ");
}

/**
 * Read a masked value back as a date, or `null` if it isn't one.
 *
 * The round-trip through `Date` is what catches days that look plausible but
 * don't exist (31 / 02, or 29 / 02 in a common year). A range check on each
 * part would let those through.
 */
export function parseDayMonthYear(value: string): Date | null {
  const digits = digitsOf(value);
  if (digits.length !== 8) return null;

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));

  // Midday UTC, so no timezone can nudge this onto the day either side.
  const date = new Date(Date.UTC(year, month - 1, day, 12));

  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isRealDate ? date : null;
}

/** Write a date back out in the masked `DD / MM / YYYY` form. */
export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${day} / ${month} / ${date.getFullYear()}`;
}

/**
 * The `YYYY-MM-DD` form the API stores dates in.
 *
 * Read back in UTC on purpose. `parseDayMonthYear` builds its dates at midday
 * UTC so no timezone can shift them a day either way, and pulling them out in
 * local time would undo exactly that.
 */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * A stored `YYYY-MM-DD` date as the masked `DD / MM / YYYY` a field edits.
 *
 * The inverse of `toIsoDate(parseDayMonthYear(…))`. Done on the string rather
 * than through `Date`, so there is no timezone in the way to move the day.
 * Anything that isn't a stored date comes back empty, which is what an empty
 * field shows.
 */
export function fromIsoDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return "";

  const [, year, month, day] = match;

  return `${day} / ${month} / ${year}`;
}

/**
 * A masked field value as the stored `YYYY-MM-DD`, or `null` if it isn't a
 * whole, real date yet.
 */
export function dayMonthYearToIso(value: string): string | null {
  const date = parseDayMonthYear(value);

  return date ? toIsoDate(date) : null;
}
