import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AudioClip } from '@epooja/content';
import {
  SELF_RECITE_NOMINAL_MS,
  groupPlanIntoRuns,
  type AudioPlanItem,
  type PlanRun,
} from '@epooja/sankalpam';
import { useQueuePlayback, type AudioQueueTrack } from '@/services/audio';

export interface SankalpamRunner {
  /** The plan item a devotee should currently see — the self-recite prompt's own text, or whichever clip run is loaded. */
  activeItem: AudioPlanItem | undefined;
  /** True while sitting on a self-recited segment, waiting for `continueSelfRecite` or its own timeout. */
  awaitingSelfRecite: boolean;
  /** The self-recite prompt's "Continue" action (§9.6.1: "auto-continue or tap") — also fires on its own after the nominal pause. */
  continueSelfRecite: () => void;
  playing: boolean;
}

const NO_TRACKS: AudioQueueTrack[] = [];

/**
 * Steps a built Sankalpam audio plan through its own runs (§10 Phase 7):
 * consecutive recorded clips load into one gapless RNTP queue and advance
 * on their own; a self-recited segment (the devotee's name, or a gotra no
 * pandit has recorded) instead shows a prompt and waits — for a tap, or for
 * `SELF_RECITE_NOMINAL_MS` to pass on its own — before moving on. A
 * `missing` run (§10 Phase 5's own gap marker) is skipped the instant it is
 * reached; there is nothing to play or to pause for.
 *
 * `active` mirrors the same convention `useQueuePlayback` already uses: a
 * caller not currently in this step passes `false` and gets back an inert
 * runner, rather than this hook trying to guess when it should run from the
 * plan alone.
 */
export function useSankalpamRunner(
  plan: readonly AudioPlanItem[],
  manifest: readonly AudioClip[],
  active: boolean,
  onComplete: () => void,
): SankalpamRunner {
  const runs = useMemo(() => groupPlanIntoRuns(plan), [plan]);
  // One past the last run (rather than clamped) is the "finished" state —
  // `currentRun` below is simply `undefined` there, and the effect right
  // after calls `onComplete` exactly once when `runIndex` first reaches it.
  const [runIndex, setRunIndex] = useState(0);

  // Deferred one tick (`setTimeout(..., 0)`), not called straight from the
  // effect body: React's own lint flags a synchronous same-tick `setState`
  // inside an effect as a likely cascading-render bug, and that is exactly
  // right here too — `active`/`runs` just changed, so the commit this
  // effect runs after already reflects that; a same-tick reset would redo
  // it a second time before anything ever painted.
  useEffect(() => {
    if (!active) return undefined;
    const id = setTimeout(() => setRunIndex(0), 0);
    return () => clearTimeout(id);
  }, [active, runs]);

  const advanceRun = useCallback(() => {
    setRunIndex((index) => index + 1);
  }, []);

  useEffect(() => {
    if (active && runIndex >= runs.length) onComplete();
  }, [active, runIndex, runs.length, onComplete]);

  const currentRun: PlanRun | undefined = runs[runIndex];

  // `missing`: nothing to play or wait on — skip the moment it is reached.
  useEffect(() => {
    if (!active || currentRun?.kind !== 'missing') return undefined;
    const id = setTimeout(advanceRun, 0);
    return () => clearTimeout(id);
  }, [active, currentRun, advanceRun]);

  // `self_recite`: auto-continue after the nominal pause unless a tap beats it there.
  const selfReciteTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (!active || currentRun?.kind !== 'self_recite') return undefined;
    selfReciteTimer.current = setTimeout(advanceRun, SELF_RECITE_NOMINAL_MS);
    return () => clearTimeout(selfReciteTimer.current);
  }, [active, currentRun, advanceRun]);

  const continueSelfRecite = useCallback(() => {
    clearTimeout(selfReciteTimer.current);
    advanceRun();
  }, [advanceRun]);

  // `clips`/`pandit_clone`: load into RNTP, advance once the run's own queue ends.
  const { tracks, trackManifest } = useMemo(() => {
    if (currentRun?.kind === 'clips') {
      return {
        tracks: currentRun.items.map(
          (item): AudioQueueTrack => ({ id: item.segmentId, kind: 'sankalpam', clipId: item.clipId }),
        ),
        trackManifest: manifest,
      };
    }
    if (currentRun?.kind === 'pandit_clone') {
      const clone: AudioClip = {
        id: currentRun.item.url,
        path: currentRun.item.url,
        durationMs: 0,
        lufs: -16,
        sha256: '0'.repeat(64),
        kind: 'name_clone',
        voice: 'pandit_clone',
        humanRecorded: true,
      };
      return {
        tracks: [
          { id: currentRun.item.segmentId, kind: 'sankalpam', clipId: currentRun.item.url },
        ] satisfies AudioQueueTrack[],
        trackManifest: [...manifest, clone],
      };
    }
    return { tracks: NO_TRACKS, trackManifest: manifest };
  }, [currentRun, manifest]);

  const onRunEnded = useCallback(() => {
    if (!active) return;
    if (currentRun?.kind === 'clips' || currentRun?.kind === 'pandit_clone') advanceRun();
  }, [active, currentRun, advanceRun]);

  const audio = useQueuePlayback(active ? tracks : NO_TRACKS, onRunEnded, trackManifest);

  const activeItem =
    currentRun === undefined
      ? undefined
      : currentRun.kind === 'clips'
        ? currentRun.items[0]
        : currentRun.item;

  return {
    activeItem,
    awaitingSelfRecite: active && currentRun?.kind === 'self_recite',
    continueSelfRecite,
    playing: audio.playing,
  };
}
