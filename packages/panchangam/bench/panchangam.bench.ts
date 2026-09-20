/**
 * Panchangam benchmark harness (§10 Phase 2: "Benchmarks in Vitest (bench)").
 *
 * Vitest 5 no longer exports a `bench` API, so this is a plain measurement
 * script run with `pnpm bench` — see ADR 0002 for the deviation. The budget it
 * enforces is the one §9.1 sets: `getPanchangam(day)` under 20 ms on a
 * mid-range Android, with Node as the proxy until Phase 3 re-checks on device.
 */
import {
  angaAt,
  clearPanchangamCache,
  findTransitions,
  getDayPanchangam,
  getMonth,
  getPanchangam,
  lunarMonthAt,
  samvatsaraAt,
} from '../src/index';

const HYDERABAD = { lat: 17.385, lng: 78.4867, tz: 'Asia/Kolkata' };
const INSTANT = new Date('2026-09-19T06:00:00Z');

/** §9.1 budget, halved: Node should be comfortably faster than a phone. */
const BUDGET_MS = 10;

interface Result {
  name: string;
  meanMs: number;
  p95Ms: number;
  budgeted: boolean;
}

function measure(name: string, runs: number, fn: () => void, budgeted = false): Result {
  for (let i = 0; i < Math.min(runs, 20); i += 1) fn(); // warm up

  const samples: number[] = [];
  for (let i = 0; i < runs; i += 1) {
    const start = performance.now();
    fn();
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);

  return {
    name,
    meanMs: samples.reduce((a, b) => a + b, 0) / samples.length,
    p95Ms: samples[Math.floor(samples.length * 0.95)] ?? 0,
    budgeted,
  };
}

const results: Result[] = [
  measure(
    'getPanchangam (cold)',
    200,
    () => {
      getPanchangam({ ...HYDERABAD, instant: INSTANT });
    },
    true,
  ),
  measure(
    'getDayPanchangam (cold)',
    200,
    () => {
      clearPanchangamCache();
      getDayPanchangam('2026-09-19', HYDERABAD);
    },
    true,
  ),
  measure('getDayPanchangam (memoized)', 2000, () => {
    getDayPanchangam('2026-09-19', HYDERABAD);
  }),
  measure('angaAt tithi', 500, () => {
    angaAt('tithi', INSTANT);
  }),
  measure('angaAt nakshatra', 500, () => {
    angaAt('nakshatra', INSTANT);
  }),
  measure('lunarMonthAt', 500, () => {
    lunarMonthAt(INSTANT);
  }),
  measure('samvatsaraAt', 200, () => {
    samvatsaraAt(INSTANT);
  }),
  measure('findTransitions tithi, one week', 100, () => {
    findTransitions('tithi', INSTANT, new Date('2026-09-26T06:00:00Z'));
  }),
  measure('getMonth, 30 days cold', 20, () => {
    clearPanchangamCache();
    getMonth(2026, 9, HYDERABAD);
  }),
];

const pad = (s: string, n: number): string => s.padEnd(n);
console.log(`\n${pad('benchmark', 34)}${pad('mean', 12)}${pad('p95', 12)}budget`);
console.log('-'.repeat(70));
for (const r of results) {
  console.log(
    pad(r.name, 34) +
      pad(`${r.meanMs.toFixed(3)} ms`, 12) +
      pad(`${r.p95Ms.toFixed(3)} ms`, 12) +
      (r.budgeted ? `${BUDGET_MS} ms` : '—'),
  );
}

const over = results.filter((r) => r.budgeted && r.p95Ms > BUDGET_MS);
if (over.length > 0) {
  console.error(`\n✗ over budget: ${over.map((r) => r.name).join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`\n✓ all budgeted paths under ${BUDGET_MS} ms at p95`);
}
