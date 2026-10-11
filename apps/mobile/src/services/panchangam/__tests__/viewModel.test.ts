import { getDayPanchangam, getMonth } from '@epooja/panchangam';
import { parseFestivalFile } from '@epooja/content';
import { toFullPanchangamView, toMonthView, toTodayView } from '@/services/panchangam/viewModel';

const HYDERABAD = { lat: 17.385, lng: 78.4867, tz: 'Asia/Kolkata' };

describe('toTodayView', () => {
  const data = getDayPanchangam('2026-09-19', HYDERABAD);
  const view = toTodayView(data, 'te');

  it('carries a Telugu value for each anga badge', () => {
    expect(view.tithi.value.length).toBeGreaterThan(0);
    expect(view.nakshatra.value).toBe('మూల');
    expect(view.ritu.label).toBe('Ruthuvu');
    // Phase 9 fixed this label: it used to be `kind[0].toUpperCase() + kind.slice(1)`
    // applied to the id "masa" itself, which produced "Masa" rather than the
    // actual word "Masam" every other label in this file (and the full-Panchangam
    // sheet) already used.
    expect(view.masa.label).toBe('Masam');
  });

  it("formats sun times in the Panchangam's own zone as HH:mm", () => {
    expect(view.sunrise).toMatch(/^\d{2}:\d{2}$/);
    expect(view.sunset).toMatch(/^\d{2}:\d{2}$/);
  });

  it('lists all three prayer windows in order, with an English label by default', () => {
    expect(view.prayerTimings.map((t) => t.id)).toEqual(['morning', 'midday', 'evening']);
    expect(view.prayerTimings[0]?.label).toBe('Morning');
    expect(view.prayerTimings[0]?.range).toMatch(/^\d{2}:\d{2} – \d{2}:\d{2}$/);
  });

  it('switches the prayer labels to Telugu on request, without touching the ranges', () => {
    const teluguView = toTodayView(data, 'te', 'te');
    expect(teluguView.prayerTimings[0]?.label).toBe('ప్రాతఃకాలం');
    expect(teluguView.prayerTimings[0]?.range).toBe(view.prayerTimings[0]?.range);
  });

  it('lists the three inauspicious windows', () => {
    expect(view.inauspicious.map((t) => t.id)).toEqual(['rahu', 'yamagandam', 'gulika']);
    expect(view.inauspicious[0]?.range).toMatch(/^\d{2}:\d{2} – \d{2}:\d{2}$/);
    expect(view.inauspicious[0]?.label).toBe('Rahu Kalam');
  });

  it('switches both anga-badge and inauspicious labels to Telugu on request (§10 Phase 9)', () => {
    const teluguView = toTodayView(data, 'te', 'te');
    expect(teluguView.tithi.label).toBe('తిథి');
    expect(teluguView.nakshatra.label).toBe('నక్షత్రం');
    expect(teluguView.ritu.label).toBe('ఋతువు');
    expect(teluguView.masa.label).toBe('మాసం');
    expect(teluguView.inauspicious.map((t) => t.label)).toEqual([
      'రాహు కాలం',
      'యమగండం',
      'గులిక కాలం',
    ]);
  });

  it('reads the same anga in a different script on request', () => {
    const devanagari = toTodayView(data, 'dev');
    expect(devanagari.nakshatra.value).not.toBe(view.nakshatra.value);
    expect(devanagari.nakshatra.value.length).toBeGreaterThan(0);
  });
});

describe('toFullPanchangamView', () => {
  const data = getDayPanchangam('2026-09-19', HYDERABAD);
  const view = toFullPanchangamView(data, 'te');

  it('adds the sheet-only fields on top of the Today view', () => {
    expect(view.samvatsara.length).toBeGreaterThan(0);
    expect(['Uttarayanam', 'Dakshinayanam']).toContain(view.ayana);
    expect(['Shukla Paksha', 'Krishna Paksha']).toContain(view.paksha);
    expect(view.yoga.value.length).toBeGreaterThan(0);
    expect(view.karana.value.length).toBeGreaterThan(0);
    expect(view.vasara.length).toBeGreaterThan(0);
    expect(typeof view.adhika).toBe('boolean');
  });

  it('still carries everything the Today badges need', () => {
    expect(view.tithi.value.length).toBeGreaterThan(0);
    expect(view.sunrise).toMatch(/^\d{2}:\d{2}$/);
  });

  it('passes uiLang through to the Today-view fields it spreads in', () => {
    const teluguView = toFullPanchangamView(data, 'te', 'te');
    expect(teluguView.tithi.label).toBe('తిథి');
  });
});

describe('toMonthView', () => {
  // September 2026: 1 September is a Tuesday (weekday 2), so the first row
  // is padded with two leading nulls.
  const days = getMonth(2026, 9, HYDERABAD);
  const view = toMonthView(2026, 9, days, '2026-09-19');

  it('pads the grid to full, Sunday-first weeks', () => {
    expect(view.weeks[0]).toHaveLength(7);
    expect(view.weeks[0]?.[0]).toBeNull();
    expect(view.weeks[0]?.[1]).toBeNull();
    expect(view.weeks[0]?.[2]?.day).toBe(1);
    expect(view.weeks.at(-1)).toHaveLength(7);
  });

  it('marks exactly one pournami, one amavasya and two ekadashi days', () => {
    const markers = view.weeks
      .flat()
      .map((cell) => cell?.marker)
      .filter((marker): marker is NonNullable<typeof marker> => Boolean(marker));
    expect(markers.filter((m) => m === 'pournami')).toHaveLength(1);
    expect(markers.filter((m) => m === 'amavasya')).toHaveLength(1);
    expect(markers.filter((m) => m === 'ekadashi')).toHaveLength(2);
  });

  it('flags the requested date as today, and only that date', () => {
    const todayCells = view.weeks.flat().filter((cell) => cell?.isToday);
    expect(todayCells).toHaveLength(1);
    expect(todayCells[0]?.date).toBe('2026-09-19');
  });

  it('carries no festival names when no file is supplied', () => {
    expect(view.weeks.flat().every((cell) => (cell?.festivalNames ?? []).length === 0)).toBe(true);
  });

  it('marks a festival day from a supplied table, localized to uiLang', () => {
    const festivalFile = parseFestivalFile({
      kind: 'festivals',
      samvatsara: days[0]!.samvatsara.id,
      review: { status: 'PENDING_PANDIT_REVIEW', reviewer: null, date: null },
      festivals: [
        {
          id: 'vinayaka-chavithi',
          name: { te: 'వినాయక చవితి', en: 'Vinayaka Chavithi' },
          date: '2026-09-14',
        },
      ],
    });

    const withFestival = toMonthView(2026, 9, days, '2026-09-19', festivalFile, 'te');
    const cell = withFestival.weeks.flat().find((c) => c?.date === '2026-09-14');
    expect(cell?.festivalNames).toEqual(['వినాయక చవితి']);
  });
});
