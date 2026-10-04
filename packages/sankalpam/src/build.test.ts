import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  parseDeityNamesFile,
  parseEnumFile,
  parseGeoRegionsFile,
  parseSankalpamTemplateFile,
  parseSuffixTableFile,
  type AudioClip,
  type Devotee,
  type EnumFile,
} from '@epooja/content';
import {
  activeSegmentAt,
  buildSankalpamAudioPlan,
  buildSankalpamText,
  groupPlanIntoRuns,
  resolveNameAudioMode,
  scriptValue,
} from './build';
import { SELF_RECITE_NOMINAL_MS } from './types';
import type { AudioPlanItem, SankalpamContent, SankalpamInput, SankalpamPanchangamInput } from './types';

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
    prefs: {
      uiLang: 'en',
      mantraScript: 'te',
      showTransliteration: true,
      nameAudio: 'self_recite',
    },
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

describe('buildSankalpamAudioPlan — §10 Phase 7: real durations and cue offsets', () => {
  const MANIFEST: AudioClip[] = [
    { id: 'sankalpam.purpose', path: 'x', durationMs: 5000, lufs: -16, sha256: 'a'.repeat(64), kind: 'sankalpam_fixed', voice: 'pandit_primary', humanRecorded: true },
    { id: 'enum.tithi.shukla_10', path: 'x', durationMs: 1200, lufs: -16, sha256: 'a'.repeat(64), kind: 'sankalpam_token', voice: 'pandit_primary', humanRecorded: true },
  ];

  it('looks up each clip’s real duration from the manifest, defaulting to 0 when unrecorded', () => {
    const plan = buildSankalpamAudioPlan(input(), CONTENT, MANIFEST);
    const purpose = plan.find((item) => item.segmentId === 'purpose');
    const tithi = plan.find((item) => item.segmentId === 'tithi');
    const unrecorded = plan.find((item) => item.segmentId === 'auspicious-moment');
    expect(purpose?.durationMs).toBe(5000);
    expect(tithi?.durationMs).toBe(1200);
    expect(unrecorded?.durationMs).toBe(0);
  });

  it('gives every item a cumulative startMs/endMs with no gaps and no overlaps', () => {
    const plan = buildSankalpamAudioPlan(input(), CONTENT, MANIFEST);
    expect(plan[0]?.startMs).toBe(0);
    for (let i = 1; i < plan.length; i += 1) {
      expect(plan[i]?.startMs).toBe(plan[i - 1]?.endMs);
    }
    for (const item of plan) {
      expect(item.endMs).toBe(item.startMs + item.durationMs);
    }
  });

  it('gives a self-recited item the §9.6.1 nominal pause span, not a real duration', () => {
    const plan = buildSankalpamAudioPlan(input(), CONTENT, MANIFEST);
    const name = plan.find((item) => item.segmentId === 'name');
    expect(name?.durationMs).toBe(SELF_RECITE_NOMINAL_MS);
  });

  it('gives a missing or omitted item an empty span, never widening the timeline', () => {
    const plan = buildSankalpamAudioPlan(
      input({ devotee: devotee({ gotraId: undefined, gotraCustom: undefined }) }),
      CONTENT,
      MANIFEST,
    );
    const gotra = plan.find((item) => item.segmentId === 'gotra');
    expect(gotra).toMatchObject({ kind: 'missing', startMs: gotra?.endMs, durationMs: 0 });
  });
});

describe('resolveNameAudioMode — §9.6.1', () => {
  it('self-recites by default, when the devotee never opted into a clone', () => {
    expect(resolveNameAudioMode(input())).toEqual({ kind: 'self_recite' });
  });

  it('self-recites even when opted in, if no clone has been cached yet (not yet rendered)', () => {
    const opted = input({
      devotee: devotee({ prefs: { uiLang: 'en', mantraScript: 'te', showTransliteration: true, nameAudio: 'pandit_clone' } }),
    });
    expect(resolveNameAudioMode(opted)).toEqual({ kind: 'self_recite' });
  });

  it('uses the cached clone only once opted in *and* cached, preferring the local file over the remote URL', () => {
    const withClone = input({
      devotee: devotee({
        prefs: { uiLang: 'en', mantraScript: 'te', showTransliteration: true, nameAudio: 'pandit_clone' },
        nameAudio: { url: 'https://cdn.example/name.m4a', localPath: 'file:///cache/name.m4a', hash: 'x' },
      }),
    });
    expect(resolveNameAudioMode(withClone)).toEqual({
      kind: 'pandit_clone',
      url: 'file:///cache/name.m4a',
    });
  });

  it('falls back to the remote URL when nothing has been cached locally yet', () => {
    const withClone = input({
      devotee: devotee({
        prefs: { uiLang: 'en', mantraScript: 'te', showTransliteration: true, nameAudio: 'pandit_clone' },
        nameAudio: { url: 'https://cdn.example/name.m4a', hash: 'x' },
      }),
    });
    expect(resolveNameAudioMode(withClone)).toEqual({
      kind: 'pandit_clone',
      url: 'https://cdn.example/name.m4a',
    });
  });

  it('never returns anything but self_recite or pandit_clone — no generic TTS path exists to return', () => {
    for (const nameAudioPref of ['self_recite', 'pandit_clone'] as const) {
      const result = resolveNameAudioMode(
        input({ devotee: devotee({ prefs: { uiLang: 'en', mantraScript: 'te', showTransliteration: true, nameAudio: nameAudioPref } }) }),
      );
      expect(['self_recite', 'pandit_clone']).toContain(result.kind);
    }
  });
});

describe('activeSegmentAt — §10 Phase 7 text-highlight tracking', () => {
  const plan = buildSankalpamAudioPlan(input(), CONTENT, [
    { id: 'sankalpam.purpose', path: 'x', durationMs: 5000, lufs: -16, sha256: 'a'.repeat(64), kind: 'sankalpam_fixed', voice: 'pandit_primary', humanRecorded: true },
  ]);

  it('finds the item whose span contains the position', () => {
    const active = activeSegmentAt(plan, 1000);
    expect(active?.segmentId).toBe('purpose');
  });

  it('moves to the next item once its own span ends', () => {
    const purpose = plan.find((item) => item.segmentId === 'purpose')!;
    const active = activeSegmentAt(plan, purpose.endMs);
    expect(active?.segmentId).not.toBe('purpose');
  });

  it('skips a zero-duration item — nothing is ever "active" for an empty span', () => {
    const zeroDuration = plan.find((item) => item.durationMs === 0);
    expect(zeroDuration).toBeDefined();
    const active = activeSegmentAt(plan, zeroDuration!.startMs);
    expect(active?.segmentId).not.toBe(zeroDuration!.segmentId);
  });

  it('stays on the last item once the position runs past the end of the whole plan', () => {
    const active = activeSegmentAt(plan, 10_000_000);
    expect(active?.segmentId).toBe(plan[plan.length - 1]?.segmentId);
  });

  it('returns undefined for an empty plan rather than throwing', () => {
    expect(activeSegmentAt([], 0)).toBeUndefined();
  });
});

describe('groupPlanIntoRuns — §10 Phase 7 Chant Player sequencing', () => {
  it('batches every consecutive clip into one run', () => {
    const plan = buildSankalpamAudioPlan(input(), CONTENT);
    // male, no family, a real deity and a custom gotra: everything up to
    // GOTRA is pure enum/fixed clips — one long run before the first break.
    const runs = groupPlanIntoRuns(plan);
    const firstBreak = runs.findIndex((run) => run.kind !== 'clips');
    expect(firstBreak).toBeGreaterThan(0);
    expect(runs[0]?.kind).toBe('clips');
    expect((runs[0] as { kind: 'clips'; items: unknown[] }).items.length).toBeGreaterThan(1);
  });

  it('breaks the run at a self-recited GOTRA, then resumes clips, then breaks again at NAME', () => {
    const plan = buildSankalpamAudioPlan(input(), CONTENT); // male, gotraCustom set — both GOTRA and NAME self-recite
    const runs = groupPlanIntoRuns(plan);
    const kinds = runs.map((run) => run.kind);
    expect(kinds).toContain('self_recite');
    expect(kinds.filter((k) => k === 'self_recite')).toHaveLength(2); // GOTRA, NAME
    // Never two self_recite runs back to back with nothing real in between —
    // SELF.gotrodbhava sits between them as a real suffix-table clip.
    const firstSelfRecite = kinds.indexOf('self_recite');
    expect(kinds[firstSelfRecite + 1]).toBe('clips');
  });

  it('every item in the original plan appears in exactly one run, same order', () => {
    const plan = buildSankalpamAudioPlan(input(), CONTENT);
    const runs = groupPlanIntoRuns(plan);
    const flattened = runs.flatMap((run): AudioPlanItem[] => (run.kind === 'clips' ? run.items : [run.item]));
    expect(flattened.map((item) => item.segmentId)).toEqual(plan.map((item) => item.segmentId));
  });

  it('a missing slot is its own run, never merged into a clips run', () => {
    const plan = buildSankalpamAudioPlan(
      input({ devotee: devotee({ gotraId: undefined, gotraCustom: undefined }) }),
      CONTENT,
    );
    const runs = groupPlanIntoRuns(plan);
    const missingRun = runs.find((run) => run.kind === 'missing');
    expect(missingRun).toBeDefined();
    expect(missingRun?.kind === 'missing' && missingRun.item.segmentId).toBe('gotra');
  });

  it('returns no runs for an empty plan', () => {
    expect(groupPlanIntoRuns([])).toEqual([]);
  });
});

describe('§10 Phase 7 acceptance: 10 fixture profiles assemble a continuous recitation', () => {
  const profiles: SankalpamInput[] = [
    input({ devotee: devotee({ gender: 'male' }) }),
    input({ devotee: devotee({ gender: 'female' }) }),
    input({
      devotee: devotee({
        gender: 'male',
        family: [familyMember({ relation: 'spouse', includeInSankalpam: true })],
      }),
    }),
    input({
      devotee: devotee({
        gender: 'female',
        family: [familyMember({ relation: 'spouse', includeInSankalpam: true, gender: 'male' })],
      }),
    }),
    input({
      devotee: devotee({
        family: [
          familyMember({ id: 'c1', relation: 'son' }),
          familyMember({ id: 'c2', relation: 'daughter' }),
        ],
      }),
    }),
    input({ devotee: devotee({ gotraId: undefined, gotraCustom: undefined }) }),
    input({ deity: 'generic' }),
    input({ deity: 'shiva' }),
    input({ location: NEW_JERSEY }),
    input({ location: VIJAYAWADA }),
  ];

  it.each(profiles.map((profile, index) => [index, profile] as const))(
    'profile %i assembles a gapless, non-overlapping plan',
    (_index, profile) => {
      const plan = buildSankalpamAudioPlan(profile, CONTENT);
      expect(plan.length).toBeGreaterThan(0);
      expect(plan[0]?.startMs).toBe(0);
      for (let i = 1; i < plan.length; i += 1) {
        expect(plan[i]?.startMs).toBe(plan[i - 1]?.endMs);
      }
    },
  );
});
