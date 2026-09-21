import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getDayPanchangam } from '@epooja/panchangam';
import { toFullPanchangamView, toTodayView } from '@/services/panchangam/viewModel';
import { formatCalendarDate } from '@/lib/dateFormat';
import { resolveToday } from '@/stores/settings';

/**
 * §10 Phase 3 acceptance: "Today shows correct values for Hyderabad on 3
 * fixture dates (use a debug date override)."
 *
 * The engine's own correctness is Phase 2's job — 292 tests there, checked
 * against `packages/panchangam/test/fixtures/verified.json`. What this
 * exercises is everything Phase 3 put on top of it: the debug-date override
 * actually reaching the query, the view model reading the right anga off the
 * right day, and the dial's weekday/date parts agreeing with what the engine
 * computed — using the same verified fixtures as the source of truth, rather
 * than a second hand-derived set of expectations that could drift from them.
 */

const HYDERABAD = { lat: 17.385, lng: 78.4867, tz: 'Asia/Kolkata' };

interface VerifiedFixture {
  id: string;
  date: string;
  place: { label: string };
  expect: {
    masa?: { id: string; adhika: boolean };
    vasara?: { id: string; weekday: number };
  };
}

// Jest transpiles to CommonJS, where `__dirname` is available but
// `import.meta.dirname` (an ESM-only feature) is not.
const FIXTURES_PATH = join(
  __dirname,
  '../../../../../../packages/panchangam/test/fixtures/verified.json',
);
const ALL_FIXTURES = (
  JSON.parse(readFileSync(FIXTURES_PATH, 'utf8')) as { fixtures: VerifiedFixture[] }
).fixtures;

function fixture(id: string): VerifiedFixture {
  const found = ALL_FIXTURES.find((f) => f.id === id);
  if (!found) throw new Error(`No fixture named ${id} in verified.json`);
  return found;
}

// Three fixture dates, each exercising something different: an ordinary day,
// Ugadi (a masa/samvatsara boundary), and a day inside an adhika month.
const CASES = [
  { fixtureId: 'verified-vasara-saturday', weekdayName: 'Saturday' },
  { fixtureId: 'verified-vasara-ugadi-2024', weekdayName: 'Tuesday' },
  { fixtureId: 'verified-adhika-shravana-middle', weekdayName: 'Tuesday' },
] as const;

describe('Today, for Hyderabad, on the three §10 Phase 3 fixture dates', () => {
  it.each(CASES)('$fixtureId ($date)', ({ fixtureId, weekdayName }) => {
    const fx = fixture(fixtureId);
    expect(fx.place.label).toBe('Hyderabad');

    // What a debug-date override handed to the query layer resolves to —
    // exactly the string `usePanchangam`'s query key and `getDayPanchangam`
    // both key off.
    const resolvedDate = resolveToday(fx.date, new Date('2099-01-01'), HYDERABAD.tz, true);
    expect(resolvedDate).toBe(fx.date);

    const data = getDayPanchangam(resolvedDate, HYDERABAD, { basis: 'sunrise' });
    const today = toTodayView(data, 'te');
    const full = toFullPanchangamView(data, 'te');

    // The four Today badges are non-empty and in the devotee's script.
    for (const badge of [today.tithi, today.nakshatra, today.ritu, today.masa]) {
      expect(badge.value.length).toBeGreaterThan(0);
    }

    if (fx.expect.masa) {
      expect(data.masa.id).toBe(fx.expect.masa.id);
      expect(data.masa.adhika).toBe(fx.expect.masa.adhika);
      expect(full.adhika).toBe(fx.expect.masa.adhika);
    }

    if (fx.expect.vasara) {
      expect(data.vasara.id).toBe(fx.expect.vasara.id);
      expect(data.vasara.weekday).toBe(fx.expect.vasara.weekday);
    }

    // The dial reads the calendar date directly, not the engine's vasara —
    // this confirms the two still agree, i.e. nothing shifted the "which
    // day" the screen is showing relative to what the angas describe.
    expect(formatCalendarDate(resolvedDate).weekday).toBe(weekdayName);

    // Sun times and the prayer schedule render as clock times regardless of
    // which of the three dates this is.
    expect(today.sunrise).toMatch(/^\d{2}:\d{2}$/);
    expect(today.sunset).toMatch(/^\d{2}:\d{2}$/);
    expect(today.prayerTimings).toHaveLength(3);
  });

  it('ignores the debug override in a release build (§10: never in production)', () => {
    const fx = fixture('verified-vasara-saturday');
    const liveNow = new Date('2026-01-15T06:00:00Z'); // 11:30 IST
    const resolved = resolveToday(fx.date, liveNow, HYDERABAD.tz, false);
    expect(resolved).not.toBe(fx.date);
    expect(resolved).toBe('2026-01-15');
  });
});
