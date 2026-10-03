/**
 * @epooja/content — schemas, types and loaders for ritual content (§9.4).
 *
 * Framework-free: no React Native, no Expo (§15).
 */

export { reviewSchema, isApproved, type Review } from './review';

export {
  scriptSchema,
  genderSchema,
  localizedTextSchema,
  contentTextSchema,
  displayName,
  initialsOf,
  type Script,
  type Gender,
  type LocalizedText,
  type ContentText,
} from './localizedText';

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
  familyMemberSchema,
  devoteeSchema,
  devoteeLocationSchema,
  devoteePrefsSchema,
  missingSankalpamFields,
  RELATIONS,
  type Relation,
  type FamilyMember,
  type Devotee,
  type DevoteeLocation,
  type DevoteePrefs,
} from './devotee';

export {
  samagriItemSchema,
  samagriFileSchema,
  parseSamagriFile,
  type SamagriItem,
  type SamagriFile,
} from './samagri';

export {
  naivedyamIngredientSchema,
  naivedyamRecipeSchema,
  naivedyamFileSchema,
  parseNaivedyamFile,
  scaledAmount,
  formatScaledAmount,
  type NaivedyamIngredient,
  type NaivedyamRecipe,
  type NaivedyamFile,
} from './naivedyam';

export {
  mantraLineSchema,
  pujaStepSchema,
  pujaCatalogItemSchema,
  pujaPackMetaSchema,
  pujaStepTemplateFileSchema,
  parsePujaFile,
  parsePujaStepTemplateFile,
  stepsForVariant,
  stepsBySection,
  STEP_SECTIONS,
  UPACHARAS,
  PUJA_VARIANTS,
  PUJA_CATEGORIES,
  type MantraLine,
  type PujaStep,
  type PujaCatalogItem,
  type PujaStepTemplateFile,
  type StepSection,
  type Upachara,
  type PujaVariant,
  type PujaCategory,
} from './pujas';

export {
  audioClipSchema,
  isProductionSafe,
  AUDIO_CLIP_KINDS,
  AUDIO_VOICES,
  type AudioClip,
  type AudioClipKind,
  type AudioVoice,
} from './audio';

export {
  sankalpamSegmentSchema,
  sankalpamTemplateFileSchema,
  parseSankalpamTemplateFile,
  suffixTableFileSchema,
  parseSuffixTableFile,
  geoRegionsFileSchema,
  parseGeoRegionsFile,
  deityNamesFileSchema,
  parseDeityNamesFile,
  SANKALPAM_SLOTS,
  RELATION_KINDS,
  type SankalpamSlot,
  type SankalpamSegment,
  type SankalpamTemplateFile,
  type SuffixTableFile,
  type GeoRegion,
  type RiverRegion,
  type GeoRegionsFile,
  type DeityNamesFile,
  type RelationKind,
} from './sankalpam';

export const CONTENT_PACKAGE = {
  name: '@epooja/content',
  schemaImplementedInPhase: 4,
} as const;
