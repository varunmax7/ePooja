import { describe, expect, it } from 'vitest';
import { MAX_FONT_SCALE, MIN_FONT_SCALE, clampFontScale, scaleTextStyle } from './fontScale';
import { textStyles } from './typography';

describe('clampFontScale', () => {
  it('holds the Phase 1 ceiling at 130%', () => {
    expect(MAX_FONT_SCALE).toBe(1.3);
    expect(clampFontScale(1.3)).toBe(1.3);
    expect(clampFontScale(2.4)).toBe(1.3);
  });

  it('does not shrink text below the floor', () => {
    expect(clampFontScale(0.5)).toBe(MIN_FONT_SCALE);
  });

  it('falls back to 1 for values a platform could plausibly hand us', () => {
    expect(clampFontScale(Number.NaN)).toBe(1);
    expect(clampFontScale(0)).toBe(1);
    expect(clampFontScale(-1)).toBe(1);
    expect(clampFontScale(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe('scaleTextStyle', () => {
  it('returns the token untouched at 100%', () => {
    expect(scaleTextStyle(textStyles.body, 1)).toBe(textStyles.body);
  });

  it('keeps the line-height ratio at every scale', () => {
    for (const [name, token] of Object.entries(textStyles)) {
      const ratio = token.lineHeight / token.fontSize;
      for (const scale of [MIN_FONT_SCALE, 1.15, MAX_FONT_SCALE]) {
        const scaled = scaleTextStyle(token, scale);
        expect(scaled.lineHeight / scaled.fontSize, `${name} @ ${scale}`).toBeCloseTo(ratio, 2);
      }
    }
  });

  it('keeps the svara headroom §7.3 asks of mantra text at 130%', () => {
    const scaled = scaleTextStyle(textStyles.mantraTelugu, 1.3);
    expect(scaled.lineHeight / scaled.fontSize).toBeGreaterThanOrEqual(1.55);
  });

  it('scales letter-spacing with the size, and leaves it unset when the token has none', () => {
    expect(scaleTextStyle(textStyles.fieldLabel, 1.3).letterSpacing).toBeCloseTo(0.52, 2);
    expect(scaleTextStyle(textStyles.body, 1.3).letterSpacing).toBeUndefined();
  });

  it('clamps rather than trusting the caller', () => {
    expect(scaleTextStyle(textStyles.body, 3)).toEqual(scaleTextStyle(textStyles.body, 1.3));
  });

  it('preserves the font family', () => {
    expect(scaleTextStyle(textStyles.mantraDevanagari, 1.3).fontFamily).toBe(
      textStyles.mantraDevanagari.fontFamily,
    );
  });
});
