/**
 * @epooja/ui — design tokens and primitive components (implementation.md §7).
 *
 * Phase 0 ships the package shell. `tokens.ts` (§7.2) and the component set
 * (§7.4) land in Phase 1. Tokens stay framework-free so Skia drawings, the
 * NativeWind theme and tests can all read the same values.
 */

export const UI_PACKAGE = {
  name: '@epooja/ui',
  tokensImplementedInPhase: 1,
  componentsImplementedInPhase: 1,
} as const;
