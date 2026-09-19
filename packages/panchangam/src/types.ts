/**
 * Panchangam types (§9.4).
 *
 * These live here rather than in `@epooja/content` because this package must
 * stay dependency-free; Phase 4's content package re-exports them (ADR 0002).
 */

export interface GeoLocation {
  lat: number;
  lng: number;
  /** IANA timezone, e.g. `Asia/Kolkata`. Required — NRI users are first-class. */
  tz: string;
  altitudeMeters?: number;
}

/** A span of an anga with its identity and its start/end instants (ISO 8601). */
export interface AngaSpan<T extends string = string> {
  id: T;
  index: number;
  startsAt: string;
  endsAt: string;
}

export type Paksha = 'shukla' | 'krishna';
export type Ayana = 'uttarayana' | 'dakshinayana';
export type NakshatraPada = 1 | 2 | 3 | 4;
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface PrayerTiming {
  id: 'morning' | 'midday' | 'evening';
  start: string;
  end: string;
}

export interface PanchangamData {
  /** Local calendar date (yyyy-MM-dd) of the Hindu day this describes. */
  date: string;
  tz: string;
  lat: number;
  lng: number;
  /** The instant the angas were evaluated at (§3.7). */
  computedFor: string;
  samvatsara: { id: string; index: number };
  ayana: Ayana;
  ritu: string;
  masa: { id: string; adhika: boolean };
  paksha: Paksha;
  tithi: AngaSpan;
  nakshatra: AngaSpan & { pada: NakshatraPada };
  yoga: AngaSpan;
  karana: AngaSpan;
  vasara: { id: string; weekday: Weekday };
  sunrise: string;
  sunset: string;
  moonrise?: string;
  moonset?: string;
  rahuKalam: [string, string];
  yamagandam: [string, string];
  gulikaKalam: [string, string];
  prayerTimings: PrayerTiming[];
}

export interface PanchangamInput extends GeoLocation {
  /** The moment the puja starts. Angas are those prevailing then (§3.7). */
  instant: Date;
}

export interface DayPanchangamOptions {
  /**
   * Which instant the angas are reported for (§3.7).
   * - `sunrise` — the values prevailing at local sunrise (printed-panchangam convention)
   * - `instant` — the values prevailing at the moment passed in (puja start)
   */
  basis?: 'sunrise' | 'instant';
}

/** The anga families `findTransitions` can walk. */
export type AngaKind = 'tithi' | 'nakshatra' | 'yoga' | 'karana';
