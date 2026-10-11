import { describe, expect, it } from 'vitest';
import { festivalsInMonth, parseFestivalFile } from './festivals';

const base = {
  kind: 'festivals' as const,
  samvatsara: 'vishvavasu',
  review: { status: 'PENDING_PANDIT_REVIEW' as const, reviewer: null, date: null },
  festivals: [
    {
      id: 'ugadi',
      name: { te: '⟨TODO_PANDIT: ugadi_te⟩', en: 'Ugadi' },
      date: '2026-03-19',
    },
    {
      id: 'vinayaka-chavithi',
      name: { te: '⟨TODO_PANDIT: vinayaka_chavithi_te⟩', en: 'Vinayaka Chavithi' },
      date: '2026-09-14',
    },
  ],
};

describe('festival schema', () => {
  it('parses a well-formed file', () => {
    const file = parseFestivalFile(base);
    expect(file.festivals).toHaveLength(2);
  });

  it('rejects a duplicate festival id', () => {
    const broken = { ...base, festivals: [...base.festivals, { ...base.festivals[0]! }] };
    expect(() => parseFestivalFile(broken)).toThrow(/Duplicate festival id ugadi/);
  });

  it('rejects a malformed date', () => {
    expect(() =>
      parseFestivalFile({
        ...base,
        festivals: [{ ...base.festivals[0]!, date: '19-03-2026' }],
      }),
    ).toThrow();
  });
});

describe('festivalsInMonth', () => {
  const file = parseFestivalFile(base);

  it('returns no festivals when no file is supplied', () => {
    expect(festivalsInMonth(undefined, 2026, 3)).toEqual([]);
  });

  it('filters to the requested year and month', () => {
    expect(festivalsInMonth(file, 2026, 3).map((f) => f.id)).toEqual(['ugadi']);
    expect(festivalsInMonth(file, 2026, 9).map((f) => f.id)).toEqual(['vinayaka-chavithi']);
  });

  it('returns nothing for a month with no festival', () => {
    expect(festivalsInMonth(file, 2026, 1)).toEqual([]);
  });
});
