import type { PujaStep } from '@epooja/content';
import type { AudioPlanItem } from '@epooja/sankalpam';
import { buildStepQueue } from '@/services/audio/queue';

const WITH_INSTRUCTION: PujaStep = {
  id: 'deeparadhana',
  order: 1,
  section: 'poorvangam',
  title: { te: 'x' },
  instruction: { text: { te: 'x' }, audioId: 'instr.deeparadhana' },
  chant: { audioId: 'chant.deeparadhana', lines: [] },
};

const CHANT_ONLY: PujaStep = {
  id: 'pranayamam',
  order: 2,
  section: 'poorvangam',
  title: { te: 'x' },
  chant: { audioId: 'chant.pranayamam', lines: [] },
};

const INSTRUCTION_ONLY: PujaStep = {
  id: 'namaskaram',
  order: 3,
  section: 'poorvangam',
  title: { te: 'x' },
  instruction: { text: { te: 'x' }, audioId: 'instr.namaskaram' },
};

const SANKALPAM_STEP: PujaStep = {
  id: 'sankalpam',
  order: 4,
  section: 'poorvangam',
  title: { te: 'x' },
  instruction: { text: { te: 'x' }, audioId: 'instr.sankalpam' },
  dynamic: 'sankalpam',
};

const SANKALPAM_PLAN: AudioPlanItem[] = [
  {
    kind: 'clip',
    segmentId: 'purpose',
    clipId: 'sankalpam.purpose',
    durationMs: 0,
    startMs: 0,
    endMs: 0,
  },
  {
    kind: 'clip',
    segmentId: 'tithi',
    clipId: 'enum.tithi.shukla_10',
    durationMs: 0,
    startMs: 0,
    endMs: 0,
  },
  {
    kind: 'self_recite',
    segmentId: 'name',
    slot: 'NAME',
    durationMs: 3000,
    startMs: 0,
    endMs: 3000,
  },
  { kind: 'missing', segmentId: 'gotra', slot: 'GOTRA', durationMs: 0, startMs: 3000, endMs: 3000 },
];

describe('buildStepQueue — instruction phase', () => {
  it('is the instruction clip in guided mode', () => {
    expect(buildStepQueue(WITH_INSTRUCTION, 'guided', 'instruction')).toEqual([
      { id: 'instruction', kind: 'instruction', clipId: 'instr.deeparadhana' },
    ]);
  });

  it('is empty in chant mode, even when an instruction exists', () => {
    expect(buildStepQueue(WITH_INSTRUCTION, 'chant', 'instruction')).toEqual([]);
  });

  it('is empty for a step with no instruction', () => {
    expect(buildStepQueue(CHANT_ONLY, 'guided', 'instruction')).toEqual([]);
  });
});

describe('buildStepQueue — chant phase', () => {
  it('is the chant clip, regardless of mode', () => {
    expect(buildStepQueue(WITH_INSTRUCTION, 'guided', 'chant')).toEqual([
      { id: 'chant', kind: 'chant', clipId: 'chant.deeparadhana' },
    ]);
    expect(buildStepQueue(WITH_INSTRUCTION, 'chant', 'chant')).toEqual([
      { id: 'chant', kind: 'chant', clipId: 'chant.deeparadhana' },
    ]);
  });

  it('is empty for an instruction-only step', () => {
    expect(buildStepQueue(INSTRUCTION_ONLY, 'guided', 'chant')).toEqual([]);
  });

  it('comes from the Sankalpam audio plan for a dynamic step', () => {
    const queue = buildStepQueue(SANKALPAM_STEP, 'chant', 'chant', SANKALPAM_PLAN);
    expect(queue).toEqual([
      { id: 'purpose', kind: 'sankalpam', clipId: 'sankalpam.purpose' },
      { id: 'tithi', kind: 'sankalpam', clipId: 'enum.tithi.shukla_10' },
    ]);
  });

  it('is empty for a dynamic step with no plan given', () => {
    expect(buildStepQueue(SANKALPAM_STEP, 'chant', 'chant')).toEqual([]);
  });

  it('skips self_recite and missing plan items — nothing to queue for them', () => {
    const queue = buildStepQueue(SANKALPAM_STEP, 'chant', 'chant', SANKALPAM_PLAN);
    expect(queue.some((track) => track.id === 'name' || track.id === 'gotra')).toBe(false);
  });
});
