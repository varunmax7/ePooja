import { SearchMoonPhase } from 'astronomy-engine';
import { rasiOf } from './angas';
import { sunSiderealLongitude } from './astronomy';
import { addDays } from './math';
import type { Ayana } from './types';

/** Amanta (Chandramana) masa ids, Chaitra first (§9.2). */
export const MASA_IDS = [
  'chaitra',
  'vaishakha',
  'jyeshtha',
  'ashadha',
  'shravana',
  'bhadrapada',
  'ashvayuja',
  'kartika',
  'margashira',
  'pushya',
  'magha',
  'phalguna',
] as const;

export type MasaId = (typeof MASA_IDS)[number];

/** Ruthuvu ids; each spans two masas (§9.1). */
export const RITU_IDS = ['vasanta', 'grishma', 'varsha', 'sharad', 'hemanta', 'shishira'] as const;

export type RituId = (typeof RITU_IDS)[number];

/** Samvatsara cycle, in the order §9.2 lists it. */
export const SAMVATSARA_IDS = [
  'prabhava',
  'vibhava',
  'shukla',
  'pramoduta',
  'prajotpatti',
  'angirasa',
  'shrimukha',
  'bhava',
  'yuva',
  'dhatu',
  'ishvara',
  'bahudhanya',
  'pramathi',
  'vikrama',
  'vrisha',
  'chitrabhanu',
  'svabhanu',
  'tarana',
  'parthiva',
  'vyaya',
  'sarvajit',
  'sarvadhari',
  'virodhi',
  'vikriti',
  'khara',
  'nandana',
  'vijaya',
  'jaya',
  'manmatha',
  'durmukhi',
  'hevilambi',
  'vilambi',
  'vikari',
  'sharvari',
  'plava',
  'shubhakrit',
  'shobhakrit',
  'krodhi',
  'vishvavasu',
  'parabhava',
  'plavanga',
  'kilaka',
  'saumya',
  'sadharana',
  'virodhikrit',
  'paridhavi',
  'pramadicha',
  'ananda',
  'rakshasa',
  'nala',
  'pingala',
  'kalayukti',
  'siddharthi',
  'raudri',
  'durmati',
  'dundubhi',
  'rudhirodgari',
  'raktakshi',
  'krodhana',
  'akshaya',
] as const;

export type SamvatsaraId = (typeof SAMVATSARA_IDS)[number];

/** Mean synodic month, used only to size search windows. */
const SYNODIC_DAYS = 29.53059;

/** The new moon at or before `instant`. */
export function previousNewMoon(instant: Date): Date {
  // A 30.5-day window ending at `instant` always contains at least one new
  // moon, and at most two; take the later one that is still ≤ instant.
  const first = SearchMoonPhase(0, addDays(instant, -(SYNODIC_DAYS + 1)), SYNODIC_DAYS + 1.5);
  /* c8 ignore next -- the search window is wider than a synodic month */
  if (!first) throw new Error(`No new moon found before ${instant.toISOString()}`);

  const second = SearchMoonPhase(0, addDays(first.date, 1), SYNODIC_DAYS + 2);
  if (second && second.date.getTime() <= instant.getTime()) return second.date;
  return first.date;
}

/** The first new moon strictly after `instant`. */
export function nextNewMoon(instant: Date): Date {
  const found = SearchMoonPhase(0, addDays(instant, 0.01), SYNODIC_DAYS + 2);
  /* c8 ignore next -- the search window is wider than a synodic month */
  if (!found) throw new Error(`No new moon found after ${instant.toISOString()}`);
  return found.date;
}

export interface LunarMonth {
  /** New moon that begins the month. */
  startsAt: Date;
  /** New moon that begins the following month. */
  endsAt: Date;
  masaIndex: number;
  id: MasaId;
  adhika: boolean;
}

/**
 * The amanta lunar month containing `instant` (§9.1).
 *
 * The Sun's sidereal rashi at the opening new moon fixes the month name
 * (`masa = (rashi + 1) mod 12`); if the Sun has not changed rashi by the next
 * new moon, no sankranti fell inside the month and it is an **adhika** masa
 * bearing the same name.
 */
export function lunarMonthAt(instant: Date): LunarMonth {
  const startsAt = previousNewMoon(instant);
  const endsAt = nextNewMoon(startsAt);

  const rashiAtStart = rasiOf(sunSiderealLongitude(startsAt));
  const rashiAtEnd = rasiOf(sunSiderealLongitude(endsAt));

  const masaIndex = (rashiAtStart + 1) % 12;
  const id = MASA_IDS[masaIndex];
  /* c8 ignore next -- masaIndex is always 0..11 */
  if (!id) throw new Error(`Unreachable masa index ${masaIndex}`);

  return { startsAt, endsAt, masaIndex, id, adhika: rashiAtStart === rashiAtEnd };
}

/** Ruthuvu of a masa. Adhika takes its nija month's ruthuvu (§9.1). */
export function rituOf(masaIndex: number): RituId {
  const ritu = RITU_IDS[Math.floor(masaIndex / 2)];
  /* c8 ignore next -- masaIndex is always 0..11 */
  if (!ritu) throw new Error(`Unreachable ritu for masa ${masaIndex}`);
  return ritu;
}

/**
 * Ayanam (§9.1): Uttarayanam while the Sun's sidereal rashi is Makara (9)
 * through Mithuna (2) — i.e. from Makara Sankranti to Karkataka Sankranti.
 */
export function ayanaAt(instant: Date): Ayana {
  const rashi = rasiOf(sunSiderealLongitude(instant));
  return rashi >= 9 || rashi <= 2 ? 'uttarayana' : 'dakshinayana';
}

/**
 * The Ugadi (Chaitra Shukla Pratipada) that opened the current samvatsara: the
 * new moon starting the most recent Chaitra month at or before `instant`.
 *
 * When an adhika Chaitra occurs, the year opens at the adhika month — the
 * first Chaitra — which is the convention ADR 0002 records.
 */
export function currentYearStart(instant: Date): Date {
  let month = lunarMonthAt(instant);

  if (month.masaIndex !== 0) {
    // Jump back roughly `masaIndex` lunar months, landing within one month of
    // Chaitra, then correct by at most one step in either direction.
    month = lunarMonthAt(addDays(month.startsAt, -(month.masaIndex * SYNODIC_DAYS) + 3));

    for (let step = 0; step < 3 && month.masaIndex !== 0; step += 1) {
      const goBack = month.masaIndex <= 6;
      const from = goBack ? addDays(month.startsAt, -1) : addDays(month.endsAt, SYNODIC_DAYS / 2);
      month = lunarMonthAt(from);
    }
  }

  /* c8 ignore next -- the correction above always lands on Chaitra */
  if (month.masaIndex !== 0) throw new Error(`No Chaitra month found for ${instant.toISOString()}`);

  // An adhika Chaitra is preceded by another Chaitra; the year starts at that one.
  const previous = lunarMonthAt(addDays(month.startsAt, -1));
  return previous.masaIndex === 0 ? previous.startsAt : month.startsAt;
}

/**
 * Samvatsara (§9.1): `((Y − 1987) mod 60) + 1`, where Y is the Gregorian year
 * of the most recent Ugadi. Anchors from the plan: 2024-25 Krodhi (38),
 * 2025-26 Vishvavasu (39), 2026-27 Parabhava (40).
 */
export function samvatsaraAt(instant: Date): { id: SamvatsaraId; index: number } {
  const yearStart = currentYearStart(instant);
  const gregorianYear = yearStart.getUTCFullYear();
  const index = (((gregorianYear - 1987) % 60) + 60) % 60;
  const id = SAMVATSARA_IDS[index];
  /* c8 ignore next -- index is always 0..59 */
  if (!id) throw new Error(`Unreachable samvatsara index ${index}`);
  return { id, index: index + 1 };
}
