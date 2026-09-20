/**
 * Dynamic Type (§10 Phase 1: "Dynamic Type up to 130%").
 *
 * React Native scales a `<Text>`'s `fontSize` by the OS text size but leaves
 * `lineHeight` untouched. At 130% that makes lines overlap, and it clips the
 * svara marks that sit above and below a mantra line — exactly what §7.3 sets
 * the 1.6 line-height to prevent. So `Txt` turns RN's own scaling off and
 * scales the whole token here, keeping the ratio the tokens were designed at.
 *
 * Framework-free on purpose: the React wiring lives in
 * `components/FontScaleProvider.tsx`, and this half is unit-tested in Node.
 */
import type { TextStyleToken } from './typography';

/**
 * The ceiling Phase 1 is laid out for. Larger OS settings are clamped here
 * rather than allowed to break the ritual screens — a devotee mid-puja must
 * never lose a button off the bottom of the screen.
 */
export const MAX_FONT_SCALE = 1.3;

/** iOS lets a user ask for text smaller than default; this is that floor. */
export const MIN_FONT_SCALE = 0.85;

/** Clamp an OS font scale into the range the layouts are proven at. */
export function clampFontScale(scale: number): number {
  if (!Number.isFinite(scale) || scale <= 0) return 1;
  return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, scale));
}

/** Two decimals is below a device pixel and keeps values comparable in tests. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Scale every metric of a §7.3 token together, so the line-height ratio and
 * the letter-spacing survive the scale-up.
 */
export function scaleTextStyle(token: TextStyleToken, scale: number): TextStyleToken {
  const factor = clampFontScale(scale);
  if (factor === 1) return token;

  return {
    ...token,
    fontSize: round(token.fontSize * factor),
    lineHeight: round(token.lineHeight * factor),
    ...(token.letterSpacing === undefined
      ? {}
      : { letterSpacing: round(token.letterSpacing * factor) }),
  };
}
