/** Angular helpers shared by every anga calculator. */

/** Normalise an angle to [0, 360). */
export function norm360(deg: number): number {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

/**
 * Signed difference `a - b` folded into (-180, 180]. Used when tracking a
 * continuously increasing angle (e.g. Moon − Sun elongation) across the 360°
 * wrap, where a raw subtraction would jump by a full turn.
 */
export function deltaAngle(a: number, b: number): number {
  let d = (a - b) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/** Milliseconds ⇄ days, the unit astronomy-engine works in. */
export const MS_PER_DAY = 86_400_000;

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/**
 * Find the instant in `[lo, hi]` at which `f` crosses zero, by bisection.
 *
 * `f` must be continuous and change sign across the bracket. Every anga
 * boundary is of this form: "the angular progress reaches N × step".
 *
 * @param toleranceMs stop once the bracket is narrower than this (§9.1: 30 s)
 */
export function bisect(f: (t: Date) => number, lo: Date, hi: Date, toleranceMs = 30_000): Date {
  let a = lo.getTime();
  let b = hi.getTime();
  let fa = f(new Date(a));

  if (fa === 0) return new Date(a);

  while (b - a > toleranceMs) {
    const mid = a + (b - a) / 2;
    const fm = f(new Date(mid));
    if (fm === 0) return new Date(mid);
    if (Math.sign(fm) === Math.sign(fa)) {
      a = mid;
      fa = fm;
    } else {
      b = mid;
    }
  }

  return new Date(a + (b - a) / 2);
}
