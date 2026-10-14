import { useEffect, useRef } from 'react';
import TrackPlayer, {
  Event,
  State,
  usePlaybackState,
  useProgress,
} from 'react-native-track-player';
import type { AudioClip } from '@epooja/content';
import { isTrackPlayerUnavailable, setupTrackPlayer } from './trackPlayer';
import { BUNDLED_AUDIO_MANIFEST, resolveClipUrl } from './manifest';
import type { AudioQueueTrack } from './queue';
import type { QueuePlayback } from './playback.types';

export type { QueuePlayback };

/**
 * **Native** implementation (iOS/Android) — loads a step's audio queue into
 * RNTP (§9.6) and reports playing/progress state, calling `onEnded` once the
 * queue finishes. `useQueuePlayback.web.ts` is the web counterpart, backed
 * by `expo-audio` instead — Metro resolves whichever one matches the current
 * platform; every caller just imports `useQueuePlayback` from the barrel
 * (`services/audio`) and gets the right one.
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
      try {
        await setupTrackPlayer();
      } catch (error) {
        // This file only runs on native (`useQueuePlayback.web.ts` is web's
        // own implementation — see this file's top note), so a
        // `setupTrackPlayer` failure here is a genuine native-side problem,
        // not the web/shaka-player stub this hook used to have to route
        // around. Still caught defensively rather than left to crash the
        // whole screen the first time a transport control is pressed: every
        // call below, and every `play`/`pause`/`setRate` this hook returns,
        // would otherwise throw on every subsequent interaction. Logging and
        // bailing here leaves the runner usable (steps still advance; see
        // the §9.6 note above — there's no real clip to play yet regardless).
        console.warn('setupTrackPlayer() failed; audio playback is unavailable', error);
        if (!cancelled) onEndedRef.current();
        return;
      }

      await TrackPlayer.reset();

      const resolved = tracks
        .map((track) => ({ track, url: resolveClipUrl(track.clipId, manifest) }))
        .filter(
          (entry): entry is { track: AudioQueueTrack; url: string } => entry.url !== undefined,
        );

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

  // Each call below can throw *synchronously* (not just reject) when RNTP
  // never finished `setupPlayer` — the exact state the `catch` above leaves
  // it in on a setup failure — so `void` alone does not protect the caller;
  // a transport-control tap must never crash the screen over it.
  //
  // `isTrackPlayerUnavailable()` is checked first, and short-circuits
  // silently: once setup is known to have failed, there is no new
  // information in re-attempting (and re-logging) the exact same failure on
  // every tap for the rest of the session — the try/catch below is what
  // actually protects the caller; this is just not bothering to call a
  // function already known to throw.
  const guard = (action: () => void, label: string): void => {
    if (isTrackPlayerUnavailable()) return;
    try {
      action();
    } catch (error) {
      // See the `console.warn` note above — same reasoning, same overlay.
      console.warn(`TrackPlayer.${label}() failed`, error);
    }
  };

  return {
    playing: state === State.Playing,
    position: progress.position,
    duration: progress.duration,
    play: () => {
      guard(() => void TrackPlayer.play(), 'play');
    },
    pause: () => {
      guard(() => void TrackPlayer.pause(), 'pause');
    },
    setRate: (rate) => {
      guard(() => void TrackPlayer.setRate(rate), 'setRate');
    },
  };
}
