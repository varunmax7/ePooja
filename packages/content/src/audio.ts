import { z } from 'zod';

/**
 * Schema for one entry in a pack's audio manifest (§9.4 `AudioClip`).
 *
 * Nothing in this repo has recorded audio yet (§9.6 starts in Phase 6), so
 * `tools/content-build` emits an empty manifest for now — this schema exists
 * so that manifest has a validated shape from day one rather than growing one
 * ad hoc once real clips exist.
 */
export const AUDIO_CLIP_KINDS = [
  'chant',
  'instruction',
  'sankalpam_fixed',
  'sankalpam_token',
  'name_clone',
] as const;
export type AudioClipKind = (typeof AUDIO_CLIP_KINDS)[number];

export const AUDIO_VOICES = [
  'pandit_primary',
  'narrator_te',
  'pandit_clone',
  'dev_placeholder',
] as const;
export type AudioVoice = (typeof AUDIO_VOICES)[number];

export const audioClipSchema = z
  .object({
    id: z.string().min(1),
    path: z.string().min(1),
    durationMs: z.number().int().positive(),
    /** Loudness, LUFS — negative by convention (e.g. -16). */
    lufs: z.number().negative(),
    sha256: z.string().regex(/^[0-9a-f]{64}$/, 'sha256 must be 64 lowercase hex characters'),
    kind: z.enum(AUDIO_CLIP_KINDS),
    voice: z.enum(AUDIO_VOICES),
    /** §9.6.1: every production chant/instruction/sankalpam clip must be true. */
    humanRecorded: z.boolean(),
  })
  .refine((clip) => clip.voice !== 'dev_placeholder' || !clip.humanRecorded, {
    message: 'a dev_placeholder clip cannot also claim to be human-recorded',
    path: ['humanRecorded'],
  });

export type AudioClip = z.infer<typeof audioClipSchema>;

/**
 * §9.6.1, non-negotiable: a `dev_placeholder` voice must never reach a
 * production build. `tools/content-build` calls this on every manifest it
 * emits.
 */
export function isProductionSafe(clip: AudioClip): boolean {
  return clip.voice !== 'dev_placeholder' && clip.humanRecorded;
}
