import type { PackManifestEntry } from '@/services/content/packManifest';
import { packsNeedingUpdate } from '@/services/content/downloadManager';

function entry(id: string, version: string): PackManifestEntry {
  return {
    id,
    version,
    manifestUrl: `https://example.supabase.co/${id}@${version}/pack.json`,
    sizeBytes: 1024,
    sha256: 'deadbeef',
    publishedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('packsNeedingUpdate', () => {
  it('includes a pack with nothing installed yet', () => {
    const manifest = [entry('nitya-puja', '0.1.0')];
    expect(packsNeedingUpdate(manifest, {})).toEqual(manifest);
  });

  it('includes a pack whose installed version is older', () => {
    const manifest = [entry('nitya-puja', '0.2.0')];
    expect(packsNeedingUpdate(manifest, { 'nitya-puja': '0.1.0' })).toEqual(manifest);
  });

  it('excludes a pack already installed at the manifest version', () => {
    const manifest = [entry('nitya-puja', '0.1.0')];
    expect(packsNeedingUpdate(manifest, { 'nitya-puja': '0.1.0' })).toEqual([]);
  });

  it('only reports the packs that actually changed, out of several', () => {
    const manifest = [entry('nitya-puja', '0.1.0'), entry('ganapathi-puja', '0.3.0')];
    const result = packsNeedingUpdate(manifest, {
      'nitya-puja': '0.1.0',
      'ganapathi-puja': '0.2.0',
    });
    expect(result).toEqual([entry('ganapathi-puja', '0.3.0')]);
  });
});
