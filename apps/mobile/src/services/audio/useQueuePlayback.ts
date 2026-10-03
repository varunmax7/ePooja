import { useEffect, useRef } from 'react';
import TrackPlayer, { Event, State, usePlaybackState, useProgress } from 'react-native-track-player';
import type { AudioClip } from '@epooja/content';
import { setupTrackPlayer } from './trackPlayer';
import { BUNDLED_AUDIO_MANIFEST, resolveClipUrl } from './manifest';
import type { AudioQueueTrack } from './queue';

export interface QueuePlayback {
  playing: boolean;
  position: number;
  duration: number;
  play: () => void;
  pause: () => void;
  setRate: (rate: number) => void;
}

/**
 * Loads a step's audio queue into RNTP (§9.6) and reports playing/progress
 * state, calling `onEnded` once the queue finishes.
 *
 * §9.6 recording has not started (Phase 4/5's own notes, and `manifest.ts`'s:
 * `content/audio/` holds nothing but a `.gitkeep`). Every `clipId` this
 * resolves comes back `undefined` today, so there is nothing to load — rather
 * than leave the runner stalled waiting on a clip that will never arrive,
 * an unresolved queue calls `onEnded` on the next tick, the same way a step
 * with no audio at all would. This is dev/content-gap behaviour only: the
 * Phase 10 voice gate (`isProductionSafe`) is what stops a build from ever
 * shipping with clips still unresolved.
 */
export function useQueuePlayback(
  tracks: readonly AudioQueueTrack[],
  onEnded: () => void,
  manifest: readonly AudioClip[] = BUNDLED_AUDIO_MANIFEST,
): QueuePlayback {
  const { state } = usePlaybackState();
  const progress = useProgress(100);
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  });

  // Tracks is a fresh array from the caller each render; compare by the
  // actual clip ids so this effect only re-runs when the queue itself changes.
  const trackKey = tracks.map((track) => track.clipId).join('|');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await setupTrackPlayer();
      await TrackPlayer.reset();

      const resolved = tracks
        .map((track) => ({ track, url: resolveClipUrl(track.clipId, manifest) }))
        .filter((entry): entry is { track: AudioQueueTrack; url: string } => entry.url !== undefined);

      if (resolved.length === 0) {
        if (!cancelled) onEndedRef.current();
        return;
      }

      await TrackPlayer.add(
        resolved.map(({ track, url }) => ({ id: track.id, url, title: track.id })),
      );
      if (!cancelled) await TrackPlayer.play();
    })();

    return () => {
      cancelled = true;
    };
    // `trackKey` (not `tracks`) is the intentional dependency: the caller
    // passes a fresh array identity every render, but the queue only needs
    // reloading when the actual clip ids — or which manifest resolves them,
    // e.g. a download completing — change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackKey, manifest]);

  useEffect(() => {
    const subscription = TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
      onEndedRef.current();
    });
    return () => {
      subscription.remove();
    };
  }, []);

  return {
    playing: state === State.Playing,
    position: progress.position,
    duration: progress.duration,
    play: () => {
      void TrackPlayer.play();
    },
    pause: () => {
      void TrackPlayer.pause();
    },
    setRate: (rate) => {
      void TrackPlayer.setRate(rate);
    },
  };
}
