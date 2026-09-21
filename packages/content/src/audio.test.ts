import { describe, expect, it } from 'vitest';
import { audioClipSchema, isProductionSafe } from './audio';

const base = {
  id: 'chant.deeparadhana',
  path: 'chant.deeparadhana.m4a',
  durationMs: 4200,
  lufs: -16,
  sha256: 'a'.repeat(64),
  kind: 'chant' as const,
  voice: 'pandit_primary' as const,
  humanRecorded: true,
};

describe('audioClipSchema', () => {
  it('parses a well-formed clip', () => {
    expect(audioClipSchema.parse(base)).toMatchObject({ id: 'chant.deeparadhana' });
  });

  it('rejects a sha256 that is not 64 hex characters', () => {
    expect(() => audioClipSchema.parse({ ...base, sha256: 'not-a-hash' })).toThrow();
  });

  it('rejects a non-negative lufs value', () => {
    expect(() => audioClipSchema.parse({ ...base, lufs: 3 })).toThrow();
  });

  it('rejects a dev_placeholder voice claiming to be human-recorded', () => {
    expect(() =>
      audioClipSchema.parse({ ...base, voice: 'dev_placeholder', humanRecorded: true }),
    ).toThrow(/dev_placeholder/);
  });

  it('allows a dev_placeholder voice that admits it is not human-recorded', () => {
    expect(() =>
      audioClipSchema.parse({ ...base, voice: 'dev_placeholder', humanRecorded: false }),
    ).not.toThrow();
  });
});

describe('isProductionSafe (§9.6.1, non-negotiable)', () => {
  it('is safe for a human-recorded pandit clip', () => {
    expect(isProductionSafe(audioClipSchema.parse(base))).toBe(true);
  });

  it('is never safe for a dev placeholder, however it is otherwise flagged', () => {
    const placeholder = audioClipSchema.parse({
      ...base,
      voice: 'dev_placeholder',
      humanRecorded: false,
    });
    expect(isProductionSafe(placeholder)).toBe(false);
  });

  it('is not safe for a clip that is not marked human-recorded, even from a real voice', () => {
    const unconfirmed = audioClipSchema.parse({ ...base, humanRecorded: false });
    expect(isProductionSafe(unconfirmed)).toBe(false);
  });
});
