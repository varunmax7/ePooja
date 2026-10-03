import { describe, expect, it } from 'vitest';
import {
  DIK_IDS,
  bearingDegrees,
  dikFromBearing,
  pointInPolygon,
  regionFor,
  resolveGeo,
  riverRegionFor,
  srisailaDik,
} from './geo';
import type { GeoRegion, GeoRegionsFile, RiverRegion } from '@epooja/content';

const SRISAILAM: [number, number] = [16.0733, 78.8683];

describe('bearingDegrees', () => {
  it('is 0° due north and 90° due east', () => {
    const origin = { lat: 0, lng: 0 };
    expect(bearingDegrees(origin, { lat: 1, lng: 0 })).toBeCloseTo(0, 1);
    expect(bearingDegrees(origin, { lat: 0, lng: 1 })).toBeCloseTo(90, 1);
  });

  it('is 180° due south and 270° due west', () => {
    const origin = { lat: 0, lng: 0 };
    expect(bearingDegrees(origin, { lat: -1, lng: 0 })).toBeCloseTo(180, 1);
    expect(bearingDegrees(origin, { lat: 0, lng: -1 })).toBeCloseTo(270, 1);
  });

  it('is always in [0, 360)', () => {
    expect(bearingDegrees({ lat: 10, lng: 10 }, { lat: -10, lng: -10 })).toBeGreaterThanOrEqual(0);
    expect(bearingDegrees({ lat: 10, lng: 10 }, { lat: -10, lng: -10 })).toBeLessThan(360);
  });
});

describe('dikFromBearing', () => {
  it('maps each of the 8 compass headings to its own dik', () => {
    expect(dikFromBearing(0)).toBe('uttara');
    expect(dikFromBearing(45)).toBe('ishanya');
    expect(dikFromBearing(90)).toBe('purva');
    expect(dikFromBearing(135)).toBe('agneya');
    expect(dikFromBearing(180)).toBe('dakshina');
    expect(dikFromBearing(225)).toBe('nairriti');
    expect(dikFromBearing(270)).toBe('paschima');
    expect(dikFromBearing(315)).toBe('vayavya');
  });

  it('wraps 360° back to north', () => {
    expect(dikFromBearing(360)).toBe('uttara');
  });

  it('every id it can return is a real dik enum id', () => {
    for (const bearing of [10, 50, 100, 140, 190, 230, 280, 340]) {
      expect(DIK_IDS).toContain(dikFromBearing(bearing));
    }
  });
});

describe('srisailaDik', () => {
  it('places New Jersey to the north-west of Srisailam', () => {
    expect(srisailaDik(SRISAILAM, { lat: 40.5187, lng: -74.4121 })).toBe('vayavya');
  });

  it('places Sydney to the south-east', () => {
    expect(srisailaDik(SRISAILAM, { lat: -33.8688, lng: 151.2093 })).toBe('agneya');
  });

  it('is deterministic for the same coordinates', () => {
    const a = srisailaDik(SRISAILAM, { lat: 17.385, lng: 78.4867 });
    const b = srisailaDik(SRISAILAM, { lat: 17.385, lng: 78.4867 });
    expect(a).toBe(b);
  });
});

describe('pointInPolygon', () => {
  // A simple 4×4 box: lat 0–4, lng 0–4.
  const box: [number, number][] = [
    [4, 0],
    [4, 4],
    [0, 4],
    [0, 0],
  ];

  it('finds a point in the middle of the box', () => {
    expect(pointInPolygon({ lat: 2, lng: 2 }, box)).toBe(true);
  });

  it('excludes a point well outside the box', () => {
    expect(pointInPolygon({ lat: 10, lng: 10 }, box)).toBe(false);
  });

  it('excludes a point on the other side of an edge', () => {
    expect(pointInPolygon({ lat: 2, lng: -1 }, box)).toBe(false);
  });
});

describe('riverRegionFor', () => {
  const krishnaGodavari: RiverRegion = {
    id: 'krishna-godavari',
    label: 'KG delta',
    text: { te: 'test' },
    polygon: [
      [17.5, 80.0],
      [17.5, 82.5],
      [15.5, 82.5],
      [15.5, 80.0],
    ],
  };
  const telangana: RiverRegion = {
    id: 'telangana',
    label: 'Telangana',
    text: { te: 'test' },
    polygon: [
      [19.9, 77.2],
      [19.9, 81.3],
      [15.8, 77.2],
      [15.8, 81.3],
    ],
  };

  it('finds Vijayawada in the Krishna-Godavari region', () => {
    const match = riverRegionFor({ lat: 16.5062, lng: 80.648 }, [krishnaGodavari, telangana]);
    expect(match?.id).toBe('krishna-godavari');
  });

  it('returns undefined for a point in no listed region', () => {
    expect(riverRegionFor({ lat: 40, lng: -74 }, [krishnaGodavari, telangana])).toBeUndefined();
  });
});

describe('regionFor', () => {
  const india: GeoRegion = {
    id: 'india',
    label: 'India',
    countryCodes: ['IN'],
    dvipa: { te: 'x' },
    varsha: { te: 'x' },
    khanda: { te: 'x' },
    meru: { te: 'x' },
    computeSrisailaDik: true,
    computeRiverRegion: true,
  };
  const fallback: GeoRegion = {
    ...india,
    id: 'generic-nri',
    countryCodes: [],
    computeSrisailaDik: false,
    computeRiverRegion: false,
  };

  it('matches an exact country code', () => {
    expect(regionFor('IN', [india, fallback]).id).toBe('india');
  });

  it('falls back to the wildcard region for an unlisted country', () => {
    expect(regionFor('FR', [india, fallback]).id).toBe('generic-nri');
  });
});

describe('resolveGeo', () => {
  const file: GeoRegionsFile = {
    kind: 'sankalpam-geo-regions',
    review: { status: 'PENDING_PANDIT_REVIEW', reviewer: null, date: null },
    srisailam: SRISAILAM,
    regions: [
      {
        id: 'india',
        label: 'India',
        countryCodes: ['IN'],
        dvipa: { te: 'x' },
        varsha: { te: 'x' },
        khanda: { te: 'x' },
        meru: { te: 'x' },
        computeSrisailaDik: true,
        computeRiverRegion: true,
      },
      {
        id: 'generic-nri',
        label: 'Elsewhere',
        countryCodes: [],
        dvipa: { te: 'x' },
        varsha: { te: 'x' },
        khanda: { te: 'x' },
        meru: { te: 'x' },
        computeSrisailaDik: false,
        computeRiverRegion: false,
      },
    ],
    riverRegions: [
      {
        id: 'krishna-godavari',
        label: 'KG',
        text: { te: 'x' },
        polygon: [
          [17.5, 80.0],
          [17.5, 82.5],
          [15.5, 82.5],
          [15.5, 80.0],
        ],
      },
    ],
  };

  it('computes both srisaila_dik and river_region for an India address', () => {
    const resolved = resolveGeo({ lat: 16.5062, lng: 80.648, countryCode: 'IN' }, file);
    expect(resolved.region.id).toBe('india');
    expect(resolved.srisailaDik).toBeDefined();
    expect(resolved.riverRegion?.id).toBe('krishna-godavari');
  });

  it('computes neither for an NRI address, even inside the same polygon', () => {
    const resolved = resolveGeo({ lat: 16.5062, lng: 80.648, countryCode: 'US' }, file);
    expect(resolved.region.id).toBe('generic-nri');
    expect(resolved.srisailaDik).toBeUndefined();
    expect(resolved.riverRegion).toBeUndefined();
  });

  it('honours a manual river-region override over the polygon lookup', () => {
    const resolved = resolveGeo(
      { lat: 0, lng: 0, countryCode: 'IN', riverRegionOverride: 'krishna-godavari' },
      file,
    );
    expect(resolved.riverRegion?.id).toBe('krishna-godavari');
  });

  it('leaves river_region undefined when nothing matches and there is no override', () => {
    const resolved = resolveGeo({ lat: 0, lng: 0, countryCode: 'IN' }, file);
    expect(resolved.riverRegion).toBeUndefined();
  });
});
