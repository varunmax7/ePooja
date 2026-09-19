/**
 * @epooja/sankalpam — Sankalpam text and audio-plan builder (implementation.md §9.3).
 *
 * Phase 0 ships the package shell only; the builder lands in Phase 5 (text)
 * and Phase 7 (audio plan). No ritual text is ever hardcoded here — every
 * fragment comes from `content/sankalpam/*` and `content/enums/*` (§0.3).
 */

export const SANKALPAM_PACKAGE = {
  name: '@epooja/sankalpam',
  /** §3.6: enum values store pre-declined locative forms; we never decline algorithmically. */
  declension: 'pre-declined-enum-values',
  textImplementedInPhase: 5,
  audioPlanImplementedInPhase: 7,
} as const;
