import tzLookup from 'tz-lookup';
import { nearestCity, type City, type DevoteeLocation } from '@epooja/content';

/**
 * Turns a coordinate or a chosen city into the `DevoteeLocation` §9.4 stores
 * (§8.1's location step, §8.5's reverse lookup). Kept free of `expo-location`
 * so it is unit-testable in Node — the native call is a thin wrapper around
 * `resolveFromCoords` in `native.ts`.
 */

/**
 * How close a GPS fix has to be to a listed city before the label shows that
 * city's name outright, rather than "near {city}". Inside a city this is
 * comfortably true; the fallback exists for the coarser Telugu-district
 * coverage the list has outside its cities (`content/cities.json`).
 */
const SAME_CITY_KM = 25;

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * A GPS fix → a `DevoteeLocation`.
 *
 * The timezone always comes from `tz-lookup` against the raw coordinate, not
 * from the matched city — a devotee standing near a state line must get their
 * own zone, never the nearest listed city's. The city match only supplies the
 * display label and, when close enough, `cityId`.
 */
export function resolveFromCoords(cities: readonly City[], point: Coordinates): DevoteeLocation {
  const tz = tzLookup(point.lat, point.lng);
  const match = nearestCity(cities, point);

  if (match !== null && match.distanceKm <= SAME_CITY_KM) {
    return {
      lat: point.lat,
      lng: point.lng,
      tz,
      cityId: match.city.id,
      label: `${match.city.name}, ${match.city.region}`,
    };
  }

  if (match !== null) {
    return {
      lat: point.lat,
      lng: point.lng,
      tz,
      label: `Near ${match.city.name}, ${match.city.region}`,
    };
  }

  // No city within any useful distance: still a valid location, just an
  // unlabelled one. tz-lookup covers the whole globe, so sunrise is exact
  // even here.
  return {
    lat: point.lat,
    lng: point.lng,
    tz,
    label: `${point.lat.toFixed(2)}, ${point.lng.toFixed(2)}`,
  };
}

/** A devotee's manual choice from `searchCities` → the same `DevoteeLocation` shape. */
export function resolveFromCity(city: City): DevoteeLocation {
  return {
    lat: city.lat,
    lng: city.lng,
    tz: city.tz,
    cityId: city.id,
    label: `${city.name}, ${city.region}`,
  };
}
