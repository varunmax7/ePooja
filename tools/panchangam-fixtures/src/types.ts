/**
 * Fixture format for the Panchangam golden set (§9.1).
 *
 * Fixtures come in two classes, and the difference matters:
 *
 * - `verified` — the expected values were read off a reference panchangam (or
 *   another independent authority) and hand-checked. These prove correctness.
 * - `engine-snapshot` — the expected values were produced by this engine. They
 *   catch regressions and nothing else; they can never prove the engine right.
 *
 * §9.1's acceptance bar is ≥ 60 **verified** cases. Anything still marked
 * `engine-snapshot` is listed in `content/REVIEW_QUEUE.md` as outstanding.
 */
export type FixtureSource = 'verified' | 'engine-snapshot';

export interface FixturePlace {
  id: string;
  label: string;
  lat: number;
  lng: number;
  tz: string;
}

export interface FixtureExpectation {
  samvatsara?: { id: string; index: number };
  ayana?: string;
  ritu?: string;
  masa?: { id: string; adhika: boolean };
  paksha?: string;
  tithi?: { id: string; index: number };
  nakshatra?: { id: string; index: number; pada: number };
  yoga?: { id: string; index: number };
  karana?: { id: string; index: number };
  vasara?: { id: string; weekday: number };
  /** Local HH:mm in the fixture's timezone. */
  sunrise?: string;
  sunset?: string;
  rahuKalam?: [string, string];
  /** ISO instants; compared within the transition tolerance. */
  tithiEndsAt?: string;
  nakshatraEndsAt?: string;
}

export interface Fixture {
  id: string;
  place: FixturePlace;
  /** Local calendar date, yyyy-MM-dd. */
  date: string;
  source: FixtureSource;
  /** Where a `verified` fixture's values came from. Required when verified. */
  reference?: string;
  /** Why this case is in the set. */
  why: string;
  expect: FixtureExpectation;
}

export interface FixtureFile {
  $schema?: string;
  note: string;
  /** Tolerances from §9.1. */
  tolerances: {
    sunriseMinutes: number;
    transitionMinutes: number;
  };
  fixtures: Fixture[];
}

export const PLACES: Record<string, FixturePlace> = {
  hyderabad: { id: 'hyderabad', label: 'Hyderabad', lat: 17.385, lng: 78.4867, tz: 'Asia/Kolkata' },
  vijayawada: {
    id: 'vijayawada',
    label: 'Vijayawada',
    lat: 16.5062,
    lng: 80.648,
    tz: 'Asia/Kolkata',
  },
  tirupati: { id: 'tirupati', label: 'Tirupati', lat: 13.6288, lng: 79.4192, tz: 'Asia/Kolkata' },
  visakhapatnam: {
    id: 'visakhapatnam',
    label: 'Visakhapatnam',
    lat: 17.6868,
    lng: 83.2185,
    tz: 'Asia/Kolkata',
  },
  newJersey: {
    id: 'newJersey',
    label: 'Edison, New Jersey',
    lat: 40.5187,
    lng: -74.4121,
    tz: 'America/New_York',
  },
  dallas: { id: 'dallas', label: 'Dallas', lat: 32.7767, lng: -96.797, tz: 'America/Chicago' },
  dubai: { id: 'dubai', label: 'Dubai', lat: 25.2048, lng: 55.2708, tz: 'Asia/Dubai' },
  london: { id: 'london', label: 'London', lat: 51.5072, lng: -0.1276, tz: 'Europe/London' },
  sydney: { id: 'sydney', label: 'Sydney', lat: -33.8688, lng: 151.2093, tz: 'Australia/Sydney' },
};
