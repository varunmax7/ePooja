/**
 * @epooja/sankalpam — Sankalpam text and audio-plan builder (implementation.md §9.3).
 *
 * The text builder landed in Phase 5; `buildSankalpamAudioPlan` ships a
 * stub (real clip durations arrive in Phase 7). No ritual text is ever
 * hardcoded here — every fragment comes from `content/sankalpam/*` and
 * `content/enums/*` (§0.3).
 */

export const SANKALPAM_PACKAGE = {
  name: '@epooja/sankalpam',
  /** §3.6: enum values store pre-declined locative forms; we never decline algorithmically. */
  declension: 'pre-declined-enum-values',
  textImplementedInPhase: 5,
  audioPlanImplementedInPhase: 7,
} as const;

export { buildSankalpamText, buildSankalpamAudioPlan, scriptValue } from './build';

export {
  bearingDegrees,
  dikFromBearing,
  pointInPolygon,
  regionFor,
  resolveGeo,
  riverRegionFor,
  srisailaDik,
  DIK_IDS,
  type DikId,
  type GeoInput,
  type ResolvedGeo,
} from './geo';

export type {
  AudioPlanItem,
  RenderedSegment,
  SankalpamContent,
  SankalpamInput,
  SankalpamLocationInput,
  SankalpamPanchangamInput,
  SankalpamText,
  SlotResolution,
} from './types';
