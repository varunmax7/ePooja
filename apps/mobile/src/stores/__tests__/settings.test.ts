import { ISO_DATE, localDateIn, resolveToday, shiftDate } from '@/stores/settings';

describe('resolveToday', () => {
  const now = new Date('2026-09-21T02:30:00Z');

  it("uses the device clock in the devotee's own timezone", () => {
    // 02:30 UTC is already the 21st in Hyderabad and still the 20th in Dallas.
    expect(resolveToday(null, now, 'Asia/Kolkata', true)).toBe('2026-09-21');
    expect(resolveToday(null, now, 'America/Chicago', true)).toBe('2026-09-20');
  });

  it('honours the debug override in a dev build', () => {
    expect(resolveToday('2024-07-17', now, 'Asia/Kolkata', true)).toBe('2024-07-17');
  });

  it('ignores the override in a release build, whatever is in storage', () => {
    expect(resolveToday('2024-07-17', now, 'Asia/Kolkata', false)).toBe('2026-09-21');
  });

  it('ignores a malformed override rather than showing the wrong day', () => {
    expect(resolveToday('17 July 2024', now, 'Asia/Kolkata', true)).toBe('2026-09-21');
    expect(ISO_DATE.test('2024-07-17')).toBe(true);
    expect(ISO_DATE.test('2024-7-17')).toBe(false);
  });
});

describe('localDateIn', () => {
  it('rolls over at local midnight, not UTC midnight', () => {
    const justBefore = new Date('2026-09-20T18:29:00Z'); // 23:59 IST
    const justAfter = new Date('2026-09-20T18:31:00Z'); // 00:01 IST
    expect(localDateIn(justBefore, 'Asia/Kolkata')).toBe('2026-09-20');
    expect(localDateIn(justAfter, 'Asia/Kolkata')).toBe('2026-09-21');
  });

  it('handles a southern-hemisphere zone ahead of UTC', () => {
    expect(localDateIn(new Date('2026-09-20T16:00:00Z'), 'Australia/Sydney')).toBe('2026-09-21');
  });
});

describe('shiftDate', () => {
  it('steps a day forward and back', () => {
    expect(shiftDate('2026-09-21', 1)).toBe('2026-09-22');
    expect(shiftDate('2026-09-21', -1)).toBe('2026-09-20');
  });

  it('crosses month and year boundaries', () => {
    expect(shiftDate('2026-09-30', 1)).toBe('2026-10-01');
    expect(shiftDate('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('handles a leap day', () => {
    expect(shiftDate('2028-02-28', 1)).toBe('2028-02-29');
    expect(shiftDate('2028-02-29', 1)).toBe('2028-03-01');
  });

  it('does not drift across a DST change', () => {
    // US spring forward, 8 March 2026. Noon UTC anchoring keeps this exact.
    expect(shiftDate('2026-03-07', 1)).toBe('2026-03-08');
    expect(shiftDate('2026-03-08', 1)).toBe('2026-03-09');
  });
});
