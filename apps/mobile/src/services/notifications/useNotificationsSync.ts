import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useDevoteeStore } from '@/stores/devotee';
import { useNotificationsStore } from '@/stores/notifications';
import { rescheduleReminders } from './notificationService';
import { registerBackgroundRefresh } from './backgroundTask';

/**
 * Keeps the OS's scheduled reminders in step with the devotee's location,
 * which prayer timings are toggled on, and the UI language the notification
 * text itself is baked in at schedule time (§10 Phase 9 acceptance:
 * "reminders fire at the correct local time after a location change").
 *
 * Mounted once, at the root (`app/_layout.tsx`), the same way `useAuthSync`
 * and `useSyncLanguage` are. Does not request notification permission —
 * that only happens when a devotee actively turns a reminder on
 * (`useToggleReminder`); this hook only re-syncs what is already permitted,
 * so a devotee who has never touched a bell icon is never prompted.
 */
export function useNotificationsSync(): void {
  const location = useDevoteeStore((s) => s.devotee?.location);
  const uiLang = useDevoteeStore((s) => s.devotee?.prefs.uiLang);
  const enabledTimingIds = useNotificationsStore((s) => s.enabledTimingIds);

  useEffect(() => {
    // expo-background-task has no JS fallback in every dev-client / simulator
    // combination; a devotee who never reopens the app for a week is a real
    // but secondary gap next to "reminders work at all while using the app".
    registerBackgroundRefresh().catch(() => {});
  }, []);

  useEffect(() => {
    const ids = Object.entries(enabledTimingIds)
      .filter(([, enabled]) => enabled)
      .map(([id]) => id);

    if (!location || ids.length === 0) {
      Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
      return;
    }

    Notifications.getPermissionsAsync()
      .then((permission) => (permission.granted ? rescheduleReminders(location, ids) : undefined))
      .catch(() => {});
    // `uiLang` is read only to retrigger this on a language change — the
    // notification text itself comes from `i18next.language` inside
    // `notificationService.rescheduleReminders`, which `useSyncLanguage`
    // (mounted alongside this hook) keeps in step with the same preference.
  }, [location, enabledTimingIds, uiLang]);
}
