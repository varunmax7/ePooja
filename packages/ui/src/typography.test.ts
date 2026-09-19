import { describe, expect, it } from 'vitest';
import { fontFamily, mantraStyleFor, textStyles } from './typography.js';

describe('font families', () => {
  it('uses the §7.3 faces', () => {
    expect(fontFamily.uiTitle).toContain('Mukta');
    expect(fontFamily.uiTelugu).toContain('NotoSansTelugu');
    expect(fontFamily.mantraTelugu).toContain('TiroTelugu');
    expect(fontFamily.mantraDevanagari).toContain('TiroDevanagariSanskrit');
  });

  it('names every family in the expo-google-fonts key format', () => {
    for (const family of Object.values(fontFamily)) {
      expect(family).toMatch(/^[A-Za-z]+_\d{3}[A-Za-z]+(_Italic)?$/);
    }
  });
});

describe('text styles', () => {
  it('gives mantra text the §7.3 size and line height', () => {
    expect(textStyles.mantraTelugu.fontSize).toBeGreaterThanOrEqual(20);
    expect(textStyles.mantraTelugu.fontSize).toBeLessThanOrEqual(24);
    // 1.6 line height keeps svara marks above and below the line unclipped.
    const ratio = textStyles.mantraTelugu.lineHeight / textStyles.mantraTelugu.fontSize;
    expect(ratio).toBeGreaterThanOrEqual(1.55);
  });

  it('gives Devanagari mantra text the same metrics as Telugu', () => {
    expect(textStyles.mantraDevanagari.fontSize).toBe(textStyles.mantraTelugu.fontSize);
    expect(textStyles.mantraDevanagari.lineHeight).toBe(textStyles.mantraTelugu.lineHeight);
  });

  it('makes the dial day number the largest thing on screen (§7.4)', () => {
    const sizes = Object.values(textStyles).map((s) => s.fontSize);
    expect(textStyles.dialDay.fontSize).toBe(Math.max(...sizes));
    expect(textStyles.dialDay.fontSize).toBe(48);
  });

  it('keeps every style at a readable line height', () => {
    for (const [name, style] of Object.entries(textStyles)) {
      expect(style.lineHeight / style.fontSize, name).toBeGreaterThanOrEqual(1.1);
    }
  });

  it('never drops below 12 px', () => {
    for (const [name, style] of Object.entries(textStyles)) {
      expect(style.fontSize, name).toBeGreaterThanOrEqual(12);
    }
  });
});

describe('mantraStyleFor', () => {
  it('picks the Telugu face by default', () => {
    expect(mantraStyleFor('te').fontFamily).toBe(fontFamily.mantraTelugu);
  });

  it('picks the Devanagari face, which carries the Vedic svara marks', () => {
    expect(mantraStyleFor('dev').fontFamily).toBe(fontFamily.mantraDevanagari);
  });

  it('picks the italic transliteration face for IAST', () => {
    expect(mantraStyleFor('iast').fontFamily).toBe(fontFamily.transliteration);
  });
});
