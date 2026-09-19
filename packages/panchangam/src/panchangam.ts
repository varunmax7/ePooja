import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { nakshatraPada } from './angas.js';
import { searchMoon, searchSun } from './astronomy.js';
import { gulikaKalam, prayerTimings, rahuKalam, yamagandam } from './kalams.js';
import { ayanaAt, lunarMonthAt, rituOf, samvatsaraAt } from './masa.js';
import { addDays } from './math.js';
import { angaAt } from './transitions.js';
import type {
  DayPanchangamOptions,
  GeoLocation,
  PanchangamData,
  PanchangamInput,
  Weekday,
} from './types.js';

/** Thrown where the Sun does not rise or set on the requested day. */
export class NoSunriseError extends Error {
  constructor(location: GeoLocation, instant: Date) {
    super(
      `The Sun does not rise and set at ${location.lat},${location.lng} around ${instant.toISOString()}`,
    );
    this.name = 'NoSunriseError';
  }
}

/** Vasara ids in the Sankalpam forms §9.2 lists, Sunday first. */
export const VASARA_IDS = [
  'bhanu',
  'indu',
  'bhauma',
  'saumya',
  'guru',
  'bhrigu',
  'sthira',
] as const;

/** The most recent sunrise at or before `instant` — the start of the Hindu day (§3.7). */
export function mostRecentSunrise(instant: Date, location: GeoLocation): Date {
  const firstAfter = searchSun(location, 1, addDays(instant, -1.6), 1.7);
  /* c8 ignore next -- only at latitudes with no sunrise, which NoSunriseError covers */
  if (!firstAfter) throw new NoSunriseError(location, instant);

  if (firstAfter.getTime() > instant.getTime()) return firstAfter;

  const next = searchSun(location, 1, addDays(firstAfter, 0.5), 1.2);
  if (next && next.getTime() <= instant.getTime()) return next;
  return firstAfter;
}

function localWeekday(instant: Date, tz: string): Weekday {
  return (Number(formatInTimeZone(instant, tz, 'i')) % 7) as Weekday;
}

/**
 * Full Panchangam for a single instant (§9.1).
 *
 * Pure and deterministic: no network, no clock reads, no locale lookups beyond
 * the IANA zone passed in.
 */
export function getPanchangam(input: PanchangamInput): PanchangamData {
  const { instant, lat, lng, tz } = input;
  const location: GeoLocation = {
    lat,
    lng,
    tz,
    ...(input.altitudeMeters === undefined ? {} : { altitudeMeters: input.altitudeMeters }),
  };

  const sunrise = mostRecentSunrise(instant, location);
  const sunset = searchSun(location, -1, sunrise, 1);
  /* c8 ignore next -- a day with a sunrise but no sunset is already rejected above */
  if (!sunset) throw new NoSunriseError(location, instant);

  // §3.7: the Hindu day runs sunrise to sunrise, so the weekday is that of the
  // most recent sunrise — before dawn, that is still yesterday's vasara.
  const weekday = localWeekday(sunrise, tz);
  const vasaraId = VASARA_IDS[weekday];
  /* c8 ignore next -- weekday is always 0..6 */
  if (!vasaraId) throw new Error(`Unreachable weekday ${weekday}`);

  const month = lunarMonthAt(instant);
  const tithi = angaAt('tithi', instant);
  const nakshatra = angaAt('nakshatra', instant);

  const [rahuStart, rahuEnd] = rahuKalam(sunrise, sunset, weekday);
  const [yamaStart, yamaEnd] = yamagandam(sunrise, sunset, weekday);
  const [gulikaStart, gulikaEnd] = gulikaKalam(sunrise, sunset, weekday);

  const moonrise = searchMoon(location, 1, sunrise, 1);
  const moonset = searchMoon(location, -1, sunrise, 1);

  return {
    date: formatInTimeZone(sunrise, tz, 'yyyy-MM-dd'),
    tz,
    lat,
    lng,
    computedFor: instant.toISOString(),
    samvatsara: samvatsaraAt(instant),
    ayana: ayanaAt(instant),
    ritu: rituOf(month.masaIndex),
    masa: { id: month.id, adhika: month.adhika },
    paksha: tithi.index <= 15 ? 'shukla' : 'krishna',
    tithi,
    nakshatra: { ...nakshatra, pada: nakshatraPada(instant) },
    yoga: angaAt('yoga', instant),
    karana: angaAt('karana', instant),
    vasara: { id: vasaraId, weekday },
    sunrise: sunrise.toISOString(),
    sunset: sunset.toISOString(),
    ...(moonrise ? { moonrise: moonrise.toISOString() } : {}),
    ...(moonset ? { moonset: moonset.toISOString() } : {}),
    rahuKalam: [rahuStart.toISOString(), rahuEnd.toISOString()],
    yamagandam: [yamaStart.toISOString(), yamaEnd.toISOString()],
    gulikaKalam: [gulikaStart.toISOString(), gulikaEnd.toISOString()],
    prayerTimings: prayerTimings(sunrise, sunset),
  };
}

/** Local midnight (start of the calendar day) for a `yyyy-MM-dd` in a zone. */
function startOfLocalDay(date: string, tz: string): Date {
  return fromZonedTime(`${date}T00:00:00`, tz);
}

const memo = new Map<string, PanchangamData>();
const MEMO_LIMIT = 256;

/** §9.1: memoize per date and location rounded to 0.01°. */
function memoKey(date: string, location: GeoLocation, basis: string): string {
  return [date, location.tz, location.lat.toFixed(2), location.lng.toFixed(2), basis].join('|');
}

/**
 * Panchangam for a local calendar date (§9.1 `getDayPanchangam`).
 *
 * `basis: 'sunrise'` (the default) reports the values prevailing at local
 * sunrise, which is what a printed panchangam shows. `basis: 'instant'` reports
 * the values at the moment passed in, which is what a Sankalpam needs (§3.7).
 */
export function getDayPanchangam(
  date: string | Date,
  location: GeoLocation,
  options: DayPanchangamOptions = {},
): PanchangamData {
  const basis = options.basis ?? 'sunrise';
  const localDate =
    typeof date === 'string' ? date : formatInTimeZone(date, location.tz, 'yyyy-MM-dd');

  const key = memoKey(
    localDate,
    location,
    basis === 'instant' && typeof date !== 'string' ? date.toISOString() : basis,
  );
  const cached = memo.get(key);
  if (cached) return cached;

  let instant: Date;
  if (basis === 'instant' && typeof date !== 'string') {
    instant = date;
  } else {
    const sunrise = searchSun(location, 1, startOfLocalDay(localDate, location.tz), 1.6);
    if (!sunrise) throw new NoSunriseError(location, startOfLocalDay(localDate, location.tz));
    // A minute past sunrise keeps the anga lookup on the correct side of the
    // boundary when a tithi changes exactly at sunrise.
    instant = new Date(sunrise.getTime() + 60_000);
  }

  const result = getPanchangam({ ...location, instant });

  if (memo.size >= MEMO_LIMIT) memo.clear();
  memo.set(key, result);
  return result;
}

/** Clear the memo (tests, and when the devotee changes location). */
export function clearPanchangamCache(): void {
  memo.clear();
}

/**
 * Every day of a Gregorian month at a location (§9.1 `getMonth`), for the
 * calendar screen.
 *
 * @param month 1–12
 */
export function getMonth(year: number, month: number, location: GeoLocation): PanchangamData[] {
  const days: PanchangamData[] = [];
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    days.push(getDayPanchangam(date, location));
  }

  return days;
}
