import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getDayPanchangam } from './panchangam';
import type { GeoLocation } from './types';

/**
 * The golden fixture runner (§9.1).
 *
 * `verified.json` holds cases whose expected values come from outside this
 * engine — they are the ones that prove correctness. `snapshots.json` holds
 * the engine's own output and only guards against regressions; the two are run
 * the same way but must never be confused, so the counts are asserted below.
 */
interface Fixture {
  id: string;
  place: GeoLocation & { id: string; label: string };
  date: string;
  source: 'verified' | 'engine-snapshot';
  reference?: string;
  why: string;
  expect: Record<string, unknown>;
}

interface FixtureFile {
  note: string;
  tolerances: { sunriseMinutes: number; transitionMinutes: number };
  fixtures: Fixture[];
}

const FIXTURE_DIR = join(import.meta.dirname, '../test/fixtures');

function loadFixtures(file: string): FixtureFile {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, file), 'utf8')) as FixtureFile;
}

const verified = loadFixtures('verified.json');
const snapshots = loadFixtures('snapshots.json');

function localTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

function minutesApart(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 60_000;
}

function checkFixture(fixture: Fixture, tolerances: FixtureFile['tolerances']): void {
  const day = getDayPanchangam(fixture.date, fixture.place);
  const want = fixture.expect;

  if (want.samvatsara) expect(day.samvatsara).toEqual(want.samvatsara);
  if (want.ayana) expect(day.ayana).toBe(want.ayana);
  if (want.ritu) expect(day.ritu).toBe(want.ritu);
  if (want.masa) expect(day.masa).toEqual(want.masa);
  if (want.paksha) expect(day.paksha).toBe(want.paksha);
  if (want.vasara) expect(day.vasara).toEqual(want.vasara);

  if (want.tithi) {
    expect({ id: day.tithi.id, index: day.tithi.index }).toEqual(want.tithi);
  }
  if (want.nakshatra) {
    expect({
      id: day.nakshatra.id,
      index: day.nakshatra.index,
      pada: day.nakshatra.pada,
    }).toEqual(want.nakshatra);
  }
  if (want.yoga) expect({ id: day.yoga.id, index: day.yoga.index }).toEqual(want.yoga);
  if (want.karana) expect({ id: day.karana.id, index: day.karana.index }).toEqual(want.karana);

  if (want.sunrise) expect(localTime(day.sunrise, fixture.place.tz)).toBe(want.sunrise);
  if (want.sunset) expect(localTime(day.sunset, fixture.place.tz)).toBe(want.sunset);
  if (want.rahuKalam) {
    expect([
      localTime(day.rahuKalam[0], fixture.place.tz),
      localTime(day.rahuKalam[1], fixture.place.tz),
    ]).toEqual(want.rahuKalam);
  }

  if (typeof want.tithiEndsAt === 'string') {
    expect(minutesApart(day.tithi.endsAt, want.tithiEndsAt)).toBeLessThanOrEqual(
      tolerances.transitionMinutes,
    );
  }
  if (typeof want.nakshatraEndsAt === 'string') {
    expect(minutesApart(day.nakshatra.endsAt, want.nakshatraEndsAt)).toBeLessThanOrEqual(
      tolerances.transitionMinutes,
    );
  }
}

describe('verified fixtures (independent of this engine)', () => {
  it.each(verified.fixtures.map((f) => [f.id, f] as const))('%s', (_id, fixture) => {
    checkFixture(fixture, verified.tolerances);
  });

  it('names a reference for every verified case', () => {
    for (const fixture of verified.fixtures) {
      expect(fixture.source).toBe('verified');
      expect(fixture.reference, `${fixture.id} has no reference`).toBeTruthy();
    }
  });
});

describe('engine snapshots (regression guard only)', () => {
  it.each(snapshots.fixtures.map((f) => [f.id, f] as const))('%s', (_id, fixture) => {
    checkFixture(fixture, snapshots.tolerances);
  });

  it('is labelled as snapshots, never as verified', () => {
    expect(snapshots.fixtures.every((f) => f.source === 'engine-snapshot')).toBe(true);
  });
});

describe('fixture coverage', () => {
  const all = [...verified.fixtures, ...snapshots.fixtures];

  it('spans the nine places §9.1 lists', () => {
    const places = new Set(all.map((f) => f.place.id));
    expect(places.size).toBeGreaterThanOrEqual(9);
  });

  it('includes the adhika masa year', () => {
    expect(all.some((f) => f.date.startsWith('2023-'))).toBe(true);
    expect(
      verified.fixtures.some(
        (f) => (f.expect.masa as { adhika?: boolean } | undefined)?.adhika === true,
      ),
    ).toBe(true);
  });

  it('includes DST switch days outside India', () => {
    const dstDays = all.filter(
      (f) => f.place.tz !== 'Asia/Kolkata' && f.why.toLowerCase().includes('dst'),
    );
    expect(dstDays.length).toBeGreaterThanOrEqual(4);
  });

  it('includes fourteen consecutive days in Telugu cities', () => {
    for (const place of ['hyderabad', 'vijayawada', 'tirupati']) {
      const days = all.filter((f) => f.place.id === place && f.date.startsWith('2026-09-'));
      expect(days.length, place).toBeGreaterThanOrEqual(14);
    }
  });

  it('has at least sixty cases in total', () => {
    expect(all.length).toBeGreaterThanOrEqual(60);
  });

  /**
   * The Phase 2 acceptance bar is ≥ 60 cases verified against a reference
   * panchangam. This test states the current shortfall out loud rather than
   * letting a green suite imply the bar has been met.
   */
  it('documents how far the verified set still is from the §9.1 bar of 60', () => {
    const verifiedCount = verified.fixtures.length;
    expect(verifiedCount).toBeGreaterThan(0);
    if (verifiedCount < 60) {
      expect(
        snapshots.note,
        'snapshots.json must say it is not a substitute for verified fixtures',
      ).toMatch(/not verified/i);
    }
  });
});
