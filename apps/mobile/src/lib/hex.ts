/**
 * Shared by `services/auth` (Apple's sign-in nonce) and `services/content`
 * (pack checksum verification) — both need to turn a byte digest into the
 * hex string their counterpart (Apple, or `content_packs.sha256`) expects.
 */
export function bytesToHex(bytes: Uint8Array | ArrayBuffer): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(view)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
