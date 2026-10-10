import { bytesToHex } from '../nonce';

describe('bytesToHex', () => {
  it('encodes each byte as two lowercase hex digits', () => {
    expect(bytesToHex(new Uint8Array([0, 1, 15, 16, 255]))).toBe('00010f10ff');
  });

  it('returns an empty string for an empty array', () => {
    expect(bytesToHex(new Uint8Array([]))).toBe('');
  });
});
