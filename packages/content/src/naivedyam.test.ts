import { describe, expect, it } from 'vitest';
import { formatScaledAmount, parseNaivedyamFile, scaledAmount } from './naivedyam';

const base = {
  kind: 'naivedyam' as const,
  review: { status: 'PENDING_PANDIT_REVIEW' as const, reviewer: null, date: null },
  recipes: [
    {
      id: 'pulihora',
      name: { te: '⟨TODO_PANDIT: pulihora_te⟩', en: 'Pulihora' },
      image: 'naivedyam/pulihora.webp',
      timeMinutes: 25,
      baseServings: 4,
      ingredients: [
        {
          id: 'rice',
          name: { te: '⟨TODO_PANDIT: rice_te⟩', en: 'Cooked rice' },
          amount: 2,
          unit: 'cups',
        },
        {
          id: 'tamarind',
          name: { te: '⟨TODO_PANDIT: tamarind_te⟩', en: 'Tamarind pulp' },
          amount: 3,
          unit: 'tbsp',
        },
      ],
      steps: [{ te: '⟨TODO_PANDIT: pulihora_step_1⟩' }],
    },
  ],
};

describe('naivedyam schema', () => {
  it('parses a well-formed file', () => {
    const file = parseNaivedyamFile(base);
    expect(file.recipes).toHaveLength(1);
  });

  it('rejects a duplicate recipe id', () => {
    const broken = { ...base, recipes: [...base.recipes, { ...base.recipes[0] }] };
    expect(() => parseNaivedyamFile(broken)).toThrow(/Duplicate recipe id pulihora/);
  });

  it('rejects a duplicate ingredient id within one recipe', () => {
    const broken = {
      ...base,
      recipes: [
        {
          ...base.recipes[0],
          ingredients: [...base.recipes[0]!.ingredients, { ...base.recipes[0]!.ingredients[0]! }],
        },
      ],
    };
    expect(() => parseNaivedyamFile(broken)).toThrow(/Duplicate ingredient id rice/);
  });

  it('requires at least one step and one ingredient', () => {
    expect(() =>
      parseNaivedyamFile({ ...base, recipes: [{ ...base.recipes[0], ingredients: [] }] }),
    ).toThrow();
    expect(() =>
      parseNaivedyamFile({ ...base, recipes: [{ ...base.recipes[0], steps: [] }] }),
    ).toThrow();
  });
});

describe('scaledAmount', () => {
  const rice = { amount: 2 };

  it('returns the base amount unscaled at the base servings', () => {
    expect(scaledAmount(rice, 4, 4)).toBe(2);
  });

  it('scales up and down proportionally', () => {
    expect(scaledAmount(rice, 8, 4)).toBe(4);
    expect(scaledAmount(rice, 2, 4)).toBe(1);
  });

  it('rounds to two decimals rather than a repeating fraction', () => {
    // 2 cups for 4, scaled to 3 servings: 1.5, not 1.4999999999999998.
    expect(scaledAmount(rice, 3, 4)).toBe(1.5);
    // A three-way split that would repeat forever.
    expect(scaledAmount({ amount: 1 }, 1, 3)).toBe(0.33);
  });

  it('allows zero servings (an empty plan) but never negative ones', () => {
    expect(scaledAmount(rice, 0, 4)).toBe(0);
    expect(() => scaledAmount(rice, -1, 4)).toThrow(RangeError);
  });

  it('refuses a non-positive base — nothing to scale relative to', () => {
    expect(() => scaledAmount(rice, 4, 0)).toThrow(RangeError);
    expect(() => scaledAmount(rice, 4, -2)).toThrow(RangeError);
  });
});

describe('formatScaledAmount', () => {
  it('formats a whole number without a decimal point', () => {
    expect(formatScaledAmount({ amount: 2 }, 8, 4)).toBe('4');
  });

  it('formats a fraction, trimming a trailing zero', () => {
    expect(formatScaledAmount({ amount: 2 }, 3, 4)).toBe('1.5');
  });

  it('keeps two decimals when both are significant', () => {
    expect(formatScaledAmount({ amount: 1 }, 1, 3)).toBe('0.33');
  });
});
