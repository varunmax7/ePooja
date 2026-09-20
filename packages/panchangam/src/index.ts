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
} from './panchangam';

export { angaAt, findTransitions, tithiId, NAKSHATRA_IDS, YOGA_IDS } from './transitions';

export {
  tithiIndex,
  pakshaOf,
  nakshatraIndex,
  nakshatraPada,
  yogaIndex,
  karanaAt,
  karanaFromHalfIndex,
  rasiOf,
  rasiFromNakshatraPada,
  rasiIdFromNakshatraPada,
  KARANA_IDS,
  MOVABLE_KARANAS,
  RASI_IDS,
  type RasiId,
} from './angas';

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
} from './masa';

export {
  rahuKalam,
  yamagandam,
  gulikaKalam,
  prayerTimings,
  DEFAULT_PRAYER_PARTS,
  PRAYER_DAY_PARTS,
  RAHU_SEGMENTS,
  YAMA_SEGMENTS,
  GULIKA_SEGMENTS,
} from './kalams';

export { lahiriAyanamsa, julianDay } from './ayanamsa';
export {
  sunSiderealLongitude,
  moonSiderealLongitude,
  moonSunElongation,
  ayanamsaAt,
} from './astronomy';
export { norm360, deltaAngle } from './math';

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
} from './types';

export const PANCHANGAM_PACKAGE = {
  name: '@epooja/panchangam',
  /** Ayanamsa used for all sidereal conversions (§3.4: no Swiss Ephemeris). */
  ayanamsa: 'lahiri',
} as const;

export type AyanamsaId = (typeof PANCHANGAM_PACKAGE)['ayanamsa'];
