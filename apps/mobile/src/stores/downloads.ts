import { create } from 'zustand';
import { PUJAS } from '@/services/content';

/**
 * Puja pack download state (§9.6/§10 Phase 6: "`services/content` downloads:
 * pack manifest → download clips with checksum verification → `downloads`
 * store").
 *
 * There is no pack manifest or CDN to download from yet — Phase 8 builds the
 * backend this needs (`pack-manifest` Edge Function, `content_packs` table).
 * What exists today is the seed pack bundled into the binary (§10 Phase 4),
 * which is "downloaded" the instant the app installs. This store reflects
 * exactly that honestly rather than fabricating a progress bar for a network
 * call that cannot happen yet: every bundled puja starts `'bundled'`, and the
 * only state transition this phase implements is the one Phase 8 will
 * actually need the shape of — `markDownloading`/`markDownloaded`/`markFailed`
 * for a puja pack once there is somewhere real to fetch one from.
 */

export type DownloadStatus = 'bundled' | 'not-downloaded' | 'downloading' | 'downloaded' | 'failed';

interface DownloadsState {
  statuses: Record<string, DownloadStatus>;
  statusFor: (pujaId: string) => DownloadStatus;
  /** True for any status that lets the Puja Runner actually start (§9.7 `preparing`). */
  isAvailableOffline: (pujaId: string) => boolean;
  markDownloading: (pujaId: string) => void;
  markDownloaded: (pujaId: string) => void;
  markFailed: (pujaId: string) => void;
}

const BUNDLED_STATUSES: Record<string, DownloadStatus> = Object.fromEntries(
  PUJAS.map((puja) => [puja.id, 'bundled' as const]),
);

export const useDownloadsStore = create<DownloadsState>()((set, get) => ({
  statuses: { ...BUNDLED_STATUSES },

  statusFor: (pujaId) => get().statuses[pujaId] ?? 'not-downloaded',

  isAvailableOffline: (pujaId) => {
    const status = get().statusFor(pujaId);
    return status === 'bundled' || status === 'downloaded';
  },

  markDownloading: (pujaId) => {
    set({ statuses: { ...get().statuses, [pujaId]: 'downloading' } });
  },

  markDownloaded: (pujaId) => {
    set({ statuses: { ...get().statuses, [pujaId]: 'downloaded' } });
  },

  markFailed: (pujaId) => {
    set({ statuses: { ...get().statuses, [pujaId]: 'failed' } });
  },
}));
