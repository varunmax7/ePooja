/**
 * Formats a `yyyy-MM-dd` Panchangam date for `DateDial` and headers.
 *
 * Takes no timezone: the string is already the devotee's local calendar date
 * (`resolveToday`/`localDateIn` resolved it), so this only has to spell that
 * date out — parsing it against any zone here would risk re-shifting a date
 * that has already been placed on the correct day.
 */
export interface CalendarDateParts {
  weekday: string;
  day: string;
  month: string;
  year: string;
}

const INTL_LOCALE: Record<'en' | 'te', string> = { en: 'en-US', te: 'te-IN' };

/**
 * `uiLang` defaults to `'en'` so every existing call site (and the English
 * fixture in `acceptance.test.ts`) keeps its current weekday/month spelling;
 * pass the devotee's `prefs.uiLang` to get Telugu names instead (§10 Phase 9
 * "number/date formatting per locale").
 */
export function formatCalendarDate(date: string, uiLang: 'en' | 'te' = 'en'): CalendarDateParts {
  const instant = new Date(`${date}T00:00:00Z`);
  const format = (options: Intl.DateTimeFormatOptions): string =>
    new Intl.DateTimeFormat(INTL_LOCALE[uiLang], { timeZone: 'UTC', ...options }).format(instant);

  return {
    weekday: format({ weekday: 'long' }),
    day: format({ day: 'numeric' }),
    month: format({ month: 'long' }),
    year: format({ year: 'numeric' }),
  };
}

/** `yyyy-MM-dd` for the first day of a Gregorian month. */
export function firstOfMonth(year: number, month: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
}

/** Steps a `{year, month}` pair by whole months, wrapping the year. */
export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const zeroBased = year * 12 + (month - 1) + delta;
  return { year: Math.floor(zeroBased / 12), month: (((zeroBased % 12) + 12) % 12) + 1 };
}

/**
 * The Calendar screen's weekday header, Sunday-first and narrow ("S", "M",
 * …), in the devotee's `uiLang`.
 */
export function weekdayNarrowLabels(uiLang: 'en' | 'te' = 'en'): string[] {
  // 2026-09-06 is a Sunday in UTC — any known Sunday works as the anchor.
  const sunday = new Date('2026-09-06T00:00:00Z');
  const format = new Intl.DateTimeFormat(INTL_LOCALE[uiLang], {
    timeZone: 'UTC',
    weekday: 'narrow',
  });
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(sunday);
    day.setUTCDate(sunday.getUTCDate() + i);
    return format.format(day);
  });
}

/** The month name + year for a Calendar header, e.g. "September 2026". */
export function formatMonthYear(year: number, month: number, uiLang: 'en' | 'te' = 'en'): string {
  const instant = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat(INTL_LOCALE[uiLang], {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(instant);
}
