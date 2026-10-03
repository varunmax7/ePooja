import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  parseDeityNamesFile,
  parseGeoRegionsFile,
  parseSankalpamTemplateFile,
  parseSuffixTableFile,
} from './sankalpam';

const CONTENT_DIR = join(import.meta.dirname, '../../../content/sankalpam');
const load = (file: string): unknown => JSON.parse(readFileSync(join(CONTENT_DIR, file), 'utf8'));

describe('content/sankalpam/template.json', () => {
  const file = parseSankalpamTemplateFile(load('template.json'));

  it('is still pending pandit review', () => {
    expect(file.review.status).toBe('PENDING_PANDIT_REVIEW');
  });

  it('references every §9.3 slot exactly once', () => {
    const slots = file.segments.filter((s) => s.type === 'slot').map((s) => s.slot);
    expect(new Set(slots).size).toBe(slots.length);
  });

  it('marks the two GEO slots that do not apply to every region as optional', () => {
    const bySlot = Object.fromEntries(
      file.segments.filter((s) => s.type === 'slot').map((s) => [s.slot, s]),
    );
    expect(bySlot['GEO.srisaila_dik']?.optional).toBe(true);
    expect(bySlot['GEO.river_region']?.optional).toBe(true);
    expect(bySlot['GEO.dvipa']?.optional).toBe(false);
    expect(bySlot.NAME?.optional).toBe(false);
  });

  it('marks the spouse and family clauses as optional — a bachelor is not missing data', () => {
    const bySlot = Object.fromEntries(
      file.segments.filter((s) => s.type === 'slot').map((s) => [s.slot, s]),
    );
    expect(bySlot.SPOUSE_CLAUSE?.optional).toBe(true);
    expect(bySlot.FAMILY_CLAUSE?.optional).toBe(true);
  });

  it("uses §3.3's corrected text, not the client's Sinhala-glyph typo", () => {
    const segment = file.segments.find((s) => s.id === 'evam-guna-visheshana');
    expect(segment?.type).toBe('fixed');
    expect(segment && 'text' in segment ? segment.text.te : null).toBe(
      'ఏవం గుణ విశేషణ విశిష్టాయాం శుభ తిథౌ',
    );
  });

  it("matches §3.6's own worked example for the gotra suffix", () => {
    const suffix = parseSuffixTableFile(load('suffix-tables.json'));
    expect(suffix.gotrodbhava.male.te).toBe('గోత్రోద్భవస్య');
    expect(suffix.gotrodbhava.female.te).toBe('గోత్రోద్భవాయాః');
  });
});

describe('content/sankalpam/geo-regions.json', () => {
  const file = parseGeoRegionsFile(load('geo-regions.json'));

  it('is anchored at the Srisailam coordinates §9.1 names', () => {
    expect(file.srisailam).toEqual([16.0733, 78.8683]);
  });

  it('has exactly one India region computing both srisaila_dik and river_region', () => {
    const india = file.regions.find((r) => r.id === 'india');
    expect(india?.countryCodes).toEqual(['IN']);
    expect(india?.computeSrisailaDik).toBe(true);
    expect(india?.computeRiverRegion).toBe(true);
  });

  it('has exactly one fallback region for a country none of the others name', () => {
    const fallbacks = file.regions.filter((r) => r.countryCodes.length === 0);
    expect(fallbacks).toHaveLength(1);
  });

  it('gives every river-region polygon at least three points', () => {
    for (const region of file.riverRegions) {
      expect(region.polygon.length, region.id).toBeGreaterThanOrEqual(3);
    }
  });

  it("uses the spec's own example text for the Krishna-Godavari region", () => {
    const kg = file.riverRegions.find((r) => r.id === 'krishna-godavari');
    expect(kg?.text.te).toBe('కృష్ణా-గోదావర్యోః మధ్య ప్రదేశే');
  });
});

describe('content/sankalpam/deity-names.json', () => {
  const file = parseDeityNamesFile(load('deity-names.json'));

  it('names every deity the bundled pujas use', () => {
    for (const deity of ['generic', 'ganapathi', 'lakshmi', 'shiva']) {
      expect(file.names[deity], deity).toBeDefined();
    }
  });
});

describe('the sankalpam schemas reject malformed content', () => {
  it('rejects a template with a duplicate segment id', () => {
    const base = load('template.json') as { segments: unknown[] };
    const broken = { ...base, segments: [...base.segments, base.segments[0]] };
    expect(() => parseSankalpamTemplateFile(broken)).toThrow(/Duplicate segment id/);
  });

  it('rejects a geo file with two fallback regions', () => {
    const base = load('geo-regions.json') as { regions: { countryCodes: string[] }[] };
    const broken = {
      ...base,
      regions: [...base.regions, { ...base.regions[0], id: 'second-fallback', countryCodes: [] }],
    };
    expect(() => parseGeoRegionsFile(broken)).toThrow(/exactly one region must be the fallback/);
  });

  it('rejects a slot segment naming a slot outside §9.3', () => {
    const base = load('template.json') as { segments: unknown[] };
    const broken = {
      ...base,
      segments: [{ type: 'slot', id: 'bogus', slot: 'NOT_A_REAL_SLOT', optional: false }],
    };
    expect(() => parseSankalpamTemplateFile(broken)).toThrow();
  });
});
