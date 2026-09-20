import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage';

/**
 * App settings that are not part of the devotee's ritual record.
 *
 * Kept separate from `useDevoteeStore` so that deleting the profile (§13)
 * does not also reset the debug switches, and so the router can read
 * `debugDate` before a devotee exists.
 */

export const SETTINGS_STORAGE_KEY = 'settings';

/** The slice that reaches MMKV. */
interface PersistedSettings {
  debugDate: string | null;
}

interface SettingsState {
  /**
   * Debug date override, `yyyy-MM-dd`, used by the Phase 3 acceptance check to
   * put Today on a fixture date without touching the device clock. Dev builds
   * only — `resolveToday` ignores it in production.
   */
  debugDate: string | null;
  setDebugDate: (date: string | null) => void;
  /**
   * The date the Today screen's day-swipe (§8.2) has navigated to, or `null`
   * to track the live "today" as it rolls over at local midnight. Not
   * persisted: relaunching the app should always land back on today.
   */
  viewingDate: string | null;
  setViewingDate: (date: string | null) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      debugDate: null,
      setDebugDate: (debugDate) => {
        set({ debugDate });
      },
      viewingDate: null,
      setViewingDate: (viewingDate) => {
        set({ viewingDate });
      },
      reset: () => {
        set({ debugDate: null, viewingDate: null });
      },
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: mmkvStorage<PersistedSettings>(),
      partialize: (state): PersistedSettings => ({ debugDate: state.debugDate }),
      version: 1,
    },
  ),
);

/** `yyyy-MM-dd`, the shape `getDayPanchangam` and the debug override both use. */
export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Which day the app should show.
 *
 * The override is honoured only in a dev build: a release must never be able
 * to show a devotee the wrong day's tithi because a debug value survived in
 * storage.
 */
export function resolveToday(
  debugDate: string | null,
  now: Date,
  tz: string,
  isDev: boolean,
): string {
  if (isDev && debugDate !== null && ISO_DATE.test(debugDate)) return debugDate;
  return localDateIn(now, tz);
}

/** The local calendar date at an instant, in a given IANA zone. */
export function localDateIn(instant: Date, tz: string): string {
  // `en-CA` formats as yyyy-MM-dd, which is what the engine expects.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/** Step a `yyyy-MM-dd` by whole days, for the Today screen's date swipe. */
export function shiftDate(date: string, days: number): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}
