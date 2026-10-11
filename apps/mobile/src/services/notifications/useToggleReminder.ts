import { useCallback } from 'react';
import { useDevoteeStore } from '@/stores/devotee';
import { useNotificationsStore } from '@/stores/notifications';
import { requestPermission, rescheduleReminders } from './notificationService';

/**
 * The Today screen's bell toggle (§8.2 `TimingRow`), wired to a real
 * schedule rather than the Phase 1-3 local `useState` it used to be.
 *
 * Permission is requested here, and only here — the moment a devotee first
 * asks for a reminder, not at app launch (§10 Phase 9 doesn't ask for
 * anything an onboarding step didn't already promise). Turning a reminder
 * off never re-prompts; only turning one on, when not yet granted, does.
 */
export function useToggleReminder(): (timingId: string) => Promise<void> {
  const toggle = useNotificationsStore((s) => s.toggle);
  const location = useDevoteeStore((s) => s.devotee?.location);

  return useCallback(
    async (timingId: string) => {
      const turningOn = !useNotificationsStore.getState().isEnabled(timingId);

      if (turningOn) {
        const permission = await requestPermission();
        if (permission !== 'granted') return;
      }

      toggle(timingId);

      if (location) {
        const ids = useNotificationsStore.getState().enabledIds();
        await rescheduleReminders(location, ids);
      }
    },
    [toggle, location],
  );
}
