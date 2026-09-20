import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseTimingFile, pendingTimingFields, prayerParts } from './timings';

const CONTENT_DIR = join(import.meta.dirname, '../../../content');
const raw = JSON.parse(readFileSync(join(CONTENT_DIR, 'timings.json'), 'utf8')) as unknown;

describe('content/timings.json', () => {
  const file = parseTimingFile(raw);

  it('names all three windows §8.2 asks for, in order', () => {
    expect(file.timings.map((t) => t.id)).toEqual(['morning', 'midday', 'evening']);
  });

  it('places them on the first, third and fifth parts of daylight', () => {
    expect(prayerParts(file)).toEqual({ morning: 0, midday: 2, evening: 4 });
  });

  it('still owes a pandit every sandhya name', () => {
    expect(pendingTimingFields(file)).toEqual([
      'morning.sandhya',
      'midday.sandhya',
      'evening.sandhya',
    ]);
    expect(file.review.status).toBe('PENDING_PANDIT_REVIEW');
  });
});

describe('the timings schema', () => {
  const base = raw as Record<string, unknown>;
  const withTimings = (timings: unknown) => ({ ...base, timings });
  const good = (base.timings as Record<string, unknown>[]).map((t) => ({ ...t }));

  it('rejects a window outside the parts it divides daylight into', () => {
    const broken = good.map((t, i) => (i === 2 ? { ...t, part: 5 } : t));
    expect(() => parseTimingFile(withTimings(broken))).toThrow(/part must be 0–4/);
  });

  it('rejects windows listed out of order', () => {
    expect(() => parseTimingFile(withTimings([...good].reverse()))).toThrow(/ascending part/);
  });

  it('rejects a missing window rather than quietly dropping a reminder', () => {
    expect(() => parseTimingFile(withTimings(good.slice(0, 2)))).toThrow(/Missing timing evening/);
  });

  it('rejects an audio token that does not match its id', () => {
    const broken = good.map((t, i) => (i === 0 ? { ...t, audioTokenId: 'enum.timing.dawn' } : t));
    expect(() => parseTimingFile(withTimings(broken))).toThrow(/enum\.timing\.morning/);
  });
});
