import { formatInTimeZone } from 'date-fns-tz';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  NoSunriseError,
  VASARA_IDS,
  clearPanchangamCache,
  getDayPanchangam,
  getMonth,
  getPanchangam,
  mostRecentSunrise,
} from './panchangam.js';
import type { GeoLocation } from './types.js';

const HYDERABAD: GeoLocation = { lat: 17.385, lng: 78.4867, tz: 'Asia/Kolkata' };
const NEW_JERSEY: GeoLocation = { lat: 40.0583, lng: -74.4057, tz: 'America/New_York' };
const LONDON: GeoLocation = { lat: 51.5072, lng: -0.1276, tz: 'Europe/London' };
const SYDNEY: GeoLocation = { lat: -33.8688, lng: 151.2093, tz: 'Australia/Sydney' };
const DUBAI: GeoLocation = { lat: 25.2048, lng: 55.2708, tz: 'Asia/Dubai' };
const TROMSO: GeoLocation = { lat: 69.6496, lng: 18.9553, tz: 'Europe/Oslo' };

const localTime = (iso: string, tz: string): string => formatInTimeZone(new Date(iso), tz, 'HH:mm');

beforeEach(() => {
  clearPanchangamCache();
});

describe('getDayPanchangam', () => {
  const day = getDayPanchangam('2026-09-19', HYDERABAD);

  it('reports the requested local date', () => {
    expect(day.date).toBe('2026-09-19');
    expect(day.tz).toBe('Asia/Kolkata');
  });

  it('places sunrise and sunset at plausible local times for Hyderabad in September', () => {
    expect(localTime(day.sunrise, HYDERABAD.tz)).toBe('06:04');
    expect(localTime(day.sunset, HYDERABAD.tz)).toBe('18:15');
  });

  it('names the samvatsara, masa, ritu and ayana', () => {
    expect(day.samvatsara).toEqual({ id: 'parabhava', index: 40 });
    expect(day.masa).toEqual({ id: 'bhadrapada', adhika: false });
    expect(day.ritu).toBe('varsha');
    expect(day.ayana).toBe('dakshinayana');
  });

  it('reports the vasara of the day’s sunrise', () => {
    // 19 September 2026 is a Saturday: sthira vasara.
    expect(day.vasara).toEqual({ id: 'sthira', weekday: 6 });
  });

  it('puts Saturday’s Rahu kalam in the third eighth of daylight', () => {
    expect(localTime(day.rahuKalam[0], HYDERABAD.tz)).toBe('09:07');
    expect(localTime(day.rahuKalam[1], HYDERABAD.tz)).toBe('10:38');
  });

  it('keeps the three kalams inside daylight and out of each other’s way', () => {
    const spans = [day.rahuKalam, day.yamagandam, day.gulikaKalam].map(([s, e]) => [
      new Date(s).getTime(),
      new Date(e).getTime(),
    ]);
    const sunrise = new Date(day.sunrise).getTime();
    const sunset = new Date(day.sunset).getTime();

    for (const [start, end] of spans) {
      expect(start).toBeGreaterThanOrEqual(sunrise);
      expect(end).toBeLessThanOrEqual(sunset);
    }
    expect(new Set(spans.map(([s]) => s)).size).toBe(3);
  });

  it('reports the angas prevailing at sunrise, and spans that contain it', () => {
    const sunrise = new Date(day.sunrise).getTime();
    for (const anga of [day.tithi, day.nakshatra, day.yoga, day.karana]) {
      expect(new Date(anga.startsAt).getTime()).toBeLessThanOrEqual(sunrise + 60_000);
      expect(new Date(anga.endsAt).getTime()).toBeGreaterThan(sunrise);
    }
  });

  it('agrees with the paksha implied by the tithi', () => {
    expect(day.paksha).toBe(day.tithi.index <= 15 ? 'shukla' : 'krishna');
  });

  it('memoizes repeated lookups of the same day and place', () => {
    const first = getDayPanchangam('2026-09-19', HYDERABAD);
    const second = getDayPanchangam('2026-09-19', HYDERABAD);
    expect(second).toBe(first);
  });

  it('accepts a Date and resolves it to the local calendar day', () => {
    const fromDate = getDayPanchangam(new Date('2026-09-19T12:00:00Z'), HYDERABAD);
    expect(fromDate.date).toBe('2026-09-19');
  });
});

describe('the Hindu day runs sunrise to sunrise (§3.7)', () => {
  it('still reports yesterday’s vasara before dawn', () => {
    // 04:30 IST on Sunday 20 September is before sunrise, so it is still
    // Saturday's (sthira) Hindu day.
    const beforeDawn = getPanchangam({
      ...HYDERABAD,
      instant: new Date('2026-09-19T23:00:00Z'), // 04:30 IST on the 20th
    });
    expect(localTime(beforeDawn.computedFor, HYDERABAD.tz)).toBe('04:30');
    expect(beforeDawn.vasara.id).toBe('sthira');
    expect(beforeDawn.date).toBe('2026-09-19');
  });

  it('turns over to the next vasara after sunrise', () => {
    const afterDawn = getPanchangam({
      ...HYDERABAD,
      instant: new Date('2026-09-20T01:30:00Z'), // 07:00 IST on the 20th
    });
    expect(afterDawn.vasara.id).toBe('bhanu');
    expect(afterDawn.date).toBe('2026-09-20');
  });

  it('names all seven vasaras across a week, in order', () => {
    const ids = [];
    for (let day = 20; day <= 26; day += 1) {
      ids.push(getDayPanchangam(`2026-09-${day}`, HYDERABAD).vasara.id);
    }
    expect(ids).toEqual([...VASARA_IDS]);
  });
});

describe('mostRecentSunrise', () => {
  it('returns a sunrise at or before the instant', () => {
    const instant = new Date('2026-09-19T12:00:00Z');
    const sunrise = mostRecentSunrise(instant, HYDERABAD);
    expect(sunrise.getTime()).toBeLessThanOrEqual(instant.getTime());
    expect(instant.getTime() - sunrise.getTime()).toBeLessThan(24 * 3_600_000);
  });

  it('returns the previous day’s sunrise just before dawn', () => {
    const beforeDawn = new Date('2026-09-19T00:00:00Z'); // 05:30 IST, before 06:04
    expect(localTime(mostRecentSunrise(beforeDawn, HYDERABAD).toISOString(), HYDERABAD.tz)).toBe(
      '06:04',
    );
    expect(mostRecentSunrise(beforeDawn, HYDERABAD).getUTCDate()).toBe(18);
  });
});

describe('NRI locations and daylight saving', () => {
  it('computes a US east-coast day either side of the DST change', () => {
    // US DST ended 1 November 2026: sunrise jumps back an hour in local time.
    const before = getDayPanchangam('2026-10-31', NEW_JERSEY);
    const after = getDayPanchangam('2026-11-01', NEW_JERSEY);

    // The clock jumps back an hour while the instant of sunrise creeps
    // forward by about a minute a day: 11:25Z then 11:26Z.
    expect(localTime(before.sunrise, NEW_JERSEY.tz)).toBe('07:25');
    expect(localTime(after.sunrise, NEW_JERSEY.tz)).toBe('06:26');
    expect(new Date(after.sunrise).getTime()).toBeGreaterThan(new Date(before.sunrise).getTime());
    expect(before.date).toBe('2026-10-31');
    expect(after.date).toBe('2026-11-01');
  });

  it('computes a UK day either side of the DST change', () => {
    // UK clocks went back on 25 October 2026.
    const before = getDayPanchangam('2026-10-24', LONDON);
    const after = getDayPanchangam('2026-10-25', LONDON);
    expect(Number(localTime(before.sunrise, LONDON.tz).slice(0, 2))).toBeGreaterThanOrEqual(7);
    expect(Number(localTime(after.sunrise, LONDON.tz).slice(0, 2))).toBeLessThanOrEqual(7);
  });

  it('gets a southern-hemisphere ritu right (Sydney keeps the Indian lunar month)', () => {
    const sydney = getDayPanchangam('2026-09-19', SYDNEY);
    // Masa and ritu are lunar, not seasonal, so they match India even in spring.
    expect(sydney.masa.id).toBe('bhadrapada');
    expect(sydney.ritu).toBe('varsha');
    expect(sydney.date).toBe('2026-09-19');
  });

  it('keeps the same tithi id across places on the same instant', () => {
    const instant = new Date('2026-09-19T06:00:00Z');
    const hyderabad = getPanchangam({ ...HYDERABAD, instant });
    const dubai = getPanchangam({ ...DUBAI, instant });
    const newJersey = getPanchangam({ ...NEW_JERSEY, instant });

    // The angas are global; only the day framing and timings are local.
    expect(dubai.tithi.id).toBe(hyderabad.tithi.id);
    expect(newJersey.tithi.id).toBe(hyderabad.tithi.id);
    expect(newJersey.sunrise).not.toBe(hyderabad.sunrise);
  });

  it('gives each location its own sunrise', () => {
    const instant = new Date('2026-09-19T06:00:00Z');
    const sunrises = [HYDERABAD, DUBAI, LONDON, NEW_JERSEY, SYDNEY].map(
      (loc) => getPanchangam({ ...loc, instant }).sunrise,
    );
    expect(new Set(sunrises).size).toBe(5);
  });
});

describe('getMonth', () => {
  const september = getMonth(2026, 9, HYDERABAD);

  it('returns every day of the month', () => {
    expect(september).toHaveLength(30);
    expect(september[0]?.date).toBe('2026-09-01');
    expect(september[29]?.date).toBe('2026-09-30');
  });

  it('returns days in order with no gaps', () => {
    for (let i = 1; i < september.length; i += 1) {
      const previous = new Date(`${september[i - 1]!.date}T00:00:00Z`).getTime();
      const current = new Date(`${september[i]!.date}T00:00:00Z`).getTime();
      expect(current - previous).toBe(86_400_000);
    }
  });

  it('handles a 31-day month and a February', () => {
    expect(getMonth(2026, 1, HYDERABAD)).toHaveLength(31);
    expect(getMonth(2026, 2, HYDERABAD)).toHaveLength(28);
    expect(getMonth(2028, 2, HYDERABAD)).toHaveLength(29);
  });

  it('advances the tithi by roughly one a day', () => {
    const indices = september.map((d) => d.tithi.index);
    const distinct = new Set(indices);
    expect(distinct.size).toBeGreaterThanOrEqual(27);
  });
});

describe('NoSunriseError', () => {
  it('is thrown where the Sun neither rises nor sets', () => {
    // Tromsø in midsummer: the Sun stays up.
    expect(() => getDayPanchangam('2026-06-21', TROMSO)).toThrow(NoSunriseError);
  });

  it('names the location and instant', () => {
    try {
      getDayPanchangam('2026-06-21', TROMSO);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as Error).name).toBe('NoSunriseError');
      expect((error as Error).message).toContain('69.6496');
    }
  });
});

describe('basis option (§3.7)', () => {
  it('reports the angas at the puja’s instant when asked', () => {
    const instant = new Date('2026-09-19T14:00:00Z'); // 19:30 IST, an evening puja
    const atInstant = getDayPanchangam(instant, HYDERABAD, { basis: 'instant' });
    expect(atInstant.computedFor).toBe(instant.toISOString());
  });

  it('defaults to sunrise, which a printed panchangam shows', () => {
    const day = getDayPanchangam('2026-09-19', HYDERABAD);
    const sunrise = new Date(day.sunrise).getTime();
    const computedFor = new Date(day.computedFor).getTime();
    expect(computedFor - sunrise).toBeLessThanOrEqual(60_000);
  });

  it('can disagree with the sunrise basis when a tithi turns during the day', () => {
    const day = getDayPanchangam('2026-09-19', HYDERABAD);
    const evening = getDayPanchangam(new Date('2026-09-19T16:00:00Z'), HYDERABAD, {
      basis: 'instant',
    });
    expect(evening.tithi.index).toBeGreaterThanOrEqual(day.tithi.index);
  });
});

describe('edge cases', () => {
  it('accepts an observer altitude', () => {
    // §9.1 fixes the sunrise convention as upper limb with standard refraction
    // and no horizon-dip correction, so elevation moves the result by seconds
    // at most. ADR 0002 records that; the point here is that it is accepted
    // and still produces a sane day.
    const sea = getPanchangam({ ...HYDERABAD, instant: new Date('2026-09-19T06:00:00Z') });
    const high = getPanchangam({
      ...HYDERABAD,
      altitudeMeters: 2000,
      instant: new Date('2026-09-19T06:00:00Z'),
    });
    const driftSeconds =
      Math.abs(new Date(high.sunrise).getTime() - new Date(sea.sunrise).getTime()) / 1000;
    expect(driftSeconds).toBeLessThan(120);
    expect(high.vasara).toEqual(sea.vasara);
  });

  it('returns the upcoming sunrise when none has happened within the search window', () => {
    // Near the Arctic circle in spring the Sun can skip a day's rise; the
    // search then lands on the next one rather than throwing.
    const sunrise = mostRecentSunrise(new Date('2026-03-20T12:00:00Z'), {
      lat: 66.5,
      lng: 25.7,
      tz: 'Europe/Helsinki',
    });
    expect(sunrise).toBeInstanceOf(Date);
  });

  it('clears the memo once it fills up', () => {
    clearPanchangamCache();
    // The cache holds 256 entries; nine months is more than that.
    for (let month = 1; month <= 9; month += 1) getMonth(2026, month, HYDERABAD);
    // Still correct after eviction.
    expect(getDayPanchangam('2026-09-19', HYDERABAD).vasara.id).toBe('sthira');
  });
});
