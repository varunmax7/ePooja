/**
 * @epooja/content — schemas, types and loaders for ritual content (§9.4).
 *
 * Framework-free: no React Native, no Expo (§15). Phase 2 ships the review
 * contract and the enum schema; the puja, samagri and naivedyam schemas land
 * in Phase 4.
 */

export { reviewSchema, isApproved, type Review } from './review';

export {
  enumFileSchema,
  enumValueSchema,
  parseEnumFile,
  pendingFields,
  isFullyAuthored,
  isTodoPandit,
  teluguOrTodo,
  devanagariOrTodo,
  TODO_PANDIT_PATTERN,
  enumValue,
  enumDisplay,
  type EnumFile,
  type EnumValue,
} from './enums';

export {
  citySchema,
  cityFileSchema,
  parseCityFile,
  distanceKm,
  nearestCity,
  searchCities,
  type City,
  type CityFile,
  type NearestCity,
} from './cities';

export {
  timingSchema,
  timingFileSchema,
  parseTimingFile,
  prayerParts,
  pendingTimingFields,
  PRAYER_TIMING_IDS,
  type Timing,
  type TimingFile,
  type PrayerTimingId,
} from './timings';

export {
  scriptSchema,
  genderSchema,
  localizedTextSchema,
  familyMemberSchema,
  devoteeSchema,
  devoteeLocationSchema,
  devoteePrefsSchema,
  displayName,
  initialsOf,
  missingSankalpamFields,
  RELATIONS,
  type Script,
  type Gender,
  type LocalizedText,
  type Relation,
  type FamilyMember,
  type Devotee,
  type DevoteeLocation,
  type DevoteePrefs,
} from './devotee';

export const CONTENT_PACKAGE = {
  name: '@epooja/content',
  schemaImplementedInPhase: 4,
} as const;
