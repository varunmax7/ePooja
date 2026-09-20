import { SearchMoonPhase } from 'astronomy-engine';
import { describe, expect, it } from 'vitest';
import {
  KARANA_IDS,
  MOVABLE_KARANAS,
  karanaAt,
  karanaFromHalfIndex,
  karanaHalfIndex,
  nakshatraIndex,
  nakshatraPada,
  pakshaOf,
  rasiFromNakshatraPada,
  rasiIdFromNakshatraPada,
  rasiOf,
  tithiIndex,
  yogaIndex,
} from './angas';
import { moonSunElongation } from './astronomy';

/**
 * Phase instants come from astronomy-engine's own phase search, which is a
 * different code path from the elongation arithmetic under test — so these
 * assertions cross-validate rather than restate the implementation.
 */
function phaseInstant(targetLongitude: 0 | 180, searchFrom: string): Date {
  const found = SearchMoonPhase(targetLongitude, new Date(searchFrom), 40);
  if (!found) throw new Error(`No phase ${targetLongitude} found after ${searchFrom}`);
  return found.date;
}

const AMAVASYA_2026_09 = phaseInstant(0, '2026-09-01T00:00:00Z');
const POURNAMI_2026_09 = phaseInstant(180, '2026-09-01T00:00:00Z');

describe('tithiIndex', () => {
  it('is 1–30 across a synodic month', () => {
    for (let hours = 0; hours < 30 * 24; hours += 6) {
      const t = new Date(AMAVASYA_2026_09.getTime() + hours * 3_600_000);
      const index = tithiIndex(t);
      expect(index).toBeGreaterThanOrEqual(1);
      expect(index).toBeLessThanOrEqual(30);
    }
  });

  it('is Shukla Prathama just after the new moon', () => {
    expect(tithiIndex(new Date(AMAVASYA_2026_09.getTime() + 3_600_000))).toBe(1);
  });

  it('is Pournami (15) in the hour before the full moon', () => {
    expect(tithiIndex(new Date(POURNAMI_2026_09.getTime() - 3_600_000))).toBe(15);
  });

  it('turns to Krishna Prathama (16) once the full moon passes', () => {
    expect(tithiIndex(new Date(POURNAMI_2026_09.getTime() + 3_600_000))).toBe(16);
  });

  it('is Amavasya (30) just before the new moon', () => {
    expect(tithiIndex(new Date(AMAVASYA_2026_09.getTime() - 3_600_000))).toBe(30);
  });
});

describe('pakshaOf', () => {
  it('splits at tithi 15', () => {
    expect(pakshaOf(1)).toBe('shukla');
    expect(pakshaOf(15)).toBe('shukla');
    expect(pakshaOf(16)).toBe('krishna');
    expect(pakshaOf(30)).toBe('krishna');
  });
});

describe('nakshatraIndex and pada', () => {
  it('stays within 1–27 over a sidereal month', () => {
    for (let hours = 0; hours < 28 * 24; hours += 4) {
      const index = nakshatraIndex(new Date(AMAVASYA_2026_09.getTime() + hours * 3_600_000));
      expect(index).toBeGreaterThanOrEqual(1);
      expect(index).toBeLessThanOrEqual(27);
    }
  });

  it('reports a pada of 1–4', () => {
    for (let hours = 0; hours < 28 * 24; hours += 3) {
      const pada = nakshatraPada(new Date(AMAVASYA_2026_09.getTime() + hours * 3_600_000));
      expect([1, 2, 3, 4]).toContain(pada);
    }
  });
});

describe('yogaIndex', () => {
  it('stays within 1–27', () => {
    for (let hours = 0; hours < 30 * 24; hours += 5) {
      const index = yogaIndex(new Date(AMAVASYA_2026_09.getTime() + hours * 3_600_000));
      expect(index).toBeGreaterThanOrEqual(1);
      expect(index).toBeLessThanOrEqual(27);
    }
  });
});

describe('rasiOf', () => {
  it.each([
    [0, 0],
    [29.99, 0],
    [30, 1],
    [359.99, 11],
    [-1, 11],
  ])('maps %s° to rasi %s', (longitude, rasi) => {
    expect(rasiOf(longitude)).toBe(rasi);
  });
});

describe('karanaFromHalfIndex', () => {
  it('assigns Kimstughna to the first half-tithi', () => {
    expect(karanaFromHalfIndex(0)).toEqual({ id: 'kimstughna', index: 1 });
  });

  it('cycles the seven movable karanas through half-tithis 1–56', () => {
    for (let k = 1; k <= 56; k += 1) {
      const expected = MOVABLE_KARANAS[(k - 1) % 7];
      expect(karanaFromHalfIndex(k).id).toBe(expected);
    }
  });

  it('starts the movable cycle at Bava and ends it at Vishti', () => {
    expect(karanaFromHalfIndex(1).id).toBe('bava');
    expect(karanaFromHalfIndex(56).id).toBe('vishti');
  });

  it('assigns the three fixed karanas to the last half-tithis', () => {
    expect(karanaFromHalfIndex(57)).toEqual({ id: 'shakuni', index: 9 });
    expect(karanaFromHalfIndex(58)).toEqual({ id: 'chatushpada', index: 10 });
    expect(karanaFromHalfIndex(59)).toEqual({ id: 'naga', index: 11 });
  });

  it('produces indices that line up with KARANA_IDS', () => {
    for (let k = 0; k <= 59; k += 1) {
      const { id, index } = karanaFromHalfIndex(k);
      expect(KARANA_IDS[index - 1]).toBe(id);
    }
  });

  it('uses every one of the eleven karanas across a synodic month', () => {
    const seen = new Set<string>();
    for (let k = 0; k <= 59; k += 1) seen.add(karanaFromHalfIndex(k).id);
    expect(seen.size).toBe(KARANA_IDS.length);
  });
});

describe('karanaAt', () => {
  it('agrees with the half-tithi index at an instant', () => {
    const instant = new Date('2026-09-19T06:00:00Z');
    const half = karanaHalfIndex(instant);
    expect(karanaAt(instant)).toEqual({ ...karanaFromHalfIndex(half), halfIndex: half });
  });

  it('derives the half-index from the elongation', () => {
    const instant = new Date('2026-09-19T06:00:00Z');
    expect(karanaHalfIndex(instant)).toBe(Math.floor(moonSunElongation(instant) / 6));
  });
});

describe('rasiFromNakshatraPada', () => {
  it('puts the first nine padas in Mesha and the next nine in Vrishabha', () => {
    // Ashvini 1–4, Bharani 1–4, Krittika 1 -> Mesha.
    expect(rasiFromNakshatraPada(1, 1)).toBe(1);
    expect(rasiFromNakshatraPada(2, 4)).toBe(1);
    expect(rasiFromNakshatraPada(3, 1)).toBe(1);
    // Krittika 2 starts Vrishabha.
    expect(rasiFromNakshatraPada(3, 2)).toBe(2);
  });

  it('gives the §9.2 worked example: Rohini pada 3 is Vrishabha', () => {
    expect(rasiIdFromNakshatraPada(4, 3)).toBe('vrishabha');
  });

  it('covers all 108 padas with twelve rasis of nine padas each', () => {
    const counts = new Map<number, number>();
    for (let nakshatra = 1; nakshatra <= 27; nakshatra += 1) {
      for (let pada = 1; pada <= 4; pada += 1) {
        const rasi = rasiFromNakshatraPada(nakshatra, pada);
        counts.set(rasi, (counts.get(rasi) ?? 0) + 1);
      }
    }

    expect([...counts.keys()].sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect([...counts.values()].every((n) => n === 9)).toBe(true);
  });

  it('agrees with rasiOf on the sidereal longitude each pada starts at', () => {
    const NAKSHATRA_ARC = 360 / 27;
    for (let nakshatra = 1; nakshatra <= 27; nakshatra += 1) {
      for (let pada = 1; pada <= 4; pada += 1) {
        // A hair inside the pada, so a boundary rounds the same way in both.
        const longitude =
          (nakshatra - 1) * NAKSHATRA_ARC + (pada - 1) * (NAKSHATRA_ARC / 4) + 0.001;
        expect(rasiFromNakshatraPada(nakshatra, pada) - 1, `${nakshatra}/${pada}`).toBe(
          rasiOf(longitude),
        );
      }
    }
  });

  it('refuses input it cannot honestly map', () => {
    expect(() => rasiFromNakshatraPada(0, 1)).toThrow(RangeError);
    expect(() => rasiFromNakshatraPada(28, 1)).toThrow(RangeError);
    expect(() => rasiFromNakshatraPada(1, 5)).toThrow(RangeError);
    expect(() => rasiFromNakshatraPada(1.5, 1)).toThrow(RangeError);
  });
});
