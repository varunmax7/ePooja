import * as Notifications from 'expo-notifications';
import type { GeoLocation } from '@epooja/panchangam';
import i18next from 'i18next';
import { buildReminderPlan, type ReminderPlanItem } from './schedulePlan';

/** How many days ahead reminders are kept scheduled (§10 Phase 9). */
export const REMINDER_WINDOW_DAYS = 7;

// A banner while the app is foregrounded is the whole point of a prayer-time
// reminder — a devotee mid-day, screen off, needs to see it, not have it
// silently logged.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export async function requestPermission(): Promise<PermissionStatus> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return 'granted';

  const result = await Notifications.requestPermissionsAsync();
  return result.granted ? 'granted' : result.canAskAgain ? 'undetermined' : 'denied';
}

function titleFor(item: ReminderPlanItem): string {
  return i18next.language === 'te' ? item.titleTe : item.titleEn;
}

/**
 * Cancels every reminder this app previously scheduled and schedules the
 * next `REMINDER_WINDOW_DAYS` days' worth from scratch.
 *
 * A full replace rather than a diff: `expo-notifications` has no concept of
 * "my app's notifications" versus any other scheduled locally, so the plan's
 * deterministic `(timingId, date)` ids are only there to make a single run
 * idempotent-looking in logs, not to support an incremental diff — the
 * window is short and the list is small enough that cancel-and-reschedule
 * is simpler than reconciling two id sets and just as cheap.
 */
export async function rescheduleReminders(
  location: GeoLocation,
  enabledTimingIds: readonly string[],
  now: Date = new Date(),
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const plan = buildReminderPlan(location, enabledTimingIds, REMINDER_WINDOW_DAYS, now);

  await Promise.all(
    plan.map((item) =>
      Notifications.scheduleNotificationAsync({
        identifier: item.id,
        content: {
          title: titleFor(item),
          // eslint-disable-next-line import/no-named-as-default-member -- see src/i18n/index.ts
          body: i18next.t('notifications:body'),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: item.notifyAt,
        },
      }),
    ),
  );
}
