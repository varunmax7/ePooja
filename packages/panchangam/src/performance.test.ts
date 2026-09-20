import { describe, expect, it } from 'vitest';
import { clearPanchangamCache, getDayPanchangam, getMonth, getPanchangam } from './panchangam';

/**
 * §9.1 sets a 20 ms budget for a day's Panchangam on a mid-range Android, and
 * §10 Phase 2 accepts a Node measurement as the proxy. These are deliberately
 * loose — they exist to catch an order-of-magnitude regression (an accidental
 * extra search, a lost memo), not to police microseconds. `pnpm bench` prints
 * the real numbers.
 */
const HYDERABAD = { lat: 17.385, lng: 78.4867, tz: 'Asia/Kolkata' };
const NODE_BUDGET_MS = 20;

function timeOf(fn: () => void, runs: number): number {
  fn(); // warm up
  const start = performance.now();
  for (let i = 0; i < runs; i += 1) fn();
  return (performance.now() - start) / runs;
}

describe('performance', () => {
  it('computes a full day well inside the 20 ms budget', () => {
    const mean = timeOf(() => {
      getPanchangam({ ...HYDERABAD, instant: new Date('2026-09-19T06:00:00Z') });
    }, 50);
    expect(mean).toBeLessThan(NODE_BUDGET_MS);
  });

  it('computes a cold getDayPanchangam inside the budget', () => {
    const mean = timeOf(() => {
      clearPanchangamCache();
      getDayPanchangam('2026-09-19', HYDERABAD);
    }, 50);
    expect(mean).toBeLessThan(NODE_BUDGET_MS);
  });

  it('serves a memoized day far faster than a cold one', () => {
    clearPanchangamCache();
    getDayPanchangam('2026-09-19', HYDERABAD);
    const memoized = timeOf(() => {
      getDayPanchangam('2026-09-19', HYDERABAD);
    }, 1000);
    expect(memoized).toBeLessThan(0.05);
  });

  it('builds a calendar month in well under a second', () => {
    clearPanchangamCache();
    const start = performance.now();
    getMonth(2026, 9, HYDERABAD);
    expect(performance.now() - start).toBeLessThan(1000);
  });
});
