import { describe, expect, it } from 'vitest';
import { isTodoPandit, reviewSchema } from './index.js';

describe('reviewSchema', () => {
  it('accepts an unreviewed content block', () => {
    const parsed = reviewSchema.parse({
      status: 'PENDING_PANDIT_REVIEW',
      reviewer: null,
      date: null,
    });
    expect(parsed.status).toBe('PENDING_PANDIT_REVIEW');
  });

  it('rejects an unknown review status', () => {
    expect(() => reviewSchema.parse({ status: 'LGTM', reviewer: null, date: null })).toThrow();
  });
});

describe('isTodoPandit', () => {
  it('matches the §0.4 placeholder form', () => {
    expect(isTodoPandit('⟨TODO_PANDIT:achamanam_line_2⟩')).toBe(true);
  });

  it('does not match ordinary content', () => {
    expect(isTodoPandit('achamanam_line_2')).toBe(false);
  });
});
