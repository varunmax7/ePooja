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
 * Which fifth of daylight each prayer window occupies.
 *
 * Daylight is split into the five traditional parts (pratah, sangava,
 * madhyahna, aparahna, sayahna); the app surfaces the three a household puja
 * uses. §8.2 puts the authoritative windows in `content/timings.json`, which
 * is where the app reads them from — this default is the same choice, kept
 * here so the engine stays usable on its own and cannot depend on content
 * (§15). ADR 0002 records it; §9.1 does not pin it down.
 */
export const DEFAULT_PRAYER_PARTS: Readonly<Record<PrayerTiming['id'], number>> = {
  morning: 0,
  midday: 2,
  evening: 4,
};

/** Total parts daylight is divided into for the prayer windows. */
export const PRAYER_DAY_PARTS = 5;

/**
 * Prayer timings for the reminder schedule (§9.4 `prayerTimings`).
 *
 * `parts` maps each window to the fifth of daylight it starts at; the app
 * passes the values from `content/timings.json` so a pandit can move a window
 * without a release.
 */
export function prayerTimings(
  sunrise: Date,
  sunset: Date,
  parts: Readonly<Record<PrayerTiming['id'], number>> = DEFAULT_PRAYER_PARTS,
): PrayerTiming[] {
  const span = (sunset.getTime() - sunrise.getTime()) / PRAYER_DAY_PARTS;

  return (['morning', 'midday', 'evening'] as const).map((id) => {
    const part = parts[id];
    if (!Number.isInteger(part) || part < 0 || part >= PRAYER_DAY_PARTS) {
      throw new RangeError(`${id} prayer window must be part 0–${PRAYER_DAY_PARTS - 1}, got ${part}`);
    }
    return {
      id,
      start: new Date(sunrise.getTime() + part * span).toISOString(),
      end: new Date(sunrise.getTime() + (part + 1) * span).toISOString(),
    };
  });
}
