import { z } from 'zod';
import { reviewSchema } from './review';
import { teluguOrTodo } from './enums';

/**
 * Schema for `content/cities.json` — the offline city list behind §8.1's
 * location step and the nearest-city reverse lookup.
 *
 * The list is not a gazetteer and does not try to be: a devotee either lets
 * GPS place them, or picks the nearest listed city by hand. What matters is
 * that every entry carries coordinates good enough for the ±1 min sunrise
 * tolerance §9.1 sets, and an IANA timezone.
 */

/** ISO 3166-1 alpha-2. */
const COUNTRY = z.string().regex(/^[A-Z]{2}$/, 'country must be an ISO 3166-1 alpha-2 code');

/**
 * IANA zone name. Not an enum: the list is large and moves, and `tz-lookup`
 * and the platform are the authorities. The shape is checked so a typo cannot
 * silently become a UTC fallback.
 */
const IANA_TZ = z
  .string()
  .regex(/^[A-Za-z]+(?:[_+-]?[A-Za-z0-9]+)*(?:\/[A-Za-z0-9]+(?:[_+-]?[A-Za-z0-9]+)*)+$/, {
    message: 'tz must be an IANA zone name such as Asia/Kolkata',
  });

export const citySchema = z.object({
  id: z
    .string()
    .regex(/^[a-z][a-z0-9-]*$/, 'ids are lower-kebab-case ASCII keys, never display text'),
  /** Latin display name. Always present — it is the search fallback. */
  name: z.string().min(1),
  /**
   * Telugu display name, where the spelling is standard. Absent rather than
   * invented for cities outside the Telugu districts (§0.4).
   */
  nameTe: teluguOrTodo.optional(),
  /** State, province or the nearest equivalent; shown under the name. */
  region: z.string().min(1),
  country: COUNTRY,
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  tz: IANA_TZ,
});

export type City = z.infer<typeof citySchema>;

export const cityFileSchema = z
  .object({
    $schema: z.string().optional(),
    kind: z.literal('cities'),
    note: z.string().optional(),
    review: reviewSchema,
    reviewNote: z.string().optional(),
    cities: z.array(citySchema).min(1),
  })
  .superRefine((file, ctx) => {
    const ids = new Set<string>();
    file.cities.forEach((city, position) => {
      if (ids.has(city.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate id ${city.id}`,
          path: ['cities', position, 'id'],
        });
      }
      ids.add(city.id);
    });
  });

export type CityFile = z.infer<typeof cityFileSchema>;

export function parseCityFile(data: unknown): CityFile {
  return cityFileSchema.parse(data);
}

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Great-circle distance in kilometres.
 *
 * Haversine rather than a flat approximation: the city list spans Sydney to
 * Seattle, and a devotee near the antimeridian or a pole must not be matched
 * to the wrong side of the world.
 */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface NearestCity {
  city: City;
  distanceKm: number;
}

/**
 * The listed city closest to a point.
 *
 * Returns the distance too: the caller decides whether the match is close
 * enough to show as "you are here" or only as "nearest listed city", because
 * the list is sparse outside the Telugu districts.
 */
export function nearestCity(
  cities: readonly City[],
  point: { lat: number; lng: number },
): NearestCity | null {
  let best: NearestCity | null = null;

  for (const city of cities) {
    const km = distanceKm(point, city);
    if (best === null || km < best.distanceKm) best = { city, distanceKm: km };
  }

  return best;
}

/** Fold a query for matching: case-insensitive, accent-insensitive, trimmed. */
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
    .trim();
}

/**
 * Offline city search over the Latin name, the Telugu name and the region.
 *
 * Matches on a prefix of any word, so "vij" finds Vijayawada and "new j"
 * finds Edison, New Jersey. Ranked so that a name match beats a region match
 * and a whole-name match beats a word-prefix one — a devotee typing
 * "hyderabad" should not have to scroll past every city in Telangana.
 */
export function searchCities(cities: readonly City[], query: string, limit = 20): City[] {
  const needle = fold(query);
  if (needle.length === 0) return [];

  const scored: { city: City; score: number }[] = [];

  for (const city of cities) {
    const name = fold(city.name);
    const region = fold(city.region);
    const telugu = city.nameTe?.trim() ?? '';

    let score = -1;
    if (name === needle) score = 0;
    else if (telugu.length > 0 && telugu.startsWith(query.trim()) && query.trim().length > 0)
      score = 1;
    else if (name.startsWith(needle)) score = 2;
    else if (name.split(/\s+/).some((word) => word.startsWith(needle))) score = 3;
    else if (region.startsWith(needle)) score = 4;
    else if (region.split(/\s+/).some((word) => word.startsWith(needle))) score = 5;
    else if (name.includes(needle)) score = 6;

    if (score >= 0) scored.push({ city, score });
  }

  scored.sort((a, b) => a.score - b.score || a.city.name.localeCompare(b.city.name));
  return scored.slice(0, limit).map((entry) => entry.city);
}
