import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  enumDisplay,
  enumFileSchema,
  enumValue,
  isFullyAuthored,
  isTodoPandit,
  parseEnumFile,
  pendingFields,
} from './enums';

const ENUM_DIR = join(import.meta.dirname, '../../../content/enums');

const enumFiles = readdirSync(ENUM_DIR)
  .filter((f) => f.endsWith('.json'))
  .sort();

const load = (file: string): unknown => JSON.parse(readFileSync(join(ENUM_DIR, file), 'utf8'));

describe('content/enums', () => {
  it('ships every enumeration §9.2 calls for', () => {
    expect(enumFiles).toEqual([
      'ayana.json',
      'dik.json',
      'gotra.json',
      'karana.json',
      'masa.json',
      'nakshatra.json',
      'rasi.json',
      'ruthu.json',
      'samvatsara.json',
      'tithi.json',
      'vasara.json',
      'yoga.json',
    ]);
  });

  it.each(enumFiles)('%s validates against the schema', (file) => {
    expect(() => parseEnumFile(load(file))).not.toThrow();
  });

  it.each([
    ['samvatsara.json', 60],
    ['nakshatra.json', 27],
    ['yoga.json', 27],
    ['tithi.json', 30],
    ['masa.json', 12],
    ['rasi.json', 12],
    ['karana.json', 11],
    ['dik.json', 8],
    ['vasara.json', 7],
    ['ruthu.json', 6],
    ['ayana.json', 2],
  ])('%s has %i values', (file, count) => {
    expect(parseEnumFile(load(file)).values).toHaveLength(count);
  });

  it.each(enumFiles)('%s is still pending pandit review', (file) => {
    // Phase 10 flips these to APPROVED; until then nothing may claim otherwise.
    expect(parseEnumFile(load(file)).review.status).toBe('PENDING_PANDIT_REVIEW');
  });

  it('keeps the gotra list empty until the pandit supplies it (§9.2)', () => {
    expect(parseEnumFile(load('gotra.json')).values).toEqual([]);
  });
});

describe('Telugu seeded from the plan (§3.3)', () => {
  /**
   * The client spec contained a Sinhala glyph inside apparently-Telugu text,
   * so every seeded Telugu string is checked to be Telugu-block only.
   */
  it.each(['nakshatra.json', 'masa.json', 'vasara.json'])(
    '%s contains real Telugu, not look-alike glyphs',
    (file) => {
      const parsed = parseEnumFile(load(file));
      const seeded = parsed.values.filter((v) => !isTodoPandit(v.te));
      expect(seeded.length).toBe(parsed.values.length);

      for (const value of seeded) {
        for (const char of [...value.te]) {
          const code = char.codePointAt(0) ?? 0;
          const isTelugu = code >= 0x0c00 && code <= 0x0c7f;
          const isJoiner = code === 0x200c || code === 0x200d;
          expect(
            isTelugu || isJoiner,
            `${file}: ${value.id} contains U+${code.toString(16).toUpperCase()} (${char})`,
          ).toBe(true);
        }
      }
    },
  );

  it('rejects the Sinhala glyph from §3.3 in a Telugu field', () => {
    const file = {
      kind: 'test',
      review: { status: 'PENDING_PANDIT_REVIEW', reviewer: null, date: null },
      values: [
        {
          id: 'evam',
          index: 1,
          te: 'ఎవంగුణ', // the pasted client text: 'ు' here is Sinhala U+0DD4
          iast: 'evaṁguṇa',
          dev: '⟨TODO_PANDIT: test_evam_dev⟩',
          locative: { te: '⟨TODO_PANDIT: test_evam_locative_te⟩', iast: 'x' },
          audioTokenId: 'enum.test.evam',
        },
      ],
    };
    expect(() => enumFileSchema.parse(file)).toThrow();
  });
});

describe('schema rules', () => {
  const valid = {
    kind: 'demo',
    review: { status: 'PENDING_PANDIT_REVIEW', reviewer: null, date: null },
    values: [
      {
        id: 'first',
        index: 1,
        te: '⟨TODO_PANDIT: demo_first_te⟩',
        iast: 'First',
        dev: '⟨TODO_PANDIT: demo_first_dev⟩',
        locative: {
          te: '⟨TODO_PANDIT: demo_first_locative_te⟩',
          iast: '⟨TODO_PANDIT: demo_first_locative_iast⟩',
        },
        audioTokenId: 'enum.demo.first',
      },
    ],
  };

  it('accepts a well-formed file', () => {
    expect(() => enumFileSchema.parse(valid)).not.toThrow();
  });

  it('rejects an index that is not its position', () => {
    const bad = { ...valid, values: [{ ...valid.values[0]!, index: 7 }] };
    expect(() => enumFileSchema.parse(bad)).toThrow(/1-based position/);
  });

  it('rejects an audioTokenId that does not match the kind and id', () => {
    const bad = { ...valid, values: [{ ...valid.values[0]!, audioTokenId: 'enum.other.first' }] };
    expect(() => enumFileSchema.parse(bad)).toThrow(/audioTokenId/);
  });

  it('rejects duplicate ids', () => {
    const bad = {
      ...valid,
      values: [valid.values[0]!, { ...valid.values[0]!, index: 2 }],
    };
    expect(() => enumFileSchema.parse(bad)).toThrow(/Duplicate id/);
  });

  it('rejects display text used as an id', () => {
    const bad = { ...valid, values: [{ ...valid.values[0]!, id: 'రోహిణి' }] };
    expect(() => enumFileSchema.parse(bad)).toThrow();
  });

  it('rejects an unknown review status', () => {
    expect(() =>
      enumFileSchema.parse({ ...valid, review: { status: 'LGTM', reviewer: null, date: null } }),
    ).toThrow();
  });
});

describe('pendingFields', () => {
  const parsed = parseEnumFile(load('nakshatra.json'));

  it('lists what a seeded value still needs', () => {
    const rohini = parsed.values.find((v) => v.id === 'rohini');
    expect(rohini).toBeDefined();
    expect(pendingFields(rohini!)).toEqual(['iast', 'dev', 'locative.te', 'locative.iast']);
  });

  it('reports the whole file as not yet authored', () => {
    expect(isFullyAuthored(parsed)).toBe(false);
  });

  it('reports a fully authored value as complete', () => {
    expect(
      pendingFields({
        id: 'rohini',
        index: 4,
        te: 'రోహిణి',
        iast: 'Rohiṇī',
        dev: 'रोहिणी',
        locative: { te: 'రోహిణీ నక్షత్రే', iast: 'rohiṇī nakṣatre' },
        audioTokenId: 'enum.nakshatra.rohini',
      }),
    ).toEqual([]);
  });
});

describe('isTodoPandit', () => {
  it('matches the §0.4 placeholder form', () => {
    expect(isTodoPandit('⟨TODO_PANDIT: achamanam_line_2⟩')).toBe(true);
    expect(isTodoPandit('⟨TODO_PANDIT:achamanam_line_2⟩')).toBe(true);
  });

  it('does not match ordinary content', () => {
    expect(isTodoPandit('రోహిణి')).toBe(false);
    expect(isTodoPandit('TODO_PANDIT')).toBe(false);
  });
});

describe('enumValue / enumDisplay', () => {
  const file = parseEnumFile({
    kind: 'nakshatra',
    review: { status: 'PENDING_PANDIT_REVIEW', reviewer: null, date: null },
    values: [
      {
        id: 'rohini',
        index: 1,
        te: 'రోహిణి',
        iast: 'rohiṇī',
        dev: 'रोहिणी',
        locative: { te: 'రోహిణీ నక్షత్రే', iast: 'rohiṇī nakṣatre' },
        audioTokenId: 'enum.nakshatra.rohini',
      },
    ],
  });

  it('finds a value by id', () => {
    expect(enumValue(file, 'rohini').te).toBe('రోహిణి');
  });

  it('throws rather than returning undefined for an id the content forgot', () => {
    expect(() => enumValue(file, 'ashvini')).toThrow(/No nakshatra value/);
  });

  it('reads the form for each script', () => {
    const value = enumValue(file, 'rohini');
    expect(enumDisplay(value, 'te')).toBe('రోహిణి');
    expect(enumDisplay(value, 'dev')).toBe('रोहिणी');
    expect(enumDisplay(value, 'iast')).toBe('rohiṇī');
  });
});
