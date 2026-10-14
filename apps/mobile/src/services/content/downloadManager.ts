import { Directory, File, Paths } from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { bytesToHex } from '@/lib/hex';
import { useDownloadsStore } from '@/stores/downloads';
import { fetchPackManifest, type PackManifestEntry } from './packManifest';

/**
 * §10 Phase 8: "pack manifest → download clips with checksum verification →
 * `downloads` store." Only `pack.json` is downloaded here — the clips
 * themselves aren't part of any manifest yet (every audio-manifest.json
 * `tools/content-build` emits is still `clips: []`, §9.6 recording hasn't
 * started), so there is nothing beyond the pack JSON for this phase to
 * actually move bytes for. The shape is real; there's just nothing audio to
 * exercise it with yet (same gap Phases 6 and 7 both recorded).
 */

/**
 * Built lazily rather than at module scope: `expo-file-system`'s web shim
 * throws constructing a `Directory` at all (`this.validatePath is not a
 * function`) — fine, since downloads are native-only anyway (there's
 * nothing to download yet regardless, per the note above), but a top-level
 * `new Directory(...)` would crash on *import*, taking down every screen
 * that pulls in this module's barrel (`services/content`), not just the
 * download path.
 */
function packsDir(): Directory {
  return new Directory(Paths.document, 'packs');
}

/**
 * Which remote packs are worth fetching: present in the manifest and either
 * missing locally or at an older version. Pure — no filesystem, no network —
 * so the "what's stale" decision is tested without mocking either.
 */
export function packsNeedingUpdate(
  manifestPacks: readonly PackManifestEntry[],
  installedVersions: Readonly<Record<string, string>>,
): PackManifestEntry[] {
  return manifestPacks.filter((pack) => installedVersions[pack.id] !== pack.version);
}

/** Pulls the manifest and reports what's stale, without downloading anything. */
export async function checkForUpdates(): Promise<PackManifestEntry[]> {
  const manifest = await fetchPackManifest();
  if (!manifest) return [];
  return packsNeedingUpdate(manifest.packs, useDownloadsStore.getState().installedVersions);
}

/**
 * Downloads one pack's `pack.json`, verifies it against the manifest's
 * `sha256` before trusting it, and updates `useDownloadsStore`. A checksum
 * mismatch deletes the downloaded file rather than leaving a corrupt pack
 * marked installed — the one thing worse than "not downloaded" is "marked
 * downloaded but wrong."
 */
export async function downloadPack(entry: PackManifestEntry): Promise<boolean> {
  const { markDownloading, markDownloaded, markFailed } = useDownloadsStore.getState();
  markDownloading(entry.id);

  try {
    const packs = packsDir();
    if (!packs.exists) packs.create({ intermediates: true });

    const packDir = new Directory(packs, `${entry.id}@${entry.version}`);
    if (!packDir.exists) packDir.create({ intermediates: true });

    const file = await File.downloadFileAsync(entry.manifestUrl, packDir, { idempotent: true });
    const bytes = await file.arrayBuffer();
    const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes);

    if (bytesToHex(digest) !== entry.sha256) {
      file.delete();
      markFailed(entry.id);
      return false;
    }

    markDownloaded(entry.id, entry.version);
    return true;
  } catch (error) {
    console.error(`downloadPack(${entry.id}) failed`, error);
    markFailed(entry.id);
    return false;
  }
}
