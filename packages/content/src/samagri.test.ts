import { describe, expect, it } from 'vitest';
import { parseSamagriFile } from './samagri';

const base = {
  kind: 'samagri' as const,
  review: { status: 'PENDING_PANDIT_REVIEW' as const, reviewer: null, date: null },
  items: [
    { id: 'deepam', name: { te: 'దీపం', en: 'Lamp' }, icon: 'candle' },
    { id: 'akshatalu', name: { te: 'అక్షతలు' }, icon: 'rice', optional: true },
  ],
};

describe('samagri schema', () => {
  it('parses a well-formed file', () => {
    const file = parseSamagriFile(base);
    expect(file.items).toHaveLength(2);
    expect(file.items[1]?.optional).toBe(true);
  });

  it('rejects a duplicate item id', () => {
    const broken = { ...base, items: [...base.items, { ...base.items[0] }] };
    expect(() => parseSamagriFile(broken)).toThrow(/Duplicate samagri id deepam/);
  });

  it('rejects an id that is not lower-kebab-case', () => {
    const broken = { ...base, items: [{ ...base.items[0], id: 'Deepam_1' }] };
    expect(() => parseSamagriFile(broken)).toThrow();
  });

  it('accepts a ⟨TODO_PANDIT: …⟩ placeholder in the Telugu name (§0.4)', () => {
    const withPlaceholder = {
      ...base,
      items: [{ id: 'karpuram', name: { te: '⟨TODO_PANDIT: karpuram_te⟩' }, icon: 'fire' }],
    };
    expect(() => parseSamagriFile(withPlaceholder)).not.toThrow();
  });

  it('requires at least one item', () => {
    expect(() => parseSamagriFile({ ...base, items: [] })).toThrow();
  });
});
