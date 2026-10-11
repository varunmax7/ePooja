import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage';

/**
 * Which prayer-timing reminders (§8.2 `TimingRow` bell toggles) a devotee has
 * turned on, persisted independently of the devotee record itself — the
 * reminder preference survives "delete my account" and sign-out the same way
 * `useSettingsStore`'s debug switches do, since it is a device preference,
 * not a ritual fact about the devotee.
 */

export const NOTIFICATIONS_STORAGE_KEY = 'notifications';

interface PersistedNotifications {
  enabledTimingIds: Record<string, boolean>;
}

interface NotificationsState extends PersistedNotifications {
  isEnabled: (timingId: string) => boolean;
  toggle: (timingId: string) => void;
  /** All ids currently on, for `schedulePlan.buildReminderPlan`. */
  enabledIds: () => string[];
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      enabledTimingIds: {},
      isEnabled: (timingId) => get().enabledTimingIds[timingId] === true,
      toggle: (timingId) => {
        set((state) => ({
          enabledTimingIds: {
            ...state.enabledTimingIds,
            [timingId]: !state.enabledTimingIds[timingId],
          },
        }));
      },
      enabledIds: () =>
        Object.entries(get().enabledTimingIds)
          .filter(([, enabled]) => enabled)
          .map(([id]) => id),
    }),
    {
      name: NOTIFICATIONS_STORAGE_KEY,
      storage: mmkvStorage<PersistedNotifications>(),
      partialize: (state): PersistedNotifications => ({
        enabledTimingIds: state.enabledTimingIds,
      }),
      version: 1,
    },
  ),
);
