/**
 * @epooja/panchangam — on-device Panchangam engine (implementation.md §9.1).
 *
 * Phase 0 ships the package shell only: the real API
 * (`getPanchangam`, `getDayPanchangam`, `findTransitions`, `getMonth`)
 * lands in Phase 2. Nothing here may import React Native or Expo (§15).
 */

export const PANCHANGAM_PACKAGE = {
  name: '@epooja/panchangam',
  /** Ayanamsa used for all sidereal conversions (§3.4: no Swiss Ephemeris). */
  ayanamsa: 'lahiri',
  /** Phase that fills this package in. */
  implementedInPhase: 2,
} as const;

export type AyanamsaId = (typeof PANCHANGAM_PACKAGE)['ayanamsa'];
