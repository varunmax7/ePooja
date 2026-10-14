import { useEffect, useRef, useState } from 'react';
import { createAudioPlayer, type AudioPlayer, type AudioStatus } from 'expo-audio';
import type { AudioClip } from '@epooja/content';
import { BUNDLED_AUDIO_MANIFEST, resolveClipUrl } from './manifest';
import type { AudioQueueTrack } from './queue';
import type { QueuePlayback } from './playback.types';

export type { QueuePlayback };

/**
 * **Web** implementation — `useQueuePlayback.ts`'s native counterpart loads
 * into `react-native-track-player`, but RNTP's web build pulls in
 * `shaka-player` for `setupPlayer`, and `metro.config.js` deliberately stubs
 * that import to an empty module on `platform === 'web'` (the product ships
 * natively; web exists for the Phase 1 screenshot harness, not functional
 * audio) — so RNTP is permanently, intentionally silent on web. `expo-audio`
 * is a plain `expo-audio`-already-a-dependency wrapper around the browser's
 * own `<audio>` element on web, with no such stub in its way.
 *
 * Metro resolves this file over `useQueuePlayback.ts` for any web bundle —
 * callers import `useQueuePlayback` from the `services/audio` barrel either
 * way and never see the difference.
 *
 * Same content-gap behaviour as the native file (see its own note): §9.6
 * recording has not started, so every `clipId` resolves to `undefined`
 * against `BUNDLED_AUDIO_MANIFEST`, and an unresolved queue calls `onEnded`
 * on the next tick rather than stalling.
 */
export function useQueuePlayback(
  tracks: readonly AudioQueueTrack[],
  onEnded: () => void,
  manifest: readonly AudioClip[] = BUNDLED_AUDIO_MANIFEST,
): QueuePlayback {
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  });

  const playerRef = useRef<AudioPlayer | null>(null);
  const [status, setStatus] = useState({ playing: false, position: 0, duration: 0 });

  // Tracks is a fresh array from the caller each render; compare by the
  // actual clip ids so this effect only re-runs when the queue itself
  // changes (same reasoning as the native file's identical `trackKey`).
  const trackKey = tracks.map((track) => track.clipId).join('|');

  useEffect(() => {
    let cancelled = false;
    let index = 0;

    const urls = tracks
      .map((track) => resolveClipUrl(track.clipId, manifest))
      .filter((url): url is string => url !== undefined);

    if (urls.length === 0) {
      // Same reasoning as the native file: nothing resolved, don't stall
      // the runner waiting on a clip that will never arrive.
      const id = setTimeout(() => {
        if (!cancelled) onEndedRef.current();
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(id);
      };
    }

    const player = createAudioPlayer(urls[0]);
    playerRef.current = player;

    const subscription = player.addListener('playbackStatusUpdate', (playerStatus: AudioStatus) => {
      if (cancelled) return;
      setStatus({
        playing: playerStatus.playing,
        position: playerStatus.currentTime,
        duration: playerStatus.duration,
      });

      if (!playerStatus.didJustFinish) return;

      index += 1;
      const next = urls[index];
      if (next === undefined) {
        onEndedRef.current();
        return;
      }
      player.replace(next);
      player.play();
    });

    player.play();

    return () => {
      cancelled = true;
      subscription.remove();
      player.remove();
      if (playerRef.current === player) playerRef.current = null;
    };
    // `trackKey` (not `tracks`) is the intentional dependency — see the
    // native file's identical note.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackKey, manifest]);

  return {
    playing: status.playing,
    position: status.position,
    duration: status.duration,
    play: () => {
      playerRef.current?.play();
    },
    pause: () => {
      playerRef.current?.pause();
    },
    setRate: (rate) => {
      if (playerRef.current) playerRef.current.playbackRate = rate;
    },
  };
}
