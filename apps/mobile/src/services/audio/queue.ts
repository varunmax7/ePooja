import type { PujaStep } from '@epooja/content';
import type { AudioPlanItem } from '@epooja/sankalpam';

/**
 * §9.6: "Step playback: Guided mode queue = `[instructionClip, (await
 * action), chantClip]`; Chant mode = `[chantClip]`." The "(await action)" in
 * the middle is the pujaRunner machine's own `awaitingAction` state, not an
 * audio track — and that split matters for more than vocabulary: the
 * instruction clip and the chant clip need *separate* "this clip ended"
 * signals (the machine decides differently after each one — §9.7's
 * `instruction → awaitingAction|chanting` vs. `chanting → done`), so they
 * are never loaded into RNTP as one combined queue. This function builds
 * one phase's queue at a time; the caller (the Chant Player, which already
 * knows the machine's current substate) asks for `'instruction'` while in
 * that state and `'chant'` while in `chanting`.
 */
export type AudioQueuePhase = 'instruction' | 'chant';

export interface AudioQueueTrack {
  /** Stable id for this queue position — `"instruction"`/`"chant"`, or a Sankalpam segment id. */
  id: string;
  kind: 'instruction' | 'chant' | 'sankalpam';
  clipId: string;
}

/**
 * The clip queue for one phase of one step.
 *
 * `'instruction'` is empty outside guided mode or for a step with no
 * instruction — there is simply nothing to wait on, and the runner moves
 * straight past it (§9.7's own `step.entry` routing already decided this
 * before audio is ever involved).
 *
 * `'chant'` for a step marked `dynamic: 'sankalpam'` (§9.4) comes from a
 * pre-built Sankalpam audio plan (§9.3's `buildSankalpamAudioPlan`) rather
 * than `step.chant` — that step has none. A `self_recite` or `missing` plan
 * item contributes no track — §9.6.1's self-recite pause is UI (the
 * devotee's own name, shown large), not something to queue.
 */
export function buildStepQueue(
  step: PujaStep,
  mode: 'chant' | 'guided',
  phase: AudioQueuePhase,
  sankalpamPlan: readonly AudioPlanItem[] = [],
): AudioQueueTrack[] {
  if (phase === 'instruction') {
    if (mode !== 'guided' || !step.instruction) return [];
    return [{ id: 'instruction', kind: 'instruction', clipId: step.instruction.audioId }];
  }

  if (step.dynamic === 'sankalpam') {
    return sankalpamPlan
      .filter((item) => item.kind === 'clip')
      .map((item) => ({ id: item.segmentId, kind: 'sankalpam' as const, clipId: item.clipId }));
  }

  if (step.chant) {
    return [{ id: 'chant', kind: 'chant', clipId: step.chant.audioId }];
  }

  return [];
}
