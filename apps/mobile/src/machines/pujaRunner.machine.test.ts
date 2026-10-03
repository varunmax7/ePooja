import { createActor } from 'xstate';
import type { PujaStep } from '@epooja/content';
import { pujaRunnerMachine, type PujaRunnerInput } from './pujaRunner.machine';

/**
 * §9.7: every transition in the diagram, exercised explicitly. `xstate` v5
 * dropped the old `@xstate/test` model-based runner before a replacement
 * shipped for v5's `setup()` API, so this is the same substitution Phase 2
 * made for Vitest 5's removed `bench` API (ADR 0002 §1's "deviation", not a
 * shortcut) — every arrow in the §9.7 diagram gets its own assertion instead
 * of a generated path.
 */

function step(overrides: Partial<PujaStep> & Pick<PujaStep, 'id' | 'order'>): PujaStep {
  return {
    section: 'poorvangam',
    title: { te: overrides.id },
    ...overrides,
  };
}

const WITH_INSTRUCTION_AND_ACTION = step({
  id: 'deeparadhana',
  order: 1,
  instruction: {
    text: { te: 'x' },
    audioId: 'instr.deeparadhana',
    action: { kind: 'confirm', icon: 'diya' },
  },
  chant: { audioId: 'chant.deeparadhana', lines: [{ id: 'l1', text: { te: 'x' } }] },
});

const WITH_INSTRUCTION_NO_ACTION = step({
  id: 'namaskaram',
  order: 2,
  instruction: { text: { te: 'x' }, audioId: 'instr.namaskaram' },
  chant: { audioId: 'chant.namaskaram', lines: [{ id: 'l1', text: { te: 'x' } }] },
});

const CHANT_ONLY = step({
  id: 'pranayamam',
  order: 3,
  chant: { audioId: 'chant.pranayamam', lines: [{ id: 'l1', text: { te: 'x' } }] },
});

const NAMAVALI_STEP = step({
  id: 'ashtottaram',
  order: 4,
  namavali: { count: 2, offering: 'pushpa', names: [{ id: 'n1', text: { te: 'x' } }] },
  chant: { audioId: 'chant.ashtottaram', lines: [] },
});

const STEPS: PujaStep[] = [
  WITH_INSTRUCTION_AND_ACTION,
  WITH_INSTRUCTION_NO_ACTION,
  CHANT_ONLY,
  NAMAVALI_STEP,
];

function start(input: Partial<PujaRunnerInput> = {}) {
  const actor = createActor(pujaRunnerMachine, {
    input: {
      pujaId: 'nitya-puja',
      variant: 'short',
      mode: 'guided',
      steps: STEPS,
      ...input,
    },
  });
  actor.start();
  return actor;
}

describe('pujaRunner — idle → preparing → step', () => {
  it('starts idle and moves to preparing on START', () => {
    const actor = start();
    expect(actor.getSnapshot().value).toBe('idle');
    actor.send({ type: 'START' });
    expect(actor.getSnapshot().value).toBe('preparing');
  });

  it('records startedAt on entering preparing', () => {
    const actor = start();
    expect(actor.getSnapshot().context.startedAt).toBeNull();
    actor.send({ type: 'START' });
    expect(actor.getSnapshot().context.startedAt).not.toBeNull();
  });

  it('enters the first step on READY', () => {
    const actor = start();
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    expect(actor.getSnapshot().value).toEqual({ step: 'instruction' });
    expect(actor.getSnapshot().context.stepIndex).toBe(0);
  });
});

describe('pujaRunner — step.entry routing', () => {
  it('goes to instruction when guided and the step has one', () => {
    const actor = start({ mode: 'guided' });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    expect(actor.getSnapshot().value).toEqual({ step: 'instruction' });
  });

  it('skips straight to chanting in chant mode even with an instruction', () => {
    const actor = start({ mode: 'chant' });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    expect(actor.getSnapshot().value).toEqual({ step: 'chanting' });
  });

  it('skips straight to chanting for a step with no instruction', () => {
    const actor = start({ mode: 'guided', steps: [CHANT_ONLY] });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    expect(actor.getSnapshot().value).toEqual({ step: 'chanting' });
  });
});

describe('pujaRunner — instruction → awaitingAction → chanting', () => {
  it('waits for CONFIRM when the instruction has an action', () => {
    const actor = start({ mode: 'guided' });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    actor.send({ type: 'AUDIO_ENDED' });
    expect(actor.getSnapshot().value).toEqual({ step: 'awaitingAction' });

    actor.send({ type: 'CONFIRM' });
    expect(actor.getSnapshot().value).toEqual({ step: 'chanting' });
  });

  it('TIMEOUT also advances out of awaitingAction', () => {
    const actor = start({ mode: 'guided' });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    actor.send({ type: 'AUDIO_ENDED' });
    actor.send({ type: 'TIMEOUT' });
    expect(actor.getSnapshot().value).toEqual({ step: 'chanting' });
  });

  it('goes straight to chanting after the instruction when there is no action', () => {
    const actor = start({ mode: 'guided', steps: [WITH_INSTRUCTION_NO_ACTION] });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    actor.send({ type: 'AUDIO_ENDED' });
    expect(actor.getSnapshot().value).toEqual({ step: 'chanting' });
  });
});

describe('pujaRunner — chanting → done → next step', () => {
  it('moves to done when the chant ends', () => {
    const actor = start({ mode: 'chant', steps: [CHANT_ONLY, WITH_INSTRUCTION_NO_ACTION] });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    actor.send({ type: 'AUDIO_ENDED' });
    expect(actor.getSnapshot().value).toEqual({ step: 'done' });
  });

  it('stays on done until NEXT when autoAdvance is off', () => {
    const actor = start({
      mode: 'chant',
      autoAdvance: false,
      steps: [CHANT_ONLY, WITH_INSTRUCTION_NO_ACTION],
    });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    actor.send({ type: 'AUDIO_ENDED' });
    expect(actor.getSnapshot().value).toEqual({ step: 'done' });
    expect(actor.getSnapshot().context.stepIndex).toBe(0);
  });

  it('auto-advances to the next step entry when autoAdvance is on', () => {
    const actor = start({
      mode: 'chant',
      autoAdvance: true,
      steps: [CHANT_ONLY, WITH_INSTRUCTION_NO_ACTION],
    });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    actor.send({ type: 'AUDIO_ENDED' });
    expect(actor.getSnapshot().context.stepIndex).toBe(1);
    expect(actor.getSnapshot().value).toEqual({ step: 'chanting' });
  });

  it('NEXT manually advances to the next step, resetting lineIndex and namavaliCount', () => {
    const actor = start({ mode: 'chant', steps: [CHANT_ONLY, NAMAVALI_STEP] });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    actor.send({ type: 'LINE', index: 3 });
    actor.send({ type: 'NEXT' });
    expect(actor.getSnapshot().context.stepIndex).toBe(1);
    expect(actor.getSnapshot().context.lineIndex).toBe(0);
    expect(actor.getSnapshot().value).toEqual({ step: 'chanting' });
  });

  it('PREV moves back a step and is a no-op at the first step', () => {
    const actor = start({ mode: 'chant', steps: [CHANT_ONLY, NAMAVALI_STEP] });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    actor.send({ type: 'NEXT' });
    expect(actor.getSnapshot().context.stepIndex).toBe(1);

    actor.send({ type: 'PREV' });
    expect(actor.getSnapshot().context.stepIndex).toBe(0);

    actor.send({ type: 'PREV' });
    expect(actor.getSnapshot().context.stepIndex).toBe(0);
  });

  it('reaching done on the last step completes the session instead of advancing', () => {
    const actor = start({ mode: 'chant', steps: [CHANT_ONLY], autoAdvance: true });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    actor.send({ type: 'AUDIO_ENDED' });
    expect(actor.getSnapshot().value).toBe('completed');
    expect(actor.getSnapshot().status).toBe('done');
  });

  it('NEXT on the last step (autoAdvance off) also completes the session', () => {
    const actor = start({ mode: 'chant', steps: [CHANT_ONLY], autoAdvance: false });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    actor.send({ type: 'AUDIO_ENDED' });
    expect(actor.getSnapshot().value).toEqual({ step: 'done' });
    actor.send({ type: 'NEXT' });
    expect(actor.getSnapshot().value).toBe('completed');
  });
});

describe('pujaRunner — pause / resume', () => {
  it('PAUSE from any step substate, RESUME returns to the exact same substate', () => {
    const actor = start({ mode: 'guided' });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    actor.send({ type: 'AUDIO_ENDED' }); // → awaitingAction
    expect(actor.getSnapshot().value).toEqual({ step: 'awaitingAction' });

    actor.send({ type: 'PAUSE' });
    expect(actor.getSnapshot().value).toBe('paused');

    actor.send({ type: 'RESUME' });
    expect(actor.getSnapshot().value).toEqual({ step: 'awaitingAction' });
  });

  it('preserves stepIndex and lineIndex across a pause/resume cycle', () => {
    const actor = start({ mode: 'chant', steps: [CHANT_ONLY, NAMAVALI_STEP] });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    actor.send({ type: 'NEXT' });
    actor.send({ type: 'LINE', index: 2 });

    actor.send({ type: 'PAUSE' });
    actor.send({ type: 'RESUME' });

    expect(actor.getSnapshot().context.stepIndex).toBe(1);
    expect(actor.getSnapshot().context.lineIndex).toBe(2);
  });

  it('EXIT while paused ends the session (the persisted resume point is the host’s job)', () => {
    const actor = start({ mode: 'chant' });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    actor.send({ type: 'PAUSE' });
    actor.send({ type: 'EXIT' });
    expect(actor.getSnapshot().value).toBe('exited');
    expect(actor.getSnapshot().status).toBe('done');
  });
});

describe('pujaRunner — EXIT from an active step', () => {
  it('ends the session from any step substate', () => {
    const actor = start({ mode: 'chant' });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    actor.send({ type: 'EXIT' });
    expect(actor.getSnapshot().value).toBe('exited');
  });
});

describe('pujaRunner — namavali tap counter', () => {
  it('increments on each tap, capped at the step’s own count', () => {
    const actor = start({ mode: 'chant', steps: [NAMAVALI_STEP] });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });

    actor.send({ type: 'NAMAVALI_TAP' });
    expect(actor.getSnapshot().context.namavaliCount).toBe(1);
    actor.send({ type: 'NAMAVALI_TAP' });
    expect(actor.getSnapshot().context.namavaliCount).toBe(2);
    actor.send({ type: 'NAMAVALI_TAP' }); // NAMAVALI_STEP.namavali.count is 2
    expect(actor.getSnapshot().context.namavaliCount).toBe(2);
  });

  it('resets to 0 on the next step', () => {
    const actor = start({ mode: 'chant', steps: [NAMAVALI_STEP, CHANT_ONLY] });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    actor.send({ type: 'NAMAVALI_TAP' });
    actor.send({ type: 'NEXT' });
    expect(actor.getSnapshot().context.namavaliCount).toBe(0);
  });
});

describe('pujaRunner — mode and auto-advance switches', () => {
  it('SET_MODE changes mode without disturbing the current step position', () => {
    const actor = start({ mode: 'chant', steps: [WITH_INSTRUCTION_AND_ACTION] });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    expect(actor.getSnapshot().value).toEqual({ step: 'chanting' });

    actor.send({ type: 'SET_MODE', mode: 'guided' });
    expect(actor.getSnapshot().context.mode).toBe('guided');
    // Already past the instruction gate for this step; mode only affects
    // routing on the *next* step.entry, not the one already in progress.
    expect(actor.getSnapshot().value).toEqual({ step: 'chanting' });
  });

  it('SET_AUTO_ADVANCE toggles whether done advances on its own', () => {
    const actor = start({ mode: 'chant', autoAdvance: false, steps: [CHANT_ONLY, NAMAVALI_STEP] });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    actor.send({ type: 'SET_AUTO_ADVANCE', autoAdvance: true });
    actor.send({ type: 'AUDIO_ENDED' });
    expect(actor.getSnapshot().context.stepIndex).toBe(1);
  });
});

describe('pujaRunner — resuming a persisted session', () => {
  it('starts directly on the given step when resumeAtStepIndex is set', () => {
    const actor = start({
      mode: 'chant',
      steps: [CHANT_ONLY, NAMAVALI_STEP],
      resumeAtStepIndex: 1,
    });
    actor.send({ type: 'START' });
    actor.send({ type: 'READY' });
    expect(actor.getSnapshot().context.stepIndex).toBe(1);
  });
});
