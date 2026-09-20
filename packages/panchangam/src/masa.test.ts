import { describe, expect, it } from 'vitest';
import {
  MASA_IDS,
  RITU_IDS,
  SAMVATSARA_IDS,
  ayanaAt,
  currentYearStart,
  lunarMonthAt,
  nextNewMoon,
  previousNewMoon,
  rituOf,
  samvatsaraAt,
} from './masa';

const at = (iso: string): Date => new Date(iso);

describe('new moon search', () => {
  it('brackets an instant between two new moons', () => {
    const instant = at('2026-09-19T06:00:00Z');
    const previous = previousNewMoon(instant);
    const next = nextNewMoon(previous);

    expect(previous.getTime()).toBeLessThanOrEqual(instant.getTime());
    expect(next.getTime()).toBeGreaterThan(instant.getTime());
  });

  it('returns a synodic month between consecutive new moons', () => {
    const first = previousNewMoon(at('2026-06-15T00:00:00Z'));
    const second = nextNewMoon(first);
    const days = (second.getTime() - first.getTime()) / 86_400_000;
    expect(days).toBeGreaterThan(29.2);
    expect(days).toBeLessThan(29.9);
  });

  it('finds the new moon that just passed, not the one before it', () => {
    const newMoon = previousNewMoon(at('2026-09-19T06:00:00Z'));
    const hoursSince = (at('2026-09-19T06:00:00Z').getTime() - newMoon.getTime()) / 3_600_000;
    expect(hoursSince).toBeLessThan(29.6 * 24);
  });
});

describe('lunarMonthAt', () => {
  it('names the month from the Sun’s rashi at the opening new moon', () => {
    const month = lunarMonthAt(at('2026-09-19T06:00:00Z'));
    expect(month.id).toBe('bhadrapada');
    expect(month.adhika).toBe(false);
  });

  it('detects Adhika Shravana 2023', () => {
    // The widely published adhika masa: 18 July – 16 August 2023.
    const adhika = lunarMonthAt(at('2023-08-01T06:00:00Z'));
    expect(adhika.id).toBe('shravana');
    expect(adhika.adhika).toBe(true);
    expect(adhika.startsAt.toISOString().slice(0, 10)).toBe('2023-07-17');
  });

  it('treats the month that follows an adhika masa as nija', () => {
    const nija = lunarMonthAt(at('2023-08-25T06:00:00Z'));
    expect(nija.id).toBe('shravana');
    expect(nija.adhika).toBe(false);
    expect(nija.startsAt.toISOString().slice(0, 10)).toBe('2023-08-16');
  });

  it('covers every masa name across a year', () => {
    const seen = new Set<string>();
    for (let day = 0; day < 380; day += 7) {
      seen.add(lunarMonthAt(new Date(at('2025-01-01T06:00:00Z').getTime() + day * 86_400_000)).id);
    }
    expect(seen.size).toBe(MASA_IDS.length);
  });

  it('spans its own start and end', () => {
    const month = lunarMonthAt(at('2026-05-05T06:00:00Z'));
    expect(month.startsAt.getTime()).toBeLessThan(month.endsAt.getTime());
  });
});

describe('rituOf', () => {
  it.each([
    [0, 'vasanta'],
    [1, 'vasanta'],
    [2, 'grishma'],
    [3, 'grishma'],
    [4, 'varsha'],
    [5, 'varsha'],
    [6, 'sharad'],
    [7, 'sharad'],
    [8, 'hemanta'],
    [9, 'hemanta'],
    [10, 'shishira'],
    [11, 'shishira'],
  ])('maps masa %s to %s', (masaIndex, ritu) => {
    expect(rituOf(masaIndex)).toBe(ritu);
  });

  it('uses every ruthuvu exactly twice', () => {
    const counts = new Map<string, number>();
    for (let masa = 0; masa < 12; masa += 1) {
      const ritu = rituOf(masa);
      counts.set(ritu, (counts.get(ritu) ?? 0) + 1);
    }
    expect(counts.size).toBe(RITU_IDS.length);
    expect([...counts.values()].every((c) => c === 2)).toBe(true);
  });
});

describe('ayanaAt', () => {
  it('is Uttarayanam in late January, after Makara Sankranti', () => {
    expect(ayanaAt(at('2026-01-25T06:00:00Z'))).toBe('uttarayana');
  });

  it('is still Uttarayanam in June, before Karkataka Sankranti', () => {
    expect(ayanaAt(at('2026-06-20T06:00:00Z'))).toBe('uttarayana');
  });

  it('is Dakshinayanam from late July', () => {
    expect(ayanaAt(at('2026-07-25T06:00:00Z'))).toBe('dakshinayana');
  });

  it('is Dakshinayanam in December, before Makara Sankranti', () => {
    expect(ayanaAt(at('2026-12-25T06:00:00Z'))).toBe('dakshinayana');
  });

  it('switches to Uttarayanam within a day of 14–15 January', () => {
    expect(ayanaAt(at('2026-01-13T00:00:00Z'))).toBe('dakshinayana');
    expect(ayanaAt(at('2026-01-16T00:00:00Z'))).toBe('uttarayana');
  });
});

describe('samvatsaraAt', () => {
  // The three anchors §9.1 gives.
  it.each([
    ['2024-06-15T06:00:00Z', 38, 'krodhi'],
    ['2025-06-15T06:00:00Z', 39, 'vishvavasu'],
    ['2026-06-15T06:00:00Z', 40, 'parabhava'],
  ])('reports %s as samvatsara %i (%s)', (iso, index, id) => {
    expect(samvatsaraAt(at(iso))).toEqual({ index, id });
  });

  it('still reports the previous samvatsara just before Ugadi', () => {
    // Ugadi 2025 fell on 30 March; 20 March is still Vishvavasu’s predecessor.
    expect(samvatsaraAt(at('2025-03-20T06:00:00Z')).id).toBe('krodhi');
  });

  it('has sixty distinct names', () => {
    expect(new Set(SAMVATSARA_IDS).size).toBe(60);
  });

  it('wraps the cycle every sixty years', () => {
    const now = samvatsaraAt(at('2026-06-15T06:00:00Z'));
    const inSixty = samvatsaraAt(at('2086-06-15T06:00:00Z'));
    expect(inSixty).toEqual(now);
  });
});

describe('currentYearStart', () => {
  it.each([
    ['2024-06-15T06:00:00Z', '2024-04-08'],
    ['2025-06-15T06:00:00Z', '2025-03-29'],
    ['2026-06-15T06:00:00Z', '2026-03-19'],
  ])('finds the Chaitra new moon preceding %s', (iso, expected) => {
    expect(currentYearStart(at(iso)).toISOString().slice(0, 10)).toBe(expected);
  });

  it('opens the year on a Chaitra month', () => {
    const start = currentYearStart(at('2026-09-19T06:00:00Z'));
    expect(lunarMonthAt(new Date(start.getTime() + 86_400_000)).id).toBe('chaitra');
  });

  it('reaches back across the year boundary from January', () => {
    // January 2026 still belongs to the year that opened at Ugadi 2025.
    expect(currentYearStart(at('2026-01-20T06:00:00Z')).toISOString().slice(0, 10)).toBe(
      '2025-03-29',
    );
  });

  it('is never after the instant asked about', () => {
    for (const iso of ['2024-04-10T06:00:00Z', '2025-12-31T23:00:00Z', '2026-03-25T06:00:00Z']) {
      expect(currentYearStart(at(iso)).getTime()).toBeLessThanOrEqual(at(iso).getTime());
    }
  });
});
