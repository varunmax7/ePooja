import type { PrayerTiming, Weekday } from './types';

/**
 * Inauspicious periods (§9.1): daylight is divided into eight equal parts and
 * each weekday takes one of them, numbered from sunrise.
 *
 * Index 0 = Sunday. The tables are 1-indexed segments exactly as §9.1 states
 * them, so they can be read straight off the plan when verifying.
 */
export const RAHU_SEGMENTS: readonly number[] = [8, 2, 7, 5, 6, 4, 3];
export const YAMA_SEGMENTS: readonly number[] = [5, 4, 3, 2, 1, 7, 6];
export const GULIKA_SEGMENTS: readonly number[] = [7, 6, 5, 4, 3, 2, 1];

export type KalamSpan = [Date, Date];

function segmentSpan(sunrise: Date, sunset: Date, segment: number): KalamSpan {
  const dayLength = sunset.getTime() - sunrise.getTime();
  const eighth = dayLength / 8;
  const start = new Date(sunrise.getTime() + (segment - 1) * eighth);
  const end = new Date(start.getTime() + eighth);
  return [start, end];
}

function segmentFor(table: readonly number[], weekday: Weekday): number {
  const segment = table[weekday];
  /* c8 ignore next -- weekday is always 0..6 */
  if (segment === undefined) throw new Error(`Unreachable weekday ${weekday}`);
  return segment;
}

export function rahuKalam(sunrise: Date, sunset: Date, weekday: Weekday): KalamSpan {
  return segmentSpan(sunrise, sunset, segmentFor(RAHU_SEGMENTS, weekday));
}

export function yamagandam(sunrise: Date, sunset: Date, weekday: Weekday): KalamSpan {
  return segmentSpan(sunrise, sunset, segmentFor(YAMA_SEGMENTS, weekday));
}

export function gulikaKalam(sunrise: Date, sunset: Date, weekday: Weekday): KalamSpan {
  return segmentSpan(sunrise, sunset, segmentFor(GULIKA_SEGMENTS, weekday));
}

/**
 * Prayer timings for the reminder schedule (§9.4 `prayerTimings`).
 *
 * Daylight is split into the five traditional parts (pratah, sangava,
 * madhyahna, aparahna, sayahna); the app surfaces the three a household puja
 * uses. ADR 0002 records this choice — §9.1 does not pin it down.
 */
export function prayerTimings(sunrise: Date, sunset: Date): PrayerTiming[] {
  const fifth = (sunset.getTime() - sunrise.getTime()) / 5;
  const part = (n: number): [string, string] => [
    new Date(sunrise.getTime() + n * fifth).toISOString(),
    new Date(sunrise.getTime() + (n + 1) * fifth).toISOString(),
  ];

  const [morningStart, morningEnd] = part(0);
  const [middayStart, middayEnd] = part(2);
  const [eveningStart, eveningEnd] = part(4);

  return [
    { id: 'morning', start: morningStart, end: morningEnd },
    { id: 'midday', start: middayStart, end: middayEnd },
    { id: 'evening', start: eveningStart, end: eveningEnd },
  ];
}
