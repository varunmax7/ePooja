import {
  Body,
  EclipticGeoMoon,
  MakeTime,
  Observer,
  SearchRiseSet,
  SunPosition,
} from 'astronomy-engine';
import { julianDay, lahiriAyanamsa } from './ayanamsa.js';
import { norm360 } from './math.js';
import type { GeoLocation } from './types.js';

/** Apparent geocentric tropical ecliptic longitude of the Sun, of date. */
export function sunTropicalLongitude(instant: Date): number {
  return norm360(SunPosition(instant).elon);
}

/** Apparent geocentric tropical ecliptic longitude of the Moon, of date. */
export function moonTropicalLongitude(instant: Date): number {
  return norm360(EclipticGeoMoon(instant).lon);
}

/** Ayanamsa in degrees at an instant. */
export function ayanamsaAt(instant: Date): number {
  return lahiriAyanamsa(julianDay(MakeTime(instant)));
}

/** Sidereal longitude = tropical − ayanamsa (§9.1). */
export function toSidereal(tropicalLongitude: number, instant: Date): number {
  return norm360(tropicalLongitude - ayanamsaAt(instant));
}

export function sunSiderealLongitude(instant: Date): number {
  return toSidereal(sunTropicalLongitude(instant), instant);
}

export function moonSiderealLongitude(instant: Date): number {
  return toSidereal(moonTropicalLongitude(instant), instant);
}

/**
 * Elongation of the Moon from the Sun, 0–360°. Tithi, paksha and karana are
 * all slices of this one quantity, and because the ayanamsa cancels in the
 * subtraction it is identical in tropical and sidereal frames.
 */
export function moonSunElongation(instant: Date): number {
  return norm360(moonTropicalLongitude(instant) - sunTropicalLongitude(instant));
}

function observerFor(location: GeoLocation): Observer {
  return new Observer(location.lat, location.lng, location.altitudeMeters ?? 0);
}

/**
 * Sunrise/sunset search (§9.1: upper limb, standard refraction — which is what
 * `SearchRiseSet` applies by default).
 *
 * @param direction +1 for rise, -1 for set
 * @param searchFrom instant to search forward (or backward) from
 * @param limitDays search window; negative searches backwards
 */
export function searchSun(
  location: GeoLocation,
  direction: 1 | -1,
  searchFrom: Date,
  limitDays: number,
): Date | null {
  const found = SearchRiseSet(Body.Sun, observerFor(location), direction, searchFrom, limitDays);
  return found ? found.date : null;
}

export function searchMoon(
  location: GeoLocation,
  direction: 1 | -1,
  searchFrom: Date,
  limitDays: number,
): Date | null {
  const found = SearchRiseSet(Body.Moon, observerFor(location), direction, searchFrom, limitDays);
  return found ? found.date : null;
}
