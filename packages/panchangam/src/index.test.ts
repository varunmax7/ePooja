import { describe, expect, it } from 'vitest';
import * as Astronomy from 'astronomy-engine';
import { PANCHANGAM_PACKAGE } from './index.js';

describe('package shell', () => {
  it('declares the Lahiri ayanamsa as the sidereal reference', () => {
    expect(PANCHANGAM_PACKAGE.ayanamsa).toBe('lahiri');
  });
});

describe('astronomy-engine dependency smoke test', () => {
  it('computes a plausible geocentric solar longitude', () => {
    // 2000-01-01T12:00Z: the Sun's tropical longitude is ~280 degrees.
    const lon = Astronomy.SunPosition(new Date('2000-01-01T12:00:00Z')).elon;
    expect(lon).toBeGreaterThan(279);
    expect(lon).toBeLessThan(281);
  });

  it('computes sunrise for Hyderabad without throwing', () => {
    const hyderabad = new Astronomy.Observer(17.385, 78.4867, 500);
    const sunrise = Astronomy.SearchRiseSet(
      Astronomy.Body.Sun,
      hyderabad,
      +1,
      new Date('2026-01-01T00:00:00Z'),
      1,
    );
    expect(sunrise).not.toBeNull();
  });
});
