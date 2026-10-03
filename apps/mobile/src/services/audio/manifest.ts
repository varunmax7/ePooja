import type { AudioClip } from '@epooja/content';

/**
 * The bundled seed pack's audio clips (§9.6).
 *
 * Empty today: `content/audio/` is nothing but a `.gitkeep` — recording has
 * not started (Phase 4 and Phase 5 already noted this; §10 Phase 10's voice
 * gate is where it finally must not be). Every other piece of this phase's
 * audio plumbing (`queue.ts`, `useQueuePlayback`) is written against the
 * `AudioClip[]` shape, so swapping this constant for a real manifest once
 * Phase 7/8 have one to load needs no change anywhere else.
 */
export const BUNDLED_AUDIO_MANIFEST: readonly AudioClip[] = [];

/** A clip id's playable path, or `undefined` if nothing has been recorded for it yet. */
export function resolveClipUrl(
  clipId: string,
  manifest: readonly AudioClip[] = BUNDLED_AUDIO_MANIFEST,
): string | undefined {
  return manifest.find((clip) => clip.id === clipId)?.path;
}
