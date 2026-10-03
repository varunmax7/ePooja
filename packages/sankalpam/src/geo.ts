import type { GeoRegion, GeoRegionsFile, RiverRegion } from '@epooja/content';

/**
 * The §9.3 GEO block: which region's dvipa/varsha/khanda/meru text applies,
 * the 8-point compass bearing from Srisailam, and which river region a
 * coordinate falls in. All pure geometry — the words themselves come from
 * `content/sankalpam/geo-regions.json`, never computed here (§0.4).
 */

export interface GeoInput {
  lat: number;
  lng: number;
  /** ISO 3166-1 alpha-2, e.g. from reverse-geocoding or the chosen city. */
  countryCode: string;
  /**
   * A devotee's manual choice, from Settings (§9.3: "manual override in
   * settings"). When set, this river region is used outright — the polygon
   * lookup is a default, not the last word.
   */
  riverRegionOverride?: string;
}

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

/**
 * Initial great-circle bearing from `from` to `to`, in degrees clockwise
 * from true north (0–360). The standard forward-azimuth formula — the same
 * shape of calculation `distanceKm` in `@epooja/content` already uses for
 * the onboarding city search, just solving for direction instead of length.
 */
export function bearingDegrees(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const dLng = toRadians(to.lng - from.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

/**
 * The 8-point compass dik id a bearing falls in, matching
 * `content/enums/dik.json`'s order (púrva = east, and around clockwise).
 * Each of the 8 points owns a 45° wedge centred on its compass heading.
 */
export const DIK_IDS = [
  'purva', // East, 90°
  'agneya', // South-east, 135°
  'dakshina', // South, 180°
  'nairriti', // South-west, 225°
  'paschima', // West, 270°
  'vayavya', // North-west, 315°
  'uttara', // North, 0°/360°
  'ishanya', // North-east, 45°
] as const;

export type DikId = (typeof DIK_IDS)[number];

/** Compass heading (° clockwise from north) each dik wedge is centred on. */
const DIK_HEADINGS: Record<DikId, number> = {
  uttara: 0,
  ishanya: 45,
  purva: 90,
  agneya: 135,
  dakshina: 180,
  nairriti: 225,
  paschima: 270,
  vayavya: 315,
};

/** The dik whose 45° wedge a bearing (0–360°) falls in. */
export function dikFromBearing(bearing: number): DikId {
  const normalised = ((bearing % 360) + 360) % 360;
  const index = Math.round(normalised / 45) % 8;
  const entries = Object.entries(DIK_HEADINGS) as [DikId, number][];
  const match = entries.find(([, heading]) => heading === (index * 45) % 360);
  /* c8 ignore next -- every multiple of 45 up to 315 has an entry above */
  if (!match) throw new Error(`Unreachable bearing index ${index}`);
  return match[0];
}

/** The 8-point dik from Srisailam to a point — §9.3's `srisaila_dik`. */
export function srisailaDik(
  srisailam: readonly [number, number],
  point: { lat: number; lng: number },
): DikId {
  const bearing = bearingDegrees({ lat: srisailam[0], lng: srisailam[1] }, point);
  return dikFromBearing(bearing);
}

/**
 * Ray-casting point-in-polygon test over `[lat, lng]` vertices.
 *
 * Good enough for the coarse rectangular regions §10 Phase 5 asks for
 * ("start: Telangana + AP coarse polygons") — it doesn't need to handle
 * antimeridian wraparound or geodesic edges, because every region this
 * resolves is well inside a single UTM-scale patch of India.
 */
export function pointInPolygon(
  point: { lat: number; lng: number },
  polygon: readonly (readonly [number, number])[],
): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const vi = polygon[i];
    const vj = polygon[j];
    /* c8 ignore next 2 -- polygon arrays are non-empty by construction (schema enforces length >= 3) */
    if (!vi || !vj) continue;
    const [latI, lngI] = vi;
    const [latJ, lngJ] = vj;

    const crosses = latI > point.lat !== latJ > point.lat;
    if (!crosses) continue;

    const lngAtCrossing = ((lngJ - lngI) * (point.lat - latI)) / (latJ - latI) + lngI;
    if (point.lng < lngAtCrossing) inside = !inside;
  }

  return inside;
}

/** The most specific river region a point falls in, or undefined outside all of them. */
export function riverRegionFor(
  point: { lat: number; lng: number },
  riverRegions: readonly RiverRegion[],
): RiverRegion | undefined {
  return riverRegions.find((region) => pointInPolygon(point, region.polygon));
}

/**
 * The GEO region a country code resolves to: an exact match, or the one
 * region marked as the fallback (empty `countryCodes` — §9.3: "unknown
 * region → user chooses from a pandit-approved list," which the fallback
 * row represents until that picker exists).
 */
export function regionFor(countryCode: string, regions: readonly GeoRegion[]): GeoRegion {
  const exact = regions.find((region) => region.countryCodes.includes(countryCode));
  if (exact) return exact;

  const fallback = regions.find((region) => region.countryCodes.length === 0);
  /* c8 ignore next -- geoRegionsFileSchema requires exactly one fallback region */
  if (!fallback) throw new Error('No fallback GEO region in geo-regions.json');
  return fallback;
}

export interface ResolvedGeo {
  region: GeoRegion;
  srisailaDik: DikId | undefined;
  riverRegion: RiverRegion | undefined;
}

/**
 * The complete GEO resolution for one location: which region's fixed text
 * applies, and — only where that region says the tradition uses them — the
 * Srisailam dik and the river region.
 */
export function resolveGeo(input: GeoInput, file: GeoRegionsFile): ResolvedGeo {
  const region = regionFor(input.countryCode, file.regions);

  const riverRegion = !region.computeRiverRegion
    ? undefined
    : input.riverRegionOverride
      ? file.riverRegions.find((r) => r.id === input.riverRegionOverride)
      : riverRegionFor(input, file.riverRegions);

  return {
    region,
    srisailaDik: region.computeSrisailaDik ? srisailaDik(file.srisailam, input) : undefined,
    riverRegion,
  };
}
