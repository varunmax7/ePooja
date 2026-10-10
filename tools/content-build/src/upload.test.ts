import { describe, expect, it } from 'vitest';
import { parseUploadArgs } from './upload';

describe('parseUploadArgs', () => {
  it('defaults to no upload and the production channel', () => {
    expect(parseUploadArgs([])).toEqual({ upload: false, channel: 'production' });
  });

  it('turns on upload for --upload', () => {
    expect(parseUploadArgs(['--upload'])).toEqual({ upload: true, channel: 'production' });
  });

  it('reads the channel after --channel', () => {
    expect(parseUploadArgs(['--upload', '--channel', 'preview'])).toEqual({
      upload: true,
      channel: 'preview',
    });
  });

  it('rejects an unknown channel rather than silently defaulting', () => {
    expect(() => parseUploadArgs(['--channel', 'staging'])).toThrow(/preview.*production/);
  });
});
