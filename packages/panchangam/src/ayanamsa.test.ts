import { MakeTime } from 'astronomy-engine';
import { describe, expect, it } from 'vitest';
import { julianDay, lahiriAyanamsa } from './ayanamsa.js';

const J2000_JD = 2_451_545.0;

describe('julianDay', () => {
  it('returns the J2000 epoch for 2000-01-01T12:00Z', () => {
    expect(julianDay(MakeTime(new Date('2000-01-01T12:00:00Z')))).toBeCloseTo(J2000_JD, 6);
  });

  it('advances by one per day', () => {
    const a = julianDay(MakeTime(new Date('2026-03-01T00:00:00Z')));
    const b = julianDay(MakeTime(new Date('2026-03-02T00:00:00Z')));
    expect(b - a).toBeCloseTo(1, 9);
  });
});

describe('lahiriAyanamsa', () => {
  it('matches the plan’s J2000 anchor of 23.85306°', () => {
    expect(lahiriAyanamsa(J2000_JD)).toBeCloseTo(23.85306, 6);
  });

  it('advances at 50.2791″ per Julian year', () => {
    const delta = lahiriAyanamsa(J2000_JD + 365.25) - lahiriAyanamsa(J2000_JD);
    expect(delta * 3600).toBeCloseTo(50.2791, 6);
  });

  it('is close to the published Lahiri value for 2026 (≈24°12′)', () => {
    // 2026-01-01 is JD 2461041.5. Published Lahiri tables give ≈24.20°.
    // Tolerance is deliberately loose: ADR 0002 tracks the linear model’s drift.
    expect(lahiriAyanamsa(2_461_041.5)).toBeGreaterThan(24.15);
    expect(lahiriAyanamsa(2_461_041.5)).toBeLessThan(24.25);
  });

  it('is monotonically increasing', () => {
    expect(lahiriAyanamsa(J2000_JD + 1000)).toBeGreaterThan(lahiriAyanamsa(J2000_JD));
  });
});
