import { describe, expect, it } from 'vitest';
import { parsePujaFile, stepsBySection, stepsForVariant } from './pujas';

const base = {
  id: 'nitya-puja-short',
  slug: 'nitya-puja',
  deity: 'generic',
  category: 'nitya' as const,
  title: { te: 'నిత్య పూజ', en: 'Daily Nitya Puja' },
  description: { te: '⟨TODO_PANDIT: nitya_description_te⟩', en: 'A short daily puja.' },
  image: 'pujas/nitya.webp',
  durations: { short: 15, full: 35 },
  samagri: ['deepam'],
  naivedyam: ['panchamrutham'],
  review: { status: 'PENDING_PANDIT_REVIEW' as const, reviewer: null, date: null },
  pack: { version: '0.1.0', sizeBytes: 0, audioIds: [] },
  steps: [
    {
      id: 'deeparadhana',
      order: 1,
      section: 'poorvangam' as const,
      title: { te: 'దీపారాధన', en: 'Lighting the lamp' },
      instruction: { text: { te: 'దీపం వెలిగించండి' }, audioId: 'instr.deeparadhana' },
      variants: ['short', 'full'] as const,
    },
    {
      id: 'pranayamam',
      order: 2,
      section: 'poorvangam' as const,
      title: { te: 'ప్రాణాయామం' },
      chant: {
        audioId: 'chant.pranayamam',
        lines: [{ id: 'l1', text: { te: '⟨TODO_PANDIT: pranayamam_l1⟩' } }],
      },
      variants: ['full'] as const,
    },
    {
      id: 'sankalpam',
      order: 3,
      section: 'poorvangam' as const,
      title: { te: 'సంకల్పం' },
      dynamic: 'sankalpam' as const,
      variants: ['short', 'full'] as const,
    },
    {
      id: 'harathi',
      order: 4,
      section: 'uttarangam' as const,
      title: { te: 'హారతి' },
      instruction: { text: { te: 'హారతి ఇవ్వండి' }, audioId: 'instr.harathi' },
      variants: ['short', 'full'] as const,
    },
  ],
};

describe('puja schema', () => {
  it('parses a well-formed puja', () => {
    const puja = parsePujaFile(base);
    expect(puja.steps).toHaveLength(4);
  });

  it('rejects a duplicate step id', () => {
    const broken = { ...base, steps: [...base.steps, { ...base.steps[0] }] };
    expect(() => parsePujaFile(broken)).toThrow(/Duplicate step id deeparadhana/);
  });

  it('rejects step order that does not strictly increase', () => {
    const broken = {
      ...base,
      steps: [base.steps[0], { ...base.steps[1], order: 1 }, base.steps[2], base.steps[3]],
    };
    expect(() => parsePujaFile(broken)).toThrow(/order must strictly increase/);
  });

  it('rejects a step with no instruction, chant, namavali or dynamic content', () => {
    const broken = {
      ...base,
      steps: [
        { id: 'empty-step', order: 1, section: 'poorvangam' as const, title: { te: 'ఖాళీ' } },
      ],
    };
    expect(() => parsePujaFile(broken)).toThrow(/no instruction, chant, namavali or dynamic/);
  });

  it('rejects a short duration that is not shorter than full', () => {
    const broken = { ...base, durations: { short: 35, full: 35 } };
    expect(() => parsePujaFile(broken)).toThrow(/short duration must be less than/);
  });

  it('requires at least one step', () => {
    expect(() => parsePujaFile({ ...base, steps: [] })).toThrow();
  });
});

describe('stepsForVariant', () => {
  const puja = parsePujaFile(base);

  it('includes only steps whose variants list contains the requested one', () => {
    const short = stepsForVariant(puja, 'short');
    expect(short.map((s) => s.id)).toEqual(['deeparadhana', 'sankalpam', 'harathi']);
  });

  it('the full variant includes every step', () => {
    const full = stepsForVariant(puja, 'full');
    expect(full.map((s) => s.id)).toEqual(['deeparadhana', 'pranayamam', 'sankalpam', 'harathi']);
  });

  it('a step with no variants list is included in every variant', () => {
    const puja2 = parsePujaFile({
      ...base,
      steps: [{ ...base.steps[0], variants: undefined }],
    });
    expect(stepsForVariant(puja2, 'short').map((s) => s.id)).toEqual(['deeparadhana']);
  });
});

describe('stepsBySection', () => {
  it('groups steps by section, in §8.4 accordion order, omitting empty sections', () => {
    const puja = parsePujaFile(base);
    const groups = stepsBySection(stepsForVariant(puja, 'full'));

    expect(groups.map((g) => g.section)).toEqual(['poorvangam', 'uttarangam']);
    expect(groups[0]?.steps.map((s) => s.id)).toEqual(['deeparadhana', 'pranayamam', 'sankalpam']);
    expect(groups[1]?.steps.map((s) => s.id)).toEqual(['harathi']);
  });
});
