import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  parseDeityNamesFile,
  parseEnumFile,
  parseGeoRegionsFile,
  parseSankalpamTemplateFile,
  parseSuffixTableFile,
  type Devotee,
  type EnumFile,
} from '@epooja/content';
import { buildSankalpamAudioPlan, buildSankalpamText, scriptValue } from './build';
import type { SankalpamContent, SankalpamInput, SankalpamPanchangamInput } from './types';

/**
 * §10 Phase 5 acceptance: "20 snapshot fixtures pass [...] in all 3 scripts;
 * any missing slot yields a visible ⟨MISSING:slot⟩ marker [...]; female-
 * performer and family variants render per the suffix tables."
 *
 * These run against the *real* `content/sankalpam/*` and `content/enums/*`
 * files, not a synthetic fixture — the same honesty Phase 2 and Phase 4's
 * tests insist on: most of this content is still `⟨TODO_PANDIT: …⟩` (gotra's
 * list is empty; the family/spouse-female wording has no spec source yet),
 * so these fixtures assert the *mechanism* — the right row picked, the right
 * marker shown — rather than exact prose vitest's snapshot files would
 * otherwise freeze over half-finished placeholder text.
 */

const CONTENT_DIR = join(import.meta.dirname, '../../../content');
const loadJson = (path: string): unknown =>
  JSON.parse(readFileSync(join(CONTENT_DIR, path), 'utf8'));

function loadContent(): SankalpamContent {
  return {
    template: parseSankalpamTemplateFile(loadJson('sankalpam/template.json')),
    suffixTables: parseSuffixTableFile(loadJson('sankalpam/suffix-tables.json')),
    geoRegions: parseGeoRegionsFile(loadJson('sankalpam/geo-regions.json')),
    deityNames: parseDeityNamesFile(loadJson('sankalpam/deity-names.json')),
    enums: {
      samvatsara: parseEnumFile(loadJson('enums/samvatsara.json')),
      ayana: parseEnumFile(loadJson('enums/ayana.json')),
      ruthu: parseEnumFile(loadJson('enums/ruthu.json')),
      masa: parseEnumFile(loadJson('enums/masa.json')),
      paksha: parseEnumFile(loadJson('enums/paksha.json')),
      tithi: parseEnumFile(loadJson('enums/tithi.json')),
      vasara: parseEnumFile(loadJson('enums/vasara.json')),
      nakshatra: parseEnumFile(loadJson('enums/nakshatra.json')),
      yoga: parseEnumFile(loadJson('enums/yoga.json')),
      karana: parseEnumFile(loadJson('enums/karana.json')),
      gotra: parseEnumFile(loadJson('enums/gotra.json')),
      dik: parseEnumFile(loadJson('enums/dik.json')),
    },
  };
}

const CONTENT = loadContent();

/** `CONTENT.enums.gotra`, with one entry injected — real `gotra.json` is empty until §9.2's pandit pass. */
function contentWithGotra(id: string, locativeTe: string): SankalpamContent {
  const gotra: EnumFile = {
    ...CONTENT.enums.gotra,
    values: [
      {
        id,
        index: 1,
        te: id,
        iast: id,
        dev: id,
        locative: { te: locativeTe, iast: locativeTe },
        audioTokenId: `enum.gotra.${id}`,
      },
    ],
  };
  return { ...CONTENT, enums: { ...CONTENT.enums, gotra } };
}

const PANCHANGAM: SankalpamPanchangamInput = {
  samvatsaraId: 'vishvavasu',
  ayana: 'dakshinayana',
  rituId: 'sharad',
  masaId: 'ashvayuja',
  paksha: 'shukla',
  tithiId: 'shukla_10',
  vasaraId: 'bhanu',
  nakshatraId: 'rohini',
  yogaId: 'siddhi',
  karanaId: 'bava',
};

const HYDERABAD = { lat: 17.385, lng: 78.4867, countryCode: 'IN' };
const VIJAYAWADA = { lat: 16.5062, lng: 80.648, countryCode: 'IN' };
/** Ladakh: India, but outside both coarse river-region polygons (§10 Phase 5: "start: Telangana + AP coarse polygons"). */
const LADAKH = { lat: 34.0, lng: 77.0, countryCode: 'IN' };
const NEW_JERSEY = { lat: 40.5187, lng: -74.4121, countryCode: 'US' };

function devotee(overrides: Partial<SankalpamInput['devotee']> = {}): SankalpamInput['devotee'] {
  return {
    name: { te: 'రాముడు', en: 'Ramudu' } as Devotee['name'],
    gender: 'male',
    gotraCustom: 'భరద్వాజ',
    family: [],
    ...overrides,
  };
}

function input(overrides: Partial<SankalpamInput> = {}): SankalpamInput {
  return {
    devotee: devotee(),
    panchangam: PANCHANGAM,
    location: HYDERABAD,
    deity: 'ganapathi',
    ...overrides,
  };
}

function familyMember(
  overrides: Partial<SankalpamInput['devotee']['family'][number]>,
): SankalpamInput['devotee']['family'][number] {
  return {
    id: 'm1',
    name: { te: 'పేరు' } as Devotee['name'],
    relation: 'son',
    gender: 'male',
    includeInSankalpam: true,
    ...overrides,
  };
}

describe('buildSankalpamText — a complete fixture', () => {
  const text = buildSankalpamText(input(), CONTENT);

  it('renders non-empty, distinct text in all three scripts', () => {
    expect(text.te.length).toBeGreaterThan(50);
    expect(text.dev.length).toBeGreaterThan(50);
    expect(text.iast.length).toBeGreaterThan(50);
    expect(text.te).not.toBe(text.dev);
    expect(text.te).not.toBe(text.iast);
  });

  it('opens with the §9.3 purpose clause in every script', () => {
    expect(text.te.startsWith('మమోపాత్త')).toBe(true);
    expect(text.dev.startsWith('ममोपात्त')).toBe(true);
    expect(text.iast.startsWith('mamopātta')).toBe(true);
  });

  it('closes with the sankalpa-closing clause', () => {
    expect(text.te.endsWith('పూజాం కరిష్యే')).toBe(true);
  });

  it('carries one rendered segment per template segment, in order', () => {
    expect(text.segments).toHaveLength(CONTENT.template.segments.length);
    expect(text.segments.map((s) => s.id)).toEqual(CONTENT.template.segments.map((s) => s.id));
  });

  it('has no unresolved markers when every slot has real data', () => {
    expect(text.te).not.toContain('⟨MISSING');
  });
});

describe('buildSankalpamText — gender suffixes (§9.3 suffix tables)', () => {
  it('uses the male gotrodbhava/namadheya suffixes for a male performer', () => {
    const text = buildSankalpamText(input({ devotee: devotee({ gender: 'male' }) }), CONTENT);
    expect(text.te).toContain('గోత్రోద్భవస్య');
    expect(text.te).toContain('నామధేయస్య');
  });

  it('uses the female gotrodbhava/namadheya suffixes for a female performer', () => {
    const text = buildSankalpamText(input({ devotee: devotee({ gender: 'female' }) }), CONTENT);
    expect(text.te).toContain('గోత్రోద్భవాయాః');
    expect(text.te).toContain('నామధేయాయాః');
  });
});

describe('buildSankalpamText — spouse clause', () => {
  it('omits the spouse clause entirely for a devotee with no spouse on file', () => {
    const text = buildSankalpamText(input({ devotee: devotee({ family: [] }) }), CONTENT);
    expect(text.te).not.toContain('సమేతస్య');
    expect(text.te).not.toContain('⟨MISSING:SPOUSE_CLAUSE⟩');
  });

  it('includes the male spouse clause when a spouse is marked includeInSankalpam', () => {
    const family = [familyMember({ relation: 'spouse', includeInSankalpam: true })];
    const text = buildSankalpamText(
      input({ devotee: devotee({ gender: 'male', family }) }),
      CONTENT,
    );
    expect(text.te).toContain('ధర్మపత్నీ సమేతస్య');
  });

  it('excludes a spouse who exists but is not marked includeInSankalpam', () => {
    const family = [familyMember({ relation: 'spouse', includeInSankalpam: false })];
    const text = buildSankalpamText(input({ devotee: devotee({ family }) }), CONTENT);
    expect(text.te).not.toContain('సమేతస్య');
  });

  it('renders the pending female-performer spouse-clause placeholder, not the male wording', () => {
    const family = [familyMember({ relation: 'spouse', includeInSankalpam: true, gender: 'male' })];
    const text = buildSankalpamText(
      input({ devotee: devotee({ gender: 'female', family }) }),
      CONTENT,
    );
    expect(text.te).toContain('⟨TODO_PANDIT: spouse_clause_female_te⟩');
    expect(text.te).not.toContain('ధర్మపత్నీ సమేతస్య');
  });
});

describe('buildSankalpamText — family clause', () => {
  it('omits the family clause when no family members are marked for inclusion', () => {
    const text = buildSankalpamText(input({ devotee: devotee({ family: [] }) }), CONTENT);
    expect(text.te).not.toContain('family_clause_suffix');
  });

  it('includes one family-term placeholder per distinct relation, deduplicated across repeats', () => {
    const family = [
      familyMember({ id: 'c1', relation: 'son' }),
      familyMember({ id: 'c2', relation: 'son' }),
      familyMember({ id: 'c3', relation: 'daughter' }),
      familyMember({ id: 'c4', relation: 'father', includeInSankalpam: false }),
    ];
    const text = buildSankalpamText(input({ devotee: devotee({ family }) }), CONTENT);

    const sonCount = (text.te.match(/family_term_son_te/g) ?? []).length;
    const daughterCount = (text.te.match(/family_term_daughter_te/g) ?? []).length;
    expect(sonCount).toBe(1);
    expect(daughterCount).toBe(1);
    expect(text.te).not.toContain('family_term_father_te');
    expect(text.te).toContain('family_clause_suffix_male_te');
  });
});

describe('buildSankalpamText — gotra', () => {
  it('self-recites a custom gotra undeclined, exactly as typed', () => {
    const text = buildSankalpamText(
      input({ devotee: devotee({ gotraId: undefined, gotraCustom: 'వాశిష్ఠ' }) }),
      CONTENT,
    );
    expect(text.te).toContain('వాశిష్ఠ');
    expect(text.te).not.toContain('⟨MISSING:GOTRA⟩');
  });

  it('looks up a listed gotra by its locative form when gotraId is set', () => {
    const content = contentWithGotra('vasishtha', 'వాశిష్ఠ గోత్రస్య');
    const text = buildSankalpamText(
      input({ devotee: devotee({ gotraId: 'vasishtha', gotraCustom: undefined }) }),
      content,
    );
    expect(text.te).toContain('వాశిష్ఠ గోత్రస్య');
  });

  it('renders ⟨MISSING:GOTRA⟩ when neither a listed gotra nor a custom one is given', () => {
    const text = buildSankalpamText(
      input({ devotee: devotee({ gotraId: undefined, gotraCustom: undefined }) }),
      CONTENT,
    );
    expect(text.te).toContain('⟨MISSING:GOTRA⟩');
    expect(text.dev).toContain('⟨MISSING:GOTRA⟩');
    expect(text.iast).toContain('⟨MISSING:GOTRA⟩');
  });
});

describe('buildSankalpamText — deity', () => {
  it('renders a resolved deity name for a catalogued deity', () => {
    const text = buildSankalpamText(input({ deity: 'shiva' }), CONTENT);
    expect(text.te).toContain('శివ');
  });

  it("renders the generic deity's pending placeholder for the daily Nitya puja", () => {
    const text = buildSankalpamText(input({ deity: 'generic' }), CONTENT);
    expect(text.te).toContain('⟨TODO_PANDIT: deity_generic_te⟩');
  });

  it('renders ⟨MISSING:DEITY⟩ for a deity id absent from deity-names.json', () => {
    const text = buildSankalpamText(input({ deity: 'not-a-real-deity' }), CONTENT);
    expect(text.te).toContain('⟨MISSING:DEITY⟩');
  });
});

describe('buildSankalpamText — GEO block', () => {
  it('computes both the Srisailam dik and the Krishna-Godavari river region inside that polygon', () => {
    const text = buildSankalpamText(input({ location: VIJAYAWADA }), CONTENT);
    const dik = text.segments.find((s) => s.slot === 'GEO.srisaila_dik');
    const river = text.segments.find((s) => s.slot === 'GEO.river_region');
    expect(dik?.resolution.status).toBe('resolved');
    expect(river?.resolution.status).toBe('resolved');
    expect(text.te).toContain('కృష్ణా-గోదావర్యోః మధ్య ప్రదేశే');
  });

  it('renders ⟨MISSING:GEO.river_region⟩ for an Indian address outside every listed polygon', () => {
    const text = buildSankalpamText(input({ location: LADAKH }), CONTENT);
    expect(text.te).toContain('⟨MISSING:GEO.river_region⟩');
    const dik = text.segments.find((s) => s.slot === 'GEO.srisaila_dik');
    expect(dik?.resolution.status).toBe('resolved');
  });

  it('honours a manual river-region override over the polygon lookup', () => {
    const text = buildSankalpamText(
      input({ location: { ...HYDERABAD, riverRegionOverride: 'telangana' } }),
      CONTENT,
    );
    expect(text.te).toContain('⟨TODO_PANDIT: river_region_telangana_te⟩');
  });

  it('omits the Srisailam dik and river region entirely for a non-Indian address', () => {
    const text = buildSankalpamText(input({ location: NEW_JERSEY }), CONTENT);
    const dik = text.segments.find((s) => s.slot === 'GEO.srisaila_dik');
    const river = text.segments.find((s) => s.slot === 'GEO.river_region');
    expect(dik?.resolution.status).toBe('omit');
    expect(river?.resolution.status).toBe('omit');
    expect(text.te).not.toContain('⟨MISSING:GEO');
  });

  it("uses the NRI region's own (pending) geo clause text, never India's", () => {
    const text = buildSankalpamText(input({ location: NEW_JERSEY }), CONTENT);
    expect(text.te).toContain('⟨TODO_PANDIT: geo_usa_dvipa_te⟩');
    expect(text.te).not.toContain('జమ్బూద్వీపే');
  });
});

describe('buildSankalpamText — devotee name', () => {
  it('inserts the Telugu name undeclined and transliterates it for dev/iast', () => {
    const text = buildSankalpamText(
      input({ devotee: devotee({ name: { te: 'కృష్ణ', en: 'Krishna' } as Devotee['name'] }) }),
      CONTENT,
    );
    expect(text.te).toContain('కృష్ణ');
    expect(text.dev).toContain(scriptValue({ te: 'కృష్ణ' }, 'dev'));
  });

  it('falls back to the English spelling, literally, when no Telugu name is given', () => {
    const text = buildSankalpamText(
      input({ devotee: devotee({ name: { te: '', en: 'Ramesh' } as Devotee['name'] }) }),
      CONTENT,
    );
    expect(text.te).toContain('Ramesh');
    expect(text.dev).toContain('Ramesh');
    expect(text.iast).toContain('Ramesh');
  });
});

describe('scriptValue', () => {
  it('always returns the Telugu value for the te script', () => {
    expect(scriptValue({ te: 'నమః', dev: 'x', iast: 'y' }, 'te')).toBe('నమః');
  });

  it('prefers a pre-authored dev/iast value over transliterating', () => {
    expect(scriptValue({ te: 'నమః', dev: 'HANDWRITTEN' }, 'dev')).toBe('HANDWRITTEN');
  });

  it('transliterates live when no dev/iast value is pre-authored', () => {
    expect(scriptValue({ te: 'నమః' }, 'dev')).toBe('नमः');
  });

  it('echoes a ⟨TODO_PANDIT: …⟩ placeholder unchanged in every script', () => {
    const placeholder = '⟨TODO_PANDIT: example⟩';
    expect(scriptValue({ te: placeholder }, 'dev')).toBe(placeholder);
    expect(scriptValue({ te: placeholder }, 'iast')).toBe(placeholder);
  });
});

describe('buildSankalpamAudioPlan — Phase 5 stub', () => {
  it('emits one item per non-omitted segment, in template order', () => {
    const text = buildSankalpamText(input(), CONTENT);
    const plan = buildSankalpamAudioPlan(input(), CONTENT);
    const expectedCount = text.segments.filter((s) => s.resolution.status !== 'omit').length;
    expect(plan).toHaveLength(expectedCount);
    expect(plan.map((item) => item.segmentId)).toEqual(
      text.segments.filter((s) => s.resolution.status !== 'omit').map((s) => s.id),
    );
  });

  it('points fixed clauses and enum slots at a clip id with a stub zero duration', () => {
    const plan = buildSankalpamAudioPlan(input(), CONTENT);
    const purpose = plan.find((item) => item.segmentId === 'purpose');
    const tithi = plan.find((item) => item.segmentId === 'tithi');
    expect(purpose).toMatchObject({ kind: 'clip', clipId: 'sankalpam.purpose', durationMs: 0 });
    expect(tithi).toMatchObject({ kind: 'clip', durationMs: 0 });
    expect(tithi?.kind === 'clip' && tithi.clipId).toBe('enum.tithi.shukla_10');
  });

  it('self-recites the name and a custom gotra instead of pointing at a clip', () => {
    const plan = buildSankalpamAudioPlan(input(), CONTENT);
    const name = plan.find((item) => item.segmentId === 'name');
    const gotra = plan.find((item) => item.segmentId === 'gotra');
    expect(name).toMatchObject({ kind: 'self_recite', slot: 'NAME' });
    expect(gotra).toMatchObject({ kind: 'self_recite', slot: 'GOTRA' });
  });

  it('surfaces a missing slot as its own audio-plan item', () => {
    const plan = buildSankalpamAudioPlan(
      input({ devotee: devotee({ gotraId: undefined, gotraCustom: undefined }) }),
      CONTENT,
    );
    const gotra = plan.find((item) => item.segmentId === 'gotra');
    expect(gotra).toMatchObject({ kind: 'missing', slot: 'GOTRA' });
  });

  it('contains no item for an omitted segment (a bachelor has no spouse-clause item at all)', () => {
    const plan = buildSankalpamAudioPlan(input({ devotee: devotee({ family: [] }) }), CONTENT);
    expect(plan.find((item) => item.segmentId === 'spouse-clause')).toBeUndefined();
  });
});
