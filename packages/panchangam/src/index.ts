/**
 * @epooja/panchangam — on-device Panchangam engine (implementation.md §9.1).
 *
 * Pure, deterministic and framework-free: no React Native, no Expo, no network
 * and no ambient clock reads (§15). Everything the app shows on the Today and
 * Calendar screens, and every variable the Sankalpam stitches in, comes from
 * here.
 */

export {
  getPanchangam,
  getDayPanchangam,
  getMonth,
  mostRecentSunrise,
  clearPanchangamCache,
  NoSunriseError,
  VASARA_IDS,
} from './panchangam.js';

export { angaAt, findTransitions, tithiId, NAKSHATRA_IDS, YOGA_IDS } from './transitions.js';

export {
  tithiIndex,
  pakshaOf,
  nakshatraIndex,
  nakshatraPada,
  yogaIndex,
  karanaAt,
  karanaFromHalfIndex,
  rasiOf,
  KARANA_IDS,
  MOVABLE_KARANAS,
} from './angas.js';

export {
  lunarMonthAt,
  previousNewMoon,
  nextNewMoon,
  ayanaAt,
  rituOf,
  samvatsaraAt,
  currentYearStart,
  MASA_IDS,
  RITU_IDS,
  SAMVATSARA_IDS,
} from './masa.js';

export {
  rahuKalam,
  yamagandam,
  gulikaKalam,
  prayerTimings,
  RAHU_SEGMENTS,
  YAMA_SEGMENTS,
  GULIKA_SEGMENTS,
} from './kalams.js';

export { lahiriAyanamsa, julianDay } from './ayanamsa.js';
export {
  sunSiderealLongitude,
  moonSiderealLongitude,
  moonSunElongation,
  ayanamsaAt,
} from './astronomy.js';
export { norm360, deltaAngle } from './math.js';

export type {
  AngaKind,
  AngaSpan,
  Ayana,
  DayPanchangamOptions,
  GeoLocation,
  NakshatraPada,
  Paksha,
  PanchangamData,
  PanchangamInput,
  PrayerTiming,
  Weekday,
} from './types.js';

export const PANCHANGAM_PACKAGE = {
  name: '@epooja/panchangam',
  /** Ayanamsa used for all sidereal conversions (§3.4: no Swiss Ephemeris). */
  ayanamsa: 'lahiri',
} as const;

export type AyanamsaId = (typeof PANCHANGAM_PACKAGE)['ayanamsa'];
