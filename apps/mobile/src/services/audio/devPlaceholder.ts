import type { AudioClip, AudioClipKind } from '@epooja/content';
import type { AudioQueueTrack } from './queue';

/**
 * A short (≈2.9s), non-speech chime — not a mantra, not a voice, not anyone
 * reciting anything. CC0 1.0 Universal, Wikimedia Commons, "Airplane Chime
 * Sound Effect.ogg" (uploaded by Sharelk):
 * https://commons.wikimedia.org/wiki/File:Airplane_Chime_Sound_Effect.ogg
 *
 * Exists so the Puja Runner's transport controls (play/pause, progress,
 * auto-advance) can be exercised against *something* while §9.6 recording
 * hasn't started — `BUNDLED_AUDIO_MANIFEST` stays genuinely empty (that's
 * load-bearing: `manifest.test.ts` pins it), and this never substitutes for
 * ritual content. Every entry this produces is tagged `voice:
 * 'dev_placeholder'` / `humanRecorded: false`, which `isProductionSafe`
 * (`@epooja/content`) refuses unconditionally — and the one call site
 * (`app/player/[slug].tsx`) gates it behind `__DEV__` besides.
 */
const DEV_CHIME_URL =
  'https://upload.wikimedia.org/wikipedia/commons/c/ce/Airplane_Chime_Sound_Effect.ogg';
const DEV_CHIME_SHA256 = 'cce5b73c814b7f8c501d0370ce27995c28fe2e6c2bed06547208cba00f285c2';
const DEV_CHIME_DURATION_MS = 2934;

/**
 * `__DEV__` alone is true in Jest too, and the unit/screen tests rely on an
 * unresolved queue ending a step immediately (no real clip ⇒ `onEnded` on
 * the next tick) to drive their assertions deterministically — the chime
 * resolving instead would leave them waiting on a `PlaybackQueueEnded` event
 * their mocked `TrackPlayer` never fires. `NODE_ENV !== 'test'` (Jest's own
 * default, unset here) keeps this out of every test run while still
 * enabling it for an actual `expo start` dev session.
 */
export const DEV_PLACEHOLDER_AUDIO_ENABLED = __DEV__ && process.env.NODE_ENV !== 'test';

function clipKindFor(trackKind: AudioQueueTrack['kind']): AudioClipKind {
  if (trackKind === 'instruction') return 'instruction';
  if (trackKind === 'sankalpam') return 'sankalpam_fixed';
  return 'chant';
}

/**
 * One dev-placeholder `AudioClip` per distinct clip id a queue actually
 * asks for, all pointing at the same chime — so `resolveClipUrl` resolves
 * every track the current step happens to have, whatever its real
 * (unrecorded) `audioId` is, without needing to know that id ahead of time.
 */
export function devPlaceholderManifestFor(tracks: readonly AudioQueueTrack[]): AudioClip[] {
  const seen = new Map<string, AudioClip>();

  for (const track of tracks) {
    if (seen.has(track.clipId)) continue;
    seen.set(track.clipId, {
      id: track.clipId,
      path: DEV_CHIME_URL,
      durationMs: DEV_CHIME_DURATION_MS,
      lufs: -16,
      sha256: DEV_CHIME_SHA256,
      kind: clipKindFor(track.kind),
      voice: 'dev_placeholder',
      humanRecorded: false,
    });
  }

  return Array.from(seen.values());
}
