import { moonSiderealLongitude, moonSunElongation, sunSiderealLongitude } from './astronomy';
import { norm360 } from './math';
import type { NakshatraPada, Paksha } from './types';

export const TITHI_ARC = 12;
export const NAKSHATRA_ARC = 360 / 27;
export const YOGA_ARC = 360 / 27;
export const KARANA_ARC = 6;
export const PADA_ARC = NAKSHATRA_ARC / 4;
export const RASI_ARC = 30;

/** Tithi 1–30 (§9.1). 1–15 Shukla, 16–30 Krishna; 15 Pournami, 30 Amavasya. */
export function tithiIndex(instant: Date): number {
  return Math.floor(moonSunElongation(instant) / TITHI_ARC) + 1;
}

export function pakshaOf(tithi: number): Paksha {
  return tithi <= 15 ? 'shukla' : 'krishna';
}

/** Nakshatra 1–27 from the Moon's sidereal longitude (§9.1). */
export function nakshatraIndex(instant: Date): number {
  return Math.floor(moonSiderealLongitude(instant) / NAKSHATRA_ARC) + 1;
}

/** Pada 1–4 within the current nakshatra (§9.1). */
export function nakshatraPada(instant: Date): NakshatraPada {
  const lon = moonSiderealLongitude(instant);
  const pada = Math.floor((lon % NAKSHATRA_ARC) / PADA_ARC) + 1;
  return Math.min(4, Math.max(1, pada)) as NakshatraPada;
}

/** Yoga 1–27 from the summed sidereal longitudes (§9.1). */
export function yogaIndex(instant: Date): number {
  const sum = norm360(sunSiderealLongitude(instant) + moonSiderealLongitude(instant));
  return Math.floor(sum / YOGA_ARC) + 1;
}

/** Rasi 0–11 (Mesha = 0) of a sidereal longitude. */
export function rasiOf(siderealLongitude: number): number {
  return Math.floor(norm360(siderealLongitude) / RASI_ARC);
}

/**
 * Karana ids in the order §9.1 lays out: the seven movable karanas repeat
 * through half-tithis 1–56, bracketed by the four fixed ones.
 */
export const MOVABLE_KARANAS = [
  'bava',
  'balava',
  'kaulava',
  'taitila',
  'garaja',
  'vanija',
  'vishti',
] as const;

export const KARANA_IDS = [
  'kimstughna',
  ...MOVABLE_KARANAS,
  'shakuni',
  'chatushpada',
  'naga',
] as const;

export type KaranaId = (typeof KARANA_IDS)[number];

/** Half-tithi index 0–59 (§9.1). */
export function karanaHalfIndex(instant: Date): number {
  return Math.floor(moonSunElongation(instant) / KARANA_ARC);
}

/**
 * Karana for a half-tithi index (§9.1):
 * k = 0 Kimstughna; k = 1…56 cycle through the seven movable karanas;
 * k = 57 Shakuni, 58 Chatushpada, 59 Naga.
 */
export function karanaFromHalfIndex(k: number): { id: KaranaId; index: number } {
  if (k === 0) return { id: 'kimstughna', index: 1 };
  if (k === 57) return { id: 'shakuni', index: 9 };
  if (k === 58) return { id: 'chatushpada', index: 10 };
  if (k === 59) return { id: 'naga', index: 11 };

  const movable = MOVABLE_KARANAS[(k - 1) % 7];
  /* c8 ignore next -- (k-1) % 7 is always 0..6, so `movable` cannot be undefined */
  if (!movable) throw new Error(`Unreachable karana index ${k}`);
  return { id: movable, index: MOVABLE_KARANAS.indexOf(movable) + 2 };
}

export function karanaAt(instant: Date): { id: KaranaId; index: number; halfIndex: number } {
  const halfIndex = karanaHalfIndex(instant);
  return { ...karanaFromHalfIndex(halfIndex), halfIndex };
}
