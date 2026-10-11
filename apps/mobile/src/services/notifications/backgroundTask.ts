import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { useDevoteeStore } from '@/stores/devotee';
import { useNotificationsStore } from '@/stores/notifications';
import { rescheduleReminders } from './notificationService';

/**
 * Keeps the rolling 7-day reminder window advancing even on a day the
 * devotee never opens the app (§10 Phase 9 acceptance: "reminders fire at
 * the correct local time"). `useNotificationsSync` covers app-open and
 * preference changes; this covers the gap between opens.
 *
 * `defineTask` must run at module scope, before the app registers or
 * unregisters it — a background launch reconstructs the whole JS bundle
 * fresh and looks the task up by name, so if this file was never imported in
 * that launch, the OS call finds nothing to run (an acknowledged Expo
 * platform constraint, not something this module can work around; importing
 * it once from `app/_layout.tsx` is what satisfies it here).
 */
export const BACKGROUND_TASK_NAME = 'epooja-reminder-refresh';

TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    const location = useDevoteeStore.getState().devotee?.location;
    if (!location) return BackgroundTask.BackgroundTaskResult.Success;

    const enabledTimingIds = useNotificationsStore.getState().enabledIds();
    await rescheduleReminders(location, enabledTimingIds);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/** Registers the daily refresh. Safe to call every launch — re-registering is a no-op. */
export async function registerBackgroundRefresh(): Promise<void> {
  await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_NAME, {
    // Daily is the spec (§10): "rescheduled on app open and daily via
    // `expo-background-task`". The OS still treats this as a minimum, not a
    // guarantee (see the type's own doc comment).
    minimumInterval: 24 * 60,
  });
}
