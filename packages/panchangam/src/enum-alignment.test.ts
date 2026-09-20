import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { KARANA_IDS } from './angas';
import { MASA_IDS, RITU_IDS, SAMVATSARA_IDS } from './masa';
import { VASARA_IDS } from './panchangam';
import { NAKSHATRA_IDS, YOGA_IDS, tithiId } from './transitions';

/**
 * The engine computes ids; `content/enums/*.json` holds the Telugu, the
 * pre-declined locative forms and the pandit's audio token for each of them.
 * If the two drift apart, the Sankalpam silently loses a word — so they are
 * checked against each other here.
 *
 * Reading the files with `node:fs` keeps this a test-only dependency: the
 * engine itself stays pure and framework-free (§15).
 */
const ENUM_DIR = join(import.meta.dirname, '../../../content/enums');

function enumIds(file: string): string[] {
  const parsed: unknown = JSON.parse(readFileSync(join(ENUM_DIR, `${file}.json`), 'utf8'));
  const values = (parsed as { values: { id: string }[] }).values;
  return values.map((v) => v.id);
}

describe('engine ids match content/enums', () => {
  it.each([
    ['samvatsara', SAMVATSARA_IDS],
    ['nakshatra', NAKSHATRA_IDS],
    ['yoga', YOGA_IDS],
    ['karana', KARANA_IDS],
    ['masa', MASA_IDS],
    ['ruthu', RITU_IDS],
    ['vasara', VASARA_IDS],
  ])('%s ids line up in the same order', (file, ids) => {
    expect(enumIds(file)).toEqual([...ids]);
  });

  it('tithi ids line up for all thirty tithis', () => {
    const generated = Array.from({ length: 30 }, (_, i) => tithiId(i + 1));
    expect(enumIds('tithi')).toEqual(generated);
  });

  it('has an audio token for every value the engine can produce', () => {
    const parsed: unknown = JSON.parse(readFileSync(join(ENUM_DIR, 'nakshatra.json'), 'utf8'));
    const values = (parsed as { values: { id: string; audioTokenId: string }[] }).values;
    for (const id of NAKSHATRA_IDS) {
      const match = values.find((v) => v.id === id);
      expect(match?.audioTokenId).toBe(`enum.nakshatra.${id}`);
    }
  });
});
