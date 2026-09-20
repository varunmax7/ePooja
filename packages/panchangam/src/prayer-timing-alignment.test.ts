import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PRAYER_PARTS, PRAYER_DAY_PARTS } from './kalams';

/**
 * `content/timings.json` supplies the labels the Today screen shows for the
 * engine's three prayer windows; the *parts* of daylight those windows land
 * on are the engine's own `DEFAULT_PRAYER_PARTS`, so the two must never
 * drift apart, or a "Morning" label would sit under the midday window.
 */
const TIMINGS_PATH = join(import.meta.dirname, '../../../content/timings.json');

interface TimingFile {
  parts: number;
  timings: { id: 'morning' | 'midday' | 'evening'; part: number }[];
}

describe('content/timings.json matches the engine\'s prayer windows', () => {
  const file = JSON.parse(readFileSync(TIMINGS_PATH, 'utf8')) as TimingFile;

  it('divides daylight into the same number of parts', () => {
    expect(file.parts).toBe(PRAYER_DAY_PARTS);
  });

  it('puts each window on the same part the engine defaults to', () => {
    for (const timing of file.timings) {
      expect(timing.part, timing.id).toBe(DEFAULT_PRAYER_PARTS[timing.id]);
    }
  });
});
