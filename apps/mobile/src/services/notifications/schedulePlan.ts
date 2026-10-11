import { getDayPanchangam, NoSunriseError, type GeoLocation } from '@epooja/panchangam';
import { shiftDate, localDateIn } from '@/stores/settings';
import { TIMINGS } from '@/services/panchangam';

/**
 * One prayer-timing reminder to schedule, for one future day (§10 Phase 9:
 * "Local reminders for prayer timings (next 7 days)...").
 *
 * `id` is stable and deterministic from `(timingId, date)` alone, not a
 * random uuid — `notificationService.rescheduleReminders` diffs against it
 * so a reschedule after a location change cancels and re-creates only what
 * actually moved, rather than every pending notification.
 */
export interface ReminderPlanItem {
  id: string;
  timingId: string;
  /** `yyyy-MM-dd`, in the location's own timezone. */
  date: string;
  /** The instant the prayer window starts — same as the Today screen's bell row. */
  notifyAt: Date;
  titleEn: string;
  titleTe: string;
}

function labelFor(timingId: string): { en: string; te: string } {
  const timing = TIMINGS.timings.find((t) => t.id === timingId);
  return { en: timing?.en ?? timingId, te: timing?.te ?? timingId };
}

/**
 * The next `days` days' worth of enabled prayer-timing reminders for a
 * location, computed from the same `@epooja/panchangam` engine the Today
 * screen reads (§9.1) — so a reminder always fires at the instant the
 * screen's own bell row shows, never a separately-maintained approximation.
 *
 * Pure and synchronous: no `expo-notifications`, no device clock read beyond
 * the `now` passed in. `notificationService.ts` is the only caller that
 * touches the OS scheduler; this is the part a test can check without one.
 */
export function buildReminderPlan(
  location: GeoLocation,
  enabledTimingIds: readonly string[],
  days: number,
  now: Date,
): ReminderPlanItem[] {
  if (enabledTimingIds.length === 0) return [];

  const startDate = localDateIn(now, location.tz);
  const items: ReminderPlanItem[] = [];

  for (let i = 0; i < days; i += 1) {
    const date = shiftDate(startDate, i);

    let panchangam;
    try {
      panchangam = getDayPanchangam(date, location, { basis: 'sunrise' });
    } catch (error) {
      // Extreme-latitude locations can have a sunless day (§9.1 `NoSunriseError`);
      // skip just that date rather than losing the whole week's reminders.
      if (error instanceof NoSunriseError) continue;
      throw error;
    }

    for (const timing of panchangam.prayerTimings) {
      if (!enabledTimingIds.includes(timing.id)) continue;

      const notifyAt = new Date(timing.start);
      if (notifyAt.getTime() <= now.getTime()) continue;

      const label = labelFor(timing.id);
      items.push({
        id: `${timing.id}:${date}`,
        timingId: timing.id,
        date,
        notifyAt,
        titleEn: label.en,
        titleTe: label.te,
      });
    }
  }

  return items;
}
