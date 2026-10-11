import { buildReminderPlan } from '../schedulePlan';

const HYDERABAD = { lat: 17.385, lng: 78.4867, tz: 'Asia/Kolkata' };

describe('buildReminderPlan', () => {
  it('returns nothing when no timing is enabled', () => {
    const plan = buildReminderPlan(HYDERABAD, [], 7, new Date('2026-10-10T00:00:00Z'));
    expect(plan).toEqual([]);
  });

  it('schedules one item per enabled timing per day, for the requested span', () => {
    const now = new Date('2026-10-10T00:00:00Z');
    const plan = buildReminderPlan(HYDERABAD, ['morning', 'evening'], 7, now);

    const dates = new Set(plan.map((item) => item.date));
    expect(dates.size).toBe(7);
    for (const item of plan) {
      expect(['morning', 'evening']).toContain(item.timingId);
    }
    // Two timings × seven days, modulo whatever already elapsed today.
    expect(plan.length).toBeGreaterThanOrEqual(13);
    expect(plan.length).toBeLessThanOrEqual(14);
  });

  it('never schedules an instant that has already passed', () => {
    // Well past the Hyderabad evening window for this date.
    const now = new Date('2026-10-10T20:00:00Z');
    const plan = buildReminderPlan(HYDERABAD, ['morning', 'midday', 'evening'], 1, now);

    for (const item of plan) {
      expect(item.notifyAt.getTime()).toBeGreaterThan(now.getTime());
    }
    // Today's three windows are all behind `now`; only tomorrow is possible,
    // but the span is 1 day, so nothing today-dated survives.
    expect(plan.every((item) => item.date !== '2026-10-10')).toBe(true);
  });

  it('gives each item a stable id and the engine-matching labels', () => {
    const plan = buildReminderPlan(HYDERABAD, ['morning'], 1, new Date('2026-10-10T00:00:00Z'));

    expect(plan).toHaveLength(1);
    expect(plan[0]!.id).toBe(`morning:${plan[0]!.date}`);
    expect(plan[0]!.titleEn).toBe('Morning');
    expect(plan[0]!.titleTe).toBe('ప్రాతఃకాలం');
  });

  it('skips a day rather than throwing when the engine has no sunrise there', () => {
    // High-arctic: some days genuinely have none (§9.1 `NoSunriseError`).
    const noSunrise = { lat: 78.2232, lng: 15.6267, tz: 'Arctic/Longyearbyen' };
    expect(() =>
      buildReminderPlan(noSunrise, ['morning'], 30, new Date('2026-12-10T00:00:00Z')),
    ).not.toThrow();
  });
});
