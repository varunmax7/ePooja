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

export function formatCalendarDate(date: string): CalendarDateParts {
  const instant = new Date(`${date}T00:00:00Z`);
  const format = (options: Intl.DateTimeFormatOptions): string =>
    new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...options }).format(instant);

  return {
    weekday: format({ weekday: 'long' }),
    day: format({ day: 'numeric' }),
    month: format({ month: 'long' }),
    year: format({ year: 'numeric' }),
  };
}
