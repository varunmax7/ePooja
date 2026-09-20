import { getDayPanchangam } from '@epooja/panchangam';
import { toFullPanchangamView, toTodayView } from '@/services/panchangam/viewModel';

const HYDERABAD = { lat: 17.385, lng: 78.4867, tz: 'Asia/Kolkata' };

describe('toTodayView', () => {
  const data = getDayPanchangam('2026-09-19', HYDERABAD);
  const view = toTodayView(data, 'te');

  it('carries a Telugu value for each anga badge', () => {
    expect(view.tithi.value.length).toBeGreaterThan(0);
    expect(view.nakshatra.value).toBe('మూల');
    expect(view.ritu.label).toBe('Ruthuvu');
    expect(view.masa.label).toBe('Masa');
  });

  it('formats sun times in the Panchangam\'s own zone as HH:mm', () => {
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
});
