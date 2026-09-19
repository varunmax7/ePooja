import { SearchMoonPhase } from 'astronomy-engine';
import { describe, expect, it } from 'vitest';
import { NAKSHATRA_IDS, YOGA_IDS, angaAt, findTransitions, tithiId } from './transitions.js';
import { KARANA_IDS } from './angas.js';
import type { AngaKind } from './types.js';

const INSTANT = new Date('2026-09-19T06:00:00Z');
const kinds: AngaKind[] = ['tithi', 'nakshatra', 'yoga', 'karana'];

const ms = (iso: string): number => new Date(iso).getTime();

describe('angaAt', () => {
  it.each(kinds)('brackets the instant inside the %s span', (kind) => {
    const span = angaAt(kind, INSTANT);
    expect(ms(span.startsAt)).toBeLessThanOrEqual(INSTANT.getTime());
    expect(ms(span.endsAt)).toBeGreaterThan(INSTANT.getTime());
  });

  it.each(kinds)('gives the %s a plausible duration', (kind) => {
    const span = angaAt(kind, INSTANT);
    const hours = (ms(span.endsAt) - ms(span.startsAt)) / 3_600_000;
    expect(hours).toBeGreaterThan(4);
    expect(hours).toBeLessThan(30);
  });

  it('returns ids drawn from the enumerations', () => {
    expect(NAKSHATRA_IDS).toContain(angaAt('nakshatra', INSTANT).id);
    expect(YOGA_IDS).toContain(angaAt('yoga', INSTANT).id);
    expect(KARANA_IDS).toContain(angaAt('karana', INSTANT).id);
  });

  it('agrees with itself anywhere inside a span', () => {
    const span = angaAt('tithi', INSTANT);
    const middle = new Date((ms(span.startsAt) + ms(span.endsAt)) / 2);
    const fromMiddle = angaAt('tithi', middle);

    expect(fromMiddle.id).toBe(span.id);
    expect(fromMiddle.index).toBe(span.index);
    // Bisection stops at the §9.1 precision of 30 s, so two searches that
    // bracket the same root from different sides can land a bracket apart.
    expect(Math.abs(ms(fromMiddle.startsAt) - ms(span.startsAt))).toBeLessThanOrEqual(30_000);
    expect(Math.abs(ms(fromMiddle.endsAt) - ms(span.endsAt))).toBeLessThanOrEqual(30_000);
  });
});

describe('tithi boundaries cross-validated against the Moon’s phase', () => {
  /**
   * `SearchMoonPhase` is an independent code path: if the elongation-derived
   * tithi spans are right, Amavasya must end at the new moon and Pournami at
   * the full moon.
   *
   * The two do not agree to the second, and should not: §9.1 specifies
   * *apparent* of-date longitudes, while `SearchMoonPhase` works from
   * geometric J2000 vectors with aberration off. The ~20″ of solar aberration
   * between them is ~45 s of time — inside the ±2 min the plan allows for
   * transition times, and the tolerance used here.
   */
  const PHASE_TOLERANCE_MS = 120_000;
  it('ends Amavasya at the new moon', () => {
    const newMoon = SearchMoonPhase(0, new Date('2026-09-01T00:00:00Z'), 40);
    expect(newMoon).not.toBeNull();
    const span = angaAt('tithi', new Date(newMoon!.date.getTime() - 3_600_000));
    expect(span.index).toBe(30);
    expect(Math.abs(ms(span.endsAt) - newMoon!.date.getTime())).toBeLessThan(PHASE_TOLERANCE_MS);
  });

  it('ends Pournami at the full moon', () => {
    const fullMoon = SearchMoonPhase(180, new Date('2026-09-01T00:00:00Z'), 40);
    expect(fullMoon).not.toBeNull();
    const span = angaAt('tithi', new Date(fullMoon!.date.getTime() - 3_600_000));
    expect(span.index).toBe(15);
    expect(Math.abs(ms(span.endsAt) - fullMoon!.date.getTime())).toBeLessThan(PHASE_TOLERANCE_MS);
  });

  it('starts Shukla Prathama at the new moon', () => {
    const newMoon = SearchMoonPhase(0, new Date('2026-05-01T00:00:00Z'), 40);
    const span = angaAt('tithi', new Date(newMoon!.date.getTime() + 3_600_000));
    expect(span.index).toBe(1);
    expect(Math.abs(ms(span.startsAt) - newMoon!.date.getTime())).toBeLessThan(PHASE_TOLERANCE_MS);
  });
});

describe('tithiId', () => {
  it('names the paksha and the ordinal', () => {
    expect(tithiId(1)).toBe('shukla_1');
    expect(tithiId(14)).toBe('shukla_14');
    expect(tithiId(16)).toBe('krishna_1');
    expect(tithiId(29)).toBe('krishna_14');
  });

  it('names the two full/new moon tithis', () => {
    expect(tithiId(15)).toBe('pournami');
    expect(tithiId(30)).toBe('amavasya');
  });

  it('produces thirty distinct ids', () => {
    const ids = new Set<string>();
    for (let i = 1; i <= 30; i += 1) ids.add(tithiId(i));
    expect(ids.size).toBe(30);
  });
});

describe('findTransitions', () => {
  const from = new Date('2026-09-19T00:00:00Z');
  const to = new Date('2026-09-24T00:00:00Z');

  it.each(kinds)('returns a contiguous chain of %s spans', (kind) => {
    const spans = findTransitions(kind, from, to);
    expect(spans.length).toBeGreaterThan(1);

    for (let i = 1; i < spans.length; i += 1) {
      const gapMs = ms(spans[i]!.startsAt) - ms(spans[i - 1]!.endsAt);
      // Consecutive spans meet; the search step allows a minute of slack.
      expect(Math.abs(gapMs)).toBeLessThan(120_000);
    }
  });

  it('covers the whole requested window', () => {
    const spans = findTransitions('tithi', from, to);
    expect(ms(spans[0]!.startsAt)).toBeLessThanOrEqual(from.getTime());
    expect(ms(spans[spans.length - 1]!.endsAt)).toBeGreaterThanOrEqual(to.getTime());
  });

  it('advances the index by one (mod the cycle) at each step', () => {
    const spans = findTransitions('nakshatra', from, to);
    for (let i = 1; i < spans.length; i += 1) {
      expect(spans[i]!.index).toBe((spans[i - 1]!.index % 27) + 1);
    }
  });

  it('returns nothing for an empty or reversed range', () => {
    expect(findTransitions('tithi', to, from)).toEqual([]);
    expect(findTransitions('tithi', from, from)).toEqual([]);
  });

  it('finds roughly one tithi a day', () => {
    const spans = findTransitions('tithi', from, to);
    expect(spans.length).toBeGreaterThanOrEqual(5);
    expect(spans.length).toBeLessThanOrEqual(7);
  });
});
