import {
  displayName,
  enumDisplay,
  enumValue,
  festivalsInMonth,
  type FestivalFile,
} from '@epooja/content';
import type { PanchangamData } from '@epooja/panchangam';
import todayEn from '@/i18n/locales/en/today';
import todayTe from '@/i18n/locales/te/today';
import { ENUM_FILES, TIMINGS } from './content';

/**
 * Turns the engine's ids into the strings the Today and Calendar screens
 * show, in the devotee's chosen script (§7.3 `MantraScript`).
 *
 * This is the one place the app looks a Panchangam id up in `content/enums`;
 * every screen goes through it rather than reading `ENUM_FILES` directly, so
 * a script change or a future content-pack swap only touches this file.
 */

export type DisplayScript = 'te' | 'dev' | 'iast';

function label(kind: keyof typeof ENUM_FILES, id: string, script: DisplayScript): string {
  return enumDisplay(enumValue(ENUM_FILES[kind], id), script);
}

export interface AngaBadgeView {
  label: string;
  value: string;
}

export interface TodayView {
  tithi: AngaBadgeView;
  nakshatra: AngaBadgeView;
  ritu: AngaBadgeView;
  masa: AngaBadgeView;
  sunrise: string;
  sunset: string;
  prayerTimings: { id: string; label: string; range: string; start: string; end: string }[];
  inauspicious: { id: string; label: string; range: string }[];
}

/** `HH:mm` in the Panchangam's own timezone, for an ISO instant. */
function clock(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
}

function range(start: string, end: string, tz: string): string {
  return `${clock(start, tz)} – ${clock(end, tz)}`;
}

const PRAYER_LABELS: Record<string, { en: string; te: string }> = Object.fromEntries(
  TIMINGS.timings.map((t) => [t.id, { en: t.en, te: t.te }]),
);

/**
 * Everyday chrome labels for the Today screen's anga badges and inauspicious
 * windows — not ritual enum names (those come from `content/enums/*.json`
 * via `label()` above, in the devotee's chosen *script*, independent of
 * `uiLang`). Sourced from the `today` i18n namespace rather than literals
 * here: §15's lint rule exempts `i18n/` precisely so a dict like this one
 * can keep its Telugu spelling in one place instead of two.
 */
const ANGA_BADGE_LABELS: Record<
  'tithi' | 'nakshatra' | 'ruthu' | 'masa',
  { en: string; te: string }
> = {
  tithi: { en: todayEn.sheet.tithi, te: todayTe.sheet.tithi },
  nakshatra: { en: todayEn.sheet.nakshatram, te: todayTe.sheet.nakshatram },
  ruthu: { en: todayEn.sheet.ruthuvu, te: todayTe.sheet.ruthuvu },
  masa: { en: todayEn.sheet.masam, te: todayTe.sheet.masam },
};

const INAUSPICIOUS_LABELS: Record<'rahu' | 'yamagandam' | 'gulika', { en: string; te: string }> = {
  rahu: { en: todayEn.rahuKalam, te: todayTe.rahuKalam },
  yamagandam: { en: todayEn.yamagandam, te: todayTe.yamagandam },
  gulika: { en: todayEn.gulikaKalam, te: todayTe.gulikaKalam },
};

/**
 * The Today screen's view of a day's Panchangam: four anga badges, sun times,
 * the prayer schedule and the inauspicious windows, all pre-formatted for the
 * devotee's script and timezone.
 *
 * Takes `script` and `uiLang` separately because they answer different
 * questions: `script` picks which alphabet a *ritual* value (a nakshatra
 * name) renders in, `uiLang` picks the language of an everyday *label*
 * ("Morning" vs. "ఉదయం") — a devotee can read Telugu ritual names while
 * keeping an English interface, and often does.
 */
export function toTodayView(
  data: PanchangamData,
  script: DisplayScript,
  uiLang: 'en' | 'te' = 'en',
): TodayView {
  const badge = (kind: 'tithi' | 'nakshatra' | 'ruthu' | 'masa', id: string): AngaBadgeView => ({
    label: uiLang === 'te' ? ANGA_BADGE_LABELS[kind].te : ANGA_BADGE_LABELS[kind].en,
    value: label(kind === 'ruthu' ? 'ruthu' : kind, id, script),
  });

  return {
    tithi: badge('tithi', data.tithi.id),
    nakshatra: badge('nakshatra', data.nakshatra.id),
    ritu: badge('ruthu', data.ritu),
    masa: badge('masa', data.masa.id),
    sunrise: clock(data.sunrise, data.tz),
    sunset: clock(data.sunset, data.tz),
    prayerTimings: data.prayerTimings.map((timing) => ({
      id: timing.id,
      label:
        (uiLang === 'te' ? PRAYER_LABELS[timing.id]?.te : PRAYER_LABELS[timing.id]?.en) ??
        timing.id,
      range: range(timing.start, timing.end, data.tz),
      start: timing.start,
      end: timing.end,
    })),
    inauspicious: [
      {
        id: 'rahu',
        label: uiLang === 'te' ? INAUSPICIOUS_LABELS.rahu.te : INAUSPICIOUS_LABELS.rahu.en,
        range: range(data.rahuKalam[0], data.rahuKalam[1], data.tz),
      },
      {
        id: 'yamagandam',
        label:
          uiLang === 'te' ? INAUSPICIOUS_LABELS.yamagandam.te : INAUSPICIOUS_LABELS.yamagandam.en,
        range: range(data.yamagandam[0], data.yamagandam[1], data.tz),
      },
      {
        id: 'gulika',
        label: uiLang === 'te' ? INAUSPICIOUS_LABELS.gulika.te : INAUSPICIOUS_LABELS.gulika.en,
        range: range(data.gulikaKalam[0], data.gulikaKalam[1], data.tz),
      },
    ],
  };
}

export interface MonthDayView {
  day: number;
  /** yyyy-MM-dd, so the calendar can route to the full-Panchangam sheet. */
  date: string;
  /** 1–15 within whichever paksha the day falls in, matching the mockup's numbering. */
  tithiNumber: number;
  marker: 'pournami' | 'amavasya' | 'ekadashi' | null;
  isToday: boolean;
  /** Names of any pandit-reviewed festivals landing on this day (§10 Phase 9), in `uiLang`. */
  festivalNames: string[];
}

export interface MonthView {
  /** Calendar grid, Sunday-first, padded with `null`s to full weeks. */
  weeks: (MonthDayView | null)[][];
}

/** `shukla_11`/`krishna_11` → `ekadashi`; `pournami`/`amavasya` pass through; everything else is unmarked. */
function tithiMarker(tithiId: string): MonthDayView['marker'] {
  if (tithiId === 'pournami') return 'pournami';
  if (tithiId === 'amavasya') return 'amavasya';
  if (tithiId === 'shukla_11' || tithiId === 'krishna_11') return 'ekadashi';
  return null;
}

/** `pournami` → 15, `amavasya` → 30 (folded to 15 below), `shukla_7`/`krishna_7` → 7. */
function tithiNumber(tithiId: string): number {
  if (tithiId === 'pournami') return 15;
  if (tithiId === 'amavasya') return 15;
  const match = /_(\d+)$/.exec(tithiId);
  return match ? Number(match[1]) : 0;
}

/**
 * The Calendar screen's month grid (§8.8): one cell per day of `year`/`month`
 * with its tithi number and an ekadashi/purnima/amavasya marker, from the
 * live engine rather than the Phase 1 placeholder numbering.
 */
export function toMonthView(
  year: number,
  month: number,
  days: PanchangamData[],
  todayDate: string,
  festivalFile?: FestivalFile,
  uiLang: 'en' | 'te' = 'en',
): MonthView {
  const festivalsByDate = new Map<string, string[]>();
  for (const festival of festivalsInMonth(festivalFile, year, month)) {
    const names = festivalsByDate.get(festival.date) ?? [];
    names.push(displayName(festival.name, uiLang === 'te' ? 'te' : 'en'));
    festivalsByDate.set(festival.date, names);
  }

  const dayViews: MonthDayView[] = days.map((data) => ({
    day: Number(data.date.slice(8, 10)),
    date: data.date,
    tithiNumber: tithiNumber(data.tithi.id),
    marker: tithiMarker(data.tithi.id),
    isToday: data.date === todayDate,
    festivalNames: festivalsByDate.get(data.date) ?? [],
  }));

  // Sunday-first, matching the `calendar.tsx` weekday header.
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const cells: (MonthDayView | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...dayViews,
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (MonthDayView | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return { weeks };
}

export interface FullPanchangamView extends TodayView {
  samvatsara: string;
  ayana: string;
  paksha: string;
  yoga: AngaBadgeView;
  karana: AngaBadgeView;
  vasara: string;
  adhika: boolean;
}

const PAKSHA_LABEL: Record<PanchangamData['paksha'], string> = {
  shukla: 'Shukla Paksha',
  krishna: 'Krishna Paksha',
};

const AYANA_LABEL: Record<PanchangamData['ayana'], string> = {
  uttarayana: 'Uttarayanam',
  dakshinayana: 'Dakshinayanam',
};

/**
 * Everything the full-Panchangam bottom sheet shows (§8.2: "all angas with
 * end times, samvatsaram, ayanam, paksham, yogam, karanam" plus the three
 * inauspicious windows already in `TodayView`).
 */
export function toFullPanchangamView(
  data: PanchangamData,
  script: DisplayScript,
  uiLang: 'en' | 'te' = 'en',
): FullPanchangamView {
  return {
    ...toTodayView(data, script, uiLang),
    samvatsara: label('samvatsara', data.samvatsara.id, script),
    ayana: AYANA_LABEL[data.ayana],
    paksha: PAKSHA_LABEL[data.paksha],
    yoga: { label: 'Yoga', value: label('yoga', data.yoga.id, script) },
    karana: { label: 'Karana', value: label('karana', data.karana.id, script) },
    vasara: label('vasara', data.vasara.id, script),
    adhika: data.masa.adhika,
  };
}
