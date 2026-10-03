import { assign, raise, setup } from 'xstate';
import type { PujaStep } from '@epooja/content';

/**
 * The Puja Runner (§9.7): a strict state machine for walking a puja's steps
 * in Chant or Guided mode, with pause/resume, manual and auto advance, and a
 * namavali tap counter.
 *
 * Deliberately audio-agnostic: this machine never touches `react-native-track-player`
 * or any other native module, so it is fully unit-testable in Node (§15: pure
 * logic lives in framework-free code with tests; the app only consumes it).
 * `AUDIO_ENDED` is an event a host component sends once RNTP reports a clip
 * finished — the machine only tracks *where the devotee is*, never *how the
 * clip is playing*.
 */

export type PujaRunnerMode = 'chant' | 'guided';

export interface PujaRunnerContext {
  pujaId: string;
  variant: 'short' | 'full';
  mode: PujaRunnerMode;
  /** The already-composed, already-variant-filtered steps this session runs (§10 Phase 6). */
  steps: readonly PujaStep[];
  stepIndex: number;
  /** Which mantra line is highlighted within the current step's chant (§9.6 text sync). */
  lineIndex: number;
  /** Taps recorded so far in the current step's namavali offering, if any. */
  namavaliCount: number;
  /** Advance to the next step automatically once a step's chant ends. */
  autoAdvance: boolean;
  startedAt: string | null;
}

export type PujaRunnerEvent =
  | { type: 'START' }
  | { type: 'READY' }
  | { type: 'AUDIO_ENDED' }
  | { type: 'CONFIRM' }
  | { type: 'TIMEOUT' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'PREV' }
  | { type: 'NEXT' }
  | { type: 'EXIT' }
  | { type: 'SET_MODE'; mode: PujaRunnerMode }
  | { type: 'SET_AUTO_ADVANCE'; autoAdvance: boolean }
  | { type: 'LINE'; index: number }
  | { type: 'NAMAVALI_TAP' };

export interface PujaRunnerInput {
  pujaId: string;
  variant: 'short' | 'full';
  mode: PujaRunnerMode;
  steps: readonly PujaStep[];
  autoAdvance?: boolean;
  /** Resuming a persisted session (§9.7's `exited`/"persisted") lands directly on this step. */
  resumeAtStepIndex?: number;
}

function currentStep(context: PujaRunnerContext): PujaStep {
  const step = context.steps[context.stepIndex];
  /* c8 ignore next -- stepIndex is always clamped to [0, steps.length) by the guards below */
  if (!step) throw new Error(`No step at index ${context.stepIndex}`);
  return step;
}

export const pujaRunnerMachine = setup({
  types: {
    context: {} as PujaRunnerContext,
    events: {} as PujaRunnerEvent,
    input: {} as PujaRunnerInput,
  },
  guards: {
    isGuidedWithInstruction: ({ context }) =>
      context.mode === 'guided' && currentStep(context).instruction !== undefined,
    requiresAction: ({ context }) => currentStep(context).instruction?.action !== undefined,
    isLastStep: ({ context }) => context.stepIndex >= context.steps.length - 1,
    hasPrevStep: ({ context }) => context.stepIndex > 0,
    autoAdvanceOn: ({ context }) => context.autoAdvance,
  },
  actions: {
    setStartedAt: assign({ startedAt: () => new Date().toISOString() }),
    goToNextStep: assign(({ context }) => ({
      stepIndex: context.stepIndex + 1,
      lineIndex: 0,
      namavaliCount: 0,
    })),
    goToPrevStep: assign(({ context }) => ({
      stepIndex: Math.max(0, context.stepIndex - 1),
      lineIndex: 0,
      namavaliCount: 0,
    })),
    setLineIndex: assign({
      lineIndex: ({ event }) => {
        /* c8 ignore next -- only ever invoked for a LINE event */
        if (event.type !== 'LINE') return 0;
        return event.index;
      },
    }),
    setMode: assign({
      mode: ({ event }) => {
        /* c8 ignore next -- only ever invoked for a SET_MODE event */
        if (event.type !== 'SET_MODE') return 'chant';
        return event.mode;
      },
    }),
    setAutoAdvance: assign({
      autoAdvance: ({ event }) => {
        /* c8 ignore next -- only ever invoked for a SET_AUTO_ADVANCE event */
        if (event.type !== 'SET_AUTO_ADVANCE') return false;
        return event.autoAdvance;
      },
    }),
    incrementNamavali: assign(({ context }) => {
      const limit = currentStep(context).namavali?.count ?? Infinity;
      return { namavaliCount: Math.min(context.namavaliCount + 1, limit) };
    }),
  },
}).createMachine({
  id: 'pujaRunner',
  context: ({ input }) => ({
    pujaId: input.pujaId,
    variant: input.variant,
    mode: input.mode,
    steps: input.steps,
    stepIndex: input.resumeAtStepIndex ?? 0,
    lineIndex: 0,
    namavaliCount: 0,
    autoAdvance: input.autoAdvance ?? false,
    startedAt: null,
  }),
  initial: 'idle',
  states: {
    idle: {
      on: { START: 'preparing' },
    },
    preparing: {
      // §9.7: "ensure pack downloaded, build sankalpam plan, keepAwake on" —
      // all three are host-side effects (the pack is already bundled, the
      // sankalpam plan is built from live data the machine does not own);
      // the host sends READY once they are done. Keep-awake is driven by a
      // React effect watching this machine's `state.matches(...)`, not by
      // the machine itself, so the machine stays free of native modules.
      entry: 'setStartedAt',
      on: { READY: 'step' },
    },
    step: {
      initial: 'entry',
      on: {
        PAUSE: 'paused',
        SET_MODE: { actions: 'setMode' },
        SET_AUTO_ADVANCE: { actions: 'setAutoAdvance' },
        PREV: { guard: 'hasPrevStep', actions: 'goToPrevStep', target: '.entry' },
        NEXT: [
          { guard: 'isLastStep', target: '#pujaRunner.completed' },
          { actions: 'goToNextStep', target: '.entry' },
        ],
        EXIT: '#pujaRunner.exited',
      },
      states: {
        hist: { type: 'history', history: 'deep' },
        entry: {
          always: [
            { guard: 'isGuidedWithInstruction', target: 'instruction' },
            { target: 'chanting' },
          ],
        },
        instruction: {
          on: {
            AUDIO_ENDED: [
              { guard: 'requiresAction', target: 'awaitingAction' },
              { target: 'chanting' },
            ],
          },
        },
        awaitingAction: {
          on: {
            CONFIRM: 'chanting',
            TIMEOUT: 'chanting',
          },
        },
        chanting: {
          on: {
            AUDIO_ENDED: 'done',
            LINE: { actions: 'setLineIndex' },
            NAMAVALI_TAP: { actions: 'incrementNamavali' },
          },
        },
        done: {
          // Auto-advance re-raises NEXT so "the last step's done" and "an
          // auto-advancing step's done" share one place that decides between
          // another step and `completed` (§9.7's own two arrows out of `done`).
          always: { guard: 'autoAdvanceOn', actions: raise({ type: 'NEXT' }) },
        },
      },
    },
    paused: {
      on: { RESUME: 'step.hist', EXIT: 'exited' },
    },
    completed: {
      type: 'final',
    },
    exited: {
      type: 'final',
    },
  },
});

export type PujaRunnerSnapshot = ReturnType<
  import('xstate').Actor<typeof pujaRunnerMachine>['getSnapshot']
>;
