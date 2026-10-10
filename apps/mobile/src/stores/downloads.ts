import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PUJAS } from '@/services/content';
import { mmkvStorage } from '@/lib/storage';

/**
 * Puja pack download state (§9.6/§10 Phase 6: "`services/content` downloads:
 * pack manifest → download clips with checksum verification → `downloads`
 * store"; wired up for real in §10 Phase 8, now that `pack-manifest` and
 * `content_packs` exist — see `services/content/downloadManager.ts`).
 *
 * Every bundled puja starts `'bundled'` and stays that way regardless of
 * what a stale persisted blob says (§10 Phase 4's seed pack ships inside the
 * binary; it cannot un-install). `installedVersions` is the only part that
 * needs to survive a relaunch — redownloading an already-downloaded pack
 * every time the app opens would contradict offline-first (§17) the moment
 * a devotee opens the app without a connection.
 */

export type DownloadStatus = 'bundled' | 'not-downloaded' | 'downloading' | 'downloaded' | 'failed';

export const DOWNLOADS_STORAGE_KEY = 'downloads';

interface PersistedDownloads {
  statuses: Record<string, DownloadStatus>;
  installedVersions: Record<string, string>;
}

interface DownloadsState extends PersistedDownloads {
  statusFor: (pujaId: string) => DownloadStatus;
  /** True for any status that lets the Puja Runner actually start (§9.7 `preparing`). */
  isAvailableOffline: (pujaId: string) => boolean;
  markDownloading: (pujaId: string) => void;
  markDownloaded: (pujaId: string, version: string) => void;
  markFailed: (pujaId: string) => void;
}

const BUNDLED_STATUSES: Record<string, DownloadStatus> = Object.fromEntries(
  PUJAS.map((puja) => [puja.id, 'bundled' as const]),
);

export const useDownloadsStore = create<DownloadsState>()(
  persist(
    (set, get) => ({
      statuses: { ...BUNDLED_STATUSES },
      installedVersions: {},

      statusFor: (pujaId) => get().statuses[pujaId] ?? 'not-downloaded',

      isAvailableOffline: (pujaId) => {
        const status = get().statusFor(pujaId);
        return status === 'bundled' || status === 'downloaded';
      },

      markDownloading: (pujaId) => {
        set({ statuses: { ...get().statuses, [pujaId]: 'downloading' } });
      },

      markDownloaded: (pujaId, version) => {
        set({
          statuses: { ...get().statuses, [pujaId]: 'downloaded' },
          installedVersions: { ...get().installedVersions, [pujaId]: version },
        });
      },

      markFailed: (pujaId) => {
        set({ statuses: { ...get().statuses, [pujaId]: 'failed' } });
      },
    }),
    {
      name: DOWNLOADS_STORAGE_KEY,
      storage: mmkvStorage<PersistedDownloads>(),
      partialize: (state): PersistedDownloads => ({
        statuses: state.statuses,
        installedVersions: state.installedVersions,
      }),
      version: 1,
      // Bundled pujas are always 'bundled', never whatever a stale persisted
      // value says (a pack can go from downloaded-and-removed to bundled
      // again across an app update that newly bundles it).
      merge: (persisted, current) => {
        const stored = persisted as Partial<PersistedDownloads> | undefined;
        return {
          ...current,
          statuses: { ...stored?.statuses, ...BUNDLED_STATUSES },
          installedVersions: stored?.installedVersions ?? {},
        };
      },
    },
  ),
);
