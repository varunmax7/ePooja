import { isProductionSafe } from '@epooja/content';
import { devPlaceholderManifestFor } from '@/services/audio/devPlaceholder';
import type { AudioQueueTrack } from '@/services/audio/queue';
import { resolveClipUrl } from '@/services/audio/manifest';

describe('devPlaceholderManifestFor', () => {
  it('produces one entry per distinct clip id, resolvable by resolveClipUrl', () => {
    const tracks: AudioQueueTrack[] = [
      { id: 'chant', kind: 'chant', clipId: 'deeparadhana_shloka_line_1' },
      { id: 'instruction', kind: 'instruction', clipId: 'deeparadhana_instruction' },
    ];
    const manifest = devPlaceholderManifestFor(tracks);

    expect(manifest).toHaveLength(2);
    expect(resolveClipUrl('deeparadhana_shloka_line_1', manifest)).toBeDefined();
    expect(resolveClipUrl('deeparadhana_instruction', manifest)).toBeDefined();
  });

  it('dedupes repeated clip ids (e.g. a sankalpam queue reusing a segment)', () => {
    const tracks: AudioQueueTrack[] = [
      { id: 'seg1', kind: 'sankalpam', clipId: 'shared_clip' },
      { id: 'seg2', kind: 'sankalpam', clipId: 'shared_clip' },
    ];
    expect(devPlaceholderManifestFor(tracks)).toHaveLength(1);
  });

  it('returns nothing for an empty queue', () => {
    expect(devPlaceholderManifestFor([])).toEqual([]);
  });

  it('never produces a clip isProductionSafe would accept', () => {
    const tracks: AudioQueueTrack[] = [
      { id: 'chant', kind: 'chant', clipId: 'a' },
      { id: 'instruction', kind: 'instruction', clipId: 'b' },
      { id: 'seg', kind: 'sankalpam', clipId: 'c' },
    ];
    for (const clip of devPlaceholderManifestFor(tracks)) {
      expect(isProductionSafe(clip)).toBe(false);
      expect(clip.voice).toBe('dev_placeholder');
      expect(clip.humanRecorded).toBe(false);
    }
  });
});
