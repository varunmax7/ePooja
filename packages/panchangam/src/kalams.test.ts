import { describe, expect, it } from 'vitest';
import {
  GULIKA_SEGMENTS,
  RAHU_SEGMENTS,
  YAMA_SEGMENTS,
  gulikaKalam,
  prayerTimings,
  rahuKalam,
  yamagandam,
} from './kalams';
import type { Weekday } from './types';

// A clean 12-hour day so segment boundaries land on exact 90-minute marks.
const SUNRISE = new Date('2026-09-19T00:00:00Z');
const SUNSET = new Date('2026-09-19T12:00:00Z');
const EIGHTH_MS = 90 * 60 * 1000;

const minutesFromSunrise = (d: Date): number => (d.getTime() - SUNRISE.getTime()) / 60_000;
const weekdays: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

describe('rahuKalam', () => {
  it.each(weekdays)('places weekday %i in its §9.1 segment', (weekday) => {
    const segment = RAHU_SEGMENTS[weekday] as number;
    const [start, end] = rahuKalam(SUNRISE, SUNSET, weekday);
    expect(minutesFromSunrise(start)).toBeCloseTo((segment - 1) * 90, 6);
    expect(end.getTime() - start.getTime()).toBe(EIGHTH_MS);
  });

  it('puts Saturday’s Rahu kalam in the third segment (09:00–10:30 on a 06:00 sunrise)', () => {
    const [start, end] = rahuKalam(SUNRISE, SUNSET, 6);
    expect(minutesFromSunrise(start)).toBe(180);
    expect(minutesFromSunrise(end)).toBe(270);
  });
});

describe('yamagandam', () => {
  it.each(weekdays)('places weekday %i in its §9.1 segment', (weekday) => {
    const segment = YAMA_SEGMENTS[weekday] as number;
    const [start] = yamagandam(SUNRISE, SUNSET, weekday);
    expect(minutesFromSunrise(start)).toBeCloseTo((segment - 1) * 90, 6);
  });

  it('starts at sunrise on a Thursday (segment 1)', () => {
    expect(yamagandam(SUNRISE, SUNSET, 4)[0].toISOString()).toBe(SUNRISE.toISOString());
  });
});

describe('gulikaKalam', () => {
  it.each(weekdays)('places weekday %i in its §9.1 segment', (weekday) => {
    const segment = GULIKA_SEGMENTS[weekday] as number;
    const [start] = gulikaKalam(SUNRISE, SUNSET, weekday);
    expect(minutesFromSunrise(start)).toBeCloseTo((segment - 1) * 90, 6);
  });

  it('walks one segment earlier each day from Sunday to Saturday', () => {
    const starts = weekdays.map((w) => minutesFromSunrise(gulikaKalam(SUNRISE, SUNSET, w)[0]));
    expect(starts).toEqual([540, 450, 360, 270, 180, 90, 0]);
  });
});

describe('segment tables', () => {
  it('assign each weekday a distinct segment within the eight daylight parts', () => {
    for (const table of [RAHU_SEGMENTS, YAMA_SEGMENTS, GULIKA_SEGMENTS]) {
      expect(table).toHaveLength(7);
      expect(new Set(table).size).toBe(7);
      expect(table.every((s) => s >= 1 && s <= 8)).toBe(true);
    }
  });

  it('never overlap on the same weekday', () => {
    for (const weekday of weekdays) {
      const segments = [RAHU_SEGMENTS[weekday], YAMA_SEGMENTS[weekday], GULIKA_SEGMENTS[weekday]];
      expect(new Set(segments).size).toBe(3);
    }
  });
});

describe('prayerTimings', () => {
  const timings = prayerTimings(SUNRISE, SUNSET);

  it('returns morning, midday and evening', () => {
    expect(timings.map((t) => t.id)).toEqual(['morning', 'midday', 'evening']);
  });

  it('splits daylight into fifths', () => {
    const fifth = (SUNSET.getTime() - SUNRISE.getTime()) / 5;
    for (const timing of timings) {
      expect(new Date(timing.end).getTime() - new Date(timing.start).getTime()).toBeCloseTo(
        fifth,
        6,
      );
    }
  });

  it('starts the morning at sunrise and ends the evening at sunset', () => {
    expect(timings[0]?.start).toBe(SUNRISE.toISOString());
    expect(timings[2]?.end).toBe(SUNSET.toISOString());
  });

  it('keeps the three windows in order and non-overlapping', () => {
    expect(new Date(timings[0]!.end).getTime()).toBeLessThanOrEqual(
      new Date(timings[1]!.start).getTime(),
    );
    expect(new Date(timings[1]!.end).getTime()).toBeLessThanOrEqual(
      new Date(timings[2]!.start).getTime(),
    );
  });
});
