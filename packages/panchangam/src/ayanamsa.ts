import type { AstroTime } from 'astronomy-engine';

/**
 * Lahiri (Chitrapaksha) ayanamsa — the tropical→sidereal offset every anga in
 * this engine depends on (§9.1).
 *
 * The plan specifies the linear model as the starting point:
 *   23.85306° at J2000, advancing 50.2791″ per Julian year.
 * ADR 0002 records why it is still the model in use and what would replace it.
 */
const J2000_JD = 2_451_545.0;
const AYANAMSA_AT_J2000_DEG = 23.85306;
const PRECESSION_ARCSEC_PER_YEAR = 50.2791;
const DAYS_PER_JULIAN_YEAR = 365.25;

/** Julian Day from an astronomy-engine time (its `ut` is days since J2000). */
export function julianDay(time: AstroTime): number {
  return time.ut + J2000_JD;
}

/** Lahiri ayanamsa in degrees for a given Julian Day. */
export function lahiriAyanamsa(jd: number): number {
  const years = (jd - J2000_JD) / DAYS_PER_JULIAN_YEAR;
  return AYANAMSA_AT_J2000_DEG + (years * PRECESSION_ARCSEC_PER_YEAR) / 3600;
}
