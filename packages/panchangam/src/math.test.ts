import { describe, expect, it } from 'vitest';
import { addDays, bisect, deltaAngle, norm360 } from './math.js';

describe('norm360', () => {
  it.each([
    [0, 0],
    [359.9, 359.9],
    [360, 0],
    [361, 1],
    [-1, 359],
    [-721, 359],
  ])('normalises %s to %s', (input, expected) => {
    expect(norm360(input)).toBeCloseTo(expected, 9);
  });
});

describe('deltaAngle', () => {
  it('returns a small positive difference just past a target', () => {
    expect(deltaAngle(1, 359)).toBeCloseTo(2, 9);
  });

  it('returns a small negative difference just before a target', () => {
    expect(deltaAngle(359, 1)).toBeCloseTo(-2, 9);
  });

  it('folds into (-180, 180]', () => {
    expect(deltaAngle(180, 0)).toBeCloseTo(180, 9);
    expect(deltaAngle(181, 0)).toBeCloseTo(-179, 9);
  });
});

describe('bisect', () => {
  const epoch = new Date('2026-01-01T00:00:00Z');

  it('finds a crossing to within the tolerance', () => {
    const target = addDays(epoch, 0.5);
    const f = (t: Date): number => t.getTime() - target.getTime();
    const found = bisect(f, epoch, addDays(epoch, 1));
    expect(Math.abs(found.getTime() - target.getTime())).toBeLessThanOrEqual(30_000);
  });

  it('returns the lower bound when it is already the root', () => {
    const f = (t: Date): number => t.getTime() - epoch.getTime();
    expect(bisect(f, epoch, addDays(epoch, 1)).toISOString()).toBe(epoch.toISOString());
  });

  it('honours a tighter tolerance', () => {
    const target = addDays(epoch, 0.25);
    const f = (t: Date): number => t.getTime() - target.getTime();
    const found = bisect(f, epoch, addDays(epoch, 1), 1000);
    expect(Math.abs(found.getTime() - target.getTime())).toBeLessThanOrEqual(1000);
  });
});
