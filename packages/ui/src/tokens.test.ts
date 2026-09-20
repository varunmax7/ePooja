import { describe, expect, it } from 'vitest';
import { colors, elevation, gradients, radius, shadow, spacing } from './tokens';

/**
 * The palette is the client's, transcribed from §7.2. These tests pin it so a
 * later "tidy-up" cannot quietly shift the temple-warm look the mockup sets.
 */
describe('colours', () => {
  it('matches the §7.2 maroon scale', () => {
    expect(colors.maroon).toEqual({
      950: '#2E0912',
      900: '#4A0F1E',
      800: '#5E1426',
      700: '#6E1A2E',
      600: '#7D2235',
      500: '#94304A',
    });
  });

  it('matches the §7.2 saffron, gold and cream scales', () => {
    expect(colors.saffron['500']).toBe('#F0A040');
    expect(colors.gold['500']).toBe('#D4A548');
    expect(colors.cream['50']).toBe('#FFFBF5');
    expect(Object.keys(colors.saffron)).toHaveLength(5);
    expect(Object.keys(colors.gold)).toHaveLength(6);
    expect(Object.keys(colors.cream)).toHaveLength(5);
  });

  it('has semantic success and danger colours', () => {
    expect(colors.success).toBe('#3E8E4F');
    expect(colors.danger).toBe('#B3261E');
  });

  it('uses uppercase six-digit hex throughout', () => {
    const scales = [colors.maroon, colors.saffron, colors.gold, colors.cream, colors.ink];
    for (const scale of scales) {
      for (const value of Object.values(scale)) {
        expect(value).toMatch(/^#[0-9A-F]{6}$/);
      }
    }
  });
});

describe('gradients', () => {
  it('fades the saffron header into cream, as §7.2 specifies', () => {
    expect(gradients.saffronHeader).toEqual(['#F6B85C', '#F0A040', '#FBEFDB']);
  });

  it('runs the gold coin light-to-dark for the radial bevel', () => {
    expect(gradients.goldCoin).toEqual(['#F3E2B6', '#D4A548', '#A77B26']);
  });

  it('darkens the maroon header downward', () => {
    expect(gradients.maroonHeader).toEqual(['#6E1A2E', '#4A0F1E']);
  });
});

describe('scales', () => {
  it('matches the §7.2 radius scale', () => {
    expect(radius).toEqual({ sm: 8, md: 12, lg: 16, xl: 24, pill: 999 });
  });

  it('matches the §7.2 spacing scale', () => {
    expect([...spacing]).toEqual([0, 4, 8, 12, 16, 20, 24, 32, 40, 48]);
  });

  it('keeps spacing monotonically increasing', () => {
    for (let i = 1; i < spacing.length; i += 1) {
      expect(spacing[i]).toBeGreaterThan(spacing[i - 1] as number);
    }
  });
});

describe('elevation', () => {
  it('turns a shadow token into React Native style props', () => {
    expect(elevation(shadow.card)).toEqual({
      shadowColor: 'rgba(110,50,20,0.14)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 7,
      elevation: 4,
    });
  });

  it('makes the raised token heavier than the card token', () => {
    expect(elevation(shadow.raised).shadowRadius).toBeGreaterThan(
      elevation(shadow.card).shadowRadius,
    );
  });

  it('uses a warm brown shadow, never black (§7.1)', () => {
    expect(shadow.card.color).toContain('110,50,20');
    expect(shadow.raised.color).toContain('110,50,20');
  });
});
