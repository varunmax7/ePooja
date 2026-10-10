import type { AudioClip } from '@epooja/content';
import { BUNDLED_AUDIO_MANIFEST, resolveClipUrl } from '@/services/audio/manifest';

const CLIP: AudioClip = {
  id: 'chant.deeparadhana',
  path: 'audio/chant/nitya/deeparadhana.m4a',
  durationMs: 4000,
  lufs: -16,
  sha256: 'a'.repeat(64),
  kind: 'chant',
  voice: 'pandit_primary',
  humanRecorded: true,
};

describe('BUNDLED_AUDIO_MANIFEST', () => {
  it('is empty — §9.6 recording has not started yet', () => {
    expect(BUNDLED_AUDIO_MANIFEST).toEqual([]);
  });
});

describe('resolveClipUrl', () => {
  it('returns undefined for a clip id with nothing recorded', () => {
    expect(resolveClipUrl('chant.deeparadhana')).toBeUndefined();
  });

  it('returns the path once a manifest carries the clip', () => {
    expect(resolveClipUrl('chant.deeparadhana', [CLIP])).toBe('audio/chant/nitya/deeparadhana.m4a');
  });

  it('returns undefined for an id absent from a non-empty manifest', () => {
    expect(resolveClipUrl('chant.other', [CLIP])).toBeUndefined();
  });
});
